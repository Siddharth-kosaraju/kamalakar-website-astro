#!/usr/bin/env bash
# ==============================================================================
# Script Name: aws_deploy.sh
# Description: Manages AWS Infrastructure Creation and UI Deployment for Kamalakar Heart Centre.
#              Adapted for Astro static output (no Puppeteer prerender needed).
# Usage:       ./aws_deploy.sh <mode> <env>
#              Modes: infra, deploy
#              Envs:  stage, prod
# ==============================================================================

set -e
set -u

# ==============================================================================
# Configuration
# ==============================================================================
AWS_REGION="ap-south-1" # Mumbai region is best for India-based clinic
export AWS_PROFILE="sid-personal"

# ==============================================================================
# Helper Functions
# ==============================================================================

usage() {
    echo "Usage: $0 <mode> <env>"
    echo ""
    echo "Modes:"
    echo "  infra   - Create/Verify Infrastructure (S3, OAC, CloudFront)"
    echo "  deploy  - Build UI and Deploy to S3 + Invalidate Cache"
    echo ""
    echo "Environments:"
    echo "  stage"
    echo "  prod"
    exit 1
}

if [ "$#" -ne 2 ]; then
    usage
fi

MODE=$1
ENV=$2

if [[ "$ENV" != "stage" && "$ENV" != "prod" ]]; then
    echo "Error: Invalid environment '$ENV'. Must be 'stage' or 'prod'."
    exit 1
fi

# ==============================================================================
# Environment Setup
# ==============================================================================

ENV_FILE=".env-$ENV"
if [ -f "$ENV_FILE" ]; then
    echo "INFO: Loading environment config from $ENV_FILE..."
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "WARNING: $ENV_FILE not found. Please create it from .env-template."
    exit 1
fi

# Define Resource Names
BUCKET_NAME="kamalakar-heart-centre-${ENV}"
OAC_NAME="KamalakarOAC-${ENV}"
ALIAS_DOMAINS="${alternateDomainNames}"
MAIN_DOMAIN=$(echo $ALIAS_DOMAINS | cut -d',' -f1)
# ==============================================================================
# Mode: Infrastructure Creation
# ==============================================================================
create_infra() {
    echo "=========================================="
    echo " Starting Infrastructure Creation ($ENV) "
    echo "=========================================="

    local ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "INFO: AWS Account ID: $ACCOUNT_ID"

    # 1. S3 Bucket Setup
    echo "Step 1: Checking S3 Bucket '$BUCKET_NAME'..."
    if aws s3api head-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1; then
        echo "INFO: S3 Bucket exists."
    else
        echo "INFO: Creating S3 Bucket..."
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi

    echo "INFO: Enforcing Bucket Public Access Block..."
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    # 2. CloudFront Origin Access Control (OAC) Setup
    echo "Step 2: Checking CloudFront OAC '$OAC_NAME'..."
    local OAC_ID=$(aws cloudfront list-origin-access-controls \
        --query "OriginAccessControlList.Items[?Name=='${OAC_NAME}'].Id" \
        --output text)

    if [ -z "$OAC_ID" ] || [ "$OAC_ID" == "None" ]; then
        echo "INFO: Creating OAC..."
        OAC_ID=$(aws cloudfront create-origin-access-control \
            --origin-access-control-config \
                "Name=${OAC_NAME},Description=OAC for Kamalakar Heart Centre,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
            --query "OriginAccessControl.Id" \
            --output text)
    fi
    echo "INFO: OAC ID: $OAC_ID"

    # 2.5 CloudFront Function: www → non-www redirect (SEO canonicalization)
    local CF_FUNC_NAME="redirect-www-to-non-www"
    local CF_FUNC_FILE="cloudfront-functions/redirect-www-to-non-www.js"
    local FUNC_ARN="arn:aws:cloudfront::${ACCOUNT_ID}:function/${CF_FUNC_NAME}"
    local ATTACH_WWW_REDIRECT=0
    echo "Step 2.5: Ensuring CloudFront Function '$CF_FUNC_NAME' (www→non-www redirect)..."
    if [ ! -f "$CF_FUNC_FILE" ]; then
        echo "WARNING: $CF_FUNC_FILE not found. Skipping function setup. Add it to enable www redirect."
    else
        ATTACH_WWW_REDIRECT=1
        local FUNC_ETAG
        if FUNC_ETAG=$(aws cloudfront describe-function --name "$CF_FUNC_NAME" --query 'ETag' --output text 2>/dev/null); then
            echo "INFO: Updating existing function '$CF_FUNC_NAME'..."
            FUNC_ETAG=$(aws cloudfront update-function \
                --name "$CF_FUNC_NAME" \
                --if-match "$FUNC_ETAG" \
                --function-config '{"Comment":"Redirect www to non-www","Runtime":"cloudfront-js-1.0"}' \
                --function-code "fileb://${CF_FUNC_FILE}" \
                --query 'ETag' --output text)
        else
            echo "INFO: Creating function '$CF_FUNC_NAME'..."
            FUNC_ETAG=$(aws cloudfront create-function \
                --name "$CF_FUNC_NAME" \
                --function-config '{"Comment":"Redirect www to non-www","Runtime":"cloudfront-js-1.0"}' \
                --function-code "fileb://${CF_FUNC_FILE}" \
                --query 'ETag' --output text)
        fi
        echo "INFO: Publishing function..."
        aws cloudfront publish-function --name "$CF_FUNC_NAME" --if-match "$FUNC_ETAG" >/dev/null
        echo "INFO: Function ARN: $FUNC_ARN"
    fi

    local FUNC_BLOCK=""
    if [ "$ATTACH_WWW_REDIRECT" -eq 1 ]; then
        FUNC_BLOCK=', "FunctionAssociations": { "Quantity": 1, "Items": [ { "EventType": "viewer-request", "FunctionARN": "'"$FUNC_ARN"'" } ] }'
    fi

    # 3. CloudFront Distribution Setup
    echo "Step 3: Checking CloudFront Distribution for alias '$MAIN_DOMAIN'..."
    local DIST_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '${MAIN_DOMAIN}')].Id | [0]" \
        --output text)

    if [ -z "$DIST_ID" ] || [ "$DIST_ID" == "None" ]; then
        echo "INFO: Creating CloudFront Distribution..."

        local CALLER_REF="ref-$(date +%s)"

        # Convert comma-separated domains to JSON array format
        local DOMAIN_JSON=$(echo $ALIAS_DOMAINS | sed 's/,/", "/g')
        local DOMAIN_COUNT=$(echo $ALIAS_DOMAINS | tr -cd ',' | wc -c)
        DOMAIN_COUNT=$((DOMAIN_COUNT + 1))

        cat <<EOF > dist-config.json
{
    "CallerReference": "${CALLER_REF}",
    "Aliases": {
        "Quantity": ${DOMAIN_COUNT},
        "Items": ["${DOMAIN_JSON}"]
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "ui-s3-bucket",
                "DomainName": "${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "${OAC_ID}"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "ui-s3-bucket",
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": { "Forward": "none" }
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["HEAD", "GET"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["HEAD", "GET"]
            }
        },
        "SmoothStreaming": false,
        "Compress": true${FUNC_BLOCK}
    },
    "CacheBehaviors": { "Quantity": 0 },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            { "ErrorCode": 403, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 60 },
            { "ErrorCode": 404, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 60 }
        ]
    },
    "Comment": "Kamalakar Heart Centre (${ENV})",
    "Enabled": true,
    "ViewerCertificate": {
        "ACMCertificateArn": "arn:aws:acm:us-east-1:${ACCOUNT_ID}:certificate/${acmCertificateIdentifier}",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2019"
    }
}
EOF

        DIST_ID=$(aws cloudfront create-distribution \
            --distribution-config file://dist-config.json \
            --query "Distribution.Id" \
            --output text)

        rm dist-config.json
        echo "INFO: Distribution creating... ID: $DIST_ID"
    else
        echo "INFO: Distribution exists: $DIST_ID. Checking for missing aliases..."

        # Fetch current config and ETag
        local CONFIG_FILE="current-config.json"
        aws cloudfront get-distribution-config --id "$DIST_ID" > "$CONFIG_FILE"
        local ETAG=$(grep '"ETag":' "$CONFIG_FILE" | cut -d'"' -f4)

        # Prepare new config by stripping ETag and updating Aliases
        local UPDATED_CONFIG="updated-config.json"

        # Prepare Domain JSON for jq
        local DOMAIN_JSON=$(echo $ALIAS_DOMAINS | sed 's/,/", "/g')
        local DOMAIN_COUNT=$(echo $ALIAS_DOMAINS | tr -cd ',' | wc -c)
        DOMAIN_COUNT=$((DOMAIN_COUNT + 1))

        # Shared jq fragment: enforce correct CustomErrorResponses (404.html with 404 status)
        local ERROR_RESP_JQ='.DistributionConfig.CustomErrorResponses = {
                   "Quantity": 2,
                   "Items": [
                     { "ErrorCode": 403, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 60 },
                     { "ErrorCode": 404, "ResponsePagePath": "/404.html", "ResponseCode": "404", "ErrorCachingMinTTL": 60 }
                   ]
                 }'

        # Update aliases, error responses, and (if function exists) attach www→non-www redirect
        if [ "$ATTACH_WWW_REDIRECT" -eq 1 ]; then
            cat "$CONFIG_FILE" | jq --arg arn "$FUNC_ARN" \
                '.DistributionConfig.Aliases.Quantity = '"${DOMAIN_COUNT}"' |
                 .DistributionConfig.Aliases.Items = ["'"${DOMAIN_JSON}"'"] |
                 .DistributionConfig.DefaultCacheBehavior.FunctionAssociations = {
                   "Quantity": 1,
                   "Items": [{ "EventType": "viewer-request", "FunctionARN": $arn }]
                 } |
                 '"${ERROR_RESP_JQ}"' |
                 .DistributionConfig' > "$UPDATED_CONFIG"
        else
            cat "$CONFIG_FILE" | jq \
                '.DistributionConfig.Aliases.Quantity = '"${DOMAIN_COUNT}"' |
                 .DistributionConfig.Aliases.Items = ["'"${DOMAIN_JSON}"'"] |
                 '"${ERROR_RESP_JQ}"' |
                 .DistributionConfig' > "$UPDATED_CONFIG"
        fi

        echo "INFO: Updating CloudFront distribution (aliases + error responses${ATTACH_WWW_REDIRECT:+ + www redirect function})..."
        aws cloudfront update-distribution \
            --id "$DIST_ID" \
            --distribution-config "file://$UPDATED_CONFIG" \
            --if-match "$ETAG" > /dev/null

        rm "$CONFIG_FILE" "$UPDATED_CONFIG"
        echo "INFO: Distribution updated (aliases, error responses, and viewer-request function)."
    fi

    # 4. Connect S3 to CloudFront (Bucket Policy)
    echo "Step 4: Updating S3 Bucket Policy for CloudFront Access..."

    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowCloudFrontOACAccess",
                "Effect": "Allow",
                "Principal": {
                    "Service": "cloudfront.amazonaws.com"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*",
                "Condition": {
                    "StringEquals": {
                        "AWS:SourceArn": "arn:aws:cloudfront::'"$ACCOUNT_ID"':distribution/'"$DIST_ID"'"
                    }
                }
            }
        ]
    }'

    echo "=========================================="
    echo " Infrastructure Setup Complete "
    echo "=========================================="
}

# ==============================================================================
# Mode: UI Deployment
# ==============================================================================
deploy_ui() {
    echo "=========================================="
    echo " Starting UI Deployment ($ENV) "
    echo "=========================================="

    echo "INFO: Looking up CloudFront Distribution ID for alias '$MAIN_DOMAIN'..."
    local DIST_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '${MAIN_DOMAIN}')].Id | [0]" \
        --output text)

    if [ -z "$DIST_ID" ] || [ "$DIST_ID" == "None" ]; then
        echo "ERROR: CloudFront Distribution not found for alias $MAIN_DOMAIN."
        exit 1
    fi

    # Astro generates static HTML directly — no Puppeteer prerender needed
    echo "INFO: Building Project (Astro static build)..."
    npm run build

    if [ ! -d "dist" ]; then
        echo "ERROR: 'dist/' directory not found."
        exit 1
    fi

    # Cache-Control strategy:
    #   Hashed assets (JS, CSS)  → immutable, 1 year (content-hash in filename = safe forever)
    #   Images / media           → 30 days
    #   Fonts                    → immutable, 1 year
    #   HTML                     → always revalidate (0s, must-revalidate)
    #   Everything else          → 1 day (robots.txt, sitemap.xml, llms.txt, etc.)
    CACHE_ASSETS="public, max-age=31536000, immutable"
    CACHE_MEDIA="public, max-age=2592000"
    CACHE_HTML="public, max-age=0, must-revalidate"
    CACHE_MISC="public, max-age=86400"

    # Astro outputs hashed assets to _astro/ (not assets/)
    echo "INFO: Uploading hashed assets (JS, CSS) with 1-year cache..."
    aws s3 sync dist/_astro/ "s3://$BUCKET_NAME/_astro/" \
        --cache-control "$CACHE_ASSETS" --delete

    if [ -d "dist/images" ]; then
        echo "INFO: Uploading images with 30-day cache..."
        aws s3 sync dist/images/ "s3://$BUCKET_NAME/images/" \
            --cache-control "$CACHE_MEDIA" --delete
    fi

    if [ -d "dist/media" ]; then
        echo "INFO: Uploading media with 30-day cache..."
        aws s3 sync dist/media/ "s3://$BUCKET_NAME/media/" \
            --cache-control "$CACHE_MEDIA" --delete
    fi

    if [ -d "dist/fonts" ]; then
        echo "INFO: Uploading fonts with 1-year cache..."
        aws s3 sync dist/fonts/ "s3://$BUCKET_NAME/fonts/" \
            --cache-control "$CACHE_ASSETS" --delete
    fi

    echo "INFO: Uploading HTML files (no-cache, always revalidate)..."
    find dist -name "*.html" | while read -r f; do
        KEY="${f#dist/}"
        aws s3 cp "$f" "s3://$BUCKET_NAME/$KEY" \
            --cache-control "$CACHE_HTML" --content-type "text/html"
    done

    echo "INFO: Uploading remaining files (robots.txt, sitemap, etc.) with 1-day cache..."
    aws s3 sync dist/ "s3://$BUCKET_NAME/" \
        --cache-control "$CACHE_MISC" \
        --exclude "_astro/*" --exclude "images/*" --exclude "media/*" --exclude "fonts/*" --exclude "*.html" \
        --delete

    echo "INFO: Verifying Cache-Control on S3..."
    FIRST_ASSET=$(find dist/_astro -type f | head -1)
    if [ -n "$FIRST_ASSET" ]; then
        KEY="_astro/$(basename "$FIRST_ASSET")"
        CACHE_VAL=$(aws s3api head-object --bucket "$BUCKET_NAME" --key "$KEY" --query 'CacheControl' --output text 2>/dev/null || true)
        if [ -z "$CACHE_VAL" ] || [ "$CACHE_VAL" == "None" ]; then
            echo "WARNING: Cache-Control missing on s3://$BUCKET_NAME/$KEY"
        else
            echo "INFO: Cache-Control on $KEY: $CACHE_VAL ✓"
        fi
    fi

    echo "INFO: Invalidating CloudFront Cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$DIST_ID" \
        --paths "/*"

    echo "=========================================="
    echo " Deployment Complete "
    echo "=========================================="
}

case "$MODE" in
    infra) create_infra ;;
    deploy) deploy_ui ;;
    *) usage ;;
esac

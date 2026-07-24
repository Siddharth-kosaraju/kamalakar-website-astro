# Media CMS infra

CDK stack (`MediaCmsStack`) provisioning the serverless media-video CMS: Cognito
(admin login), DynamoDB (video list), two Lambdas (CRUD API + publish
trigger), an HTTP API, and a CodeBuild project that materializes the
DynamoDB list into `src/content/media/*.yaml` and runs the **same**
`npm run build` / S3 sync / CloudFront invalidation as every other deploy.

Nothing here touches the main site's existing deploy path (`npm run
deploy`) — this is a separate, additive stack.

## One-time setup (before first `cdk deploy`)

1. **GitHub Personal Access Token**, so CodeBuild can clone the repo:
   - Create a fine-grained PAT (repo scope, read-only is enough) at
     https://github.com/settings/tokens
   - Store it in Secrets Manager under the exact name the stack expects:
     ```bash
     aws secretsmanager create-secret \
       --name kamalakar/codebuild-github-token \
       --secret-string "ghp_xxxxxxxxxxxxxxxxxxxx" \
       --profile sid-personal --region ap-south-1
     ```

2. **Admin login for the downloadable user manual** — the `/admin/` portal's
   "Download User Manual" button fetches these from Secrets Manager via an
   authenticated call (never baked into any committed file or JS bundle):
   ```bash
   aws secretsmanager create-secret \
     --name kamalakar/media-admin-doc-credentials \
     --secret-string '{"email":"admin@example.com","password":"the-real-password"}' \
     --profile sid-personal --region ap-south-1
   ```
   Keep this in sync manually if the admin password is ever rotated —
   nothing does that automatically.

3. **Bootstrap CDK** in the target account/region (one-time per account+region):
   ```bash
   npx cdk bootstrap aws://236229417910/ap-south-1 --profile sid-personal
   ```

4. **Deploy**:
   ```bash
   npm install
   AWS_PROFILE=sid-personal npx cdk deploy
   ```
   Note: this CDK CLI build's live "CloudFormation Validate" plugin throws
   a spurious `IllegalPluginOperation` in this environment (confirmed: the
   synthesized template is valid either way — `--no-validation` produces
   the identical, correct CloudFormation). If `cdk deploy` fails the same
   way, add `--no-validation`.

5. **Create admin users** (no self-signup by design):
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id <UserPoolId from stack output> \
     --username someone@example.com \
     --user-attributes Name=email,Value=someone@example.com Name=email_verified,Value=true \
     --profile sid-personal --region ap-south-1
   ```
   This emails a temporary password. First login requires a password reset
   (`admin-set-user-password --permanent` can also set one directly).

6. **Wire the admin page to the deployed stack** — after `cdk deploy` prints
   its outputs, add to the site's `.env` (or your deploy environment) and
   rebuild/redeploy the *main* site once:
   ```
   PUBLIC_COGNITO_REGION=ap-south-1
   PUBLIC_COGNITO_CLIENT_ID=<UserPoolClientId output>
   PUBLIC_MEDIA_API_URL=<ApiUrl output>
   ```

## After that

- Team logs into `/admin/`, adds/edits videos, clicks **Publish**.
- Publish triggers CodeBuild: DynamoDB → YAML → `npm run build` (sitemap,
  llms.txt, and canonical-verifier gates all still run) → S3 sync →
  CloudFront invalidation. ~2–3 minutes end to end.
- `npx cdk diff` / `npx cdk deploy` again any time this stack's code changes.
- `npx cdk destroy` tears it down — DynamoDB table and Cognito user pool are
  `RETAIN`ed, so this can't silently delete video data or lock out admins;
  delete those manually if a full teardown is ever actually wanted.

## Cost

Cognito, Lambda, API Gateway, and DynamoDB all sit comfortably in AWS free
tier at this usage. CodeBuild is billed per build-minute (~$0.005/min on
`SMALL`); a ~3-minute publish is roughly a cent. Realistically well under
$1/month.

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

/**
 * Existing production infra this stack plugs into (CLAUDE.md is the source
 * of truth for these — do not change without updating both places).
 */
const PROD_S3_BUCKET = 'kamalakar-heart-centre-prod';
const PROD_CLOUDFRONT_DISTRIBUTION_ID = 'E3STOTV0PG9BZU';
const GITHUB_OWNER = 'Siddharth-kosaraju';
const GITHUB_REPO = 'kamalakar-website-astro';
const GITHUB_BRANCH = 'main';
const SITE_ORIGIN = 'https://kamalakarheartcentre.com';

export class MediaCmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -----------------------------------------------------------------
    // DynamoDB — the CMS source of truth for the video list.
    // RETAIN: video data must survive a stack update/rollback; deleting
    // this table is a deliberate, separate action, never a side effect.
    // -----------------------------------------------------------------
    const table = new dynamodb.Table(this, 'MediaVideosTable', {
      tableName: 'kamalakar-media-videos',
      partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    // -----------------------------------------------------------------
    // Cognito — admin login for the social media team. No self-signup;
    // accounts are created by an admin (console or `aws cognito-idp
    // admin-create-user`). RETAIN so a stack rollback never locks the
    // team out.
    // -----------------------------------------------------------------
    const userPool = new cognito.UserPool(this, 'MediaAdminUserPool', {
      userPoolName: 'kamalakar-media-admins',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'MediaAdminUserPoolClient', {
      userPool,
      userPoolClientName: 'kamalakar-media-admin-portal',
      generateSecret: false, // public SPA client
      // USER_PASSWORD_AUTH (over HTTPS, to the Cognito IDP API directly) —
      // chosen over SRP so the admin page needs zero crypto dependency.
      // Fine for a small trusted internal team; add userSrp: true later if
      // that trade-off ever needs revisiting.
      authFlows: { userPassword: true },
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // -----------------------------------------------------------------
    // CodeBuild — the actual "publish" step. Pulls the video list from
    // DynamoDB, writes it into src/content/media/, runs the SAME
    // `npm run build` used for every other deploy (so sitemap, llms.txt,
    // and canonical verification gate every publish exactly like a
    // developer-driven deploy), then syncs dist/ to S3 and invalidates
    // CloudFront.
    //
    // Source auth: a GitHub Personal Access Token (repo scope), stored in
    // Secrets Manager under the name below BEFORE first deploy. One-time
    // manual step — see infra/README.md.
    // -----------------------------------------------------------------
    const githubTokenSecretName = 'kamalakar/codebuild-github-token';
    new codebuild.GitHubSourceCredentials(this, 'GitHubSourceCredentials', {
      accessToken: cdk.SecretValue.secretsManager(githubTokenSecretName),
    });

    const prodBucket = s3.Bucket.fromBucketName(this, 'ProdSiteBucket', PROD_S3_BUCKET);

    const publishProject = new codebuild.Project(this, 'MediaPublishProject', {
      projectName: 'kamalakar-media-publish',
      source: codebuild.Source.gitHub({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        webhook: false, // triggered only by the admin portal's Publish button, never on git push
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      environmentVariables: {
        DYNAMO_TABLE_NAME: { value: table.tableName },
        S3_BUCKET_NAME: { value: PROD_S3_BUCKET },
        CLOUDFRONT_DISTRIBUTION_ID: { value: PROD_CLOUDFRONT_DISTRIBUTION_ID },
        SITE: { value: SITE_ORIGIN },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('scripts/codebuild/media-publish-buildspec.yml'),
      timeout: cdk.Duration.minutes(15),
    });
    // Explicit branch pin — Source.gitHub() clones the repo's default ref
    // unless a build is started with a specific sourceVersion; the publish
    // Lambda doesn't pass one, so pin the project itself to main.
    (publishProject.node.defaultChild as codebuild.CfnProject).sourceVersion = GITHUB_BRANCH;

    table.grantReadData(publishProject);
    prodBucket.grantReadWrite(publishProject);
    prodBucket.grantDelete(publishProject); // `aws s3 sync --delete`
    publishProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [`arn:aws:cloudfront::${this.account}:distribution/${PROD_CLOUDFRONT_DISTRIBUTION_ID}`],
    }));

    // -----------------------------------------------------------------
    // Lambdas — the Node managed runtime ships the AWS SDK v3, so these
    // ship with zero bundled dependencies (see infra/lambda/*/index.mjs).
    // -----------------------------------------------------------------
    const commonEnv = { ALLOWED_ORIGIN: SITE_ORIGIN };

    const mediaApiFn = new lambda.Function(this, 'MediaApiFunction', {
      functionName: 'kamalakar-media-api',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/media-api'),
      timeout: cdk.Duration.seconds(15),
      environment: { ...commonEnv, TABLE_NAME: table.tableName },
    });
    table.grantReadWriteData(mediaApiFn);

    const publishFn = new lambda.Function(this, 'PublishFunction', {
      functionName: 'kamalakar-media-publish-trigger',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/publish'),
      timeout: cdk.Duration.seconds(15),
      environment: { ...commonEnv, CODEBUILD_PROJECT_NAME: publishProject.projectName },
    });
    publishFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['codebuild:StartBuild', 'codebuild:BatchGetBuilds'],
      resources: [publishProject.projectArn],
    }));

    // -----------------------------------------------------------------
    // API Gateway (HTTP API) — Cognito JWT-authorized routes for the
    // admin portal only. CORS restricted to the production site + local
    // dev, matching how the rest of the site is scoped.
    // -----------------------------------------------------------------
    const httpApi = new apigwv2.HttpApi(this, 'MediaAdminApi', {
      apiName: 'kamalakar-media-admin-api',
      corsPreflight: {
        allowOrigins: [SITE_ORIGIN, 'http://localhost:4321'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    const authorizer = new apigwv2Authorizers.HttpUserPoolAuthorizer(
      'MediaAdminAuthorizer',
      userPool,
      { userPoolClients: [userPoolClient] }
    );

    const mediaApiIntegration = new apigwv2Integrations.HttpLambdaIntegration('MediaApiIntegration', mediaApiFn);
    const publishIntegration = new apigwv2Integrations.HttpLambdaIntegration('PublishIntegration', publishFn);

    const authorizedRoute = (path: string, methods: apigwv2.HttpMethod[], integration: apigwv2Integrations.HttpLambdaIntegration) => {
      httpApi.addRoutes({ path, methods, integration, authorizer });
    };

    authorizedRoute('/videos', [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST], mediaApiIntegration);
    authorizedRoute('/videos/reorder', [apigwv2.HttpMethod.POST], mediaApiIntegration);
    authorizedRoute('/videos/{slug}', [apigwv2.HttpMethod.PUT, apigwv2.HttpMethod.DELETE, apigwv2.HttpMethod.GET], mediaApiIntegration);
    authorizedRoute('/oembed', [apigwv2.HttpMethod.POST], mediaApiIntegration);
    authorizedRoute('/publish', [apigwv2.HttpMethod.POST], publishIntegration);
    authorizedRoute('/publish/{buildId}', [apigwv2.HttpMethod.GET], publishIntegration);

    // The publish pipeline's `npm run build` (see media-publish-buildspec.yml)
    // needs these to bake the admin portal's own login config into itself —
    // without them, a CMS-triggered publish would ship a working /media/ but
    // a broken/unconfigured /admin/. Set here (not just in a local .env)
    // because CodeBuild builds from GitHub, not this machine.
    //
    // Project (L2) has no addEnvironmentVariable in this CDK version, and
    // httpApi/userPoolClient aren't available yet at the Project's own
    // construction site (Lambdas -> httpApi depend on publishProject, so it
    // must be declared first) — so the full env var list is rebuilt via the
    // L1 escape hatch instead of appending to it.
    (publishProject.node.defaultChild as codebuild.CfnProject).addPropertyOverride('Environment.EnvironmentVariables', [
      { Name: 'DYNAMO_TABLE_NAME', Value: table.tableName },
      { Name: 'S3_BUCKET_NAME', Value: PROD_S3_BUCKET },
      { Name: 'CLOUDFRONT_DISTRIBUTION_ID', Value: PROD_CLOUDFRONT_DISTRIBUTION_ID },
      { Name: 'SITE', Value: SITE_ORIGIN },
      { Name: 'PUBLIC_COGNITO_REGION', Value: this.region },
      { Name: 'PUBLIC_COGNITO_CLIENT_ID', Value: userPoolClient.userPoolClientId },
      { Name: 'PUBLIC_MEDIA_API_URL', Value: httpApi.apiEndpoint },
    ]);

    // -----------------------------------------------------------------
    // Outputs — feed these into the admin page's build-time config
    // (PUBLIC_* env vars) after first deploy. See infra/README.md.
    // -----------------------------------------------------------------
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, 'DynamoTableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'CodeBuildProjectName', { value: publishProject.projectName });
  }
}

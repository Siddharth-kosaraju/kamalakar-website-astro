#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MediaCmsStack } from '../lib/media-cms-stack';

const app = new cdk.App();

new MediaCmsStack(app, 'KamalakarMediaCmsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
  description: 'Kamalakar Heart Centre media CMS — Cognito admin login, DynamoDB video list, publish pipeline (CodeBuild -> S3 -> CloudFront).',
});

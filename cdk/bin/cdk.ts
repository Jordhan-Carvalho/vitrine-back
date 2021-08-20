#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VitrineStack } from '../lib/vitrine';

const app = new cdk.App();

new VitrineStack(app, 'vitrine-backend', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

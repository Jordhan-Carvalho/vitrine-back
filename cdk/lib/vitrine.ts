import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';

export class VitrineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // LAMBDA
    const helloLambda = new lambda.NodejsFunction(this, 'hello', {
      entry: path.join(__dirname, '../../src/functions/hello.ts'), 
      handler: 'main',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        NEW_CANDIDATE_SQS: "test"
      }
    });
  }
}

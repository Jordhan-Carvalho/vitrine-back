import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';

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


    // VPC NEEDED FOR RDS CREATION
    const vpc = new ec2.Vpc(this, "vitrine-vpc", {
      maxAzs: 2
    });
    // RDS
    const rdsDBinstance = new rds.DatabaseInstance(this, 'vtnPostgresRDS', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_12_7 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      databaseName: "vitrine",
      credentials: rds.Credentials.fromPassword("testando", cdk.SecretValue.plainText("testing1234")),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      backupRetention: cdk.Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });




    // OUTPUTS
    new cdk.CfnOutput(this, 'dbEndpoint', {
      value: rdsDBinstance.instanceEndpoint.hostname,
    });
  }
}

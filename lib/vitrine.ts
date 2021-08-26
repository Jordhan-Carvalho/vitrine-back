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
      entry: path.join(__dirname, '../src/functions/hello.ts'), 
      handler: 'main',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        NEW_CANDIDATE_SQS: "test",
        DATABASE_URL: "postgresql://testando:testing1234@vv18r829v8p5tp5.cpyl3hphd5rb.us-east-1.rds.amazonaws.com:5432/vitrine?schema=public"
      },
      timeout: cdk.Duration.seconds(6),
      bundling: {
        nodeModules: ['@prisma/client', 'prisma'],
        commandHooks: {
          beforeBundling(_inputDir: string, _outputDir: string) {
            return []
          },
          beforeInstall(inputDir: string, outputDir: string) {
            return [`cp -R ${inputDir}/prisma ${outputDir}/`]
          },
          afterBundling(_inputDir: string, outputDir: string) {
            return [
              `cd ${outputDir}`,
              `npx prisma generate`,
              `rm -rf node_modules/@prisma/engines`,
              `rm -rf node_modules/@prisma/client/node_modules node_modules/.bin node_modules/prisma`,
            ]
          },
        }
      }
    });


    // VPC NEEDED FOR RDS CREATION
    // const natGatewayProvider = ec2.NatProvider.instance({
    //   instanceType: new ec2.InstanceType('t2.small'),
    // });
    const vpc = new ec2.Vpc(this, "vitrine-vpc", {
      // cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: ec2.SubnetType.ISOLATED,
      },
      ]
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publiclyAccessible: true
    });

    rdsDBinstance.connections.allowDefaultPortFromAnyIpv4('Open to the world');


    // OUTPUTS
    new cdk.CfnOutput(this, 'dbEndpointExport', {
      value: rdsDBinstance.instanceEndpoint.hostname,
      exportName: 'dbEnpoint',
      description: 'DB endpoint'
    });

  }
}

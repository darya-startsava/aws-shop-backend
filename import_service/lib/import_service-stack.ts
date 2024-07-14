import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3noti from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";

dotenv.config();

const bucketName = process.env.S3_BUCKET!;
const catalogItemsQueueArn = process.env.CATALOG_ITEMS_QUEUE_ARN!;
const basicAuthorizerLambdaArn = process.env.BASIC_AUTHORIZER_LAMBDA_ARN!;

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "ImportQueue",
      catalogItemsQueueArn
    );

    const importProductsFileFunction = new lambda.Function(
      this,
      "ImportProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "importProductsFile.handler",
        timeout: cdk.Duration.seconds(30),
      }
    );

    const api = new apigateway.LambdaRestApi(this, "ImportProductsApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      handler: importProductsFileFunction,
      proxy: false,
    });

    const authorizerFunction = lambda.Function.fromFunctionArn(
      this,
      "AuthorizerFunction",
      basicAuthorizerLambdaArn
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "LambdaAuthorizer",
      {
        handler: authorizerFunction,
        identitySource: apigateway.IdentitySource.header("Authorization"),
      }
    );

    const importIntegration = new apigateway.LambdaIntegration(
      importProductsFileFunction
    );

    const importProductsResource = api.root.addResource("import");

    importProductsResource.addMethod(
      "GET",
      importIntegration, 
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
          {
            statusCode: "401",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
          {
            statusCode: "403",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        authorizer,
      }
    );

    const importFileParserFunction = new lambda.Function(
      this,
      "ImportFileParserFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "importFileParser.handler",
        timeout: cdk.Duration.seconds(30),
      }
    );

    catalogItemsQueue.grantSendMessages(importFileParserFunction);

    const myBucket = s3.Bucket.fromBucketName(
      this,
      "ExistingS3Bucket",
      bucketName
    );

    myBucket.addObjectCreatedNotification(
      new s3noti.LambdaDestination(importFileParserFunction),
      {
        prefix: "uploaded/",
      }
    );
  }
}

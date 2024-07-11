import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as dotenv from "dotenv";
import * as iam from "aws-cdk-lib/aws-iam";

dotenv.config();

const email = process.env.EMAIL!;

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue");

    const createProductTopic = new sns.Topic(this, "CreateProductTopic");

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(email)
    );

    const getProductListFunction = new lambda.Function(
      this,
      "GetProductListFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsList.handler",
      }
    );

    const getProductByIDFunction = new lambda.Function(
      this,
      "GetProductByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsById.handler",
      }
    );

    const createProductFunction = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "createProduct.handler",
      }
    );

    const catalogBatchProcessFunction = new lambda.Function(
      this,
      "CatalogBatchProcessFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "catalogBatchProcess.handler",
      }
    );

    catalogBatchProcessFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/*`],
      })
    );

    createProductTopic.grantPublish(catalogBatchProcessFunction);
    catalogItemsQueue.grantSendMessages(catalogBatchProcessFunction);

    catalogBatchProcessFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue)
    );

    const api = new apigateway.LambdaRestApi(this, "GetProductsApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      handler: getProductListFunction,
      proxy: false,
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET");

    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductFunction)
    );

    const productResource = productsResource.addResource("{id}");
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIDFunction)
    );
  }
}

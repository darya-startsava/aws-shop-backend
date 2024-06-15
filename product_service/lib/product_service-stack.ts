import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductListFunction = new lambda.Function(
      this,
      "GetProductListFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsList.handler",
      }
    );

    const api = new apigateway.LambdaRestApi(this, "GetProductListApi", {
      handler: getProductListFunction,
      proxy: false,
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET");

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'ProductServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

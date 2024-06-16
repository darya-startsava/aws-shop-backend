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

    const getProductByIDFunction = new lambda.Function(
      this,
      "GetProductByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "getProductsById.handler",
      }
    );

    const api = new apigateway.LambdaRestApi(this, "GetProductsApi", {
      handler: getProductListFunction,
      proxy: false,
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET");

    const productResource = productsResource.addResource("{id}");
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIDFunction)
    );
  }
}

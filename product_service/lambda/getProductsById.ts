import * as dotenv from "dotenv";
import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

dotenv.config();

const ddb = new DynamoDB.DocumentClient();

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  const id = event.pathParameters?.id;
  let product;

  const productParams = {
    TableName: process.env.PRODUCTS_TABLE!,
    Key: {
      id: id,
    },
  };

  const stockParams = {
    TableName: process.env.STOCKS_TABLE!,
    Key: {
      product_id: id,
    },
  };

  try {
    product = await Promise.all([
      ddb.get(productParams).promise(),
      ddb.get(stockParams).promise(),
    ]);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Cannot fetch products from DynamoDB",
      }),
    };
  }

  if (product[0].Item) {
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...product[0].Item, count: product[1].Item.count }),
    };
    return response;
  } else {
    const response = {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Product not found" }),
    };
    return response;
  }
};

import * as dotenv from "dotenv";
import { Handler } from "aws-lambda";

import { DynamoDB } from "aws-sdk";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

dotenv.config();

const ddb = new DynamoDB.DocumentClient();

const tableName = process.env.PRODUCTS_TABLE!;
console.log(tableName);

export const handler: Handler = async (event) => {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: tableName,
  };

  let products;
  let join;
  try {
    products = (await ddb.scan(params).promise()) as any;
    join = await Promise.all(
      products?.Items?.map(async (item) => {
        const params: AWS.DynamoDB.DocumentClient.QueryInput = {
          TableName: process.env.STOCKS_TABLE!,
          KeyConditionExpression: "product_id=:id",
          ExpressionAttributeValues: { ":id": item.id },
        };
        const stocks = (await ddb.query(params).promise())?.Items as any;
        const count = stocks?.[0].count;
        return { ...item, count };
      })
    );
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
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(join),
  };
  return response;
};

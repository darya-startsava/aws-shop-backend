import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Handler } from "aws-lambda";

import { DynamoDB } from "aws-sdk";

dotenv.config();

const ddb = new DynamoDB.DocumentClient();

const productsTableName = process.env.PRODUCTS_TABLE!;
const stocksTableName = process.env.STOCKS_TABLE!;

export const handler: Handler = async (event) => {
  const data = JSON.parse(event.body) || {};
  const { title, description, price, count } = data;

  if (!title || !description || !price || !count) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Add title, description, price and count",
      }),
    };
  }

  const id = uuidv4();

  const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: productsTableName,
    Item: {
      id,
      title,
      description,
      price,
    },
  };

  const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: stocksTableName,
    Item: {
      product_id: id,
      count,
    },
  };

  try {
    await Promise.all([
      ddb.put(productParams).promise(),
      ddb.put(stockParams).promise(),
    ]);
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        'Access-Control-Allow-Headers': 'Content-Type',
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Product was created" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        'Access-Control-Allow-Headers': 'Content-Type',
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Error creating product in DynamoDB",
      }),
    };
  }
};

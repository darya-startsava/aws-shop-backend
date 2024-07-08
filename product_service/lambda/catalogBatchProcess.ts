import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";


dotenv.config();

const productsTableName = process.env.PRODUCTS_TABLE!;
const stocksTableName = process.env.STOCKS_TABLE!;

export const handler: SQSHandler = async (event: SQSEvent) => {
  const ddb = new DynamoDB.DocumentClient();

  const createProduct = async (record: SQSRecord) => {
    const data = JSON.parse(record.body) || {};
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

    const product = { id, title, description, price };

    const stock = { product_id: id, count };

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: productsTableName,
      Item: product,
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: stocksTableName,
      Item: stock,
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
          "Access-Control-Allow-Headers": "Content-Type",
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
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: "Error creating product in DynamoDB",
        }),
      };
    }
  };

  const results = await Promise.all(event.Records?.map(createProduct));
  console.log(results);
  console.log("Products created");
};

import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

dotenv.config();

const productsTableName = process.env.PRODUCTS_TABLE!;
const stocksTableName = process.env.STOCKS_TABLE!;
const region = process.env.REGION!;
const createProductTopicARN = process.env.CREATE_PRODUCT_TOPIC_ARN!;

const snsClient = new SNSClient({ region });

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

    console.log("data:", data);

    try {
      await Promise.all([
        ddb.put(productParams).promise(),
        ddb.put(stockParams).promise(),
      ]);
      const message = `Products have been created! Details: ${JSON.stringify(
        data
      )}`;
      try {
        const result = await snsClient.send(
          new PublishCommand({
            Message: message,
            TopicArn: createProductTopicARN,
          })
        );
        console.log("Message sent: ", result);
      } catch (error) {
        console.error("Error publishing to SNS topic: ", error);
      }
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
      console.log("Error creating product in DynamoDB:", error);
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
  console.log("results:", results);
  console.log("Products created");
};

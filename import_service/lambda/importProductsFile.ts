import * as dotenv from "dotenv";
import { Handler, APIGatewayEvent } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const bucketName = process.env.S3_BUCKET;
const region = process.env.REGION;

export const handler: Handler = async (event: APIGatewayEvent) => {
  const data = event.queryStringParameters || {};
  const { name } = data;

  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Error downloading file",
      }),
    };
  }

  const s3Client = new S3Client({ region });
  const uploadParams = {
    Bucket: bucketName,
    Key: `uploaded/${name}`,
  };
  const command = new PutObjectCommand(uploadParams);

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    console.log("signedUrl:", signedUrl);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST,PUT",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ url: signedUrl }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Error downloading file to the S3 bucket",
      }),
    };
  }
};

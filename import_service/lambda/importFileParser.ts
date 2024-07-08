import * as dotenv from "dotenv";
import { Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import { Readable } from "stream";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

dotenv.config();

const region = process.env.REGION;
const sqsQueueURL = process.env.CATALOG_ITEMS_QUEUE_URL;

const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });

const queue: Array<Record<string, string>> = [];

export const handler: Handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const fileName = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const params = {
    Bucket: bucket,
    Key: fileName,
  };

  console.log("fileName: ", fileName);

  const dataStream = await s3Client.send(new GetObjectCommand(params));
  if (dataStream.Body) {
    (dataStream.Body as Readable)
      .pipe(csv({ strict: true }))
      .on("data", async (data) => {
        queue.push(data);
      })
      .on("error", (error) => console.log(error))
      .on("end", () => {
        console.log("importFileParser finished");
      });
  } else {
    console.error("No body in dataStream");
  }

  await Promise.all(
    queue.map(async (data) => {
      console.log("Start sending the message...");
      console.log(data);
      try {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: sqsQueueURL,
            MessageBody: JSON.stringify(data),
          })
        );
        console.log("The message was sent");
      } catch (error) {
        console.log(error);
      }
    })
  );

  const newFileName = fileName.replace("uploaded", "parsed");
  console.log("newFileName: ", newFileName);

  const newParams = {
    CopySource: `${bucket}/${fileName}`,
    Bucket: bucket,
    Key: newFileName,
  };

  await s3Client.send(new CopyObjectCommand(newParams));

  await s3Client.send(new DeleteObjectCommand(params));
};

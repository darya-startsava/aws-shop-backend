import * as dotenv from "dotenv";
import { Handler } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import { Readable } from "stream";

dotenv.config();


const region = process.env.REGION;
const s3Client = new S3Client({ region });

export const handler: Handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const fileName = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const params = {
    Bucket: bucket,
    Key: fileName,
  };

  const dataStream = await s3Client.send(new GetObjectCommand(params));
  if (dataStream.Body) {
    (dataStream.Body as Readable)
      .pipe(csv())
      .on("data", (data) => console.log(data))
      .on("error", (error) => console.log(error))
      .on("end", () => {
        console.log("importFileParser finished");
      });
  } else {
    console.error("No body in dataStream");
  }
};

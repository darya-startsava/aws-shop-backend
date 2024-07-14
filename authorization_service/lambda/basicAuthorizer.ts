import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import * as dotenv from "dotenv";

dotenv.config();

const login = process.env.LOGIN!;
const password = process.env.PASSWORD!;

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Event", JSON.stringify(event));

  const token = event.authorizationToken;

  console.log('token.trim() === "Basic"', token.trim() === "Basic");

  if (token.trim() === "Basic") {
    return {
      principalId: "unauthorized",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
      context: {
        statusCode: 401,
      },
    };
  }

  const reportedCredentials = token.split(" ")[1];
  const decodedCredentials = Buffer.from(
    reportedCredentials,
    "base64"
  ).toString("utf-8");
  const [reportedLogin, reportedPassword] = decodedCredentials.split(":");

  console.log("Login:", reportedLogin, "password:", reportedPassword);

  if (!password || reportedPassword !== password) {
    return {
      principalId: "unauthorized",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
      context: {
        statusCode: 403,
      },
    };
  }

  return {
    principalId: reportedLogin,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: "*",
        },
      ],
    },
  };
};

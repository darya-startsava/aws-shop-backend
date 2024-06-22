import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import { products } from "./getProductsList";

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  const id = event.pathParameters?.id;
  const product = products.find((i) => i.id === id);

  if (product) {
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
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

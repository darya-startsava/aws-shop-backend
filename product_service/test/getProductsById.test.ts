import { Context } from "aws-lambda";
import { handler } from "../lambda/getProductsById";
import { products } from "../lambda/getProductsList";

describe("Product by id handler", () => {
  test("returns  product with statusCode 200 if id is correct", async () => {
    const id = "7567ec4b-b10c-48c5-9345-fc73c48a80a3";
    const context = {} as Context;

    const result = await handler({ pathParameters: { id } }, context, () => {});

    const body = JSON.parse(result.body);
    const product = products.find((i) => i.id === id);
    expect(result.statusCode).toEqual(200);
    expect(body).toEqual(product);
  });

  test("returns not found message with statusCode 404 if id is incorrect", async () => {
    const id = "incorrectId";
    const response = { message: "Product not found" };
    const context = {} as Context;

    const result = await handler({ pathParameters: { id } }, context, () => {});
    const body = JSON.parse(result.body);
    expect(result.statusCode).toEqual(404);
    expect(body).toEqual(response);
  });
});

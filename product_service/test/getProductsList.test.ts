import { Context } from "aws-lambda";
import { handler, products } from "../lambda/getProductsList";

describe("Product handler", () => {
  test("returns all products with statusCode 200", async () => {
    const context = {} as Context;

    const result = await handler({}, context, () => {});
    const body = JSON.parse(result.body);

    expect(result.statusCode).toEqual(200);
    expect(body).toEqual(products);
  });
});

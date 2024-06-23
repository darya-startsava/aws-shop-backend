import { Context } from "aws-lambda";
import { handler } from "../lambda/getProductsList";

export const products = [
  {
    description: "Short Product Description1",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
    price: 24,
    title: "ProductOne",
  },
  {
    description: "Short Product Description7",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
    price: 15,
    title: "ProductTitle",
  },
  {
    description: "Short Product Description2",
    id: "7567ec4b-b10c-48c5-9345-fc73c48a80a3",
    price: 23,
    title: "Product",
  },
];

describe("Product handler", () => {
  test("returns all products with statusCode 200", async () => {
    const context = {} as Context;

    const result = await handler({}, context, () => {});
    const body = JSON.parse(result.body);

    expect(result.statusCode).toEqual(200);
    expect(body).toEqual(products);
  });
});

import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const result = await dynamoDb.get({
    TableName: process.env.round1AlgorithmsTable,
    Key: { algorithmId: event.pathParameters.id },
  });
  if (!result.Item) {
    throw new Error("Item not found");
  }
  return result.Item;
});

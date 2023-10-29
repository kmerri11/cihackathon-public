import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  await dynamoDb.delete({
    TableName: process.env.round1AlgorithmsTable,
    Key: { algorithmId: event.pathParameters.id },
  });
  return { status: true };
});

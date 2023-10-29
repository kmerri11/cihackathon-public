import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];
  const result = await dynamoDb.get({
    TableName: process.env.algorithmsTable,
    Key: { userId: userId },
  });
  return result.Item;
});

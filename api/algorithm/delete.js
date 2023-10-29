import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];
  await dynamoDb.delete({
    TableName: process.env.algorithmsTable,
    Key: { userId: userId },
  });
  return { status: true };
});

import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const identityId = event.requestContext.identity.cognitoIdentityId;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.algorithmsTable,
    Item: {
      userId: userId,
      identityId: identityId,
      attachment: data.attachment,
      createdAt: Date.now(),
    },
  };
  await dynamoDb.put(params);
  return { status: true };
});
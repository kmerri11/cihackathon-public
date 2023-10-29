import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const authProvider = event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(':');
  const userId = parts[parts.length - 1];
  const result = await dynamoDb.scan({
    TableName: process.env.round1AlgorithmsTable,
  });
  var algorithms = [];
  for (let i = 0; i < result.Items.length; i++) {
    if (userId == result.Items[i]["userId"]) {
      algorithms.push(result.Items[i]);
    }
  }
  return algorithms;
});

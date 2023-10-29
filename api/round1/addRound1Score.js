import * as uuid from "uuid";
import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const authProvider = event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(':');
  const userId = parts[parts.length - 1];
  await dynamoDb.put({
    TableName: process.env.round1ScoresTable,
    Item: {
      scoreId: uuid.v1(),
      userId: userId, // judge
      assignmentId: data.assignmentId,
      algorithmId: data.algorithmId,
      score: data.score,
      scoredAt: Date.now()
    },
  });
  return { status: `Added score for ${data.algorithmId}: ${data.score}` };
});

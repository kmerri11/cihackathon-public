import * as uuid from "uuid";
import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const authProvider = event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(':');
  const userId = parts[parts.length - 1];
  const params = {
    TableName: process.env.round2ScoresTable,
    Item: {
      scoreId: uuid.v1(),
      setId: data.setId,
      userId: userId,
      pairId: data.pairId,
      algorithmId: data.algorithmId,
      score: data.score,
      scoredAt: Date.now()
    },
  };
  await dynamoDb.put(params);
  return { status: `Added score for ${data.algorithmId}: ${data.score}` };
});

import AWS from "aws-sdk";
import * as uuid from "uuid";
import dynamoDb from "../libs/dynamodb-lib";

const lambda = new AWS.Lambda();

function invokevocoder(event, userId, algorithmId) {
  console.log(
    `Invoking vocoder for userId=${userId} algorithmId=${algorithmId}`
  );
  let params = {
    FunctionName: process.env.vocoderfunction,
    InvocationType: "Event",
    Payload: JSON.stringify({
      body: { algorithmId: algorithmId, userId: userId },
      requestContext: {
        identity: {
          cognitoIdentityId: event.requestContext.identity.cognitoIdentityId,
        },
      },
    }),
  };

  return new Promise((resolve, reject) => {
    lambda.invoke(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      } else {
        console.log(data);
        resolve(data);
      }
    });
  });
}

export const main = async (event, context, callback) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];
  const data = JSON.parse(event.body);
  const algorithmId = uuid.v1();
  const params = {
    TableName: process.env.round1AlgorithmsTable,
    Item: {
      userId: userId,
      algorithmId: algorithmId,
      label: data.label,
      attachment: data.attachment,
      createdAt: Date.now(),
      vocoderStatus: "Submitted for processing",
    },
  };
  await dynamoDb.put(params);

  // Trigger Lambda function to process attachment file
  await invokevocoder(event, userId, algorithmId);
  var response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    isBase64Encoded: false,
    body: JSON.stringify(params.Item),
  };
  callback(null, response);
};

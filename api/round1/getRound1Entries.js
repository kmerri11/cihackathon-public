import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const authProvider = event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(':');
  const userId = parts[parts.length - 1];
  console.log(`Fetching round 1 entries for ${userId}`);

  // Find assigned set and entries
  var result = await dynamoDb.get({
    TableName: process.env.round1AssignmentsTable,
    Key: { userId: userId },
  });
  if (!result.Item || !result.Item.assigned_sets) {
    // We have a new judge or a hacker that needs
    // another round of entries to judge
    return { total_completed: 0 };
  }
  // Fetch last assigmentId and entries
  var assigned_sets = result.Item.assigned_sets.values;
  var assignmentId = assigned_sets[assigned_sets.length - 1];
  result = await dynamoDb.get({
    TableName: process.env.round1AssignmentsTable,
    Key: { userId: assignmentId },
  });
  var assignedSet = result.Item.entries.values;
  //console.log(result.Item.entries.values);

  // Find entries scored by user
  var scoredEntries = [];
  result = await dynamoDb.query({
    KeyConditionExpression: "#user = :userId",
    FilterExpression: "#assignmentId = :assignmentId",
    ExpressionAttributeNames:{
      "#user": "userId",
      "#assignmentId": "assignmentId",
    },
    ExpressionAttributeValues: {
      ":userId": userId,
      ":assignmentId": assignmentId,
    },
    TableName: process.env.round1ScoresTable,
  });
  for (let item of result.Items) {
    scoredEntries.push(item.algorithmId);
  }
  //console.log(scoredEntries);

  let difference = assignedSet.filter(x => !scoredEntries.includes(x));
  //console.log(difference);

  // Fetch object for next entry
  var next_entry;
  if (difference[0]) {
    result = await dynamoDb.get({
      TableName: process.env.round1AlgorithmsTable,
      Key: { algorithmId: difference[0] },
    });
    next_entry = result.Item;
    next_entry.assignmentId = assignmentId;
  }
  //console.log(next_entry);

  // Find total sets completed
  var total_sets = assigned_sets.length;
  if (scoredEntries.length < assignedSet.length)
    total_sets--;

  // Return the next entry to judge (null if none)
  return {
    next_entry: next_entry,
    current_position: scoredEntries.length,
    total_entries: assignedSet.length,
    total_sets: total_sets,
  };
});

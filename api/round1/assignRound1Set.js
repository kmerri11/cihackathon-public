import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];
  //const userId = "team1"; // one score left in current set
  //const userId = "team2"; // exhausted sets
  var msg;

  // Confirm user needs a new set
  var assign_set = false;
  var userAssignment = {};

  // Find assigned set and entries
  var result = await dynamoDb.get({
    TableName: process.env.round1AssignmentsTable,
    Key: { userId: userId },
  });
  if (!result.Item || !result.Item.assigned_sets) {
    // We have a new judge or a hacker that needs
    // another round of entries to judge
    assign_set = true;
  } else {
    userAssignment = result.Item;
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
      ExpressionAttributeNames: {
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

    let difference = assignedSet.filter((x) => !scoredEntries.includes(x));
    if (difference[0]) {
      assign_set = false;
      console.log(
        `User ${userId} has ${difference.length} more entries to score`
      );
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
      if (scoredEntries.length < assignedSet.length) total_sets--;

      // Return the next entry to judge (null if none)
      return {
        msg: `User has ${difference.length} more entries to score`,
        next_entry: next_entry,
        current_position: scoredEntries.length,
        total_entries: assignedSet.length,
        total_sets: total_sets,
      };
    } else {
      // Exhausted current set, needs another
      assign_set = true;
    }
  }

  // Something weird is going on
  if (!assign_set) {
    console.log(`User ${userId} does not need a new set assignment`);
    return { msg: "A strange error is happening" };
  }

  // Find first set with lowest count that's not the same as the userId
  result = await dynamoDb.scan({
    TableName: process.env.round1AssignmentsTable,
    FilterExpression: "attribute_exists(#assignmentId)",
    ExpressionAttributeNames: {
      '#assignmentId': 'assignmentId',
    }
  });

  var min = result.Items[0].counter;
  var next_set = result.Items[0];
  for (let i = 0; i < result.Items.length; i++) {
    if (userId == result.Items[i].assignmentId) {
      console.log("Don't judge own entries");
      continue;
    }
    if (
      userAssignment.assigned_sets &&
      result.Items[i].userId in userAssignment.assigned_sets
    ) {
      console.log(`${userId} already judged ${result.Items[i]["userId"]}`);
      continue;
    }
    if (result.Items[i].counter < min) {
      console.log(`Found a lower count ${result.Items[i]["counter"]}`);
      min = result.Items[i].counter;
      next_set = result.Items[i];
    }
  }
  //console.log(next_set);

  // Check if user judged all sets (hearo!)
  if (userAssignment.assigned_sets && result.Items.length === userAssignment.assigned_sets.length) {
    next_set = {};
  }

  if (next_set && next_set.userId != userId) {
    console.log(`${userId} will judge new set: ${next_set.userId}`);
    msg = `${userId} will judge new set: ${next_set.userId}`;

    // Add set to assigned_sets
    console.log(`Appending ${next_set.userId} to assigned_sets for ${userId}`);
    await dynamoDb.update({
      TableName: process.env.round1AssignmentsTable,
      Key: { userId: userId },
      UpdateExpression: "ADD assigned_sets :new_set",
      ExpressionAttributeValues: {
        ":new_set": dynamoDb.createSet(next_set.userId),
      },
    });

    // Increment counter
    await dynamoDb.update({
      TableName: process.env.round1AssignmentsTable,
      Key: { userId: next_set.userId },
      UpdateExpression: "SET #cnt = #cnt + :val",
      ExpressionAttributeValues: {
        ":val": 1,
      },
      ExpressionAttributeNames: { "#cnt": "counter" },
    });
  } else {
    msg = "No more sets available";
    next_set = {};
    console.log(`${userId} has exhausted all available sets`);
  }

  return { msg: msg };
});

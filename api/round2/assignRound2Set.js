import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

const MAX_PER_ROUND = parseInt(process.env.round2_max_sets);
const MAX_SETS = process.env.round2entries_per_set;
const TOKEN = {
  cnc: "cnc",
  nat: "natural_speech",
  mus: "music",
  spe: "speech_in_noise",
};
const ORDER = ["cnc", "natural_speech", "music", "speech_in_noise"];

function next_index(setId, set_counter) {
  // Return if all sets are maxxed out
  let maxxed_sets = 0;
  if (set_counter['cnc'] > 31) maxxed_sets++;
  if (set_counter['music'] > 31) maxxed_sets++;
  if (set_counter['natural_speech'] > 31) maxxed_sets++;
  if (set_counter['speech_in_noise'] > 31) maxxed_sets++;
  if (maxxed_sets >= 3) return;

  let current_set = TOKEN[setId.slice(0, 3)];
  for (let i = 0; i <= 3; i++) {
    if (current_set == ORDER[i]) {
      let num = i + 1;
      if (num > 3) num = 0;
      if (set_counter[ORDER[num]] < 31) // not maxxed out
        return ORDER[num];
      else {
        return next_index(ORDER[num], set_counter);
      }
    }
  }
}


export const main = handler(async (event, context) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];
  console.log(userId);

  var next_entry;
  var current_set;
  var previous_sets = [];
  var current_position = 0;
  var choose_new_set = false;

  // Find assigned set for userId
  var result = await dynamoDb.get({
    TableName: process.env.round2AssignmentsTable,
    Key: { userId: userId },
  });
  console.log(result); // remove

  if (result.Item) {
    let total_scores = 0;
    current_set = result.Item.setId;
    if (result.Item.previousSets) previous_sets = result.Item.previousSets;
    console.log(previous_sets); // remove

    // Find algorithms associated with set
    result = await dynamoDb.get({
      TableName: process.env.round2SetsTable,
      Key: { setId: current_set },
    });
    for (let pairId of result.Item.pairs["values"]) {
      current_position += 1;

      // Check if there is a score associated with the pairId
      let score = await dynamoDb.get({
        TableName: process.env.round2ScoresTable,
        Key: {
          userId: userId,
          pairId: pairId,
        },
      });
      if (!score.Item) {
        console.log(
          `[counter=${current_position}] No score for ${pairId}: we should grade it`
        );
        next_entry = pairId;
      } else {
        console.log(
          `[counter=${current_position}] Found score for ${pairId}: ${score.Item.score}`
        );
        total_scores += 1;
      }
    }
    // Assign new set if we have scores for all pairs
    if (next_entry == null) {
      console.log(
        `[counter=${current_position}] [total_scores=${total_scores}] [next_entry=${next_entry}] Assign a new set`
      );
      choose_new_set = true;
    }
    current_position = total_scores; // Update current position
    //console.log(`current_position=${current_position}`);
  } else {
    // User is not assigned to a set
    console.log(`Team ${userId} NOT found in assignments table`);
    // Current set will be the last speech_in_noise, so it starts with cnc
    current_set = "speech_in_noise";
    choose_new_set = true;
  }

  // Assign user to new set if needed
  if (choose_new_set) {
    // Find counters for sets
    result = await dynamoDb.scan({TableName: process.env.round2CountersTable});
    var set_counter = {};
    for (let i = 0; i <= 3; i++) {
      set_counter[result.Items[i].token] = result.Items[i].counter;
    }
    console.log(set_counter);

    let next_token = next_index(current_set, set_counter);
    console.log(`Next token: ${next_token}`);
    // We've exhausted all sets
    if (next_token === undefined) {
      console.log("Exhausted all sets");
      return next_token;
    }

    result = await dynamoDb.update({
      TableName: process.env.round2CountersTable,
      Key: { token: next_token },
      UpdateExpression: "SET #cnt = #cnt + :val",
      ExpressionAttributeValues: { ":val": 1 },
      ExpressionAttributeNames: { "#cnt": "counter" },
      ReturnValues: "UPDATED_NEW",
    });

    // Choose random set if we've already graded all available sets
    let current_count = result.Attributes.counter;
    if (current_count >= MAX_SETS) {
      current_count = current_count % MAX_PER_ROUND;
    }
    console.log(`Current count for ${next_token}:${current_count}`);

    // Assign new set to user and append to list of previousSets
    let next_set = `${next_token}_${current_count}`;
    result = dynamoDb.update({
      TableName: process.env.round2AssignmentsTable,
      Key: { userId: userId },
      UpdateExpression: "SET setId = :new_set",
      ExpressionAttributeValues: {
        ":new_set": next_set,
      },
    });
    result = dynamoDb.update({
      TableName: process.env.round2AssignmentsTable,
      Key: { userId: userId },
      UpdateExpression: "ADD previousSets :old_set",
      ExpressionAttributeValues: {
        ":old_set": dynamoDb.createSet(current_set),
      },
    });
    console.log(
      `Assigned new set for team=${userId} last_set=${current_set} next_set=${next_set}`
    );

    // Find first pair to score
    result = await dynamoDb.get({
      TableName: process.env.round2SetsTable,
      Key: { setId: next_set },
    });
    current_position = 0;
    next_entry = result.Item.pairs["values"][0];
  }

  result = await dynamoDb.get({
    TableName: process.env.round2PairsTable,
    Key: { pairId: next_entry },
  });
  console.log(result);

  return {
    pair: result.Item,
    pairId: next_entry,
    setId: current_set,
    current_position: current_position,
    previous_sets: previous_sets.length,
    total_entries: MAX_PER_ROUND,
  };
});

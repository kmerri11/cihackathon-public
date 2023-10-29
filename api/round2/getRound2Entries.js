import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";

const MAX_PER_ROUND = parseInt(process.env.round2_max_sets);

export const main = handler(async (event, context) => {
  const authProvider =
    event.requestContext.identity.cognitoAuthenticationProvider;
  const parts = authProvider.split(":");
  const userId = parts[parts.length - 1];

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

  if (result.Item) {
    let total_scores = 0;
    current_set = result.Item.setId;
    if (result.Item.previousSets)
      previous_sets = result.Item.previousSets.values;

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
        //console.log(`[counter=${current_position}] No score for ${pairId}: we should grade it`);
        next_entry = pairId;
      } else {
        //console.log(`[counter=${current_position}] Found score for ${pairId}: ${score.Item.score}`);
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
    //console.log(`current_position=${current_position}`);
    current_position = total_scores; // Update current position
  } else {
    // User is not assigned to a set
    console.log(`Team ${userId} NOT found in assignments table`);
    choose_new_set = true;
  }

  if (choose_new_set) {
    // Pretend to append to set to increment number
    if (current_position === MAX_PER_ROUND) {
      previous_sets.push("set_finished");
    }
    return {
      pair: null,
      pairId: null,
      setId: current_set,
      current_position: current_position,
      previous_sets: previous_sets.length,
      total_entries: MAX_PER_ROUND,
    };
  }

  result = await dynamoDb.get({
    TableName: process.env.round2PairsTable,
    Key: { pairId: next_entry },
  });
  //console.log(result);

  return {
    pair: result.Item,
    pairId: next_entry,
    setId: current_set,
    current_position: current_position,
    previous_sets: previous_sets.length,
    total_entries: MAX_PER_ROUND,
  };
});

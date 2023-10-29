import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";
import { mean } from "mathjs";

function getMaxScore(teams, label) {
  return Object.keys(teams).reduce(function (a, b) {
    return teams[a][label] > teams[b][label] ? a : b;
  });
}

function getMinScore(teams, label) {
  return Object.keys(teams).reduce(function (a, b) {
    return teams[a][label] < teams[b][label] ? a : b;
  });
}

const getAllData = async (params) => {
  const _getAllData = async (params, startKey) => {
    if (startKey) {
      params.ExclusiveStartKey = startKey;
    }
    return dynamoDb.scan(params);
  };
  let lastEvaluatedKey = null;
  let rows = [];
  do {
    const result = await _getAllData(params, lastEvaluatedKey);
    rows = rows.concat(result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  return rows;
};

export const main = handler(async (event, context) => {
  // Build dict of raw scores
  var round2userscores = {}; // entries judged per user
  var round2scores = {}; // scores per algorithm
  // var result = await dynamoDb.scan({
  //   TableName: process.env.round2ScoresTable,
  // });

  var result;
  var params = {
    TableName: process.env.round2ScoresTable,
    Limit: 1000,
  };
  try {
    result = await getAllData(params);
    // console.log("my data: ", data);
  } catch (error) {
    console.log(error);
  }

  // dynamoDb.scan(params, function scanUntilDone(err, data) {
  //   if (err) {
  //     console.log(err, err.stack);
  //   } else {
  //     // do something with data
  //     console.log(data);
  //     if (data.LastEvaluatedKey) {
  //       params.ExclusiveStartKey = data.LastEvaluatedKey;
  //       dynamoDb.scan(params, scanUntilDone);
  //     }
  //   }
  // });

  // Add scores for each algorithm
  for (let i = 0; i < result.length; i++) {
    let algorithmId = result[i]["algorithmId"];
    let userId = result[i]["userId"];
    let score = result[i]["score"];
    if (algorithmId in round2scores) {
      round2scores[algorithmId]["raw_scores"].push(parseFloat(score));
      round2scores[algorithmId]["mean"] = mean(
        round2scores[algorithmId]["raw_scores"]
      );
      round2scores[algorithmId]["total"] = round2scores[algorithmId]["raw_scores"].reduce((a, b) => a + b, 0);
    } else {
      round2scores[algorithmId] = {
        raw_scores: [parseFloat(score)],
        mean: parseFloat(score),
        total: parseFloat(score),
      };
    }
    if (userId in round2userscores) {
      round2userscores[userId].push(algorithmId);
    } else {
      round2userscores[userId] = [algorithmId];
    }
  }
  //console.log(round2scores);

  // Build dict of algorithms for lookup because
  // dynamoDb scans are super expensive operations
  result = await dynamoDb.scan({
    TableName: process.env.round1AlgorithmsTable,
  });
  var algorithmsById = [];
  var algorithmsByUserId = [];
  for (let i = 0; i < result.Items.length; i++) {
    let algorithmId = result.Items[i]["algorithmId"];
    let userId = result.Items[i]["userId"];
    let label = result.Items[i]["label"];
    if (algorithmId in round2scores) {
      algorithmsById[algorithmId] = {
        userId: userId, // teamId
        label: label,
        raw_scores: round2scores[algorithmId]["raw_scores"],
        score: round2scores[algorithmId]["total"], // was mean
        mean: round2scores[algorithmId]["mean"],
      };
      if (userId in algorithmsByUserId) {
        algorithmsByUserId[userId].push(algorithmId);
      } else {
        algorithmsByUserId[userId] = [algorithmId];
      }
    }
  }
  //console.log(algorithmsById);

  // Add ab gold standard
  for (let category of ['cnc', 'music', 'speech_in_noise', 'natural_speech']) {
    for (let k = 1; k <=3; k++) {
      let userId = 'ab-gold-standard';
      let label = `${category}_${k}`;
      let algorithmId = `ab-gold-standard-${label}`;
      //console.log(`${userId} ${label} ${algorithmId}`);
      if (algorithmId in round2scores) {
        algorithmsById[algorithmId] = {
          userId: userId,
          label: label,
          raw_scores: round2scores[algorithmId]["raw_scores"],
          score: round2scores[algorithmId]["total"], // was mean
          mean: round2scores[algorithmId]["mean"],
        };
        if (userId in algorithmsByUserId) {
          algorithmsByUserId[userId].push(algorithmId);
        } else {
          algorithmsByUserId[userId] = [algorithmId];
        }
      }
    }
  }

  // Combine categorical scores for each team
  var teams = {};
  Object.keys(algorithmsByUserId).forEach(function (userId) {
    //console.log(userId);

    // Create object for results
    teams[userId] = {
      userId: userId,
      role: "hacker",
      overall: 0,
      cnc: 0,
      music: 0,
      speech_in_noise: 0,
      natural_speech: 0,
      scores: 0, // round2 judging progress
      total_scores: 0, // scores including non-hackers
    };

    // // Consider round 2 judging hasn't started yet
    if (round2userscores[userId]) {
      // For user progress (how many did userId judge)
      teams[userId]["scores"] = round2userscores[userId].length;
    }

    // Build array of scores for each category (label)
    for (let i = 0; i < algorithmsByUserId[userId].length; i++) {
      let algorithmId = algorithmsByUserId[userId][i];
      let label = algorithmsById[algorithmId]["label"].slice(0, -2); // truncate
      if (
        algorithmId in algorithmsById &&
        algorithmsById[algorithmId] &&
        algorithmsById[algorithmId].score
      ) {
        let old_score = parseFloat(teams[userId][label]);
        let new_score = parseFloat(algorithmsById[algorithmId].score);
        teams[userId][label] = new_score + old_score;
        //console.log(`Found score=${new_score} for algorithmId=${algorithmId} label=${label}: ${new_score}+${old_score}=${teams[userId][label]}`);
        teams[userId]["total_scores"]++;
        // Add to overall score
        let old_overall = parseFloat(teams[userId].overall);
        teams[userId].overall = new_score + old_overall;
      }
    }
    //console.log(teams[userId]);
  });

  // Find winners (and losers) for each category
  var topscores = {};
  for (let label of [
    "overall",
    "cnc",
    "music",
    "natural_speech",
    "speech_in_noise",
  ]) {
    topscores[`best_at_${label}`] = {
      category: `Best at ${label}`,
      teamId: getMaxScore(teams, label),
    };
    topscores[`worse_at_${label}`] = {
      category: `Worst at ${label}`,
      teamId: getMinScore(teams, label),
    };
  }
  //console.log(topscores);

  // Find number of sets and scores for each judge
  var judges = {};
  Object.keys(round2userscores).forEach(function (userId) {
    if (!teams[userId]) {
      judges[userId] = {
        userId: userId, // need to lookup actual name?
        role: "judge",
        scores: round2userscores[userId].length, // round2 judging progress
      };
    }
  });

  //console.log(round2userscores["team1"]);

  return {
    topscores: topscores,
    judges: judges,
    teams: teams,
  };
});

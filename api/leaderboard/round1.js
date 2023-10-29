import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";
import { std, mean } from "mathjs";

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

export const main = handler(async (event, context) => {
  var round1userscores = {};
  var round1scores = {};
  // Build dict of raw scores for each judge in order to
  // calculare mean and std for normalizing scores into zscores
  var result = await dynamoDb.scan({
    TableName: process.env.round1ScoresTable,
  });
  for (let i = 0; i < result.Items.length; i++) {
    let userId = result.Items[i]["userId"];
    let score = result.Items[i]["score"];
    if (userId in round1userscores) {
      let raw_scores = round1userscores[userId]["raw_scores"];
      raw_scores.push(score);
      round1userscores[userId]["mean"] = mean(raw_scores);
      round1userscores[userId]["stdv"] = std(raw_scores);
    } else {
      round1userscores[userId] = {
        raw_scores: [score],
        mean: 1, // avoid division by 0 errors
        stdv: 1,
      };
    }
  }
  // Fetch raw scores for all algorithms and normalize
  // values to zscores using individual judge's mean/std
  for (let i = 0; i < result.Items.length; i++) {
    let algorithmId = result.Items[i]["algorithmId"];
    let userId = result.Items[i]["userId"];
    let score = result.Items[i]["score"];
    // Calculate zscore using stdv and mean for userId
    let sd = round1userscores[userId]["stdv"];
    let mn = round1userscores[userId]["mean"];
    let zs = (score - mn) / sd;
    // console.log(
    //   `[algorithmId=${algorithmId} userId=${userId}]
    //    converting score=${score} to zscore=${zs}
    //    using stdv=${sd} and mean=${mn}`
    // );
    if (algorithmId in round1scores) {
      round1scores[algorithmId]["raw_scores"].push(score);
      round1scores[algorithmId]["zscores"].push(zs);
      round1scores[algorithmId]["zs_mean"] = mean(
        round1scores[algorithmId]["zscores"]
      );
    } else {
      round1scores[algorithmId] = {
        raw_scores: [score],
        zscores: [zs],
        zs_mean: 0,
      };
    }
  }

  // Build dict of round1 algorithms for lookup because
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
    algorithmsById[algorithmId] = {
      userId: userId,
      label: label,
    };
    if (userId in algorithmsByUserId) {
      algorithmsByUserId[userId].push(algorithmId);
    } else {
      algorithmsByUserId[userId] = [algorithmId];
    }
  }
  console.log(algorithmsById);

  // // Build dict of algorithm attachments by userId
  // result = await dynamoDb.scan({
  //   TableName: process.env.algorithmsTable,
  // });
  // var uploadsById = [];
  // for (let i = 0; i < result.Items.length; i++) {
  //   let userId = result.Items[i]["userId"];
  //   uploadsById[userId] = result.Items[i];
  // }
  // //console.log(uploadsById);

  // Calculate mean zscore for each of the three tokens
  // for each label for every userId (i.e. cnc_1 + cnc_2 + cnc_3)
  var teams = {};
  Object.keys(algorithmsByUserId).forEach(function (userId) {
    //console.log(userId);

    // Create object for results
    teams[userId] = {
      userId: userId,
      role: "hacker",
      //algorithm: uploadsById[userId],
      overall: 0,
      cnc: 0,
      music: 0,
      speech_in_noise: 0,
      natural_speech: 0,
      entries: algorithmsByUserId[userId].length,
      scores: 0, // round1 judging progress
      total_scores: 0, // scores including non-hackers
    };

    // Consider round 1 judging hasn't started yet
    if (round1userscores[userId]) {
      // For user progress (how many did userId judge)
      teams[userId]["scores"] = round1userscores[userId]["raw_scores"].length;
    }

    // Build array of zscores for each category (label)
    var zscores = {
      cnc: [],
      music: [],
      natural_speech: [],
      speech_in_noise: [],
    };
    for (let i = 0; i < algorithmsByUserId[userId].length; i++) {
      let algorithmId = algorithmsByUserId[userId][i];
      let label = algorithmsById[algorithmId]["label"].slice(0, -2); // truncate
      // Don't bother if it hasn't been scored
      if (round1scores[algorithmId]) {
        let zs_mean = round1scores[algorithmId]["zs_mean"]; // mean zscore for algorithm
        zscores[label].push(zs_mean);
        // Total scores for all userId entries
        teams[userId]["total_scores"] +=
          round1scores[algorithmId]["raw_scores"].length;
      }
    }

    // Calculate mean zscore for each category (label)
    Object.keys(zscores).forEach(function (label) {
      // Don't calculate mean of empty arrays
      if (zscores[label].length > 0) {
        let mean_zscore = mean(zscores[label]);
        teams[userId][label] = mean_zscore;
        //console.log(`label=${label} mean=${mean_zscore} [${zscores[label]}]`);
      }
    });

    // Calculate mean overall score for all categories
    teams[userId]["overall"] = mean([
      teams[userId]["cnc"],
      teams[userId]["music"],
      teams[userId]["natural_speech"],
      teams[userId]["speech_in_noise"],
    ]);
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
  Object.keys(round1userscores).forEach(function (userId) {
    if (!teams[userId]) {
      judges[userId] = {
        userId: userId, // need to lookup actual name?
        role: "judge",
        scores: round1userscores[userId]["raw_scores"].length, // round1 judging progress
      };
    }
  });

  return {
    topscores: topscores,
    judges: judges,
    teams: teams,
  };
});

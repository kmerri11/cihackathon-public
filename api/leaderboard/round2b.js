import handler from "../libs/handler-lib";
import dynamoDb from "../libs/dynamodb-lib";


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
  var result;

  // Build dict of algorithms for lookup because
  // dynamoDb scans are super expensive operations
  var algorithmsById = {};
  result = await dynamoDb.scan({
    TableName: process.env.round1AlgorithmsTable,
  });
  for (let i = 0; i < result.Items.length; i++) {
    let algorithmId = result.Items[i]["algorithmId"];
    let userId = result.Items[i]["userId"];
    let label = result.Items[i]["label"];
    algorithmsById[algorithmId] = {
      teamId: userId,
      label: label,
    };
  }

  // Build dict for pairs
  var round2pairs = {};
  try {
    result = await getAllData({
      TableName: "cihackathon-dev-round2-pairs",
      Limit: 1000,
    });
  } catch (error) {
    console.log(error);
  }
  for (let i = 0; i < result.length; i++) {
    round2pairs[result[i]["pairId"]] = result[i];
  }


  // Build dict for scores
  var round2scores = {};
  var round2matrix = {};
  try {
    result = await getAllData({
      TableName: "cihackathon-dev-round2-scores",
      Limit: 1000,
    });
  } catch (error) {
    console.log(error);
  }
  // Add scores for each algorithm
  for (let i = 0; i < result.length; i++) {
    let algorithmId = result[i]["algorithmId"];
    let pairId = result[i]["pairId"];
    let score = result[i]["score"];
    let label = "none";
    if (algorithmId in algorithmsById) {
      label = algorithmsById[algorithmId]["label"];
    }

    // Look up team that owns algorithm
    let pair = round2pairs[pairId];
    let teamId;
    let comparedTeam;
    if (algorithmId === pair['team0_algorithmId']) {
      teamId = pair['team0'];
      comparedTeam = pair['team1'];
    }
    if (algorithmId === pair['team1_algorithmId']) {
      teamId = pair['team1'];
      comparedTeam = pair['team0'];
    }

    if (teamId in round2scores) {
      if (label in round2scores[teamId]) {
          round2scores[teamId][label]["raw_scores"].push(parseFloat(score));
          round2scores[teamId][label]["sum"] = round2scores[teamId][label]["raw_scores"].reduce((a, b) => a + b, 0);
          round2scores[teamId][label]["comparedTeams"].push(comparedTeam);
      }
      else {
        round2scores[teamId][label] = {
          comparedTeams: [comparedTeam],
          algorithmId: algorithmId,
          raw_scores: [parseFloat(score)],
          sum: parseFloat(score),
        };
      }
    } else {
      round2scores[teamId] = {};
      round2scores[teamId][label] = {
        comparedTeams: [comparedTeam],
        algorithmId: algorithmId,
        raw_scores: [parseFloat(score)],
        sum: parseFloat(score),
      };
    }

    if (teamId in round2matrix) {
      if (label in round2matrix[teamId]) {
        round2matrix[teamId][label][comparedTeam] = parseFloat(score);
      }
      else {
        round2matrix[teamId][label] = {};
        round2matrix[teamId][label][comparedTeam] = parseFloat(score);
      }
    }
    else {
      round2matrix[teamId] = {};
      round2matrix[teamId][label] = {};
      round2matrix[teamId][label][comparedTeam] = parseFloat(score);
    }
  }
  //console.log(round2scores);

  // Object.keys(round2scores).forEach(function (teamId) {
  //   Object.keys(round2scores[teamId]).forEach(function (label) {
  //     let sum = round2scores[teamId][label]["sum"];
  //     let raw_scores = round2scores[teamId][label]["raw_scores"];
  //     let comparedTeams = round2scores[teamId][label]["comparedTeams"];
  //     let desc = `${teamId} ${label} ${sum} ${raw_scores} ${comparedTeams}`;
  //     console.log(desc);
  //   });
  // });
  console.log(round2matrix);

  const label = "cnc_1";
  const teams = ['team1','team2','team3','team4','team5','team6','team7','team8','team9','team10','team11','team12','team13','team14','team15','team16','team17','team18','team19','team20','team21','team22','team23','team24'];
  teams.forEach(function (teamId) {
    //console.log(teamId);
    let score_string = "";
    teams.forEach(function (comparedTeam) {
      let score = "NaN";
      if (comparedTeam in round2matrix[teamId][label]) {
        score = round2matrix[teamId][label][comparedTeam];
      };
      score_string = score_string + ` ${comparedTeam}=${score}`;
    });
    console.log(`${teamId} ${score_string}`);
  });

});

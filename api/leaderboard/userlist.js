import AWS from "aws-sdk";
import handler from "../libs/handler-lib";

function parseUser(item) {
  let user = {};
  user.userid = item.Username;
  user.created = item.UserCreateDate;
  user.status = item.UserStatus;
  try {
    for (let k = 0; k < item.Attributes.length; k++) {
      let attr = item.Attributes[k];
      if (attr.Name == "name") user.name = attr.Value.substring(0, 100); // For those who don't follow rules
      if (attr.Name == "email") user.email = attr.Value;
      if (attr.Name == "custom:role") user.role = attr.Value;
    }
  }
  catch(err) {
    console.log(item);
    console.log(err.message);
  }
  return user;
}

export const main = handler(async (event, context) => {
  var allusers = [];
  var cognito = new AWS.CognitoIdentityServiceProvider();
  var params = {
    UserPoolId: "us-east-2_CqPRRaFmB", // todo: create staging pool
    Filter: null,
    Limit: 60
  };
  var results = await cognito.listUsers(params).promise();
  console.log(results.Users);
  for (let item of results.Users) {
    let user = parseUser(item);
    allusers.push(user);
  }

  while (results.PaginationToken) {
    params.PaginationToken = results.PaginationToken;
    results = await cognito.listUsers(params).promise();
    for (let item of results.Users) {
      let user = parseUser(item);
      allusers.push(user);
    }
  }
  return allusers;
});
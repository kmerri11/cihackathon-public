const https = require("https");

export const main = (event, context, callback) => {
  const payload = JSON.stringify({
    text: `Message sent by ${event.name} (${event.email}):\n ${event.message}`,
  });
  const options = {
    hostname: "hooks.slack.com",
    method: "POST",
    path: "/services/TG4DQL3EH/B01EZ970FGS/qaLnLHcx9g5QGZ8CePhf5cHf",
  };
  var statusCode = 200;
  const request = {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      message: 'Invoked lambda function to send slack message to #help channel'
    })
  };

  const req = https.request(options, (res) =>
    res.on("data", () => callback(null, request))
  );
  req.on("error", (error) => callback(JSON.stringify(error)));
  req.write(payload);
  req.end();
};

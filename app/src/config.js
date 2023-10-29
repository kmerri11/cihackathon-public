import round1entries from "./round1entries";

const dev = {
  env: "dev",
  algorithm_label: "dev-algorithm",
  s3: {
    REGION: "***",
    BUCKET: "***",
  },
  apiGateway: {
    REGION: "***",
    URL: "***",
  },
  leaderboardapiGateway: {
    REGION: "***",
    URL: "",
  },
  cognito: {
    REGION: "***",
    USER_POOL_ID: "***",
    APP_CLIENT_ID: "***",
    IDENTITY_POOL_ID: "***",
  },
};

const prod = {
  env: "prod",
  algorithm_label: "algorithm",
  s3: {
    REGION: "***",
    BUCKET: "***",
  },
  apiGateway: {
    REGION: "***",
    URL: "***",
  },
  leaderboardapiGateway: {
    REGION: "***",
    URL: "",
  },
  cognito: {
    REGION: "***",
    USER_POOL_ID: "***",
    APP_CLIENT_ID: "***",
    IDENTITY_POOL_ID: "***",
  },
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === "prod" ? prod : dev;

config.ROUND1_ENTRIES_PER_SET = 120;
config.ROUND2_ENTRIES_PER_SET = 30;
config.entries = round1entries; // or round3entries

// Set vocoder bucket location for playback
config.VOCODER_BUCKET_URL =
  "";

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 50000000,
  ...config,
};

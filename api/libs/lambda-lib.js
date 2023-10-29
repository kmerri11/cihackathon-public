import AWS from './aws-sdk';

const client = new AWS.Lambda();

// Remove promise for asynchronous task
export default {
  invoke: (params) => client.invoke(params)
};
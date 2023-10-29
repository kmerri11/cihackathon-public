# Vocoder Python API for CI Hackathon

This directory contains serverless configuration and functions for the CI Hackathon vocoder function for the webapp. The vocoder processes electrocardiograms to produce wav files which we will use for algorithm evaluation.

This function is executed after a user (1) uploads a file to s3 and the CI Hackathon API (refer to lambda functions in `/api`) (2) creates an entry in the DynamoDB table. The lambda function takes two arguments: a userId and an algorithmID. 
* DynamoDB item contains data to help locate the electrocardiogram file in the user's private s3 bucket
* Electrocardiogram is downloaded from s3
* Vocoder processes the electrocardiogram and outputs a local wav file to disk
* Newly created wav file is uploaded to a new location in s3
* DynamoDB is updated to relfect the current state and location of processed file

### libs
Libraries for NodeJS serverless Lambda functions for working with S3, DynamoDB, Cognito, etc...

### mocks
Mock JSON files for testing Lambda functions.

### resources
Contains configuration files for AWS resources.


## Deploy a Vocoder Function

To deploy the list function again, we can run the following. Delete `.requirements.zip` before deploying.

`rm .requirements.zip; serverless deploy function -f vocoder`

## Test a Single Function

To invoke a function using mocked data, we use the following,

`serverless invoke local --function vocoder --path mocks/successful-event.json`

## Read Logs for Function

`serverless logs  --function vocoder`

try:
    import unzip_requirements
except ImportError:
    pass

import boto3
import botocore
import os
import glob
import json
import uuid
import time
import logging
from Vocoder.vocoderFunc import vocoderFunc

algorithmsTable = os.environ['DYNAMODB_TABLE']

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.info('Loading vocoder function')

PWD = '/tmp/'  # Change for local dev
UPLOADS_BUCKET = 'cihackathon-algorithm-uploads'
VOCODER_BUCKET = 'cihackathon-vocoder-outputs'
VALIDATION_BUCKET = 'cihackathon-vocoder-validation-files'

# Validation files
validation_file = {
    'cnc_1': 'CNC_holdout_1_mfm_validation.mat',
    'cnc_2': 'CNC_holdout_2_fmf_validation.mat',
    'cnc_3': 'CNC_holdout_3_mfm_validation.mat',
    'cnc_4': 'CNC_holdout_4_fmf_validation.mat',
    'cnc_5': 'CNC_holdout_5_mfm_validation.mat',
    'cnc_6': 'CNC_holdout_6_fmf_validation.mat',
    'music_1': 'David Bowie- Moonage Daydream_65_clean_validation.mat',
    'music_2': 'Tchaikovsky - Swan Lake - Four Swans_65_clean_validation.mat',
    'music_3': 'The Beatles - Happiness is a Warm Gun_65_clean_validation.mat',
    'music_4': 'Maroon 5 - Misery_65_clean_validation.mat',
    'music_5': 'Muse - Madness_65_clean_validation.mat',
    'music_6': 'Stars and Stripes_65_clean_validation.mat',
    'speech_in_noise_1': 'sentenceI_S60_N60_validation.mat',
    'speech_in_noise_2': 'sentenceJ_S50_N50_validation.mat',
    'speech_in_noise_3': 'sentenceL_S65_N60_validation.mat',
    'speech_in_noise_4': 'sentenceG_S60_N60_validation.mat',
    'speech_in_noise_5': 'sentenceH_S60_N60_validation.mat',
    'speech_in_noise_6': 'sentenceK_S55_N50_validation.mat',
    'natural_speech_1': 'sentenceA_65_clean_validation.mat',
    'natural_speech_2': 'sentenceB_55_clean_validation.mat',
    'natural_speech_3': 'sentenceC_65_clean_validation.mat',
    'natural_speech_4': 'sentenceD_65_clean_validation.mat',
    'natural_speech_5': 'sentenceE_55_clean_validation.mat',
    'natural_speech_6': 'sentenceF_65_clean_validation.mat',
}

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


class VocoderException(Exception):
    pass


class DynamoDBException(Exception):
    pass


class S3ObjectNotFoundException(Exception):
    pass


class BotoClientException(Exception):
    pass


def updateStatus(userId, algorithmId, msg):
    # Update DynamoDB with status
    table = dynamodb.Table(algorithmsTable)
    try:
        response = table.update_item(
            Key={
                'algorithmId': algorithmId
            },
            UpdateExpression="SET vocoderStatus = :s",
            ExpressionAttributeValues={
                ':s': msg,
            },
            ReturnValues="UPDATED_NEW"
        )
    except botocore.exceptions.ClientError as error:
        raise DynamoDBException('Error writing DynamoDB item\n' + error)
    logger.info('Updating dynamodb status for userId=' +
                userId + ' and algorithmId=' + algorithmId)
    logger.info(
        'Status[' +
        str(response['ResponseMetadata']['HTTPStatusCode']) + '] - ' +
        response['Attributes']['vocoderStatus']
    )


def lambda_handler(event, context):
    logger.info('## ENVIRONMENT VARIABLES')
    logger.info(os.environ)
    logger.info('## EVENT')
    logger.info(event)

    userId = event['body']['userId']
    algorithmId = event['body']['algorithmId']
    cognitoIdentityId = event['requestContext']['identity']['cognitoIdentityId']

    # Make room for files
    fileList = glob.glob(PWD + '*.h5')
    fileList.extend( glob.glob(PWD + '*.mat'))
    fileList.extend( glob.glob(PWD + '*.npz'))
    for filePath in fileList:
        try:
            os.unlink(filePath)
        except:
            print("Error deleting file : ", filePath)

    # Fetch file attachment details
    table = dynamodb.Table(algorithmsTable)
    logger.info('Fetch file attachment for userId=' + userId +
                ' with cognitoIdentityId=' + cognitoIdentityId +
                ' and algorithmId=' + algorithmId +
                ' from table=' + algorithmsTable)
    try:
        response = table.get_item(
            Key={
                'algorithmId': algorithmId
            },
        )
    except botocore.exceptions.ClientError as error:
        raise DynamoDBException('DynamoDB item does not exist\n%s' % error)
    logger.info(response)
    item = response['Item']

    # Fetch uploaded file
    updateStatus(userId, algorithmId, 'Vocoder retrieving input')
    key = 'private/' + cognitoIdentityId + '/' + item['attachment']
    electrocardiogram = item['attachment']
    logger.info('Downloading object from S3 ' + UPLOADS_BUCKET +
                '/' + key + ' to: ' + electrocardiogram)
    try:
        s3.download_file(UPLOADS_BUCKET, key, PWD + electrocardiogram)
    except botocore.exceptions.ClientError as error:
        if error.response['Error']['Code'] == '404':
            raise S3ObjectNotFoundException('S3 object does not exist')
        else:
            raise BotoClientException('S3 fetch failed\n%s' % error)

    # Fetch validation file
    label = item['label']
    try:
        validationFileName = validation_file[label]
    except KeyError:
        raise Exception('Validation file not found')
    logger.info('Downloading wav from S3 ' + VALIDATION_BUCKET +
                '/' + validationFileName + ' to: ' + validationFileName)
    try:
        s3.download_file(VALIDATION_BUCKET, validationFileName,
                         PWD + validationFileName)
    except botocore.exceptions.ClientError as error:
        if error.response['Error']['Code'] == '404':
            raise S3ObjectNotFoundException('S3 object does not exist')
        else:
            raise BotoClientException('S3 fetch failed\n%s' % error)

    # Run vocoder
    vocoder_output = PWD + item['label'] + '.wav'
    updateStatus(userId, algorithmId, 'Vocoder processing input')
    result = vocoderFunc(
        PWD + electrocardiogram,
        saveOutput=True,
        outputFile=PWD + item['label'],
        skipValidation=False,
        validationFileName=PWD + validationFileName
    )
    logger.info(result)
    if (result[0] == 1):
        error = result[1]
        updateStatus(userId, algorithmId, 'Vocoder error: %s' % error)
        logger.error('Vocoder - failure processing input: %s' % error)
        return {
            'statusCode': 200,
            'body': json.dumps('Vocoder error'),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            }
        }
    logger.info('## Vocoder result')
    logger.info(result)
    updateStatus(userId, algorithmId,
                 'Vocoder processing complete: ' + vocoder_output)
    logger.info('Vocoder - processing complete: ' + vocoder_output)

    # Upload processed output
    updateStatus(userId, algorithmId, 'Uploading processed file')
    object_name = item['label'] + '_' + str(uuid.uuid4()) + '.wav'
    logger.info('Uploading vocoder output to S3: ' +
                object_name + ' to ' + VOCODER_BUCKET)
    try:
        response = s3.upload_file(vocoder_output, VOCODER_BUCKET, object_name)
    except botocore.exceptions.ClientError as error:
        updateStatus(userId, algorithmId, 'S3 upload failed\n' + error)
        raise BotoClientException('S3 upload failed\n' + error)

    # Replace entry with addtional details
    try:
        response = table.put_item(
            Item={
                'userId': userId,
                'algorithmId': algorithmId,
                'label': item['label'],
                'attachment': item['attachment'],
                'createdAt': item['createdAt'],
                'vocoder_output': object_name,
                'processedAt': int(time.time()),
                'vocoderStatus': "Successfully processed file"
            }
        )
    except botocore.exceptions.ClientError as error:
        raise DynamoDBException('Error writing DynamoDB item\n' + error)
    logger.info('Updating DynamoDB item for userId=' + userId +
                ' and algorithmId=' + algorithmId)
    logger.info(response)

    # Trust but verify vocoder status
    table = dynamodb.Table(algorithmsTable)
    try:
        response = table.get_item(
            Key={
                'algorithmId': algorithmId
            }
        )
    except botocore.exceptions.ClientError as error:
        raise DynamoDBException('DynamoDB item does not exist\n' + error)
    logger.info('Vocoder status for userId=' + userId +
                ' and algorithmId=' + algorithmId +
                ' (' + response['Item']['vocoderStatus'] + ') ')

    logger.info('#### Exiting function')
    return {
        'statusCode': 200,
        'body': json.dumps('Success'),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
        }
    }

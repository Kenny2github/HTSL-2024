import json
import boto3
import requests
from aws_lambda_typing import events, context as ctx

FILENAME = "all_courses.json"
BUCKET_NAME = "uoft-htsl-ttb-data-c838b"

def lambda_handler(event: events.EventBridgeEvent, context: ctx.Context) -> None:
    data: bytes = b'' # TODO: get from TTB API

    s3 = boto3.resource("s3")
    s3.Bucket(BUCKET_NAME).put_object(Key=FILENAME, Body=data)

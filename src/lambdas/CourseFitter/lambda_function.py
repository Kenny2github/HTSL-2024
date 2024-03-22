import json
from typing import NewType, TypedDict, Literal, cast
import boto3
from aws_lambda_typing import events, context as ctx, responses

BUCKET_NAME = "uoft-htsl-ttb-data-c838b"

CourseCode = NewType('CourseCode', str)
SectionName = NewType('SectionName', str)
Session = NewType('Session', str)

class TTBFormItem(TypedDict):
    group: str | None
    header: bool
    label: str
    metadata: dict
    selected: bool
    value: str

class TimeOfDay(TypedDict):
    day: int
    millisofday: int

Repetition = Literal["WEEKLY"]
RepetitionTime = Literal["ONCE_A_WEEK"]
TeachMethod = Literal["LEC", "TUT", "PRA"]

class MeetingTime(TypedDict):
    start: TimeOfDay
    end: TimeOfDay
    repetition: Repetition
    repetitionTime: RepetitionTime
    sessionCode: Session

class Section(TypedDict):
    name: SectionName
    teachMethod: TeachMethod
    meetingTimes: list[MeetingTime]

class TTBCourse(TypedDict):
    code: CourseCode
    sectionCode: Literal['F', 'S', 'Y']
    sections: list[Section]
    sessions: list[Session]

HTSLCourse = dict[TeachMethod, dict[SectionName, list[MeetingTime]]]

def conflict(a: MeetingTime, b: MeetingTime) -> bool:
    c_s = (a['start']['day'], a['start']['millisofday'])
    c_e = (a['end']['day'], a['end']['millisofday'])
    d_s = (b['start']['day'], b['start']['millisofday'])
    d_e = (b['end']['day'], b['end']['millisofday'])
    return (c_s < d_e and c_e > d_s) or (d_s < c_e and d_e > c_s)

def fits(existing: list[tuple[str, SectionName]], code: str, new: HTSLCourse, others: dict[str, HTSLCourse]) -> bool:
    existing_times = [meetingTime for course, section in existing for meetingTime in others[course][cast(TeachMethod, section[:3])][section]]
    for sections in new.values():
        new_times = []
        for meetingTimes in sections.values():
            try:
                for meetingTime in meetingTimes:
                    new_times.append(meetingTime)
            except TypeError:
                print('ignoring None in', code)
        # new_times = [meetingTime for meetingTimes in sections.values() for meetingTime in meetingTimes]
        if all(any(conflict(existing, new_time) for existing in existing_times) for new_time in new_times):
            return False # at least one teaching method conflicts for all its sections with any existing time
    return True

def lambda_handler(event: events.APIGatewayProxyEventV2, context: ctx.Context) -> responses.APIGatewayProxyResponseV2:
    request = event.get("body", '{}')
    if isinstance(request, (str, bytes, bytearray)):
        request = json.loads(request)
    if 'sessions' not in request:
        return {
            'statusCode': 400,
            'body': 'Missing sessions'
        }
    client = boto3.client("s3")
    total: dict[str, HTSLCourse] = {}
    sessions = {session for sesh in request['sessions'] for session in sesh.split('-')}
    for session in sessions:
        data = client.get_object(Bucket=BUCKET_NAME, Key=f'{session}.json')['Body'].read()
        data = json.loads(data)
        total.update(data)
    existing = [(section[:8] + section[-1], section[8:].split()[0]) for section in request['courses']]
    works: dict[str, HTSLCourse] = {}
    for code, course in total.items():
        if fits(existing, code, course, total):
            works[code] = course
    return {
        'statusCode': 200,
        'body': json.dumps(sorted(works))
    }

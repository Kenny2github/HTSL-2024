import json
from typing import Literal, NewType, TypedDict
import boto3
import requests
from aws_lambda_typing import events, context as ctx

BUCKET_NAME = "uoft-htsl-ttb-data-c838b"

REFERENCE_DATA = "https://api.easi.utoronto.ca/ttb/reference-data"
PAGEABLE_COURSES = "https://api.easi.utoronto.ca/ttb/getPageableCourses"
PAGEABLE_REQUEST = {
    'availableSpace': False,
    'campuses': [],
    'courseCodeAndTitleProps': {
        'courseCode': '',
        'courseSectionCode': '',
        'courseTitle': '',
    },
    'courseLevels': [],
    'creditWeights': [],
    'dayPreferences': [],
    'deliveryModes': [],
    'departmentProps': [],
    'direction': 'asc',
    'instructor': '',
    'page': 1,
    'pageSize': 9999,
    'requirementProps': [],
    'timePreferences': [],
    'waitListable': False
}

# just in case...
HEADERS = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

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

# str is
HTSLCourse = dict[TeachMethod, dict[SectionName, list[MeetingTime]]]

def get_courses() -> list[TTBCourse]:
    r = requests.get(REFERENCE_DATA, headers=HEADERS)
    r.raise_for_status()
    reference_data = r.json()['payload']
    divisions: list[TTBFormItem] = reference_data['divisions']
    currentSessions: list[TTBFormItem] = reference_data['currentSessions']

    all_divisions: list[str] = [div["value"] for div in divisions if not div["header"]]
    all_sessions: list[str] = [session["value"] for session in currentSessions if not session["header"]]

    r = requests.post(PAGEABLE_COURSES, headers=HEADERS, json=PAGEABLE_REQUEST | {
        'divisions': all_divisions,
        'sessions': all_sessions,
    })
    r.raise_for_status()
    return r.json()['payload']['pageableCourse']['courses']['courses']

def construct_data(courses: list[TTBCourse]) -> dict[Session, dict[str, HTSLCourse]]:
    result: dict[Session, dict[str, HTSLCourse]] = {}
    for course in courses:
        course_code = course['code'] + course['sectionCode']
        item: HTSLCourse = {}
        # populate LEC: LEC0101: meetingTimes
        for section in course['sections']:
            item.setdefault(section['teachMethod'], {})[section['name']] = section['meetingTimes']
        # a course in multiple sessions goes in multiple lists
        for session in course['sessions']:
            result[session][course_code] = item
    return result

def lambda_handler(event: events.EventBridgeEvent, context: ctx.Context) -> None:
    result = construct_data(get_courses())

    bucket = boto3.resource("s3").Bucket(BUCKET_NAME)
    for session, data in result.items():
        filename = f'{session}.json'
        blob: bytes = json.dumps(data, ensure_ascii=True, separators=(',', ':')).encode('ascii')
        bucket.put_object(Key=filename, Body=blob)

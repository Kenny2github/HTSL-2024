const all_courses = {
  AER210H1F: {
    LEC: {
      LEC0101: [
        {
          start: { day: 3, millisofday: 36000000 },
          end: { day: 3, millisofday: 46800000 },
          repetition: "WEEKLY",
          repetitionTime: "ONCE_A_WEEK",
          sessionCode: "20239",
        },
        // etc
        {
          start: { day: 3, millisofday: 37000000 },
          end: { day: 3, millisofday: 47800000 },
          repetition: "WEEKLY",
          repetitionTime: "ONCE_A_WEEK",
          sessionCode: "20239",
        },
      ],
    },
  },
  // etc
};

const my_courses = [
  "AER210H1LEC0101 F",
  "AER210H1PRA0101 F",
  "AER210H1TUT0103 F",
  "CIV250H1LEC0101 S",
  "CIV214H1TUT0101 S",
  "CIV214H1LEC0101 S",
  "CIV250H1TUT0101 S",
  "CIV100H1TUT0101 S",
];

class Timetable {
  constructor(data) {
    this.time = [
      [[], [], [], [], [], [], []],
      [[], [], [], [], [], [], []],
    ];
    this.data = data;
  }

  addCourse(course) {
    let session_code = course.slice(-1);
    let this_session = undefined;
    let this_session_time = undefined;

    if (session_code == "F") {
      this_session_time = this.time[0];
    } else if (session_code == "S") {
      this_session_time = this.time[1];
    } else {
      return console.log("session not found");
    }

    let course_index_name = course.slice(0, 8);
    let course_index_type = course.slice(8, 11);
    let course_index_section = course.slice(11, 15);

    console.log(course_index_name, course_index_type, course_index_section);

    this.data[course_index_name.concat(session_code)][course_index_type][
      course_index_type.concat(course_index_section)
    ].forEach((element) => {
      let day_arr = this_session_time[element.start.day];

      let i = 0;

      while (
        i < day_arr.length &&
        day_arr[i].end <= element.start.millisofday
      ) {
        i++;
      }

      // If a previous timetable element starts after the current element ends
      if (i < day_arr.length && day_arr[i][0] >= element.end.millisofday) {
        day_arr[i][0] = Math.min(element.start.millisofday, day_arr[i][0]);
      } else if (
        i < day_arr.length &&
        day_arr[i][0] <= element.end.millisofday
      ) {
        day_arr[i][1] = Math.max(element.end.millisofday, day_arr[i][1]);
      } else {
        day_arr.splice(i, 0, [
          element.start.millisofday,
          element.end.millisofday,
        ]);
      }
    });

    console.log(this.time[0][3]);
  }

  activityFitsTimetable(day, session, start, end) {
    // Return true if the activity fits in the timetable

    if (session == "F") session = 0;
    else if (session == "S") session = 1;

    let day_arr = this.time[session][day];
    let i = 0;

    while (i < day_arr.length && day_arr[i].end <= start) {
      i++;
    }

    if (i == day_arr.length) return true;

    if (day_arr[i][0] >= end) {
      return true;
    }

    return false;
  }

  courseFitsTimetable(courseData) {
    let courseSuitable = true;

    // Check each meeting type
    Object.entries(courseData).forEach(([key, value]) => {
      // Check if at least one of the sections fits

      let found_section = false;
      for (const section in value) {
        // Check if at least one of the sections fits
        if (this.courseSectionFitsTimetable(value[section])) {
          courseSuitable = true;
          break;
        }
      }
    });
  }
}

const my_sesions = [
  "Fall 2023 (F)",
  "Winter 2024  (S)",
  "Fall-Winter 2023-2024 (Y)",
];

const timetable = new Timetable(all_courses);
timetable.addCourse("AER210H1LEC0101 F");

console.log(timetable.activityFitsTimetable(3, 36000000, 46800000));

// const available_courses = all_courses.filter((course) => {

//     return my_courses.includes(course.course + course.section);
// })

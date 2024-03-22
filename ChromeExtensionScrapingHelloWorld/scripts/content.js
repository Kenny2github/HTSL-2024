const state = {
  courses: [],
  sessions: [],
};

let coursesToShow = [];

const app_state = {
  loading: false,
};

const setLoading = (loading) => {
  app_state.loading = loading;
};

root = document.getElementsByTagName("app-root")[0];

const updateOverlayCourses = () => {
  const overlayBody = document.getElementsByClassName(
    "extensionOverlayBody"
  )[0];
  overlayBody.innerHTML = "";
  coursesToShow.forEach((course) => {
    const courseElement = document.createElement("div");
    courseElement.innerText = course;
    overlayBody.appendChild(courseElement);
  });

  if (app_state.loading) return;

  // Send the data to the server
  fetch(
    "https://eeityel2m3.execute-api.us-east-1.amazonaws.com/CourseFitter",
    {
      method: "POST",
      body: JSON.stringify(state),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      setLoading(false);

      coursesToShow = data.slice(0, 5);
      console.log(coursesToShow);
      updateOverlayCourses();
    })
    .catch((error) => {
      console.error("Error:", error);

      setLoading(false);
    });

  setLoading(true);
};

const updateCourses = () => {
  const nodes = document.getElementsByTagName("app-cell");

  if (nodes.length === 0) return;

  addedCourses = [];
  Array.from(nodes).forEach((node) => {
    courseInfoElements = node
      ?.getElementsByClassName("info-section")[0]
      ?.getElementsByTagName("span");

    if (courseInfoElements) {
      courseName = courseInfoElements[0].innerText;

      if (courseName.toLowerCase().includes("conflict")) return;

      courseSection = courseInfoElements[1].innerText;

      courseInfo = courseName.concat(courseSection);

      const courseControls = node.getElementsByClassName(
        "action-section d-print-none"
      )[0];

      if (!addedCourses.includes(courseInfo) && courseControls) {
        addedCourses.push(courseInfo);
      }
    }
  });
  if (addedCourses.length !== state.courses.length) {
    state.courses = addedCourses;
    console.log(state.courses);
    updateOverlayCourses();
  }
};

// Observe root to listen to changes to calendar
const observer = new MutationObserver(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  calendar = document.getElementById("export-container");

  if (calendar) {
    console.log("calendar found");
    observer.disconnect();

    sessions = [];

    const sessionsContainer = document.getElementById("session");

    if (sessionsContainer) {
      const sessionPills =
        sessionsContainer.getElementsByTagName("app-ttb-pill");

      Array.from(sessionPills).forEach((sessionPill) => {
        const sessionName =
          sessionPill.getElementsByTagName("span")[0].innerText;

        const sessionYear = sessionName.match(/(\d+)/);

        if (sessionYear.index > 10) return;

        let sessionString = undefined;

        if (sessionName.includes("Fall")) {
          sessionString = sessionYear[0].toString().concat("9");
        } else if (sessionName.includes("Winter")) {
          sessionString = sessionYear[0].toString().concat("1");
        }
        sessions.push(sessionString);
      });

      state.sessions = sessions;
    }

    setInterval(() => {
      updateCourses();
    }, 1000);
  }
});

observer.observe(root, {
  subtree: true,
  childList: true,
});

/// Add overlay to the page

const overlay = document.createElement("div");
overlay.className = "extensionOverlaycontainer";

const overlayContent = document.createElement("div");
overlayContent.className = "extensionOverlayContent";

const overlayHeader = document.createElement("h2");
overlayHeader.innerText = "Courses";

const overlayBody = document.createElement("div");
overlayBody.className = "extensionOverlayBody";

overlayContent.appendChild(overlayHeader);
overlayContent.appendChild(overlayBody);

overlay.appendChild(overlayContent);

document.body.appendChild(overlay);

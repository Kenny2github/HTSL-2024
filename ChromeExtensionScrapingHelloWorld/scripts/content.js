const state = {
  foundCalendar: false,
  courses: [],
  sessions: [],
};

root = document.getElementsByTagName("app-root")[0];

const updateOverlayCourses = () => {
  const overlayBody = document.getElementsByClassName(
    "extensionOverlayBody"
  )[0];
  overlayBody.innerHTML = "";
  state.courses.forEach((course) => {
    const courseElement = document.createElement("div");
    courseElement.innerText = course;
    overlayBody.appendChild(courseElement);
  });
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
        updateOverlayCourses();
      }
    }
  });
  if (addedCourses.length !== state.courses.length) {
    state.courses = addedCourses;
    console.log(state);
  }
};

// Observe root to listen to changes to calendar
const observer = new MutationObserver(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  calendar = document.getElementById("export-container");

  if (calendar) {
    console.log("calendar found");
    state.foundCalendar = true;
    observer.disconnect();

    sessions = [];

    const sessionsContainer = document.getElementById("session");

    if (sessionsContainer) {
      const sessionPills =
        sessionsContainer.getElementsByTagName("app-ttb-pill");

      Array.from(sessionPills).forEach((sessionPill) => {
        const sessionName =
          sessionPill.getElementsByTagName("span")[0].innerText;
        sessions.push(sessionName);
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

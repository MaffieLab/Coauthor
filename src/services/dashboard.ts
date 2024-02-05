import { getStats } from "./mcServices";
import { JournalStats } from "../types";
import { manuscriptUploadStatusColumn } from "../content";

export const renderDashboard = async () => {
  const dashboardContainer = document.getElementById("navigationDIV");
  const dashboard = document.createElement("section");
  dashboard.id = "coauthor-dashboard";
  dashboard.className = "nav nav-list";
  dashboard.style.padding = "0px";
  dashboardContainer?.append(dashboard);

  const header = document.createElement("h1");
  header.className = "nav-header";
  header.innerText = "Coauthor Dashboard";
  dashboard!.appendChild(header);
  renderLoginInterface();
  renderStatsTable();
};

const renderLoginInterface = () => {
  const dashboard = document.getElementById("coauthor-dashboard");
  const loginSection = document.createElement("section");
  loginSection.style.padding = "10px";
  loginSection.style.display = "flex";
  loginSection.style.flexDirection = "column";
  loginSection.style.justifyContent = "space-between";
  loginSection.style.alignItems = "center";

  const loginStatusTextWrapper = document.createElement("div");
  loginStatusTextWrapper.style.display = "flex";
  loginStatusTextWrapper.style.justifyContent = "center";
  loginStatusTextWrapper.style.alignItems = "center";
  const loginStatusText = document.createElement("div");
  loginStatusText.style.marginBottom = "5px";
  loginStatusTextWrapper.appendChild(loginStatusText);
  loginSection.appendChild(loginStatusTextWrapper);

  const logButton = document.createElement("div");
  logButton.style.backgroundColor = "green";
  logButton.style.borderRadius = "5px";
  logButton.style.color = "white";
  logButton.style.padding = "10px";
  logButton.style.display = "inline-block";

  logButton.style.cursor = "pointer";

  logButton.addEventListener("mouseover", () => {
    logButton.style.backgroundColor = "blue";
  });

  logButton.addEventListener("mouseout", () => {
    logButton.style.backgroundColor = "lightgreen";
  });

  loginSection.appendChild(logButton);
  dashboard?.appendChild(loginSection);

  const handleLogin = () => {
    chrome.runtime.sendMessage({ message: "login" }, (response) => {
      if (response.outcome === "success") {
        loginStatusText.textContent = "You are logged in.";
        logButton.textContent = "Logout";
        logButton.removeEventListener("click", handleLogin);
        logButton.addEventListener("click", handleLogout);
        manuscriptUploadStatusColumn.mount();
      }
    });
  };

  const handleLogout = () => {
    chrome.runtime.sendMessage({ message: "logout" }, (response) => {
      if (response.outcome === "success") {
        loginStatusText.textContent =
          "You are logged out. Login to contribute to Coauthor.";
        logButton.textContent = "Login";
        logButton.removeEventListener("click", handleLogout);
        logButton.addEventListener("click", handleLogin);
        manuscriptUploadStatusColumn.unmount();
      }
    });
  };

  chrome.runtime.sendMessage(
    { message: "checkAuthStatus" },
    function (response) {
      if (response.validSession) {
        logButton.textContent = "Logout";
        loginStatusText.textContent = "You are logged in.";
        logButton.addEventListener("click", handleLogout);
      } else {
        logButton.textContent = "Login";
        loginStatusText.textContent =
          "You are logged out. Login to contribute to Coauthor.";
        logButton.addEventListener("click", handleLogin);
      }
    }
  );
};

const renderStatsTable = async () => {
  const journal = document.URL.split("/")[3];
  const journalStats: JournalStats = await getStats(journal);

  const dashboard = document.getElementById("coauthor-dashboard");
  const statsTable = document.createElement("section");
  statsTable.style.padding = "0px";
  const statsHeader = document.createElement("header");
  statsHeader.textContent = "Journal Statistics";
  statsHeader.className = "nav-header";

  statsTable.appendChild(statsHeader);

  const statsList = document.createElement("ul");
  const len = Object.keys(journalStats).length;
  const headers = [
    "Avg. Days to 1st Decision",
    "Standard Deviation",
    "Accept % | 1st R&R",
    "Initial Submit => 1st R&R",
  ];
  for (let i = 0; i < len; i++) {
    const new_node = document.createElement("li");
    new_node.style.lineHeight = "20px";
    new_node.style.fontSize = "14px";
    new_node.style.marginBottom = "10px";
    new_node.style.marginTop = "10px";
    new_node.style.color = "#0083bf";
    new_node.style.padding = "1px 10px";
    new_node.className = "nav-submenu";
    new_node.innerText = `${headers[i]}: ${Object.values(journalStats)[i]}`;
    statsList.appendChild(new_node);
  }
  statsTable!.appendChild(statsList);
  dashboard?.appendChild(statsTable);
};

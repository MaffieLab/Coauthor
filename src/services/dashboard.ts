import { manuscriptUploadStatusColumn } from "../content";

export const renderDashboard = async () => {
  const dashboardContainer = document.getElementById("navigationDIV");
  const dashboard = document.createElement("section");
  dashboard.id = "coauthor-dashboard";
  dashboard.className = "nav nav-list";
  dashboard.style.padding = "0px";
  dashboardContainer?.append(dashboard);

  const header = document.createElement("header");
  header.className = "nav-header";
  header.innerText = "Coauthor Dashboard";
  header.style.margin = "0";
  dashboard!.appendChild(header);
  renderLoginInterface();
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
    logButton.style.backgroundColor = "green";
  });

  loginSection.appendChild(logButton);
  dashboard?.appendChild(loginSection);

  let popupActive = false; // only one auth window open at a time
  const handleLogin = () => {
    if (!popupActive) {
      popupActive = true;
      chrome.runtime.sendMessage({ message: "login" }, (response) => {
        if (response.outcome === "success") {
          loginStatusText.textContent = "You are logged in.";
          logButton.textContent = "Logout";
          logButton.removeEventListener("click", handleLogin);
          logButton.addEventListener("click", handleLogout);
          manuscriptUploadStatusColumn.mount();
        }
        popupActive = false;
      });
    }
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

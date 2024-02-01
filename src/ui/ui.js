chrome.runtime.sendMessage({ message: "checkAuthStatus" }, function (response) {
  const renderLoginPage = () => {
    document.querySelector("body").textContent = "";
    const header = document.createElement("h1");
    const logButton = document.createElement("div");
    header.textContent = "Sign In With Your Google Account to Use Coauthor";
    logButton.textContent = "Sign In";
    logButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ message: "login" }, (response) => {
        if (response.outcome === "success") {
          renderLogoutPage();
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                { type: "addAuthenticatedFeatures" },
                function (response) {
                  console.log(response);
                }
              );
            }
          );
        }
      });
    });
    document.querySelector("body").appendChild(header);
    document.querySelector("body").appendChild(logButton);
  };

  const renderLogoutPage = () => {
    document.querySelector("body").textContent = "";
    const header = document.createElement("h1");
    const logButton = document.createElement("div");
    header.textContent = "Sign out of Coauthor";
    logButton.textContent = "Sign Out";
    logButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ message: "logout" }, (response) => {
        if (response.outcome === "success") {
          renderLoginPage();
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                { type: "removeAuthenticatedFeatures" },
                function (response) {
                  console.log(response);
                }
              );
            }
          );
          // saveDataToLocal(response.token);
        }
      });
    });
    document.querySelector("body").appendChild(header);
    document.querySelector("body").appendChild(logButton);
  };

  if (response.validSession) {
    renderLogoutPage();
  } else {
    renderLoginPage();
  }
});

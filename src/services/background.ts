import { KJUR, b64utoutf8 } from "jsrsasign";
import env from "../env";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // handles getData for showing stats on the author page,
  // postData for posting new manuscripts to server
  if (request.contentScriptQuery == "getdata") {
    const url = request.url;
    try {
      fetch(url, {
        method: "GET",
        headers: {
          journal: request.journal,
        },
      })
        .then((response) => response.json())
        .then((response) => sendResponse(response))
        .catch();
      return true;
    } catch (err) {
      console.dir(err);
    }
  } else if (request.contentScriptQuery == "postData") {
    const url = request.url;
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.data),
    })
      .then((response) => sendResponse(response))
      .catch((error) => console.log("Error:", error));
    return true;
  }
});

let user_signed_in = false;

const CLIENT_ID = encodeURIComponent(
  "472233483506-v584va6aocfhvadjjs6fcltuteiutmse.apps.googleusercontent.com"
);
const RESPONSE_TYPE = encodeURIComponent("id_token");
const REDIRECT_URI = encodeURIComponent(
  "https://hbfekdgnodghabfkjemplgkdjdkhgggj.chromiumapp.org"
);

const STATE = encodeURIComponent("jkls3n");
const SCOPE = encodeURIComponent("openid");
const PROMPT = encodeURIComponent("consent");

function createOauth2URL() {
  let nonce = encodeURIComponent(
    Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
  );
  let url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=${SCOPE}&prompt=${PROMPT}&nonce=${nonce}`;
  return url;
}

function is_User_Signed_In() {
  return user_signed_in;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "login") {
    if (is_User_Signed_In()) {
      console.log("user already signed in");
    } else {
      chrome.identity.launchWebAuthFlow(
        {
          url: createOauth2URL(),
          interactive: true,
        },
        function (redirect_url) {
          console.log(redirect_url);
          let id_token = redirect_url!.substring(
            redirect_url!.indexOf("id_token=") + 9
          );
          id_token = id_token.substring(0, id_token.indexOf("&"));
          const user_info: any = KJUR.jws.JWS.readSafeJSONString(
            b64utoutf8(id_token.split(".")[1])
          );
          console.log(user_info);
          if (
            (user_info!.iss === "https://accounts.google.com" ||
              user_info.iss === "accounts.google.com") &&
            user_info!.aud === CLIENT_ID
          ) {
            user_signed_in = true;

            fetch(`${env.API_BASE_URL}/api/login`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${id_token}`,
              },
              credentials: "include",
            })
              .then((response) => sendResponse(response))
              .catch((error) => console.log("Error:", error));

            chrome.action.setPopup({ popup: "./logout.html" }, () => {
              sendResponse({ outcome: "success", token: id_token });
            });
          } else {
            console.log("invalid credentials");
          }
        }
      );
      return true;
    }
  } else if (request.message === "logout") {
    chrome.action.setPopup({ popup: "./login.html" }, () => {
      user_signed_in = false;
      sendResponse({ outcome: "success" });
    });
    return true;
  } else if (request.message === "isUserSignedIn") {
    sendResponse(is_User_Signed_In());
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.contentScriptQuery === "getToken") {
    chrome.storage.local.get("mcTracker_id", (result) => {
      const token = result.mcTracker_id;
      if (token) {
        sendResponse(token);
      } else {
        sendResponse(null);
      }
    });
    return true; // Indicates that the response will be sent asynchronously
  }
});

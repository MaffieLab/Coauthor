import { KJUR, b64utoutf8 } from "jsrsasign";
import * as Sentry from "@sentry/browser";

try {
  if (process.env.SENTRY_ENV) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN!,
      environment: process.env.SENTRY_ENV!,
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    });
  }
} catch (e) {
  console.error(e);
}

const CLIENT_ID = encodeURIComponent(
  "386855698885-huf3aglc5f7s4cni7fmll16ki66ho155.apps.googleusercontent.com"
);
const RESPONSE_TYPE = encodeURIComponent("id_token");
const REDIRECT_URI = encodeURIComponent(
  "https://ahajebjbfifafhoifinahkeifcgfpocl.chromiumapp.org"
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
        .catch((err) => {
          Sentry.captureException(err);
        });
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
      credentials: "include",
      body: JSON.stringify(request.data),
    })
      .then((response) => sendResponse(true))
      .catch((error) => {
        console.error(error);
        Sentry.captureException(error);
        sendResponse(false);
      });
    return true;
  } else if (request.message === "login") {
    chrome.identity.launchWebAuthFlow(
      {
        url: createOauth2URL(),
        interactive: true,
      },
      function (redirect_url) {
        if (
          !redirect_url ||
          redirect_url.indexOf("error=access_denied") !== -1
        ) {
          sendResponse({ outcome: "failure" });
          return true;
        }
        let id_token = redirect_url!.substring(
          redirect_url!.indexOf("id_token=") + 9
        );
        id_token = id_token.substring(0, id_token.indexOf("&"));
        const user_info: any = KJUR.jws.JWS.readSafeJSONString(
          b64utoutf8(id_token.split(".")[1])
        );
        if (
          (user_info!.iss === "https://accounts.google.com" ||
            user_info.iss === "accounts.google.com") &&
          user_info!.aud === CLIENT_ID
        ) {
          fetch(`${process.env.API_BASE_URL}/api/session`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${id_token}`,
            },
            credentials: "include",
          })
            .then((response) => sendResponse({ outcome: "success" }))
            .catch((error) => {
              Sentry.captureException(error);
              console.log("Error:", error);
            });
        } else {
          console.log("invalid credentials");
        }
      }
    );
    return true;
  } else if (request.message === "logout") {
    fetch(`${process.env.API_BASE_URL}/api/session`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((response) => sendResponse({ outcome: "success" }))
      .catch((error) => {
        Sentry.captureException(error);
        console.log("Error:", error);
      });
    return true;
  } else if (request.message === "checkAuthStatus") {
    fetch(`${process.env.API_BASE_URL}/api/session`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((response) => sendResponse(response))
      .catch((error) => {
        Sentry.captureException(error);
        console.log("Error:", error);
      });
    return true;
  }
});

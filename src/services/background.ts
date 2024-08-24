import * as Sentry from "@sentry/browser";
import { authenticate } from "./auth";

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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.contentScriptQuery == "getdata") {
    const url = request.url;
    try {
      fetch(url, {
        method: "GET",
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
    (async () => {
      const authSuccessful = await authenticate();
      if (authSuccessful) {
        sendResponse({ outcome: "success" });
      } else {
        sendResponse({ outcome: "failure" });
      }
    })();
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

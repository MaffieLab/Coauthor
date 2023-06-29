chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // handles getData for showing stats on the author page,
  // postData for posting new manuscripts to server
  if (request.contentScriptQuery == "getdata") {
    const url = request.url;
    try {
      fetch(url, {
        method: "GET",
        headers: {
          type: request.requestType,
          journal: request.journal,
        },
      })
        .then((response) => response.json())
        .then((response) => sendResponse(response))
        .catch();
      return true;
    } catch {
      console.dir("Is your server running?");
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
      .then((response) => response.json())
      .then((response) => sendResponse(response))
      .catch((error) => console.log("Error:", error));
    return true;
  } else if (request.contentScriptQuery == "memo") {
    const url = request.url;
    console.log(`sending the memo! to ${url}`);
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => sendResponse(response))
      .catch((error) => console.log("Error:", error));
    return true;
  }
});

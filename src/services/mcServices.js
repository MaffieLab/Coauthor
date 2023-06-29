const baseURL = "http://localhost:3001";
///'http://localhost:3001'
///'https://mctracker.fly.dev'

async function getManuscriptData(journal, type) {
  chrome.runtime.sendMessage(
    {
      contentScriptQuery: "getdata",
      url: `${baseURL}/api/manuscripts/${journal}/${type}`,
      journal: journal,
      requestType: type,
    },
    function (response) {
      if (response != undefined && response != "") {
        console.log(response);
      } else {
        console.log("no response");
      }
    }
  );
}

async function sendData(ms) {
  console.log("posting");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "postData",
    url: `${baseURL}/api/manuscripts/`,
    data: ms,
  });
  return response;
}

async function sendMemo(ms) {
  console.log("sending Memo");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "memo",
    url: `${baseURL}/api/manuscripts/memo/${ms}`,
    data: {},
  });
  return response;
}

async function getStats(journal, type) {
  console.log("starting the get manuscript data script");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "getdata",
    url: `${baseURL}/api/manuscripts/${journal}/${type}`,
    journal: journal,
    requestType: type,
  });
  return response;
}

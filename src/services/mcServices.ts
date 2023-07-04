const baseURL = "http://localhost:3001";
///'http://localhost:3001'
///'https://mctracker.fly.dev'

async function getManuscriptData(journal: string, type: string) {
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

async function sendData(ms: Manuscript) {
  console.log("posting");
  console.log("manuscript", JSON.parse(JSON.stringify(ms)));
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "postData",
    url: `${baseURL}/api/manuscripts/`,
    data: ms,
  });
  return response;
}

async function sendMemo(ms: Manuscript) {
  console.log("sending Memo");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "memo",
    url: `${baseURL}/api/manuscripts/memo/${ms}`,
    data: {},
  });
  return response;
}

async function getStats(journal: string, type: string) {
  console.log("starting the get manuscript data script");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "getdata",
    url: `${baseURL}/api/manuscripts/${journal}/${type}`,
    journal: journal,
    requestType: type,
  });
  return response;
}

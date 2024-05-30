import { Manuscript } from "../types/index";

export async function sendData(ms: Manuscript[]) {
  console.log("posting");
  console.log("manuscript", JSON.parse(JSON.stringify(ms)));
  const uploadSuccessful = (await chrome.runtime.sendMessage({
    contentScriptQuery: "postData",
    url: `${process.env.API_BASE_URL}/api/manuscripts/`,
    data: ms,
  })) as boolean;
  return uploadSuccessful;
}

export async function getStats(journal: string) {
  console.log("starting the get manuscript data script");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "getdata",
    url: `${process.env.API_BASE_URL}/api/journals/${journal}/stats`,
    journal: journal,
  });
  return response;
}

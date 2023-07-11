import env from "../env";
import { Manuscript } from "../types/index";

export async function sendData(ms: Manuscript) {
  console.log("posting");
  console.log("manuscript", JSON.parse(JSON.stringify(ms)));
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "postData",
    url: `${env.API_BASE_URL}/api/manuscripts/`,
    data: ms,
  });
  return response;
}

export async function getStats(journal: string, type: string) {
  console.log("starting the get manuscript data script");
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "getdata",
    url: `${env.API_BASE_URL}/api/manuscripts/${journal}/${type}`,
    journal: journal,
    requestType: type,
  });
  return response;
}

import { Manuscript } from "../types/index";

export async function sendData(ms: Manuscript[]) {
  const uploadSuccessful = (await chrome.runtime.sendMessage({
    contentScriptQuery: "postData",
    url: `${process.env.API_BASE_URL}/api/manuscripts/`,
    data: ms,
  })) as boolean;
  return uploadSuccessful;
}

export async function getStats(journal: string) {
  let response = await chrome.runtime.sendMessage({
    contentScriptQuery: "getdata",
    url: `${process.env.API_BASE_URL}/api/journals/${journal}/stats`,
  });
  return response;
}

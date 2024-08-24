import { ManuscriptData } from "../types/index";

export async function sendData(manuscriptData: ManuscriptData) {
  const uploadSuccessful = (await chrome.runtime.sendMessage({
    contentScriptQuery: "postData",
    url: `${process.env.API_BASE_URL}/api/manuscripts/`,
    data: manuscriptData,
  })) as boolean;
  return uploadSuccessful;
}

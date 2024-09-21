(async () => {
  const manuscriptData = (await chrome.storage.local.get("manuscriptData"))
    .manuscriptData;
  document.getElementById("manuscripts").innerHTML =
    JSON.stringify(manuscriptData);
})();

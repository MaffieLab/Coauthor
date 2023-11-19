document.querySelector("#sign-in").addEventListener("click", function () {
  chrome.runtime.sendMessage({ message: "login" }, function (response) {
    if (response.outcome === "success") {
      console.log(response.token);
      saveDataToLocal(response.token);
      window.close(); // close popup on login success
    }
  });
});

function saveDataToLocal(token) {
  console.log(token);
  chrome.storage.local.set({ mcTracker_id: token });
  console.log("Token saved to local storage:", token);
}

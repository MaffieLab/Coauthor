document.querySelector("#sign-out").addEventListener("click", function () {
  chrome.runtime.sendMessage({ message: "logout" }, function (response) {
    if (response.outcome === "success") {
      alert("logged out");
      window.close();
    }
  });
});

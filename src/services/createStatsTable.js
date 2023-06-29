const createStatsTable = (data) => {
  // receives data from the server, creates a table on the website
  // with the jouranl's stats
  let navListList = document.getElementsByClassName("nav nav-list")[0];
  let header_node = document.createElement("li");
  header_node.className = "nav-header";
  header_node.innerText = "CoAuthor Dashboard";
  navListList.appendChild(header_node);
  let len = Object.keys(data).length;
  const headers = [
    "Avg. Days to 1st Decision",
    "Standard Deviation",
    "Accept % | 1st R&R",
    " Initial Submit => 1st R&R",
  ];
  for (let i = 0; i < len; i++) {
    let new_node = document.createElement("li");
    new_node.style.lineHeight = "20px";
    new_node.style.fontSize = "14px";
    new_node.style.marginBottom = "10px";
    new_node.style.marginTop = "10px";
    new_node.style.color = "#0083bf";
    new_node.style.padding = "1px 10px";
    new_node.className = "nav-submenu";
    new_node.innerText = `${headers[i]}: ${Object.values(data)[i]}`;
    navListList.appendChild(new_node);
  }
};

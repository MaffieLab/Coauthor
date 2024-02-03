// Notes: Title sometimes has "Files Archived" on decisions page.
import { Manuscript, newManuscript } from "./types/index";
import { createStatsTable } from "./services/createStatsTable";
import { getStats, sendData } from "./services/mcServices";
import env from "./env";
import * as Sentry from "@sentry/browser";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/yourserver\.io\/api/,
        ],
      }),
      new Sentry.Replay(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

const submittedPage = (): boolean => {
  // a function that returns true if the user is on the "Submitted Manuscripts" page.
  // Else false.
  const h1 = document.getElementsByTagName("h1");
  if (h1.length < 1) {
    return false;
  } else {
    return h1[0].textContent!.toLowerCase().includes("submitted");
  }
};

const decisionsPage = (): boolean => {
  // Returns true if the user is on the "Manuscripts with Decisions" page.
  const h1 = document.getElementsByTagName("h1");
  if (h1.length < 1) {
    return false;
  } else {
    return (
      h1[0].textContent!.toLowerCase().includes("decisions") ||
      h1[0].textContent!.toLowerCase().includes("co-authored")
    );
  }
};

const daysUnderReview = (submitted: string, returned: string): number => {
  // calculates the number of days a manuscripts has been under review.
  // Takes two arguments: the day a manuscript is submitted in DD-Mon-YYYY format and day decisioned DD-Mon-YYYY
  const sec = 1000 * 60 * 60 * 24;
  return Math.floor(
    (new Date(returned).getTime() - new Date(submitted).getTime()) / sec
  );
};

const createHeader = (cell_fill: string, rowNumber: number) => {
  // Creates the header column
  const header = document.createElement("td");
  header.innerText = cell_fill;
  if (
    header.innerText == "Days Under Review" ||
    header.innerText == "Days Until Decision"
  ) {
    header.style["fontWeight"] = "bold";
  }
  const authorDashboard = document.getElementById(
    "authorDashboardQueue"
  ) as HTMLTableElement;
  authorDashboard!.rows[rowNumber].appendChild(header);
};
const addDecisionsColumn = (ms_dataObject: Manuscript[]) => {
  const authorDashboard = document.getElementById(
    "authorDashboardQueue"
  ) as HTMLTableElement;
  createHeader("Days Until Decision", 0);
  for (let i = 0; i < ms_dataObject.length; i++) {
    let header = document.createElement("td");
    header.innerText = `Days: ${ms_dataObject[i].days}`;
    authorDashboard!.rows[i + 1].appendChild(header);
  }
};

const getDecisionData = () => {
  /// reads the decision table.
  const authorDashboard = document.getElementById(
    "authorDashboardQueue"
  ) as HTMLTableElement;
  const authorDashboardRows = authorDashboard.rows; ///main table
  const tableHeaders = authorDashboardRows[0].cells;
  const manuscript_data = {};
  const index = getIndicies(tableHeaders);
  const ms_data: Manuscript[] = [];
  // Journal's name appears on mobile viewport widths
  const journalFullName = (
    document.getElementsByClassName(
      "brand visible-tablet visible-phone"
    )[0] as HTMLAnchorElement
  ).text;

  const journal = document.URL.split("/")[3];

  for (let i = 1; i < authorDashboardRows.length; i++) {
    let data = newManuscript();
    const row: HTMLTableRowElement = authorDashboardRows[i];
    const manuscriptID = row.cells[index.ID].textContent!.trim();
    data["manuscriptID"] = manuscriptID;
    data["journal"] = journal;
    let submission_date: string = "";
    try {
      submission_date = row.cells[index.Submitted].textContent!.trim();
    } catch (error) {
      submission_date = row.cells[index.Created].textContent!.trim();
    }
    const status = row.cells[index.Status];
    const decision = getDecisionType(status);
    if (!decision) {
      continue;
    }
    data["decision"] = decision!.decision;
    const days = daysUnderReview(submission_date, decision!.decisionDate);
    data["days"] = days;
    data["journalFullName"] = journalFullName;
    data["year"] = new Date(submission_date).getFullYear();
    ms_data.push(data);
  }
  return ms_data;
};

const addReviewTimeColumn = () => {
  /// adds a column to the table for the number of days that a manuscript has been under review
  const authorDashboardRows = (
    document.getElementById("authorDashboardQueue") as HTMLTableElement
  ).rows;
  const tableHeaders = authorDashboardRows[0].cells;
  createHeader("Days Under Review", 0);
  const index = getIndicies(tableHeaders);
  for (let i = 1; i < authorDashboardRows.length; i++) {
    const submission_date =
      authorDashboardRows[i].cells[index.Submitted].textContent!.trim();
    const days = daysUnderReview(submission_date, Date());
    createHeader(String(days), i);
  }
};
const getIndicies = (tableHeaders: HTMLCollectionOf<HTMLTableCellElement>) => {
  /// takes a list of table headers and returns a dictionary of name:index
  let index = {
    Submitted: 0,
    Created: 0,
    Title: 0,
    ID: 0,
    Status: 0,
  };

  find_colName(tableHeaders, "Submitted", index);
  find_colName(tableHeaders, "Created", index);
  find_colName(tableHeaders, "Title", index);
  find_colName(tableHeaders, "ID", index);
  find_colName(tableHeaders, "Status", index);
  try {
    find_colName(tableHeaders, "Decisioned", index);
  } catch (err) {
    console.log(err);
  }
  return index;
};

const find_colName = (
  tableHeaders: HTMLCollectionOf<HTMLTableCellElement>,
  name: string,
  obj: any
) => {
  // takes a column headers list and returns name:index
  // or "not found"
  for (let i = 0; i < tableHeaders.length; i++) {
    if (tableHeaders[i].textContent!.trim() == name) {
      obj[name] = i;
    }
    {
      {
        ("not found");
      }
    }
  }
};

const getDecisionType = (authorDashboardCell: HTMLTableCellElement) => {
  // Takes authorDashboard cell, returns decision: decision, decisionDate: date object
  // begins with reject then revision and finally accept
  // "accept with minor revisions" => revision, not accept.
  const a = authorDashboardCell.getElementsByClassName("pagecontents");
  for (let i = 0; i < a.length; i++) {
    const textContent = a[i].textContent!;
    if (
      textContent.includes("Reject") ||
      textContent.includes("Revision") ||
      textContent.includes("Accept")
    ) {
      const dat = a[i].textContent!;
      const decision = dat.split("(")[0].trim();
      let decisionDate = dat.split("(")[1].trim();
      decisionDate = decisionDate.split(")")[0].trim();
      return { decision: decision, decisionDate: decisionDate };
    } else {
      continue;
    }
  }
};

const manuscriptUploadStatusColumn: {
  columnHeader: HTMLTableCellElement | null;
  columnCells: HTMLTableCellElement[];
  uploadStatus: "PENDING" | "SUCCESS" | "FAILURE";
  mount(manuscriptData: Manuscript[]): void;
  render(): void;
  unmount(): void;
} = {
  columnHeader: null,
  columnCells: [],
  uploadStatus: "PENDING",

  async mount(manuscriptData) {
    const manuscriptTable = document.getElementById(
      "authorDashboardQueue"
    ) as HTMLTableElement;

    const manuscriptTableRows = manuscriptTable.tBodies![0].rows;

    for (const row of manuscriptTableRows) {
      const cell = document.createElement("td");
      const imageElement = document.createElement("img");
      imageElement.style.width = "25px";
      imageElement.style.height = "25px";
      cell.appendChild(imageElement);
      row.appendChild(cell);
      this.columnCells.push(cell);
    }

    const header = document.createElement("th");
    header.textContent = "Uploaded to Coauthor?";
    const tableHeaders = manuscriptTable.tHead!.rows[0];
    tableHeaders.appendChild(header);
    this.columnHeader = header;

    this.render();
    const uploadSuccessful = await sendData(manuscriptData);
    this.uploadStatus = uploadSuccessful ? "SUCCESS" : "FAILURE";
    this.render();
  },

  render() {
    switch (this.uploadStatus) {
      case "PENDING":
        for (const cell of this.columnCells) {
          const imageElement = cell.children[0] as HTMLImageElement;
          imageElement.src = chrome.runtime.getURL("assets/loading.gif");
          imageElement.alt = "Loading icon indicating upload pending";
          imageElement.title = "Manuscript upload is pending.";
        }
        break;
      case "SUCCESS":
        for (const cell of this.columnCells) {
          const imageElement = cell.children[0] as HTMLImageElement;
          imageElement.src = chrome.runtime.getURL("assets/greenCheck.png");
          imageElement.alt = "Green checkmark indicating upload success";
          imageElement.title =
            "Manuscript successfully received by Coauthor servers.";
        }
        break;
      default:
      case "FAILURE":
        for (const cell of this.columnCells) {
          const imageElement = cell.children[0] as HTMLImageElement;
          imageElement.src = chrome.runtime.getURL(
            "assets/disconnect-plug-icon.png"
          );
          imageElement.alt =
            "Disconnected plug indicating failed upload attempt";
          imageElement.title =
            "Connection could not be established with Coauthor servers.";
        }
        break;
    }
  },

  unmount() {
    this.columnHeader!.remove();
    for (const cell of this.columnCells!) {
      cell.remove();
    }
  },
};

(async () => {
  console.log("starting");
  if (decisionsPage()) {
    const journal = document.URL.split("/")[3];
    //console.log('in the decision loop')
    const result = await getStats(journal);
    console.log(`recieved result from getstats ${result}`);
    const manuscriptData = getDecisionData();
    addDecisionsColumn(manuscriptData);
    createStatsTable(result);
    chrome.runtime.sendMessage(
      { message: "checkAuthStatus" },
      async function (response) {
        if (response.validSession) {
          manuscriptUploadStatusColumn.mount(manuscriptData);
        }
      }
    );
    chrome.runtime.onMessage.addListener(async function (
      message,
      sender,
      sendResponse
    ) {
      switch (message.type) {
        case "addAuthenticatedFeatures":
          manuscriptUploadStatusColumn.mount(manuscriptData);
          sendResponse("success");
          break;
        case "removeAuthenticatedFeatures":
          manuscriptUploadStatusColumn.unmount();
          sendResponse("success");
          break;
      }
    });
  } else if (submittedPage()) {
    addReviewTimeColumn();
  }
})();

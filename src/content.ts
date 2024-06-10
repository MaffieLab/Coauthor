// Notes: Title sometimes has "Files Archived" on decisions page.
import { Manuscript, newManuscript } from "./types/index";
import { sendData } from "./services/mcServices";
import { renderDashboard } from "./services/dashboard";
import * as Sentry from "@sentry/browser";

if (process.env.SENTRY_ENV) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN!,
    environment: process.env.SENTRY_ENV!,
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    integrations: [Sentry.browserTracingIntegration()],
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
    header.innerText = `Days: ${daysUnderReview(
      ms_dataObject[i].submissionDate,
      ms_dataObject[i].decisionDate
    )}`;
    authorDashboard!.rows[i + 1].appendChild(header);
  }
};

const getManuscriptData = (): Manuscript[] => {
  const manuscriptTable = document.getElementById(
    "authorDashboardQueue"
  ) as HTMLTableElement;

  const manuscriptTableHeaderRow = manuscriptTable.tHead!.rows[0];
  const manuscriptTableBodyRows = manuscriptTable.tBodies[0].rows;

  // Get the indices of the columns of interest in the table.
  // A more flexible approach than simply making an assumption about
  // what order these columns appear (or if they appear at all)
  const columnIndices = getColumnIndices(manuscriptTableHeaderRow);

  // Journal's name appears on mobile viewport widths
  const journalFullName = (
    document.getElementsByClassName(
      "brand visible-tablet visible-phone"
    )[0] as HTMLAnchorElement
  ).text;

  const journalID = document.URL.split("/")[3];

  const manuscripts: Manuscript[] = [];

  for (const manuscriptRow of manuscriptTableBodyRows) {
    const manuscript = newManuscript();
    manuscript["journal"] = journalID;
    manuscript["journalFullName"] = journalFullName;
    const manuscriptID =
      manuscriptRow.cells[columnIndices.id].textContent!.trim();
    manuscript["manuscriptID"] = manuscriptID;
    let submissionDate: string = "";
    try {
      submissionDate =
        manuscriptRow.cells[columnIndices.submitted].textContent!.trim();
    } catch (error) {
      submissionDate =
        manuscriptRow.cells[columnIndices.created].textContent!.trim();
    }
    manuscript["submissionDate"] = submissionDate;
    const status = manuscriptRow.cells[columnIndices.status];
    const decisionInfo = getDecisionInfo(status);
    manuscript["decision"] = decisionInfo!.decision;
    manuscript["decisionDate"] = decisionInfo.decisionDate;
    manuscripts.push(manuscript);
  }

  return manuscripts;
};

const addReviewTimeColumn = () => {
  /// adds a column to the table for the number of days that a manuscript has been under review
  const manuscriptTable = document.getElementById(
    "authorDashboardQueue"
  ) as HTMLTableElement;

  const manuscriptTableHeaderRow = manuscriptTable.tHead!.rows[0];
  const authorDashboardRows = manuscriptTable.rows;

  createHeader("Days Under Review", 0);
  const index = getColumnIndices(manuscriptTableHeaderRow);
  for (let i = 1; i < authorDashboardRows.length; i++) {
    const submission_date =
      authorDashboardRows[i].cells[index.submitted].textContent!.trim();
    const days = daysUnderReview(submission_date, Date());
    createHeader(String(days), i);
  }
};

const getColumnIndices = (manuscriptTableHeaderRow: HTMLTableRowElement) => {
  const columnIndices = {
    status: -1,
    id: -1,
    submitted: -1,
    created: -1,
  };

  for (let i = 0; i < manuscriptTableHeaderRow.cells.length; i++) {
    // Text content comparison is only reliable way of identifying which column is which
    const headerElement = manuscriptTableHeaderRow.cells[i];
    const headerText = headerElement.textContent;
    if (headerText) {
      switch (headerText.trim()) {
        case "Status":
          columnIndices.status = i;
          break;
        case "ID":
          columnIndices.id = i;
          break;
        case "Submitted":
          columnIndices.submitted = i;
          break;
        case "Created":
          columnIndices.created = i;
          break;
        default:
          break;
      }
    }
  }

  return columnIndices;
};

const getDecisionInfo = (authorDashboardCell: HTMLTableCellElement) => {
  // Assume decision type and date are in the first element of the collection
  const decisionInfoElement =
    authorDashboardCell.getElementsByClassName("pagecontents")[0];
  // Assume structure is `${decision} (${decisionDate})`
  const decisionInfoText = decisionInfoElement.textContent!;

  const tokens = decisionInfoText.split("(");
  const decision = tokens[0].trim();
  const decisionDate = tokens[1].slice(0, -1);

  return {
    decision: decision,
    decisionDate: decisionDate,
  };
};

export const manuscriptUploadStatusColumn: {
  columnHeader: HTMLTableCellElement | null;
  columnCells: HTMLTableCellElement[];
  uploadStatus: "PENDING" | "SUCCESS" | "FAILURE";
  mount(): void;
  render(): void;
  unmount(): void;
} = {
  columnHeader: null,
  columnCells: [],
  uploadStatus: "PENDING",

  async mount() {
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
    const uploadSuccessful = await sendData(globalStore.manuscriptData);
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

const globalStore: {
  manuscriptData: Manuscript[];
} = {
  manuscriptData: [],
};

(async () => {
  if (decisionsPage()) {
    const manuscriptData = getManuscriptData();
    globalStore.manuscriptData = manuscriptData;
    addDecisionsColumn(manuscriptData);
    renderDashboard();
    chrome.runtime.sendMessage(
      { message: "checkAuthStatus" },
      async function (response) {
        if (response.validSession) {
          manuscriptUploadStatusColumn.mount();
        }
      }
    );
  } else if (submittedPage()) {
    addReviewTimeColumn();
  }
})();

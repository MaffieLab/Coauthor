// Notes: Title sometimes has "Files Archived" on decisions page.
// localstorage is using one file. Could divide it among journals to have a
// localStorage for each journal.
// localStorage only MSID
//test
"use strict";
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

const daysUntilDecision = () => {
  const data = getDecisionData();
  addDecisionsColumn(data);
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

  for (let i = 1; i < authorDashboardRows.length; i++) {
    let data = newManuscript();
    const manuscriptID =
      authorDashboardRows[i].cells[index.ID].textContent!.trim();
    data["manuscriptID"] = manuscriptID;
    if (isRevision(manuscriptID)) {
      data[getRevisionTag(manuscriptID)] = true;
    } else {
      data["initialSubmission"] = true;
    }
    const journal = document.URL.split("/")[3];
    data["journal"] = journal;
    try {
      const submission_date =
        authorDashboardRows[i].cells[index.Submitted].textContent!.trim();
      data["submission_date"] = submission_date;
    } catch (error) {
      const submission_date =
        authorDashboardRows[i].cells[index.Created].textContent!.trim();
      data["submission_date"] = submission_date;
    }
    const title = authorDashboardRows[i].cells[index.Title]
      .textContent!.trim()
      .split("View")[0]
      .trim();
    data["title"] = title;
    const status = authorDashboardRows[i].cells[index.Status];
    const decision = getDecisionType(status);
    data["decision"] = decision!.decision;
    if (data["decision"] == "Reject" || data["decision"] == "Accept") {
      data["terminalDecision"] = true;
    }
    data["decisioned_date"] = decision!.decisionDate;
    const days = daysUnderReview(data.submission_date, data.decisioned_date);
    data["days"] = days;
    data["journalFullName"] = journalFullName;
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
  // takes a column headersd list and returns name:index
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

const isRevision = (manuscriptID: string): boolean => {
  // Returns true if manuscript is a revision
  return manuscriptID.split(".").length > 1;
};

const getRevisionTag = (manuscriptID: string): "R1" | "R2" => {
  // returns R# where # is the round of revision
  return manuscriptID.split(".")[1] as "R1" | "R2";
};

(async () => {
  console.log("starting");
  if (decisionsPage()) {
    const journal = document.URL.split("/")[3];
    //console.log('in the decision loop')
    const result = await getStats(journal, "avg");
    console.log(`recieved result from getstats ${result}`);
    const a = getDecisionData();
    addDecisionsColumn(a);
    createStatsTable(result);
    ///need to retrieve local storage
    await postData(a, journal);
    console.log("finished posting");
  } else if (submittedPage()) {
    addReviewTimeColumn();
  }
})();

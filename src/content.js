// Notes: Title sometimes has "Files Archived" on decisions page.
// localstorage is using one file. Could divide it among journals to have a
// localStorage for each journal.
// localStorage only MSID
//test
"use strict";
const submittedPage = () => {
  // a function that returns true if the user is on the "Submitted Manuscripts" page.
  // Else false.
  const h1 = document.getElementsByTagName("h1");
  if (h1.length < 1) {
    return false;
  } else {
    return h1[0].textContent.toLowerCase().includes("submitted");
  }
};

const decisionsPage = () => {
  // Returns true if the user is on the "Manuscripts with Decisions" page.
  const h1 = document.getElementsByTagName("h1");
  if (h1.length < 1) {
    return false;
  } else {
    return (
      h1[0].textContent.toLowerCase().includes("decisions") ||
      h1[0].textContent.toLowerCase().includes("co-authored")
    );
  }
};

const daysUnderReview = (submitted, returned) => {
  // calculates the number of days a manuscripts has been under review.
  // Takes two arguments: the day a manuscript is submitted in DD-Mon-YYYY format and day decisioned DD-Mon-YYYY
  const sec = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(returned) - new Date(submitted)) / sec);
};

const createHeader = (cell_fill, rowNumber) => {
  // Creates the header column
  const header = document.createElement("td");
  header.innerText = cell_fill;
  if (
    header.innerText == "Days Under Review" ||
    header.innerText == "Days Until Decision"
  ) {
    header.style["font-weight"] = "bold";
  }
  const authorDashboard = document.getElementById("authorDashboardQueue");
  authorDashboard.rows[rowNumber].appendChild(header);
};
const addDecisionsColumn = (ms_dataObject) => {
  const authorDashboard = document.getElementById("authorDashboardQueue");
  createHeader("Days Until Decision", 0);
  for (let i = 0; i < ms_dataObject.length; i++) {
    let header = document.createElement("td");
    header.innerText = `Days: ${ms_dataObject[i].days}`;
    authorDashboard.rows[i + 1].appendChild(header);
  }
};

const daysUntilDecision = () => {
  const data = getDecisionData();
  addDecisionsColumn(data);
};

const getDecisionData = () => {
  /// reads the decision table.
  const authorDashboardRows = document.getElementById(
    "authorDashboardQueue"
  ).rows; ///main table
  const tableHeaders = authorDashboardRows[0].cells;
  const manuscript_data = {};
  const index = getIndicies(tableHeaders);
  const ms_data = [];
  const journalFullName = document.getElementsByClassName(
    "brand visible-tablet visible-phone"
  )[0].text;

  for (let i = 1; i < authorDashboardRows.length; i++) {
    let data = {};
    const manuscriptID =
      authorDashboardRows[i].cells[index.ID].textContent.trim();
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
        authorDashboardRows[i].cells[index.Submitted].textContent.trim();
      data["submission_date"] = submission_date;
    } catch (error) {
      const submission_date =
        authorDashboardRows[i].cells[index.Created].textContent.trim();
      data["submission_date"] = submission_date;
    }
    const title = authorDashboardRows[i].cells[index.Title].textContent
      .trim()
      .split("View")[0]
      .trim();
    data["title"] = title;
    const status = authorDashboardRows[i].cells[index.Status];
    const decision = getDecisionType(status);
    data["decision"] = decision.decision;
    if (data["decision"] == "Reject" || data["decision"] == "Accept") {
      data["terminalDecision"] = true;
    }
    data["decisioned_date"] = decision.decisionDate;
    const days = daysUnderReview(data.submission_date, data.decisioned_date);
    data["days"] = days;
    data["journalFullName"] = journalFullName;
    ms_data.push(data);
  }
  return ms_data;
};
const isNew = (id, data) => {
  return !data.find((item) => item.manuscriptID == id);
};
const addReviewTimeColumn = () => {
  /// adds a column to the table for the number of days that a manuscript has been under review
  const authorDashboardRows = document.getElementById(
    "authorDashboardQueue"
  ).rows;
  const tableHeaders = authorDashboardRows[0].cells;
  createHeader("Days Under Review", 0);
  const index = getIndicies(tableHeaders);
  for (let i = 1; i < authorDashboardRows.length; i++) {
    const submission_date =
      authorDashboardRows[i].cells[index.Submitted].textContent.trim();
    const days = daysUnderReview(submission_date, Date());
    createHeader(days, i);
  }
};
const getIndicies = (tableHeaders) => {
  /// takes a list of table headers and returns a dictionary of name:index
  let index = {};

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

const find_colName = (tableHeaders, name, obj) => {
  // takes a column headersd list and returns name:index
  // or "not found"
  for (let i = 0; i < tableHeaders.length; i++) {
    if (tableHeaders[i].textContent.trim() == name) {
      obj[name] = i;
    }
    {
      {
        ("not found");
      }
    }
  }
};

const getDecisionType = (authorDashboardCell) => {
  // Takes authorDashboard cell, returns decision: decision, decisionDate: date object
  // begins with reject then revision and finally accept
  // "accept with minor revisions" => revision, not accept.
  const a = authorDashboardCell.getElementsByClassName("pagecontents");
  for (let i = 0; i < a.length; i++) {
    if (a[i].textContent.includes("reject" | "revision" | "accept")) {
      const dat = a[i].textContent;
      const decision = dat.split("(")[0].trim();
      let decisionDate = dat.split("(")[1].trim();
      decisionDate = decisionDate.split(")")[0].trim();
      return { decision: decision, decisionDate: decisionDate };
    } else {
      continue;
    }
  }
};

const isRevision = (manuscriptID) => {
  // Returns true if manuscript is a revision
  return manuscriptID.split(".").length > 1;
};

const getRevisionTag = (manuscriptID) => {
  // returns R# where # is the round of revision
  return manuscriptID.split(".")[1];
};

const getOriginalID = (manuscript) => {
  // takes a manuscript ID and splits off the revisions number. Returns original ID.
  return manuscript.manuscriptID.split(".")[0];
};

const findMSindex = (manuscriptID, manuscript_data) => {
  return (
    manuscript_data.findIndex((object) => {
      object.manuscriptID == manuscriptID;
    }) == -1
  );
}; // returns true if not in the manuscript_data

const addRevision = (
  manuscript,
  manuscript_data,
  submission_date,
  decision_date,
  days
) => {
  // get the revision tag
  const tag = getRevisionTag(manuscript);
  // manuscript not in the array yet, need to find id
  const id = getOriginalID(manuscript);

  // find the other manuscript
  const index = findMSindex(id, manuscript_data);

  manuscript_data[index][tag + "_submission_date"] = decision_date;
  manuscript_data[index][tag + "_decisioned_date"] = submission_date;
  manuscript_data[index][tag + "_days_till_decision"] = days;

  return manuscript_data;
};

// Preprint server - in the manuscript ID
// format: (ARCHIVE/YEAR/DOI#).
// Note: DOI would reveal author ID
const isArchived = (manuscriptID) => {
  // returns true of the manusript is associted with an archive
  return manuscriptID.split("(") > 1;
};

const getArchive = (manuscriptID) => {
  // returns the data archive number
  return manuscriptID.split("(")[1].split("/")[0]; //this only returns archive
};

const amendData = (ms_data) => {
  // load the data object
  const data = retrieveData(ms_data);

  // Get the data on the page
  const currentPageData = getDecisionData();

  // check to see if manuscript is in the object
  for (let i = 0; i < currentPageData.length; i++) {}

  // if it is, break

  // if it is not, add it to the database

  // return the complete df
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

//for scraping table header data
//let authorDashboardRows = document.getElementById("authorDashboardQueue").rows
//let tableHeaders = authorDashboardRows[0].cells
//for(i=0; i<(tableHeaders.length-1); i++) {console.log(tableHeaders[i].textContent)}

interface JournalStats {
  "Avg. Days to 1st Decision": number;
  "Standard Deviation": number;
  "Accept % | 1st R&R": number;
  "% Initial Submit => 1st R&R": number;
}

interface Manuscript {
  manuscriptID: string;
  initialSubmission?: boolean;
  R1?: boolean;
  R2?: boolean;
  journal: string;
  submission_date: string;
  title: string;
  decision: string;
  terminalDecision?: true;
  decisioned_date: string;
  days: number;
  journalFullName: string;
}

const newManuscript = (): Manuscript => ({
  manuscriptID: "",
  journal: "",
  submission_date: "",
  title: "",
  decision: "",
  decisioned_date: "",
  days: 0,
  journalFullName: "",
});

/* 
  Stored in localStorage for caching purposes. We only store the ID 
  since that's all we need to determine if the database has the
  associated manuscript or not.
*/
interface CachedManuscript {
  manuscriptID: string;
}

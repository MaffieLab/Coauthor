export interface JournalStats {
  "Avg. Days to 1st Decision": number;
  "Standard Deviation": number;
  "Accept % | 1st R&R": number;
  "% Initial Submit => 1st R&R": number;
}

export interface Manuscript {
  manuscriptID: string;
  journal: string;
  submission_date: string;
  title: string;
  decision: string;
  decisioned_date: string;
  days: number;
  year: number;
  journalFullName: string;
}

export const newManuscript = (): Manuscript => ({
  manuscriptID: "",
  journal: "",
  submission_date: "",
  title: "",
  decision: "",
  decisioned_date: "",
  days: 0,
  year: 0,
  journalFullName: "",
});

/* 
  Stored in localStorage for caching purposes. We only store the ID 
  since that's all we need to determine if the database has the
  associated manuscript or not.
*/
export interface CachedManuscript {
  manuscriptID: string;
}

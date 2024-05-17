export interface JournalStats {
  "Avg. Days to 1st Decision": number;
  "Standard Deviation": number;
  "Accept % | 1st R&R": number;
  "% Initial Submit => 1st R&R": number;
}

export interface Manuscript {
  manuscriptID: string;
  journal: string;
  decision: string;
  submissionDate: string;
  decisionDate: string;
  journalFullName: string;
}

export const newManuscript = (): Manuscript => ({
  manuscriptID: "",
  journal: "",
  decision: "",
  submissionDate: "",
  decisionDate: "",
  journalFullName: "",
});

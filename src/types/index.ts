export interface Manuscript {
  manuscriptID: string;
  decision: string;
  submissionDate: string;
  decisionDate: string;
}

export interface ManuscriptData {
  journalUrlSlug: string;
  journalName: string;
  manuscripts: Manuscript[];
}

export const newManuscriptData = (): ManuscriptData => ({
  journalUrlSlug: "",
  journalName: "",
  manuscripts: [],
});

export const newManuscript = (): Manuscript => ({
  manuscriptID: "",
  decision: "",
  submissionDate: "",
  decisionDate: "",
});

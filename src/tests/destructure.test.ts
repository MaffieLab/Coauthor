import { destructureMsList } from "../services/storageFunctions";
import { Manuscript } from "../types/index";

describe("Destructure manuscript function", () => {
  const msList: Manuscript[] = [
    {
      manuscriptID: "id1",
      journal: "",
      submission_date: "",
      title: "",
      decision: "",
      decisioned_date: "",
      days: 0,
      year: 0,
      journalFullName: "",
    },
    {
      manuscriptID: "id2",
      journal: "",
      submission_date: "",
      title: "",
      decision: "",
      decisioned_date: "",
      days: 0,
      year: 0,
      journalFullName: "",
    },
  ];

  it("destructures list of manuscripts into list of objects containing manuscript IDs", () => {
    expect(destructureMsList(msList)).toEqual([
      { manuscriptID: "id1" },
      { manuscriptID: "id2" },
    ]);
  });
});

import { Manuscript, CachedManuscript } from "../types/index";
import { sendData } from "./mcServices";
const loadLocalStorage = (): CachedManuscript[] => {
  /// loads the localStorage object of ms_data. creates empty list if none
  if (localStorage.getItem("ms_data") == null) {
    localStorage.setItem("ms_data", "[]");
  }
  const data = JSON.parse(
    localStorage.getItem("ms_data")!
  ) as CachedManuscript[];
  return data;
};

const notInStorage = (ms: Manuscript, ms_list: CachedManuscript[]): boolean => {
  // takes a manuscript and manuscript list, returns true if manuscript is in list
  for (let i = 0; i < ms_list.length; i++) {
    if (ms_list[i].manuscriptID == ms.manuscriptID) {
      console.log(ms_list[i]);
      return false;
    }
    continue;
  }
  return true;
};

const listNotInStorage = (
  ms_list: Manuscript[],
  stored_list: CachedManuscript[]
): Manuscript[] => {
  // takes in a list of manuscripts and a list of those in storage
  // returns a list of those not currently in storage
  let toSave: Manuscript[] = [];
  for (let i = 0; i < ms_list.length; i++) {
    if (notInStorage(ms_list[i], stored_list)) {
      toSave.push(ms_list[i]);
    } else {
      continue;
    }
  }
  return toSave;
};

const destructeMsList = (listofms: Manuscript[]): CachedManuscript[] => {
  // descructures list of manuscripts
  let a: CachedManuscript[] = [];
  for (let i = 0; i < listofms.length; i++) {
    let b = (({ manuscriptID }) => ({ manuscriptID }))(listofms[i]);
    a.push(b);
  }
  return a;
};

const updateStored = (listMsToAdd: Manuscript[]) => {
  /// Adds listMsToAdd to those in local storage
  let existing = loadLocalStorage();
  let destr = destructeMsList(listMsToAdd);
  let updated = JSON.stringify(existing.concat(destr));
  localStorage.setItem("ms_data", updated);
};

const sendToServer = async (newMsList: Manuscript[]) => {
  /// write the manuscripts to server
  for (let i = 0; i < newMsList.length; i++) {
    await sendData(newMsList[i]);
  }
};

export const postData = async (msDataList: Manuscript[], journal: string) => {
  // posts data to the server
  // updates localStorage with new manuscripts
  let a = loadLocalStorage();
  ///console.log(`the following are in storage: ${a}`)
  let b = listNotInStorage(msDataList, a);
  ///console.log(`the following are not in storage: ${b}`)
  await sendToServer(b);
  /*if (b.length >0 ) {
        console.log('sending memo!')
        await sendMemo(journal)
    }*/
  updateStored(b);
};
import { UptodateForm } from "../Global.types";

// V1.3.0 -> V1.4.0
// Add groups attribut to controls
export const patchV1_3_0To1_4_0 = async (db: UptodateForm[]) => {
  const newDb: UptodateForm[] = [];
  for (const record of db) {
    if (record.groups === undefined) {
      newDb.push({ ...record, groups: ["admin"] });
    } else {
      newDb.push({ ...record });
    }
  }
  return newDb;
};

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { UptodateForm } from "../Global.types";
import { Authentification } from "./Authentification";
import { SERVER_ERROR_IMPOSSIBLE_TO_CREATE_DB } from "../Constants";
import { Logger } from "winston";

const dbFilePath = `${__dirname}/../data`;
const dbFilePathDev = `${__dirname}/../../data`;
const dbJson = "database.json";

export const dbConnect = (file?: string): string | null => {
  if (!file) file = `${dbJson}`;
  if (existsSync(file)) {
    return file;
  }
  return null;
};

/**
 * provide the default full path database file
 * @returns
 */
export const getDbInitJsonFileName = (): string => {
  if (process.env.environment === "development") {
    return `${dbFilePathDev}/${dbJson}`;
  } else {
    return `${dbFilePath}/${dbJson}`;
  }
};

export const dbCreate = (file: string) => {
  return new Promise((resolv, reject) => {
    if (!existsSync(file)) {
      // security RW for owner only
      writeFileSync(file, JSON.stringify([]), {
        encoding: "utf-8",
        mode: 0o600,
      });
      resolv(file);
    } else {
      reject(new Error(`${SERVER_ERROR_IMPOSSIBLE_TO_CREATE_DB} : ${file}`));
    }
  });
};

/**
 * This method must be called in try catch block
 * @param file
 * @returns
 */
export const dbGetData = (file: string): Promise<UptodateForm[]> => {
  return new Promise((resolv, reject) => {
    const dbFile = dbConnect(file);
    if (dbFile) {
      // eslint-disable-next-line no-useless-catch
      try {
        const content = readFileSync(dbFile, { encoding: "utf-8" });
        if (content) {
          const json: UptodateForm[] = JSON.parse(content);
          if (!Array.isArray(json))
            throw new Error(
              `Database ERROR: ${file} probably contains non JSON data (Array)`
            );
          resolv(json);
        }
        throw new Error(
          `Database ERROR: ${file} probably contains non JSON data (Array)`
        );
      } catch (error) {
        reject(error);
      }
    }
    reject(new Error(`Impossible to get dbFile value`));
  });
};

/**
 * This method must be called in try catch block
 * @param db
 * @param control
 * @returns
 */
export const dbInsert = (
  db: UptodateForm[],
  control: UptodateForm
): Promise<string> => {
  return new Promise((resolv, reject) => {
    if (control.uuid) {
      reject(new Error("Impossible to add object with an uuid"));
    }
    const uuid = uuidv4();
    db.push({
      ...control,
      uuid: uuid,
      urlCICDAuth: Authentification.dataEncrypt(
        control.urlCICDAuth,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      urlCronJobMonitoringAuth: Authentification.dataEncrypt(
        control.urlCronJobMonitoringAuth,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headerkey: Authentification.dataEncrypt(
        control.headerkey,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headervalue: Authentification.dataEncrypt(
        control.headervalue,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headerkeyGit: Authentification.dataEncrypt(
        control.headerkeyGit,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headervalueGit: Authentification.dataEncrypt(
        control.headervalueGit,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
    });
    resolv(uuid);
  });
};

export const dbCommit = (file: string, db: UptodateForm[]): Promise<null> => {
  return new Promise((resolv, reject) => {
    try {
      writeFileSync(file, JSON.stringify(db), {
        encoding: "utf-8",
        mode: 0o600,
      });
      resolv(null);
    } catch (error) {
      reject(error);
    }
  });
};

const decryptRecord = (record: UptodateForm, logger: Logger): UptodateForm => {
  let urlCICDAuth = record.urlCICDAuth;
  let urlCronJobMonitoringAuth = record.urlCronJobMonitoringAuth;
  let headerkey = record.headerkey;
  let headervalue = record.headervalue;
  let headerkeyGit = record.headerkeyGit;
  let headervalueGit = record.headervalueGit;
  try {
    urlCICDAuth = Authentification.dataDecrypt(
      record.urlCICDAuth,
      process.env.DATABASE_ENCRYPT_SECRET
    );
    urlCronJobMonitoringAuth = Authentification.dataDecrypt(
      record.urlCronJobMonitoringAuth,
      process.env.DATABASE_ENCRYPT_SECRET
    );
    headerkey = Authentification.dataDecrypt(
      record.headerkey,
      process.env.DATABASE_ENCRYPT_SECRET
    );
    headervalue = Authentification.dataDecrypt(
      record.headervalue,
      process.env.DATABASE_ENCRYPT_SECRET
    );
    headerkeyGit = Authentification.dataDecrypt(
      record.headerkeyGit,
      process.env.DATABASE_ENCRYPT_SECRET
    );
    headervalueGit = Authentification.dataDecrypt(
      record.headervalueGit,
      process.env.DATABASE_ENCRYPT_SECRET
    );
  } catch (error) {
    logger.error(
      `Database::decryptRecord-Impossible to decrypt record ${record.uuid}`
    );
  }

  return {
    ...record,
    urlCICDAuth: urlCICDAuth,
    urlCronJobMonitoringAuth: urlCronJobMonitoringAuth,
    headerkey: headerkey,
    headervalue: headervalue,
    headerkeyGit: headerkeyGit,
    headervalueGit: headervalueGit,
  };
};

const decryptDb = (records: UptodateForm[], logger: Logger) => {
  const decryptedDb: UptodateForm[] = [];
  for (const item of records) {
    decryptedDb.push(decryptRecord(item, logger));
  }
  return decryptedDb;
};

export const isRecordInUserGroups = (
  record: UptodateForm,
  userGroups: string[]
): boolean => {
  // could be remove "|| []" - for compatibility between 1.3 & 1.4 release
  // with 1.3 data groups attribut was not defined
  const groupsControl = record.groups || [];
  for (const groupControl of groupsControl) {
    if (userGroups.includes(groupControl)) return true;
  }
  return false;
};

export const dbGetRecord = (
  db: UptodateForm[],
  uuid: string,
  userGroups: string[],
  isAdmin: boolean,
  logger: Logger
): UptodateForm[] | UptodateForm | null => {
  if (!uuid) return null;
  if (uuid !== "all") {
    const control = db.filter((item) => item.uuid === uuid);
    if (control.length === 1) {
      // ok if admin or record groups includes in groups
      if (isAdmin || isRecordInUserGroups(control[0], userGroups))
        return decryptRecord(control[0], logger);
      // user is not authorized to get this control
      return null;
    }
  } else {
    // All controls are asked
    const controlsToReturn: UptodateForm[] = [];
    const dbDecrypted = decryptDb(db, logger);
    // is control has group which matchs with userGroups
    for (const control of dbDecrypted) {
      if (isAdmin || isRecordInUserGroups(control, userGroups))
        controlsToReturn.push(control);
    }
    return controlsToReturn;
  }
  return null;
};

/**
 * Don't forget to commit to keep persistent changes
 * @param db
 * @param uuid
 * @returns
 */
export const dbDeleteRecord = (db: UptodateForm[], uuid: string): string => {
  if (!uuid) return "";
  const idxOf = db.map((item) => item.uuid).indexOf(uuid);
  if (idxOf > -1) {
    db.splice(idxOf, 1);
    return uuid;
  }
  return "";
};

/**
 * Don't forget to commit to keep persistent changes
 * @param db
 * @param uuid
 * @returns
 */
export const dbUpdateRecord = (
  db: UptodateForm[],
  data: UptodateForm
): string => {
  if (!data.uuid) return "";
  const idxOf = db.map((item) => item.uuid).indexOf(data.uuid);
  if (idxOf > -1) {
    db[idxOf] = {
      ...data,
      urlCICDAuth: Authentification.dataEncrypt(
        data.urlCICDAuth,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      urlCronJobMonitoringAuth: Authentification.dataEncrypt(
        data.urlCronJobMonitoringAuth,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headerkey: Authentification.dataEncrypt(
        data.headerkey,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headervalue: Authentification.dataEncrypt(
        data.headervalue,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headerkeyGit: Authentification.dataEncrypt(
        data.headerkeyGit,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      headervalueGit: Authentification.dataEncrypt(
        data.headervalueGit,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
    };
    return data.uuid;
  }
  return "";
};

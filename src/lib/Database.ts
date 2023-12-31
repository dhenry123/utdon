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
 * @param check
 * @returns
 */
export const dbInsert = (
  db: UptodateForm[],
  check: UptodateForm
): Promise<string> => {
  return new Promise((resolv, reject) => {
    if (check.uuid) {
      reject(new Error("Impossible to add object with an uuid"));
    }
    const uuid = uuidv4();
    db.push({
      ...check,
      uuid: uuid,
      urlCICDAuth: Authentification.dataEncrypt(
        check.urlCICDAuth,
        process.env.DATABASE_ENCRYPT_SECRET
      ),
      urlCronJobMonitoringAuth: Authentification.dataEncrypt(
        check.urlCronJobMonitoringAuth,
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
  try {
    (urlCICDAuth = Authentification.dataDecrypt(
      record.urlCICDAuth,
      process.env.DATABASE_ENCRYPT_SECRET
    )),
      (urlCronJobMonitoringAuth = Authentification.dataDecrypt(
        record.urlCronJobMonitoringAuth,
        process.env.DATABASE_ENCRYPT_SECRET
      ));
  } catch (error) {
    logger.error(
      `Database::decryptRecord-Impossible to decrypt record ${record.uuid}`
    );
  }

  return {
    ...record,
    urlCICDAuth: urlCICDAuth,
    urlCronJobMonitoringAuth: urlCronJobMonitoringAuth,
  };
};

const decryptDb = (records: UptodateForm[], logger: Logger) => {
  const decryptedDb: UptodateForm[] = [];
  for (const item of records) {
    decryptedDb.push(decryptRecord(item, logger));
  }
  return decryptedDb;
};

export const dbGetRecord = (
  db: UptodateForm[],
  uuid: string,
  logger: Logger
): UptodateForm[] | UptodateForm | null => {
  if (!uuid) return null;
  if (uuid !== "all") {
    const control = db.filter((item) => item.uuid === uuid);

    if (control.length === 1) {
      // do not throw error, just log
      const recordDecrypted = decryptRecord(control[0], logger);
      return recordDecrypted;
    }
  } else {
    return decryptDb(db, logger);
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
    };
    return data.uuid;
  }
  return "";
};

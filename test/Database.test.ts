/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { UptodateForm } from "../src/Global.types";
import { existsSync, unlinkSync, writeFileSync, chmodSync } from "fs";
import {
  dbCommit,
  dbConnect,
  dbCreate,
  dbDeleteRecord,
  dbGetRecord,
  dbGetData,
  dbInsert,
  dbUpdateRecord,
  getDbInitJsonFileName,
  isRecordInUserGroups,
} from "../src/lib/Database";
import winston from "winston";
import Transport from "winston-transport";
const { combine, timestamp, json } = winston.format;

interface LastErrorTransportOptions {
  level?: string;
}

const control: UptodateForm = {
  name: "xxxxxx",
  urlProduction: "https://xxxxxxxx",
  headerkey: "",
  headervalue: "",
  headerkeyGit: "",
  headervalueGit: "",
  scrapTypeProduction: "json",
  exprProduction: "join('.',*)",
  urlGitHub: "https://xxxxxxxxx",
  exprGithub: "v[\\d+.]+",
  urlCronJobMonitoring: "https://xxxxxxxxxxxxx",
  httpMethodCronJobMonitoring: "GET",
  urlCronJobMonitoringAuth: `xxxxxxx`,
  urlCICD: "https://xxxxxxxxxxxxxxxxx",
  httpMethodCICD: "GET",
  urlCICDAuth: `xxxxxxx`,
  isPause: false,
  compareResult: null,
  uuid: "",
  groups: ["admin"],
  typeRepo: "github",
};

// Special transport - For testing: error has been flushed by winston
class LastErrorTransport extends Transport {
  lastError: Error | null;
  constructor(options: LastErrorTransportOptions = {}) {
    super(options);
    this.lastError = null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(info: any, callback: () => void) {
    if (info.level === "error") {
      this.lastError = info;
    }
    callback();
  }
}

const logger = winston.createLogger({
  level: "info",
  defaultMeta: {
    service: "utdon",
  },
  format: combine(timestamp(), json()),
  transports: [new LastErrorTransport()],
});

describe("Database", () => {
  beforeEach(() => {
    const file = "./test/data/database.json";
    if (existsSync(file)) unlinkSync(file);
    writeFileSync(file, JSON.stringify([]), "utf-8");
  });

  describe("DbConnect", () => {
    test("DbConnect - default", () => {
      expect(dbConnect()).not.toEqual("");
    });

    test("DbConnect - with path", () => {
      const mytpath = "./test/samples/database-empty.json";
      expect(dbConnect(mytpath)).toEqual(mytpath);
    });

    test("DbConnect - with non existing path", () => {
      const mytpath = "./test/samples/database-emptyxxx.json";
      expect(dbConnect(mytpath)).toBeNull();
    });
  });

  describe("getDbInitJsonFileName", () => {
    test("getDbInitJsonFileName - development environment", () => {
      process.env.environment = "development";
      const name = getDbInitJsonFileName();
      expect(name).toBeDefined();
      expect(name).not.toEqual("");
    });

    test("getDbInitJsonFileName - production environment", () => {
      process.env.environment = "production"; // anything in reality
      const name = getDbInitJsonFileName();
      expect(name).toBeDefined();
      expect(name).not.toEqual("");
    });
  });

  describe("dbCreate", () => {
    test("dbCreate - db not exists", () => {
      const mytpath = "./test/data/database.json";
      if (existsSync(mytpath)) unlinkSync(mytpath);
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbCreate(mytpath)
        .then((res) => {
          expect(res).not.toEqual("");
        })
        .catch((error: Error) => {
          // unexpected
          expect(error).not.toBeDefined();
        });
    });

    test("dbCreate - db allready exists", () => {
      const mytpath = "./test/data/database.json";
      if (existsSync(mytpath)) unlinkSync(mytpath);
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbCreate(mytpath)
        .then(() => {
          // try create twice
          dbCreate(mytpath).catch((error) => {
            // expected
            expect(error).toBeDefined();
          });
        })
        .catch((error: Error) => {
          expect(error).not.toBeDefined();
        });
    });
  });

  describe("dbGetData", () => {
    test("dbGetData - with path & no records", () => {
      const mytpath = "./test/samples/database-empty.json";
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbGetData(mytpath)
        .then((res) => {
          expect(res).toEqual([]);
        })
        .catch((error: Error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetData - malformed object", () => {
      const mytpath = "./test/samples/database-malformed-object.json";
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbGetData(mytpath)
        .then(() => {
          //unexpected
          expect(false).toBeTruthy();
        })
        .catch((error: Error) => {
          expect(error).toBeDefined();
          expect(error.toString()).toMatch(/probably contains non JSON data/);
        });
    });

    test("dbGetData - malformed empty file non json", () => {
      const mytpath = "./test/samples/database-nocontent.json";
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbGetData(mytpath)
        .then((res) => {
          // unexpected
          expect(res).not.toBeDefined();
        })
        .catch((error: Error) => {
          expect(error).toBeDefined();
          expect(error.toString()).toMatch(/probably contains non JSON data/);
        });
    });
  });

  describe("dbInsert", () => {
    test("dbInsert - without uuid", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then((res) => {
          expect(res).toBeDefined();
          expect(typeof res).toEqual("string");
          expect(res).toMatch(/-/);
        })
        .catch((error: Error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbInsert - with uuid", () => {
      const db: UptodateForm[] = [];
      dbInsert(db, { ...control, uuid: "xxxx" })
        .then((res) => {
          expect(res).not.toBeDefined();
        })
        .catch((error: Error) => {
          expect(error).toBeDefined();
        });
    });
  });

  describe("dbCommit", () => {
    test("dbCommit", () => {
      const db: UptodateForm[] = [];
      const file = "./test/data/database.json";
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control).then((uuid: string) => {
        dbCommit(file, db)
          .then((res) => {
            expect(res).toBeNull();
            dbGetData(file).then((newdb) => {
              expect(Array.isArray(newdb)).toBeTruthy();
              expect(newdb.length).toEqual(1);
              expect(newdb[0].uuid).toEqual(uuid);
            });
          })
          .catch((error: Error) => {
            // unexpected
            expect(error).not.toBeDefined();
          });
      });
    });

    test("dbCommit - db is read only", async () => {
      const db: UptodateForm[] = [];
      const file = "./test/samples/database-readonly.json";
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      // to be sure
      chmodSync(file, "400");
      await dbInsert(db, control).then(() => {
        dbCommit(file, db)
          .then(() => {
            // unexpected - file is read only
            expect(false).toBeTruthy();
          })
          .catch((error: Error) => {
            //expect(error).toBeDefined();
            // console.log(error);
            expect(error.toString()).toMatch(/EACCES: permission denied/);
          });
      });
    });
  });

  describe("dbGetRecord", () => {
    test("dbGetRecord - uuid exists - admin", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then((res) => {
          const rec = dbGetRecord(db, res, [], true, logger);
          if (!Array.isArray(rec)) {
            expect(rec?.uuid).toEqual(res);
          } else {
            throw new Error("unexpected Array returned");
          }
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetRecord - uuid exists impossible to decrypt secrets - admin", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then((res) => {
          const newdb = [{ ...control, uuid: res }];
          const rec = dbGetRecord(newdb, res, [], true, logger);
          const lastErrorWinston = (logger.transports[0] as LastErrorTransport)
            .lastError;
          expect(lastErrorWinston).toBeDefined();
          expect(lastErrorWinston?.message).toMatch(
            /Database::decryptRecord-Impossible/
          );

          if (!Array.isArray(rec)) {
            expect(rec?.uuid).toEqual(res);
          } else {
            throw new Error("unexpected Array returned");
          }
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetRecord - uuid not exists - admin", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          const rec = dbGetRecord(db, "xxxx", [], true, logger);
          expect(rec).toBeNull();
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetRecord - uuid not provided - admin", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          const rec = dbGetRecord(db, "", [], true, logger);
          expect(rec).toBeNull();
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetRecord - get all records - admin", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          const rec = dbGetRecord(db, "all", [], true, logger);
          expect(Array.isArray(rec)).toBeTruthy();
          expect(Array.isArray(rec) && rec.length).toEqual(1);
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetRecord - user is not admin and member of group which is not authorized to get this control", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      // check groups is 'admin'
      dbInsert(db, control)
        .then((uuid: string) => {
          //user wants all and member of xxxx
          const rec = dbGetRecord(db, uuid, ["xxxx"], false, logger);
          expect(rec).toBeNull();
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbGetRecord - user is not admin and member of group which is not authorized to get ALL controls", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      // check groups is 'admin'
      dbInsert(db, control)
        .then(() => {
          //user wants all and member of xxxx
          const rec = dbGetRecord(db, "all", ["xxxx"], false, logger);
          expect(Array.isArray(rec)).toBeTruthy();
          if (Array.isArray(rec)) expect(rec.length).toEqual(0);
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });
  });

  describe("dbDeleteRecord", () => {
    test("dbDeleteRecord - existing record", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          dbInsert(db, control).then((uuid) => {
            const rdel = dbDeleteRecord(db, uuid);
            expect(rdel).toEqual(uuid);
            expect(Array.isArray(db) && db.length).toEqual(1);
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbDeleteRecord - non existing record", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          dbInsert(db, control).then((uuid) => {
            const rdel = dbDeleteRecord(db, `${uuid}xxx`);
            expect(rdel).toEqual("");
            expect(Array.isArray(db) && db.length).toEqual(2);
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbDeleteRecord - empty uuid", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          dbInsert(db, control).then(() => {
            const rdel = dbDeleteRecord(db, "");
            expect(rdel).toEqual("");
            expect(Array.isArray(db) && db.length).toEqual(2);
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });
  });

  describe("dbUpdateRecord", () => {
    test("dbUpdateRecord - with uuid and admin", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          dbInsert(db, control).then((uuid) => {
            const upd = { ...control, uuid };
            upd.urlProduction = "test";
            const rupd = dbUpdateRecord(db, upd);
            expect(rupd).toEqual(uuid);
            expect(Array.isArray(db) && db.length).toEqual(2);
            const verif = dbGetRecord(db, uuid, [], true, logger);
            expect(verif).not.toBeNull();
            expect(
              verif && !Array.isArray(verif) && verif.urlProduction
            ).toEqual("test");
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbUpdateRecord - uuid not found", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          dbInsert(db, control).then(() => {
            const upd = { ...control, uuid: "xxxx" };
            upd.urlProduction = "test";
            const rupd = dbUpdateRecord(db, upd);
            expect(rupd).toEqual("");
            expect(Array.isArray(db) && db.length).toEqual(2);
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    test("dbUpdateRecord - uuid is not set", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          dbInsert(db, control).then(() => {
            const upd = { ...control };
            upd.urlProduction = "test";
            const rupd = dbUpdateRecord(db, upd);
            expect(rupd).toEqual("");
            expect(Array.isArray(db) && db.length).toEqual(2);
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });

    /**
     * if the record was modified by the setControlGlobalGithubToken method,
     * the original values were empty and the final state of the control must not change.
     */
    test("dbUpdateRecord - record and github global auth", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      // Insert control, headerkeyGit && headervalueGit are empty
      dbInsert(db, control)
        .then((uuid: string) => {
          const insertedRecord = dbGetRecord(
            db,
            uuid,
            [],
            true,
            logger
          ) as UptodateForm;
          expect(insertedRecord.headerkeyGit).toEqual("");
          expect(insertedRecord.headervalueGit).toEqual("");
          //simulate setControlGlobalGithubToken
          const recordAfterApplyingMethod = {
            ...insertedRecord,
            headerkeyGit: "globalkey",
            headervalueGit: "globalvalue",
            // Flag indicating that these attributes have been modified by the setControlGlobalGithubToken method.
            authGlobale: true,
          };
          // Update record
          dbUpdateRecord(db, recordAfterApplyingMethod);
          const recordAfterUpdate = dbGetRecord(
            db,
            uuid,
            [],
            true,
            logger
          ) as UptodateForm;

          // console.log(recordAfterUpdate);
          // State of attributes headerkeyGit && headervalueGit must not have changed
          expect(recordAfterUpdate.headerkeyGit).toEqual("");
          expect(recordAfterUpdate.headervalueGit).toEqual("");
        })
        .catch((error) => {
          //not Expected
          console.log(error);
          expect(error).not.toBeDefined();
        });
    });
  });

  describe("isRecordInUserGroups", () => {
    test("isRecordInUserGroups - global", () => {
      const db: UptodateForm[] = [];
      process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
      process.env.USER_ENCRYPT_SECRET = "test";
      dbInsert(db, control)
        .then(() => {
          expect(isRecordInUserGroups(control, ["admin"])).toBeTruthy();
          expect(isRecordInUserGroups(control, ["test"])).toBeFalsy();
          expect(isRecordInUserGroups(control, [])).toBeFalsy();
          const upd = { ...control };
          upd.urlProduction = "test";
          upd.groups = ["admin", "test"];
          dbInsert(db, control).then(() => {
            expect(isRecordInUserGroups(upd, ["admin", "test"])).toBeTruthy();
            expect(isRecordInUserGroups(upd, ["xxx", "yyy"])).toBeFalsy();
            expect(isRecordInUserGroups(upd, [])).toBeFalsy();
          });
        })
        .catch((error) => {
          expect(error).not.toBeDefined();
        });
    });
  });
});

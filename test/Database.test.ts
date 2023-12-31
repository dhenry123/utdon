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
} from "../src/lib/Database";
import winston from "winston";
import Transport from "winston-transport";
const { combine, timestamp, json } = winston.format;

interface LastErrorTransportOptions {
  level?: string;
}

const check: UptodateForm = {
  name: "xxxxxx",
  urlProduction: "https://xxxxxxxx",
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
  beforeAll(() => {
    const file = "./test/data/database.json";
    process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
    if (existsSync(file)) unlinkSync(file);
    writeFileSync(file, JSON.stringify([]), "utf-8");
  });
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

  test("dbCreate - db not exists", () => {
    const mytpath = "./test/data/database.json";
    if (existsSync(mytpath)) unlinkSync(mytpath);
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

  test("dbGetData - with path & no records", () => {
    const mytpath = "./test/samples/database-empty.json";
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

  test("dbInsert - without uuid", () => {
    const db: UptodateForm[] = [];

    dbInsert(db, check)
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
    dbInsert(db, { ...check, uuid: "xxxx" })
      .then((res) => {
        expect(res).not.toBeDefined();
      })
      .catch((error: Error) => {
        expect(error).toBeDefined();
      });
  });

  test("dbCommit", () => {
    const db: UptodateForm[] = [];
    const file = "./test/data/database.json";
    dbInsert(db, check).then((uuid: string) => {
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

  test("dbCommit - db is read only", () => {
    const db: UptodateForm[] = [];
    const file = "./test/samples/database-readonly.json";
    // to be sure
    chmodSync(file, "400");
    dbInsert(db, check).then(() => {
      dbCommit(file, db)
        .then(() => {
          // unexpected - file is read only
          expect(false).toBeTruthy();
        })
        .catch((error: Error) => {
          expect(error).toBeDefined();
          expect(error.toString()).toMatch(/EACCES: permission denied/);
        });
    });
  });

  test("dbGetRecord - uuid exists", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then((res) => {
        const rec = dbGetRecord(db, res, logger);
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

  test("dbGetRecord - uuid exists impossible to decrypt secrets", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then((res) => {
        const newdb = [{ ...check, uuid: res }];
        const rec = dbGetRecord(newdb, res, logger);
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

  test("dbGetRecord - uuid not exists", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then(() => {
        const rec = dbGetRecord(db, "xxxx", logger);
        expect(rec).toBeNull();
      })
      .catch((error) => {
        expect(error).not.toBeDefined();
      });
  });

  test("dbGetRecord - uuid not provided", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then(() => {
        const rec = dbGetRecord(db, "", logger);
        expect(rec).toBeNull();
      })
      .catch((error) => {
        expect(error).not.toBeDefined();
      });
  });

  test("dbGetRecord - get all records", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then(() => {
        const rec = dbGetRecord(db, "all", logger);
        expect(Array.isArray(rec)).toBeTruthy();
        expect(Array.isArray(rec) && rec.length).toEqual(1);
      })
      .catch((error) => {
        expect(error).not.toBeDefined();
      });
  });

  test("dbDeleteRecord - existing record", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then(() => {
        dbInsert(db, check).then((uuid) => {
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
    dbInsert(db, check)
      .then(() => {
        dbInsert(db, check).then((uuid) => {
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
    dbInsert(db, check)
      .then(() => {
        dbInsert(db, check).then(() => {
          const rdel = dbDeleteRecord(db, "");
          expect(rdel).toEqual("");
          expect(Array.isArray(db) && db.length).toEqual(2);
        });
      })
      .catch((error) => {
        expect(error).not.toBeDefined();
      });
  });

  test("dbUpdateRecord - with uuid", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then(() => {
        dbInsert(db, check).then((uuid) => {
          // const upd = { ...check, uuid: uuid };
          const upd = { ...check, uuid };
          upd.urlProduction = "test";
          const rupd = dbUpdateRecord(db, upd);
          expect(rupd).toEqual(uuid);
          expect(Array.isArray(db) && db.length).toEqual(2);
          const verif = dbGetRecord(db, uuid, logger);
          expect(verif).not.toBeNull();
          expect(verif && !Array.isArray(verif) && verif.urlProduction).toEqual(
            "test"
          );
        });
      })
      .catch((error) => {
        expect(error).not.toBeDefined();
      });
  });

  test("dbUpdateRecord - uuid not found", () => {
    const db: UptodateForm[] = [];
    dbInsert(db, check)
      .then(() => {
        dbInsert(db, check).then(() => {
          // const upd = { ...check, uuid: uuid };
          const upd = { ...check, uuid: "xxxx" };
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
    dbInsert(db, check)
      .then(() => {
        dbInsert(db, check).then(() => {
          // const upd = { ...check, uuid: uuid };
          const upd = { ...check };
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
});

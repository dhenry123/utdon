/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { Request, Response, NextFunction } from "express";
import { UptodateForm } from "../Global.types";
import {
  dbCommit,
  dbDeleteRecord,
  dbGetRecord,
  dbInsert,
  dbUpdateRecord,
} from "../lib/Database";
import { recordsOrder } from "../lib/Features";
const routerControl = express.Router();

routerControl.post(
  "/control",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mfields = [
        "name",
        "urlProduction",
        "scrapTypeProduction",
        "exprProduction",
        "urlGitHub",
        "exprGithub",
      ];
      let validate = true;
      for (const attr of Object.getOwnPropertyNames(req.body as UptodateForm)) {
        if (mfields.includes(attr) && !req.body[attr]) {
          validate = false;
          break;
        }
      }
      if (!validate) {
        res.status(503).json("check is not valide");
      } else {
        if (req.body.uuid) {
          // uuid update
          const rupd = dbUpdateRecord(req.app.get("DB"), req.body);
          if (rupd) {
            dbCommit(req.app.get("DBFILE") || "", req.app.get("DB"));
            req.app.get("LOGGER").info({ action: "check updated", uuid: rupd });
            res.status(200).json({ check: { ...req.body, uuid: rupd } });
          } else {
            next(new Error("update return empty"));
          }
        } else {
          // no uuid insert
          dbInsert(req.app.get("DB"), { ...req.body })
            .then((uuid) => {
              dbCommit(req.app.get("DBFILE") || "", req.app.get("DB"));
              req.app.get("LOGGER").info({ action: "check added", uuid: uuid });
              res.status(200).json({ check: { ...req.body, uuid: uuid } });
            })
            .catch((error: Error) => {
              next(error);
            });
        }
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * uuid value could be "all"
 */
routerControl.get(
  "/control/:uuid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let rec = dbGetRecord(
        req.app.get("DB"),
        req.params.uuid,
        req.app.get("LOGGER")
      );
      if (Array.isArray(rec) && rec.length > 0) {
        rec = recordsOrder(rec);
      }
      res.status(200).json(rec);
    } catch (error: unknown) {
      next(error);
    }
  }
);

routerControl.delete(
  "/control/:uuid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rec = dbDeleteRecord(req.app.get("DB"), req.params.uuid);
      if (rec === req.params.uuid) {
        //commit
        dbCommit(req.app.get("DBFILE") as string, req.app.get("DB"))
          .then(() => {
            res.status(200).json(rec);
          })
          .catch((error: Error) => {
            next(error);
          });
        req.app
          .get("LOGGER")
          .info({ action: "check added", uuid: req.params.uuid });
        res.status(200).json(rec);
      } else {
        res.status(404).json({
          message: `Try to delete a non-existent uuid: ${req.params.uuid}`,
        });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerControl;

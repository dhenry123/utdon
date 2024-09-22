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
import { SessionExt } from "../ServerTypes";
import { getTypeGitRepo } from "../lib/helperGitRepository";
const routerControl = express.Router();

routerControl.post(
  "/control",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //access only from the user interface, because adding a control requires going through several steps
      if (req.app.get("AUTH").isAuthBearer(req)) {
        res.status(403).json({
          error: "This operation can only be performed via the user interface",
        });
        return;
      }
      const mfields = [
        "name",
        "urlProduction",
        "scrapTypeProduction",
        "exprProduction",
        "urlGitHub",
        "exprGithub",
        "groups",
      ];
      let validate = true;
      for (const attr of Object.getOwnPropertyNames(req.body as UptodateForm)) {
        if (
          (mfields.includes(attr) && !req.body[attr]) ||
          (attr === "groups" && req.body[attr].length === 0)
        ) {
          validate = false;
          break;
        }
      }
      // finally, is user allowed to manipulate object ?
      validate = req.app.get("AUTH").isAllowedForObject(req, req.body.groups);
      if (!validate) {
        res.status(503).json("control is not valid");
      } else {
        if (req.body.uuid) {
          // uuid update
          req.body.typeRepo = getTypeGitRepo(req.body.urlGitHub);
          const rupd = dbUpdateRecord(req.app.get("DB"), req.body);
          if (rupd) {
            dbCommit(req.app.get("DBFILE") || "", req.app.get("DB"));
            req.app
              .get("LOGGER")
              .info({ action: "control updated", uuid: rupd, ipAddr: req.ip });
            res.status(200).json({ control: { ...req.body, uuid: rupd } });
          } else {
            next(new Error("update return empty"));
          }
        } else {
          // no uuid insert
          dbInsert(req.app.get("DB"), { ...req.body })
            .then((uuid) => {
              dbCommit(req.app.get("DBFILE") || "", req.app.get("DB"));
              req.app
                .get("LOGGER")
                .info({ action: "control added", uuid: uuid, ipAddr: req.ip });
              res.status(200).json({ control: { ...req.body, uuid: uuid } });
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
 * Get control - uuid value could be "all"
 */
routerControl.get(
  "/control/:uuid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      const userGroups = req.app.get("AUTH").getUserGroups(session.user.uuid);
      let rec = dbGetRecord(
        req.app.get("DB"),
        req.params.uuid,
        userGroups,
        req.app.get("AUTH").isAdmin(req),
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

/**
 * Delete control per uuid
 */
routerControl.delete(
  "/control/:uuid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      const userGroups = req.app.get("AUTH").getUserGroups(session.user.uuid);
      // get record filtered on authorized groups
      const rec = dbGetRecord(
        req.app.get("DB"),
        req.params.uuid,
        userGroups,
        req.app.get("AUTH").isAdmin(req),
        req.app.get("LOGGER")
      );
      if (rec && !Array.isArray(rec)) {
        const rec = dbDeleteRecord(req.app.get("DB"), req.params.uuid);
        if (rec === req.params.uuid) {
          //commit
          dbCommit(req.app.get("DBFILE") as string, req.app.get("DB"))
            .then(() => {
              req.app
                .get("LOGGER")
                .info({
                  action: "control deleted",
                  uuid: req.params.uuid,
                  ipAddr: req.ip,
                });
              res.status(200).json({ uuid: rec });
            })
            .catch((error: Error) => {
              next(error);
            });
        } else {
          res.status(404).json({
            message: `Something went wrong during control deletion process, non-existent uuid: ${req.params.uuid}`,
          });
        }
      } else {
        res.status(404).send();
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerControl;

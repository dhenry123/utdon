/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { NextFunction, Request, Response } from "express";
import { ERRORINVALIDREQUEST } from "../Constants";
import { ChangePasswordType, InfoIuType } from "../Global.types";
import { SessionExt } from "../ServerTypes";
const routerAuth = express.Router();

routerAuth.post(
  "/userlogin",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let verif: [number, string | InfoIuType] = ERRORINVALIDREQUEST;
      if (req.body && req.body.login && req.body.password) {
        verif = req.app
          .get("AUTH")
          .verifyPassword(req.body.login, req.body.password);
        if (verif[0] === 200) {
          req.app.get("LOGGER").info({
            action: "login",
            user: req.body.login,
          });
          const session = req.session as SessionExt;
          session.user = req.app.get("AUTH").getInfoForUi();
        }
      }
      res.status(verif[0]).json(verif[1]);
    } catch (error) {
      next(error);
    }
  }
);

routerAuth.get(
  "/isauthenticated",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verif = req.app.get("AUTH").isAuthenticated(req);
      res.status(verif ? 200 : 401).json();
    } catch (error) {
      next(error);
    }
  }
);

routerAuth.get(
  "/userlogout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user.login) {
        req.app.get("LOGGER").info({
          action: "logout",
          user: session.user.login,
        });
      }
      req.session.destroy((error: Error) => {
        if (error) req.app.get("LOGGER").error(error);
        res.status(204).json();
      });
    } catch (error) {
      next(error);
    }
  }
);

routerAuth.post(
  "/changepassword",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changepassword = req.body as ChangePasswordType;
      const verified = req.app.get("AUTH").changePassword(changepassword);
      if (verified[0] === 200) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: verified[1] });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

routerAuth.get(
  "/bearer",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (
        session.user &&
        session.user.login &&
        session.user.login === "admin"
      ) {
        res.status(200).json({ bearer: req.app.get("AUTH").getUserBearer() });
      } else {
        res.status(500).json({ error: "User is not logged with session" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

routerAuth.put(
  "/bearer",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (
        session.user &&
        session.user.login &&
        session.user.login === "admin"
      ) {
        const result = req.app.get("AUTH").changeBearer();
        if (result[0] === 200) {
          res.status(204).json();
        } else {
          res.status(500).json({ error: result[1].toString() });
        }
      } else {
        res.status(500).json({ error: "User is not logged with session" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerAuth;

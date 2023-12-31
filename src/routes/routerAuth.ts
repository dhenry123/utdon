/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { NextFunction, Request, Response } from "express";
import { ERRORINVALIDREQUEST } from "../Constants";
import { ChangePasswordType, InfoIuType } from "../Global.types";
import { SessionExt } from "../ServerTypes";
const routerAuth = express.Router();

/**
 *
 * @swagger
 * /userlogin:
 *   post:
 *     summary: login to the system with UI
 *     description: UI login method
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: login properties
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login OK
 *         content:
 *           application/text:
 *             schema:
 *               $ref: '#/components/schemas/InfoIuType'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */
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

/**
 *
 * @swagger
 * /isauthenticated:
 *   get:
 *     summary: is user logged
 *     description: Used by UI to verify user is logged
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: User is logged
 *         content:
 *           application/json:
 *             type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /userlogout:
 *   get:
 *     summary: user logout method
 *     description: Used by UI to logout user
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       204:
 *         description: User is logged out
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /changepassword:
 *   put:
 *     summary: user change password
 *     description: Used by UI to change user password
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: passwords list
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordType'
 *     responses:
 *       204:
 *         description: Password has been changed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */

routerAuth.put(
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

/**
 * @swagger
 * /bearer:
 *   get:
 *     summary: get user user auth Bearer
 *     description: Used by UI to get user auth Bearer
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: User auth Bearer
 *         content:
 *           application/json:
 *             type: object
 *             properties:
 *               bearer:
 *                 type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /bearer:
 *   put:
 *     summary: change user auth Bearer
 *     description: Used by UI to get new user auth Bearer
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       204:
 *         description: User auth Bearer has been changed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */

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

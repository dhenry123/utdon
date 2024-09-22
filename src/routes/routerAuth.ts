/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { NextFunction, Request, Response } from "express";
import { ERRORINVALIDREQUEST } from "../Constants";
import {
  ChangePasswordType,
  InfoIuType,
  NewUserType,
  UserType,
} from "../Global.types";
import { SessionExt } from "../ServerTypes";
const routerAuth = express.Router();

/**
 * login to the system with UI
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
            ipAddr: req.ip,
          });
          const session = req.session as SessionExt;
          session.user = req.app.get("AUTH").getInfoForUi(req.body.login);
        }
      }
      // no need to send info, login page is isolated, if user press F5
      // UI loose user infos
      res.status(verif[0]).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * get users list - only admin
 */
routerAuth.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      const isAdmin = req.app.get("AUTH").isAdmin(req);
      if (session.user && session.user.login && isAdmin) {
        res.status(200).json(req.app.get("AUTH").getUsersForUi(isAdmin));
      } else {
        res.status(401).send();
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * create user in the database - only admin
 */
routerAuth.post(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    //next step: for admin users only
    try {
      const session = req.session as SessionExt;
      if (
        session.user &&
        session.user.login &&
        req.app.get("AUTH").isAdmin(req)
      ) {
        // get the login and password
        const newUser = req.body as NewUserType;
        // get the list of current users, to check if user already exists
        const users: UserType[] = req.app.get("AUTH").getUsers();

        // check if user already exists
        if (!users.find((user) => user.login === newUser.login)) {
          const user = req.app
            .get("AUTH")
            .makeUser(newUser.login, newUser.password);
          req.app.get("AUTH").addUser(user); // add user to the list
          for (const group of newUser.groups) {
            req.app.get("AUTH").addGroupMember(group, user.uuid);
          }
          req.app.get("LOGGER").info({
            action: "create user",
            user: newUser.login,
            ipAddr: req.ip,
          });
          res.status(200).json({ login: newUser.login });
        } else {
          res.status(400).json({ error: "User already exists" });
        }
      } else {
        res.status(401).send();
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * modify user in the database - only admin
 */
routerAuth.put(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    //next step: for admin users only
    try {
      const session = req.session as SessionExt;
      if (
        session.user &&
        session.user.login &&
        req.app.get("AUTH").isAdmin(req)
      ) {
        // get the login and password
        const userToUpdate = req.body as NewUserType;
        if (userToUpdate.uuid) {
          // get the list of current users, to check if user already exists
          // get the list of current users, to check if user already exists
          const users: UserType[] = req.app.get("AUTH").getUsers();

          const idx = users.findIndex((u) => u.uuid === userToUpdate.uuid);
          if (idx !== -1) {
            //change password only if provided
            if (userToUpdate.password) {
              users[idx].password = req.app
                .get("AUTH")
                .encryptPassword(userToUpdate.password);
              req.app.get("AUTH").writeDB(JSON.stringify(users));
            }

            // update groups
            req.app.get("AUTH").removeUserFromGroups(userToUpdate.uuid);
            for (const group of userToUpdate.groups) {
              req.app.get("AUTH").addGroupMember(group, userToUpdate.uuid);
            }
            // groups cleaning
            req.app.get("AUTH").cleanGroups();
            req.app.get("LOGGER").info({
              action: "modify user",
              user: userToUpdate.login,
              ipAddr: req.ip,
            });
            res.status(204).send();
          } else {
            res.status(400).json({ error: "User  not found" });
          }
        } else {
          next(new Error("User uuid not set, mandatory for update"));
        }
      } else {
        res.status(401).send();
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * delete user from the database - only admin
 */
routerAuth.delete(
  "/users/:uuid",
  async (req: Request, res: Response, next: NextFunction) => {
    //next step: for admin users only
    try {
      const session = req.session as SessionExt;
      if (
        session.user &&
        session.user.uuid &&
        req.app.get("AUTH").isAdmin(req)
      ) {
        // get the login
        const userToDelete = req.params.uuid;
        // get the list of current users, to check if user exists before deleting it
        const users: UserType[] = req.app.get("AUTH").getUsers();

        const user = users.find((user) => user.uuid === userToDelete);

        const session = req.session as SessionExt;

        // check if user exists - user could not delete their account
        if (user && session.user.uuid !== req.params.uuid) {
          // if so, delete it
          req.app.get("AUTH").deleteUser(user.uuid); // add user to the list
          req.app.get("LOGGER").info({
            action: "delete user",
            user: `${user.uuid} - ${user.login}`,
            ipAddr: req.ip,
          });
          // groups cleaning
          req.app.get("AUTH").cleanGroups();
          res.status(200).json({ login: user.login, uuid: user.uuid });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } else {
        res.status(401).send();
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * is the user logged in ?
 */
routerAuth.get(
  "/isauthenticated",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verif = req.app.get("AUTH").isAuthenticated(req);
      res.status(verif ? 204 : 401).json();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * does the user have the administrator role ?
 */
routerAuth.get(
  "/isadmin",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verif = req.app.get("AUTH").isAdmin(req);
      res.status(verif ? 204 : 401).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * user logout method
 */
routerAuth.get(
  "/userlogout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      req.app.get("LOGGER").info({
        action: "logout",
        user: session.user.login ? session.user.login : "session user unknown",
        ipAddr: req.ip,
      });
      session.user.login = "";
      req.session.destroy((error: Error) => {
        if (error) {
          req.app.get("LOGGER").error(error);
        }
        res.clearCookie("connect.sid");
        res.status(204).json();
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * user change password
 */
routerAuth.put(
  "/changepassword",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user && session.user.login) {
        const changepassword = req.body as ChangePasswordType;
        const verified = req.app
          .get("AUTH")
          .changePassword(changepassword, session.user.login);
        if (verified[0] === 200) {
          res.status(204).send();
        } else {
          res.status(500).json({ error: verified[1] });
        }
      } else {
        res.status(500).json({ error: "User is not logged with session" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * get user user auth Token
 */
routerAuth.get(
  "/authtoken",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user && session.user.login) {
        res
          .status(200)
          .json(req.app.get("AUTH").getUserBearer(session.user.login));
      } else {
        res.status(500).json({ error: "User is not logged with session" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Used by UI to show the user's login in the header
 */
routerAuth.get(
  "/userlogin",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user && session.user.login) {
        res.status(200).json({ login: session.user.login });
      } else {
        res.status(401).json({ error: "User is not logged with session" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Used by UI to get new user auth Token
 */
routerAuth.put(
  "/authtoken",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user && session.user.login) {
        const result = req.app.get("AUTH").changeBearer(session.user.login);
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

/**
 * Used by UI to display user's groups
 */
routerAuth.get(
  "/groups",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user && session.user.login) {
        let groups: string[] = [];
        groups = req.app.get("AUTH").getGroups(req);
        res.status(200).json(groups);
      } else {
        res
          .status(401)
          .json({ error: "User is not logged with session or not admin" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Used by UI to get the user's groups
 */
routerAuth.get(
  "/userGroups",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      if (session.user && session.user.login) {
        const user = req.app.get("AUTH").getInfoForUi(session.user.login);
        res.status(200).json({ groups: user.groups });
      } else {
        res.status(401).json({ error: "User is not logged with session" });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerAuth;

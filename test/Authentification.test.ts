/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { existsSync, rmSync, copyFileSync, readFileSync, unlinkSync } from "fs";
import { Authentification } from "../src/lib/Authentification";
import { LOGIN_FAILED, PASSWORD_OR_USER_UNDEFINED } from "../src/Constants";
import { Request } from "express";
import { ChangePasswordType, InfoIuType } from "../src/Global.types";
import { SessionExt } from "../src/ServerTypes";

import winston from "winston";
import Transport from "winston-transport";
const { combine, timestamp, json } = winston.format;
interface LastErrorTransportOptions {
  level?: string;
}

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

const userDatabase = `${__dirname}/data/userDatabase.json`;

describe("Authentification", () => {
  beforeEach(() => {
    // delete userdatabase
    if (existsSync(userDatabase)) rmSync(userDatabase);
    process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
  });
  test("constructor", () => {
    try {
      new Authentification(userDatabase);
      expect(existsSync(userDatabase));
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("loadUserFromDatabase no user, admin group must be defined", () => {
    try {
      const auth = new Authentification(userDatabase);
      const data = auth.loadUsersFromDatabase();
      expect(data.users[0]).not.toBeDefined();
      expect(data.groups.admin).toBeDefined();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("schema migration from PR#15 to now...", () => {
    // old scheme
    copyFileSync("./test/samples/users-before-PR#15.json", userDatabase);
    try {
      // user data is older than PR#15
      const oldData = JSON.parse(readFileSync(userDatabase, "utf-8"));
      const auth = new Authentification(userDatabase);
      const data = auth.loadUsersFromDatabase();
      const fileCopy = userDatabase.replace(
        /\.json$/,
        "Before-PR#15-backup.json"
      );
      expect(existsSync(fileCopy)).toBeTruthy();
      expect(data.users).toBeDefined();
      expect(data.users[0]).toBeDefined();
      expect(data.users[0].login).toEqual(oldData.login);
      expect(data.users[0].uuid).toEqual(oldData.uuid);
      expect(data.users[0].password).toEqual(oldData.password);
      expect(data.users[0].bearer).toEqual(oldData.bearer);
      // automatically added in admin group
      expect(data.groups.admin[0]).toEqual(oldData.uuid);
      //cleaning
      unlinkSync(fileCopy);
    } catch (error: unknown) {
      console.log(error);
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("generateBearerKey", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      const bearer = auth.generateBearerKey();
      expect(bearer).not.toEqual("");
    } catch (error: unknown) {
      console.log(error);
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("makeUser - init", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      const user = auth.makeUser("admin", "admin");
      expect(user.login).toEqual("admin");
      expect(user.password).not.toEqual("");
      expect(user.bearer).not.toEqual("");
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("makeUser - USER_ENCRYPT_SECRET env var is empty", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "";
      const auth = new Authentification(userDatabase);
      auth.makeUser("admin", "admin");
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });

  test("makeUser - USER_ENCRYPT_SECRET not defined", () => {
    try {
      const auth = new Authentification(userDatabase);
      auth.makeUser("admin", "admin");
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });

  test("make & store User - admin could not be deleted", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      let data = auth.loadUsersFromDatabase();
      expect(data.users[0]).not.toBeDefined();
      const user = auth.makeUser("admin", "admin");
      auth.addUser(user);
      auth.writeDB();
      //reload from disk
      data = auth.loadUsersFromDatabase();
      expect(data.users[0].login).toEqual("admin");
      expect(data.users[0].password).not.toEqual("");
      expect(data.users[0].bearer).not.toEqual("");

      // delete every users
      data.users.forEach((user) => auth.deleteUser(user.login));
      // unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
      expect((error as Error).toString()).toMatch(
        /Error: Admin user can't be deleted/i
      );
      const auth = new Authentification(userDatabase);
      const data = auth.loadUsersFromDatabase();
      expect(data.users[0].login).toEqual("admin");
    }
  });

  test("make & store multiple User", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      let data = auth.loadUsersFromDatabase();
      expect(data.users[0]).not.toBeDefined();
      const users = [
        auth.makeUser("admin", "admin"),
        auth.makeUser("user1", "user1"),
        auth.makeUser("user2", "user2"),
      ];

      users.forEach((user) => auth.addUser(user));

      //reload from disk
      data = auth.loadUsersFromDatabase();
      users.forEach((user, index) => {
        expect(data.users[index].login).toEqual(user.login);
        expect(data.users[index].password).not.toEqual("");
        expect(data.users[index].bearer).not.toEqual("");
      });
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("make & store multiple User - then delete one of them", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      let data = auth.loadUsersFromDatabase();
      // delete every users
      data.users.forEach((user) => auth.deleteUser(user.login));
      // reload
      data = auth.loadUsersFromDatabase();

      // check that there is no user
      expect(data.users.length).toEqual(0);

      const users = [
        auth.makeUser("admin", "admin"),
        auth.makeUser("user1", "user1"),
        auth.makeUser("user2", "user2"),
      ];

      // add the users
      users.forEach((user) => auth.addUser(user));

      // reload
      data = auth.loadUsersFromDatabase();

      expect(data.users.length).toEqual(3);

      // delete user1
      auth.deleteUser("user1");

      //reload from disk
      data = auth.loadUsersFromDatabase();

      const user = data.users.find((user) => user.login === "user1");

      expect(user).not.toBeDefined();
      expect(data.users.length).toEqual(2);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("make & store multiple User - user allready exists", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      let data = auth.loadUsersFromDatabase();
      // delete every users
      data.users.forEach((user) => auth.deleteUser(user.login));
      // reload
      data = auth.loadUsersFromDatabase();

      // check that there is no user
      expect(data.users.length).toEqual(0);

      const users = [
        auth.makeUser("admin", "admin"),
        auth.makeUser("user1", "user1"),
        auth.makeUser("user1", "user1"),
      ];

      // add the users
      users.forEach((user) => auth.addUser(user));
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).toBeDefined();
      expect((error as Error).toString()).toMatch(
        /Error: User.*already exist/i
      );
    }
  });

  test("make & store User - user malformed - login empty", () => {
    try {
      const auth = new Authentification(userDatabase);
      auth.addUser({ login: "", password: "xxxx", uuid: "xxx", bearer: "xxx" });
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });

  test("make & store User - user malformed - password empty", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser({ login: "xxxx", password: "", uuid: "xxx", bearer: "xxx" });
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });

  test("make & store User - user malformed - uuid empty", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser({ login: "xxxx", password: "xxx", uuid: "", bearer: "xxx" });
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });

  test("make & store User - user malformed - bearer empty", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser({ login: "xxxx", password: "xxx", uuid: "xxx", bearer: "" });
      //unexpected
      expect(true).toBeFalsy();
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });

  test("verifyPassword correct password", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const verify = auth.verifyPassword("admin", "admin");
      expect(verify[0]).toEqual(200);
      const user = verify[1] as InfoIuType;
      expect(user.login).toEqual("admin");
      expect(user.bearer).not.toEqual("");
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("verifyPassword wrong password", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const verify = auth.verifyPassword("admin", "adminxx");
      expect(verify[0]).toEqual(401);
      expect(verify[1]).toEqual(LOGIN_FAILED);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("verifyPassword no password", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const verify = auth.verifyPassword("admin", "");
      expect(verify[0]).toEqual(500);
      expect(verify[1]).toEqual(PASSWORD_OR_USER_UNDEFINED);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("verifyPassword invalid login", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const verify = auth.verifyPassword("adminxx", "admin");
      expect(verify[0]).toEqual(401);
      expect(verify[1]).toEqual(LOGIN_FAILED);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("verifyPassword no existing user in user database", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      // no user
      const verify = auth.verifyPassword("admin", "admin");
      expect(verify[0]).toEqual(500);
      expect(verify[1]).toEqual(PASSWORD_OR_USER_UNDEFINED);
    } catch (error: unknown) {
      // unexpected error
      expect(error).toBeDefined();
    }
  });

  test("isAuthSession - true", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      req.session = { user: { login: "admin" } } as SessionExt;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeTruthy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthSession - false wrong user", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      req.session = { user: { login: "adminx" } } as SessionExt;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthSession - user is empty", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      req.session = { user: { login: "" } } as SessionExt;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthSession - user login not set", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      req.session = { user: {} } as SessionExt;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthSession - user  not set", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      req.session = {} as SessionExt;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthSession - session  not set", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthSession - development mode", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      process.env.environment = "development";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {
        body: {},
        app: {
          get: (key: string) => {
            if (key === "LOGGER") return logger;
          },
        },
        session: {},
      } as Request;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeTruthy();
      const lastErrorWinston = (logger.transports[0] as LastErrorTransport)
        .lastError;
      expect(lastErrorWinston).toBeDefined();
      expect(lastErrorWinston?.message).toMatch(
        /WARNING: process.env.environment/
      );
    } catch (error: unknown) {
      console.log(error);
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthBearer - authorization provided is ok", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {
        headers: { authorization: `${auth.getUsersBearers()[0]}` },
      } as Request;
      const isAuth = auth.isAuthBearer(req);
      expect(isAuth).toBeTruthy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthBearer - authorization provided is false", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {
        headers: { authorization: `xxxx` },
      } as Request;
      const isAuth = auth.isAuthBearer(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthBearer - authorization header is not set", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {
        headers: {},
      } as Request;
      const isAuth = auth.isAuthBearer(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthBearer - header is not set", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {} as Request;
      const isAuth = auth.isAuthBearer(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("getUserBearer - User not found", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const authBearer = auth.getUserBearer("test");
      expect(authBearer).toEqual("");
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("getUserBearer - User found", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const authBearer = auth.getUserBearer("admin");
      expect(authBearer).not.toEqual("");
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changeBearer - User not found", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const authBearer = auth.changeBearer("test");
      expect(authBearer[0]).toEqual(500);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAdmin - session is needed - OK ", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      const user = auth.makeUser("admin", "admin");
      auth.addUser(user);
      auth.addGroupMember("admin", user.uuid);
      const req = { body: {} } as Request;
      req.session = {
        user: { login: user.login, bearer: user.bearer, uuid: user.uuid },
      } as SessionExt;
      const isAuth = auth.isAdmin(req);
      expect(isAuth).toBeTruthy();
    } catch (error: unknown) {
      console.log(error);
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAdmin - session is not set", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      const user = auth.makeUser("admin", "admin");
      auth.addUser(user);
      auth.addGroupMember("admin", user.uuid);
      const isAuth = auth.isAdmin();
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      console.log(error);
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthenticated - with session", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {
        body: {},
        app: {
          get: (key: string) => {
            if (key === "LOGGER") return logger;
          },
        },
        session: {},
      } as Request;
      req.session = { user: { login: "admin" } } as SessionExt;
      const isAuth = auth.isAuthenticated(req);
      expect(isAuth).toBeTruthy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthenticated - with authorization header", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const req = {
        headers: { authorization: `${auth.getUsersBearers()[0]}` },
      } as Request;
      const isAuth = auth.isAuthenticated(req);
      expect(isAuth).toBeTruthy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changePassword - all is OK", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));

      const changepassword: ChangePasswordType = {
        login: "admin",
        password: "admin",
        newPassword: "newpassword",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = auth.usersgroups.users[0].bearer;
      const verify = auth.changePassword(changepassword);

      expect(verify[0]).toEqual(200);
      expect(auth.usersgroups.users[0].login).toEqual("admin");
      expect(auth.usersgroups.users[0].bearer).toEqual(oldbearer);
      const verifyPassword = auth.verifyPassword(
        "admin",
        changepassword.newPassword
      );
      expect(verifyPassword[0]).toEqual(200);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changePassword - current password is wrong", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        login: "admin",
        password: "adminxxxx",
        newPassword: "newpassword",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = auth.usersgroups.users[0].bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(auth.usersgroups.users[0].login).toEqual("admin");
      expect(auth.usersgroups.users[0].bearer).toEqual(oldbearer);
      const verifyPassword = auth.verifyPassword("admin", "admin");
      expect(verifyPassword[0]).toEqual(200);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changePassword - current password is missing", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        login: "admin",
        password: "",
        newPassword: "newpassword",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = auth.usersgroups.users[0].bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(auth.usersgroups.users[0].login).toEqual("admin");
      expect(auth.usersgroups.users[0].bearer).toEqual(oldbearer);
      const verifyPassword = auth.verifyPassword("admin", "admin");
      expect(verifyPassword[0]).toEqual(200);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changePassword - new password is missing", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        login: "admin",
        password: "admin",
        newPassword: "",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = auth.usersgroups.users[0].bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(auth.usersgroups.users[0].login).toEqual("admin");
      expect(auth.usersgroups.users[0].bearer).toEqual(oldbearer);
      const verifyPassword = auth.verifyPassword("admin", "admin");
      expect(verifyPassword[0]).toEqual(200);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changePassword - new confirm password is missing", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        login: "admin",
        password: "admin",
        newPassword: "newpassword",
        newConfirmPassword: "",
      };
      const oldbearer = auth.usersgroups.users[0].bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(auth.usersgroups.users[0].login).toEqual("admin");
      expect(auth.usersgroups.users[0].bearer).toEqual(oldbearer);
      const verifyPassword = auth.verifyPassword("admin", "admin");
      expect(verifyPassword[0]).toEqual(200);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changePassword - new password && new confirm password are differents", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        login: "admin",
        password: "admin",
        newPassword: "newpassword",
        newConfirmPassword: "xxxxxx",
      };
      const oldbearer = auth.usersgroups.users[0].bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(auth.usersgroups.users[0].login).toEqual("admin");
      expect(auth.usersgroups.users[0].bearer).toEqual(oldbearer);
      const verifyPassword = auth.verifyPassword("admin", "admin");
      expect(verifyPassword[0]).toEqual(200);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("changeBearer - user beared", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.addUser(auth.makeUser("admin", "admin"));
      const oldbearer = auth.usersgroups.users[0].bearer;
      const oldpasswd = auth.usersgroups.users[0].password;
      const oldlogin = auth.usersgroups.users[0].login;
      const olduuid = auth.usersgroups.users[0].uuid;
      const verify = auth.changeBearer(auth.usersgroups.users[0].login);
      expect(verify[0]).toEqual(200);

      expect(auth.usersgroups.users[0].bearer).not.toEqual("");
      expect(auth.usersgroups.users[0].bearer).not.toEqual(oldbearer);
      //check no changes elsewhere
      expect(auth.usersgroups.users[0].password).toEqual(oldpasswd);
      expect(auth.usersgroups.users[0].login).toEqual(oldlogin);
      expect(auth.usersgroups.users[0].uuid).toEqual(olduuid);
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("Auth user authorization Flow", () => {
    process.env.USER_ENCRYPT_SECRET = "test";
    const auth = new Authentification(userDatabase);
    const bearer = auth.generateBearerKey();
    const encryptedBearer = Authentification.dataEncrypt(
      bearer,
      process.env.USER_ENCRYPT_SECRET
    );
    expect(bearer).toEqual(
      Authentification.dataDecrypt(
        encryptedBearer,
        process.env.USER_ENCRYPT_SECRET
      )
    );
  });

  test("dataEncrypt - encrypt data for database", () => {
    try {
      const value = Authentification.dataEncrypt(
        "test",
        process.env.DATABASE_ENCRYPT_SECRET
      );
      expect(value).toBeDefined();
      expect(value).not.toEqual("");
    } catch (error) {
      //unexpected
      expect(true).toBeFalsy();
    }
  });

  test("dataDecrypt - decrypt data from database", () => {
    try {
      const secret = "test";
      const encrypted = Authentification.dataEncrypt(
        secret,
        process.env.DATABASE_ENCRYPT_SECRET
      );
      const decrypted = Authentification.dataDecrypt(
        encrypted,
        process.env.DATABASE_ENCRYPT_SECRET
      );
      expect(decrypted).toBeDefined();
      expect(decrypted).toEqual(secret);
    } catch (error) {
      //unexpected
      expect(true).toBeFalsy();
    }
  });

  test("dataEncrypt - encrypt data for database - secret not defined", () => {
    try {
      process.env.DATABASE_ENCRYPT_SECRET = "";
      Authentification.dataEncrypt("test", process.env.DATABASE_ENCRYPT_SECRET);
      //unexpected
      expect(true).toBeFalsy();
    } catch (error) {
      expect(error).toBeDefined();
      if (error) expect(error.toString()).toMatch(/DATABASE_ENCRYPT_SECRET/);
    }
  });

  test("dataDecrypt - decrypt data from database - secret not defined", () => {
    try {
      process.env.DATABASE_ENCRYPT_SECRET = "";
      Authentification.dataDecrypt(
        "test",
        process.env.DATABASE_ENCRYPT_SECRET || ""
      );
      //unexpected
      expect(true).toBeFalsy();
    } catch (error) {
      expect(error).toBeDefined();
      if (error) expect(error.toString()).toMatch(/DATABASE_ENCRYPT_SECRET/);
    }
  });
});

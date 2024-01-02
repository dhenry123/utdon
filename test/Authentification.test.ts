/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { existsSync, rmSync } from "fs";
import { Authentification } from "../src/lib/Authentification";
import { LOGIN_FAILED, PASSWORD_OR_USER_UNDEFINED } from "../src/Constants";
import { Request } from "express";
import { ChangePasswordType, InfoIuType } from "../src/Global.types";
import { SessionExt } from "../src/ServerTypes";
const userDatabase = `${__dirname}/data/userDatabase.json`;

describe("Authentification", () => {
  beforeAll(() => {
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

  test("loadUserFromDatabase no user", () => {
    try {
      const auth = new Authentification(userDatabase);
      const data = auth.loadUserFromDatabase();
      expect(data.login).not.toBeDefined();
    } catch (error: unknown) {
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

  test("make & store User", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      let data = auth.loadUserFromDatabase();
      expect(data.login).not.toBeDefined();
      const user = auth.makeUser("admin", "admin");
      auth.store(user);
      //reload from disk
      data = auth.loadUserFromDatabase();
      expect(data.login).toEqual("admin");
      expect(data.password).not.toEqual("");
      expect(data.bearer).not.toEqual("");
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("make & store User - user malformed - login empty", () => {
    try {
      const auth = new Authentification(userDatabase);
      auth.store({ login: "", password: "xxxx", uuid: "xxx", bearer: "xxx" });
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
      auth.store({ login: "xxxx", password: "", uuid: "xxx", bearer: "xxx" });
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
      auth.store({ login: "xxxx", password: "xxx", uuid: "", bearer: "xxx" });
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
      auth.store({ login: "xxxx", password: "xxx", uuid: "xxx", bearer: "" });
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
      const isAuth = auth.isAuthSession(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthBearer - authorization provided is ok", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.store(auth.makeUser("admin", "admin"));
      const req = {
        headers: { authorization: `${auth.getUserBearer()}` },
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
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
      auth.store(auth.makeUser("admin", "admin"));
      const req = {} as Request;
      const isAuth = auth.isAuthBearer(req);
      expect(isAuth).toBeFalsy();
    } catch (error: unknown) {
      // unexpected error
      expect(error).not.toBeDefined();
    }
  });

  test("isAuthenticated - with session", () => {
    try {
      process.env.USER_ENCRYPT_SECRET = "test";
      const auth = new Authentification(userDatabase);
      auth.store(auth.makeUser("admin", "admin"));
      const req = { body: {} } as Request;
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
      auth.store(auth.makeUser("admin", "admin"));
      const req = {
        headers: { authorization: `${auth.getUserBearer()}` },
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
      const user = auth.store(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        password: "admin",
        newPassword: "newpassword",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = user.bearer;
      const verify = auth.changePassword(changepassword);

      expect(verify[0]).toEqual(200);
      expect(user.login).toEqual("admin");
      expect(user.bearer).toEqual(oldbearer);
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
      const user = auth.store(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        password: "adminxxxx",
        newPassword: "newpassword",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = user.bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(user.login).toEqual("admin");
      expect(user.bearer).toEqual(oldbearer);
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
      const user = auth.store(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        password: "",
        newPassword: "newpassword",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = user.bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(user.login).toEqual("admin");
      expect(user.bearer).toEqual(oldbearer);
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
      const user = auth.store(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        password: "admin",
        newPassword: "",
        newConfirmPassword: "newpassword",
      };
      const oldbearer = user.bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(user.login).toEqual("admin");
      expect(user.bearer).toEqual(oldbearer);
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
      const user = auth.store(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        password: "admin",
        newPassword: "newpassword",
        newConfirmPassword: "",
      };
      const oldbearer = user.bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(user.login).toEqual("admin");
      expect(user.bearer).toEqual(oldbearer);
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
      const user = auth.store(auth.makeUser("admin", "admin"));
      const changepassword: ChangePasswordType = {
        password: "admin",
        newPassword: "newpassword",
        newConfirmPassword: "xxxxxx",
      };
      const oldbearer = user.bearer;
      const verify = auth.changePassword(changepassword);
      expect(verify[0]).toEqual(500);
      expect(user.login).toEqual("admin");
      expect(user.bearer).toEqual(oldbearer);
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
      let user = auth.store(auth.makeUser("admin", "admin"));
      const oldbearer = user.bearer;
      const oldpasswd = user.password;
      const oldlogin = user.login;
      const olduuid = user.uuid;
      const verify = auth.changeBearer();
      expect(verify[0]).toEqual(200);
      //reload user
      user = auth.user;
      expect(user.bearer).not.toEqual("");
      expect(user.bearer).not.toEqual(oldbearer);
      //check no changes elsewhere
      expect(user.password).toEqual(oldpasswd);
      expect(user.login).toEqual(oldlogin);
      expect(user.uuid).toEqual(olduuid);
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

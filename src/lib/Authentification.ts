/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { ChangePasswordType, InfoIuType, UserType } from "../Global.types";
import crypto from "crypto";

import {
  BEARERDEF,
  CIPHERALGORITHM,
  CIPHERSHAALGORITHM,
  LOGIN_FAILED,
  PASSWORD_OR_USER_UNDEFINED,
} from "../Constants";
import { Request } from "express";
import { SessionExt } from "../ServerTypes";

const userDatabaseDefault = `${__dirname}/../../data/user.json`;

export class Authentification {
  user: UserType;
  database: string;

  constructor(databasePath: string) {
    // needed for tests
    this.database = userDatabaseDefault;
    if (databasePath) this.database = databasePath;
    if (!existsSync(this.database)) this.initDatabase();
    this.user = this.loadUserFromDatabase();
  }

  loadUserFromDatabase = (): UserType => {
    return JSON.parse(readFileSync(this.database, "utf-8"));
  };

  encryptPassword = (clearPassword: string): string => {
    if (process.env.USER_ENCRYPT_SECRET) {
      return crypto
        .pbkdf2Sync(
          clearPassword,
          process.env.USER_ENCRYPT_SECRET,
          1000,
          64,
          "sha512"
        )
        .toString("hex");
    } else {
      throw new Error(
        "You have to set USER_ENCRYPT_SECRET environment variable before using encrypt"
      );
    }
  };

  generateBearerKey = (length = 16) => {
    const randomBytes = crypto.randomBytes(length);
    const bearerKey = randomBytes.toString("hex");
    return bearerKey;
  };

  makeUser = (login: string, clearPassword: string): UserType => {
    return {
      login: login,
      uuid: crypto.randomBytes(16).toString("hex"),
      password: this.encryptPassword(clearPassword),
      //Reverse needed
      bearer: Authentification.dataEncrypt(
        this.generateBearerKey(),
        process.env.USER_ENCRYPT_SECRET
      ),
    };
  };

  store = (user: UserType): UserType => {
    if (user && user.login && user.password && user.uuid && user.bearer) {
      this.initDatabase(user);
      //reset user
      this.user = user;
      return this.user;
    } else {
      throw new Error("User is not well defined");
    }
  };

  initDatabase = (user?: UserType) => {
    let finalUser: UserType | object;
    if (!user) {
      finalUser = {};
    } else {
      finalUser = user;
    }
    writeFileSync(this.database, JSON.stringify(finalUser), {
      encoding: "utf-8",
      mode: 0o600,
    });
  };

  verifyPassword = (
    login: string,
    clearPassword: string
  ): [number, string | InfoIuType] => {
    if (
      this.user &&
      this.user.login &&
      this.user.password &&
      clearPassword &&
      process.env.USER_ENCRYPT_SECRET
    ) {
      if (login !== this.user.login) return [401, LOGIN_FAILED];
      const newHash = crypto
        .pbkdf2Sync(
          clearPassword,
          process.env.USER_ENCRYPT_SECRET,
          1000,
          64,
          "sha512"
        )
        .toString("hex");

      if (this.user.password === newHash) {
        return [200, this.getInfoForUi()];
      } else {
        return [401, LOGIN_FAILED];
      }
    } else {
      return [500, PASSWORD_OR_USER_UNDEFINED];
    }
  };

  getUserLogin = (): string => {
    return this.user.login;
  };

  getUserBearer = (): string => {
    return Authentification.dataDecrypt(
      this.user.bearer,
      process.env.USER_ENCRYPT_SECRET || ""
    );
  };

  getInfoForUi(): InfoIuType {
    return { login: this.getUserLogin(), bearer: this.getUserBearer() };
  }

  isAuthenticated = (req: Request) => {
    return this.isAuthBearer(req) || this.isAuthSession(req);
  };

  isAuthSession = (req: Request) => {
    const session = req.session as SessionExt;
    if (
      session &&
      session.user &&
      session.user.login &&
      this.getUserLogin() === session.user.login
    ) {
      return true;
    }
    return false;
  };

  isAuthBearer = (req: Request) => {
    if (req.headers) {
      const authorizationHeader = req.headers["authorization"];
      const AuthKey = `${BEARERDEF}`;
      if (
        authorizationHeader &&
        authorizationHeader.match(new RegExp(AuthKey))
      ) {
        const token = authorizationHeader.replace(new RegExp(AuthKey), "");
        return token === this.getUserBearer();
      }
    }
    return false;
  };

  changeBearer = () => {
    try {
      const user: UserType = {
        ...this.user,
        bearer: Authentification.dataEncrypt(
          this.generateBearerKey(),
          process.env.USER_ENCRYPT_SECRET
        ),
      };
      this.user = { ...user };
      writeFileSync(this.database, JSON.stringify(user), {
        encoding: "utf-8",
        mode: 0o600,
      });
      return [200, "User password has been set"];
    } catch (error) {
      return [500, error]; //hard to test
    }
  };

  /**
   * user must provide current password and new && confirm password
   * @param changepassword
   * @returns
   */
  changePassword = (changepassword: ChangePasswordType) => {
    if (
      changepassword.password &&
      changepassword.newPassword &&
      changepassword.newConfirmPassword
    ) {
      if (this.verifyPassword("admin", changepassword.password)[0] === 200) {
        if (changepassword.newPassword === changepassword.newConfirmPassword) {
          const user: UserType = {
            ...this.user,
            password: this.encryptPassword(changepassword.newPassword),
          };
          this.user = { ...user };
          writeFileSync(this.database, JSON.stringify(user), {
            encoding: "utf-8",
            mode: 0o600,
          });
          return [200, "User password has been set"];
        } else {
          return [500, "The new password and its confirmation do not match"];
        }
      } else {
        return [500, "Your current password does not match"];
      }
    }
    return [500, "Invalid number of arguments"];
  };

  /**
   * encrypt data
   * source : https://codeforgeek.com/encrypt-and-decrypt-data-in-node-js/
   * @param phrase string
   *
   */
  static dataEncrypt(phrase: string, encryptKey?: string) {
    if (!encryptKey)
      throw new Error(
        "DATABASE_ENCRYPT_SECRET and USER_ENCRYPT_SECRET environment variable must be set"
      );
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto
      .createHash(CIPHERSHAALGORITHM)
      .update(encryptKey)
      .digest();
    iv.copy(resizedIV);
    const key = crypto
        .createHash(CIPHERSHAALGORITHM)
        .update(encryptKey)
        .digest(),
      cipher = crypto.createCipheriv(CIPHERALGORITHM, key, resizedIV),
      msge: Array<unknown> = [];
    msge.push(cipher.update(phrase, "binary", "hex"));
    msge.push(cipher.final("hex"));
    return msge.join("");
  }

  /**
   * decrypt data object
   * source : https://codeforgeek.com/encrypt-and-decrypt-data-in-node-js/
   * @param phrase string
   */
  static dataDecrypt(phrase: string, encryptKey?: string) {
    if (!encryptKey)
      throw new Error(
        "DATABASE_ENCRYPT_SECRET and USER_ENCRYPT_SECRET environment variable must be set"
      );
    if (!phrase) return "";
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto
      .createHash(CIPHERSHAALGORITHM)
      .update(encryptKey)
      .digest();
    iv.copy(resizedIV);
    const key = crypto
        .createHash(CIPHERSHAALGORITHM)
        .update(encryptKey)
        .digest(),
      decipher = crypto.createDecipheriv(CIPHERALGORITHM, key, resizedIV),
      msg: Array<unknown> = [];
    msg.push(decipher.update(phrase, "hex", "binary"));
    return msg.join("");
  }
}

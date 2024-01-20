/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { readFileSync, existsSync, writeFileSync, copyFileSync } from "fs";
import {
  ChangePasswordType,
  InfoIuType,
  UsersType,
  UserType,
} from "../Global.types";
import crypto from "crypto";

import {
  CIPHERALGORITHM,
  CIPHERSHAALGORITHM,
  LOGIN_FAILED,
  PASSWORD_OR_USER_UNDEFINED,
} from "../Constants";
import { Request } from "express";
import { SessionExt } from "../ServerTypes";

const userDatabaseDefault = `${__dirname}/../../data/user.json`;

export class Authentification {
  users: UsersType;
  database: string;

  constructor(databasePath: string) {
    // needed for tests
    this.database = userDatabaseDefault;
    if (databasePath) this.database = databasePath;
    if (!existsSync(this.database)) this.initDatabase();
    this.users = this.loadUsersFromDatabase();
  }

  loadUsersFromDatabase = (): UsersType => {
    // PR#15 : Modification of the user database schema: multi-administrators
    let data = JSON.parse(readFileSync(this.database, "utf-8"));
    if (!data.users) {
      copyFileSync(
        this.database,
        this.database.replace(/\.json$/, "Before-PR#15-backup.json")
      );
      // save
      this.initDatabase(data);
      data = this.loadUsersFromDatabase();
      console.log(
        "[INFO] PR#15: The user database has been converted into a multi-administrator database."
      );
    }
    return data;
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

  // test function
  store = (user: UserType): UsersType => {
    if (user && user.login && user.password && user.uuid && user.bearer) {
      this.initDatabase(user);
      //reset user ???
      this.users = { users: [user] };
      return this.users;
    } else {
      throw new Error("User is not well defined");
    }
  };

  initDatabase = (user?: UserType) => {
    const users = { users: [] } as UsersType;
    if (user) {
      users.users.push(user);
    }

    writeFileSync(this.database, JSON.stringify(users), {
      encoding: "utf-8",
      mode: 0o600,
    });
  };

  verifyPassword = (
    login: string,
    clearPassword: string
  ): [number, string | InfoIuType] => {
    if (this.users && clearPassword && process.env.USER_ENCRYPT_SECRET) {
      // find user in database
      const currentUser = this.users.users.find((user) => user.login === login);
      if (!currentUser) return [401, LOGIN_FAILED];
      const newHash = crypto
        .pbkdf2Sync(
          clearPassword,
          process.env.USER_ENCRYPT_SECRET,
          1000,
          64,
          "sha512"
        )
        .toString("hex");

      if (currentUser.password === newHash) {
        return [200, this.getInfoForUi(login)];
      } else {
        return [401, LOGIN_FAILED];
      }
    } else {
      return [500, PASSWORD_OR_USER_UNDEFINED];
    }
  };

  /*
   * return all users logins
   * @returns string[]
   */
  getUsersLogins = (): string[] => {
    return this.users.users.map((user) => user.login);
  };

  /*
   * add a user to the database
   * @param user UserType
   * @returns void
   */
  addUser = (user: UserType) => {
    // check if user already exists
    if (this.users.users.find((u) => u.login === user.login))
      throw new Error("User already exists");
    this.users.users.push(user);
    writeFileSync(this.database, JSON.stringify(this.users), {
      encoding: "utf-8",
      mode: 0o600,
    });
  };

  /*
   * delete a user from the database
   * @param user string
   * @returns void
   */
  deleteUser = (user: string) => {
    const uid = this.users.users.findIndex((u) => u.login === user);
    if (uid !== -1) {
      this.users.users.splice(uid, 1);
      writeFileSync(this.database, JSON.stringify(this.users), {
        encoding: "utf-8",
        mode: 0o600,
      });
    }
  };

  /*
   * return the user's bearer, decrypted, to check if a bearer is valid
   * @returns string
   */
  getUserBearer = (user: string): string => {
    // return this.users.users.fil .map((user) => Authentification.dataDecrypt(user.bearer, process.env.USER_ENCRYPT_SECRET || ""));
    const uid = this.users.users.findIndex((u) => u.login === user);
    if (uid === -1) return "";
    return Authentification.dataDecrypt(
      this.users.users[uid].bearer,
      process.env.USER_ENCRYPT_SECRET || ""
    );
  };

  /*
   * gives all users bearers, decrypted, to check if a bearer is valid
   * @returns string[]
   * */
  getUsersBearers = (): string[] => {
    return this.users.users.map((user) =>
      Authentification.dataDecrypt(
        user.bearer,
        process.env.USER_ENCRYPT_SECRET || ""
      )
    );
  };

  getInfoForUi(login: string): InfoIuType {
    const user = this.users.users.find((user) => user.login === login);
    if (!user) return { login: "", bearer: "" };
    return { login: user.login, bearer: user.bearer };
  }

  isAuthenticated = (req: Request) => {
    return this.isAuthBearer(req) || this.isAuthSession(req);
  };

  isAuthSession = (req: Request) => {
    const session = req.session as SessionExt;
    return (
      session &&
      session.user &&
      session.user.login &&
      !!this.getUsersLogins().find((login) => login === session.user.login)
    );
  };

  isAuthBearer = (req: Request) => {
    if (req.headers) {
      const bearers = this.getUsersBearers();
      const bearer = bearers.find(
        (bearer) => bearer === req.headers["authorization"]
      );
      return !!bearer;
    }
    return false;
  };

  changeBearer = (user: string) => {
    try {
      const uid = this.users.users.findIndex((u) => u.login === user);
      if (uid !== -1) {
        this.users.users[uid].bearer = this.generateBearerKey();
        writeFileSync(this.database, JSON.stringify(user), {
          encoding: "utf-8",
          mode: 0o600,
        });
        return [200, "User bearer has been changed"];
      } else {
        return [500, "User not found"];
      }
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
    // check if all parameters are provided
    if (
      changepassword.login &&
      changepassword.password &&
      changepassword.newPassword &&
      changepassword.newConfirmPassword
    ) {
      // check if current password is correct
      if (
        this.verifyPassword(
          changepassword.login,
          changepassword.password
        )[0] === 200
      ) {
        // if new password and its confirmation match
        if (changepassword.newPassword === changepassword.newConfirmPassword) {
          // if so, find the uid of the user we want to change the password
          // console.log(changepassword.login);
          const uid = this.users.users.findIndex(
            (u) => u.login === changepassword.login
          );

          if (uid === -1) return [500, "User not found"];

          this.users.users[uid].password = this.encryptPassword(
            changepassword.newPassword
          );
          writeFileSync(this.database, JSON.stringify(this.users), {
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

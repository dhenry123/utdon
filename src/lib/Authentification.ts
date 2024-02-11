/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { readFileSync, existsSync, writeFileSync, copyFileSync } from "fs";
import {
  ChangePasswordType,
  InfoIuType,
  UsersGroupsType,
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
  usersgroups: UsersGroupsType;
  database: string;

  constructor(databasePath: string) {
    // needed for tests
    this.database = userDatabaseDefault;
    if (databasePath) this.database = databasePath;
    if (!existsSync(this.database)) this.initDatabaseUsers();
    this.usersgroups = this.loadUsersFromDatabase();
  }

  loadUsersFromDatabase = (): UsersGroupsType => {
    // PR#15 : Modification of the user database schema: multi-administrators
    let data = JSON.parse(readFileSync(this.database, "utf-8"));
    const targetBackup = this.database.replace(
      /\.json$/,
      "Before-PR#15-backup.json"
    );
    // Before-PR#15
    if (data && !data.users) {
      copyFileSync(this.database, targetBackup);
      // save
      this.initDatabaseUsers(data);
      data = { users: [{ ...data }] };
      // data = this.loadUsersFromDatabase();
      console.log(
        "[INFO] PR#15: The user database has been converted into a multi-administrator database."
      );
      //security
      this.writeDB(JSON.stringify(data));
    }
    // Final model
    if (data.users && !data.groups) {
      data.groups = { admin: [] };
      for (const item of data.users) {
        const user = { ...item } as UserType;
        data.groups.admin.push(user.uuid);
      }
      //security
      this.writeDB(JSON.stringify(data));
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

  // // test function
  // store = (user: UserType): UsersType => {
  //   if (user && user.login && user.password && user.uuid && user.bearer) {
  //     this.initDatabaseUsers( {users:[user],groups:{admin:[user.uuid]}});
  //     //reset user ???
  //     this.usersgroups.users = { users: [user] };
  //     return this.users;
  //   } else {
  //     throw new Error("User is not well defined");
  //   }
  // };

  initDatabaseUsers = (usersGroups?: UsersGroupsType) => {
    let usersGroupsToWrite = {
      users: [],
      groups: { admin: [] },
    } as UsersGroupsType;
    if (usersGroups) {
      usersGroupsToWrite = usersGroups;
    }
    this.writeDB(JSON.stringify(usersGroupsToWrite));
  };

  verifyPassword = (
    login: string,
    clearPassword: string
  ): [number, string | InfoIuType] => {
    if (
      this.usersgroups.users &&
      clearPassword &&
      process.env.USER_ENCRYPT_SECRET
    ) {
      // find user in database
      const currentUser = this.usersgroups.users.find(
        (user) => user.login === login
      );
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
    return this.usersgroups.users.map((user) => user.login);
  };

  /*
   * add a user to the database
   * @param user UserType
   * @returns void
   */
  addUser = (user: UserType) => {
    // check if user already exists
    if (this.usersgroups.users.find((u) => u.login === user.login))
      throw new Error("User already exists");
    this.usersgroups.users.push(user);
    this.writeDB();
  };

  /*
   * delete a user from the database
   * @param user string
   * @returns void
   */
  deleteUser = (user: string) => {
    // admin user could not be deleted
    if (user === "admin") throw new Error("Admin user can't be deleted");
    const uid = this.usersgroups.users.findIndex((u) => u.login === user);
    if (uid !== -1) {
      this.usersgroups.users.splice(uid, 1);
      this.writeDB();
    }
  };

  /*
   * return the user's bearer, decrypted, to check if a bearer is valid
   * @returns string
   */
  getUserBearer = (user: string): string => {
    // return this.users.users.fil .map((user) => Authentification.dataDecrypt(user.bearer, process.env.USER_ENCRYPT_SECRET || ""));
    const uid = this.usersgroups.users.findIndex((u) => u.login === user);
    if (uid === -1) return "";
    return Authentification.dataDecrypt(
      this.usersgroups.users[uid].bearer,
      process.env.USER_ENCRYPT_SECRET || ""
    );
  };

  /*
   * gives all users bearers, decrypted, to check if a bearer is valid
   * @returns string[]
   * */
  getUsersBearers = (): string[] => {
    return this.usersgroups.users.map((user) =>
      Authentification.dataDecrypt(
        user.bearer,
        process.env.USER_ENCRYPT_SECRET || ""
      )
    );
  };

  getInfoForUi(login: string): InfoIuType {
    const user = this.usersgroups.users.find((user) => user.login === login);
    if (!user) return { login: "", bearer: "", uuid: "" };
    return { login: user.login, bearer: user.bearer, uuid: user.uuid };
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
      const uid = this.usersgroups.users.findIndex((u) => u.login === user);
      if (uid !== -1) {
        this.usersgroups.users[uid].bearer = this.generateBearerKey();
        this.writeDB();
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
          const uid = this.usersgroups.users.findIndex(
            (u) => u.login === changepassword.login
          );

          if (uid === -1) return [500, "User not found"];

          this.usersgroups.users[uid].password = this.encryptPassword(
            changepassword.newPassword
          );
          this.writeDB();
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

  writeDB = (usersGroups?: string) => {
    writeFileSync(
      this.database,
      usersGroups ? usersGroups : JSON.stringify(this.usersgroups),
      {
        encoding: "utf-8",
        mode: 0o600,
      }
    );
  };

  /**
   * is user member of group ?
   * @param group
   * @param userUuid
   * @returns
   */
  isMemberOfGroup = (group: string, userUuid: string): boolean => {
    //is user exists
    if (!this.usersgroups.users.find((u) => u.uuid === userUuid)) return false;

    if (!this.usersgroups.groups[group]) return false;

    return this.usersgroups.groups[group].includes(userUuid);
  };

  /**
   * simplicity : if non-existent group, creating group and add user inside
   * addGroupMember could be restricted by controllers
   * @param group
   * @param userUuid
   * @returns
   */
  addGroupMember = (group: string, userUuid: string): boolean => {
    // user is not set
    if (!userUuid) return false;
    // is user exists ?
    if (!this.usersgroups.users.find((u) => u.uuid === userUuid)) return false;
    // non-existent group, creating group
    if (!this.usersgroups.groups[group]) this.usersgroups.groups[group] = [];
    // add user to group if not already present
    if (!this.usersgroups.groups[group].includes(userUuid)) {
      this.usersgroups.groups[group].push(userUuid);
      this.writeDB();
    }
    return true;
  };

  /**
   * Only available when session is set, non accesible via API
   * @param req
   * @returns
   */
  isAdmin = (req?: Request) => {
    //is user exists in db
    if (req) {
      const session = req.session as SessionExt;
      if (
        session &&
        session.user &&
        session.user.uuid &&
        this.isMemberOfGroup("admin", session.user.uuid)
      )
        return true;
    }
    return false;
  };
}

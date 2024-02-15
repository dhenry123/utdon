/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { readFileSync, existsSync, writeFileSync, copyFileSync } from "fs";
import {
  ChangePasswordType,
  GroupsType,
  InfoIuType,
  UserDescriptionType,
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

  getUserMemberGroupsName = (userUuid: string): string[] => {
    const groups: string[] = [];
    Object.getOwnPropertyNames(this.usersgroups.groups).forEach((groupName) => {
      if (this.usersgroups.groups[groupName].includes(userUuid))
        groups.push(groupName);
    });
    return groups;
  };

  /*
   * return all users logins - must be used on by admin
   * @returns string[]
   */
  getUsersForUi = (isAdmin: boolean): UserDescriptionType[] => {
    const usersDescription: UserDescriptionType[] = [];
    if (isAdmin) {
      for (const user of this.usersgroups.users) {
        usersDescription.push({
          login: user.login,
          groups: this.getUserMemberGroupsName(user.uuid),
          uuid: user.uuid,
        });
      }
    }
    return usersDescription;
  };

  getUsers = (): UserType[] => {
    return this.usersgroups.users;
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
  deleteUser = (userUuid: string) => {
    // admin user could not be deleted
    if (userUuid === "admin") throw new Error("Admin user can't be deleted");
    const uid = this.usersgroups.users.findIndex((u) => u.uuid === userUuid);
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
    if (!user) return { login: "", bearer: "", uuid: "", groups: [] };
    return {
      login: user.login,
      bearer: user.bearer,
      uuid: user.uuid,
      groups: this.getUserMemberGroupsName(user.uuid),
    };
  }

  isAuthenticated = (req: Request) => {
    return this.isAuthBearer(req) || this.isAuthSession(req);
  };

  /**
   * is user set in session ?
   * @param req
   * @returns
   */
  isAuthSession = (req: Request) => {
    const session = req.session as SessionExt;
    //By pass auth in development mode
    if (process.env.environment === "development") {
      req.app
        .get("LOGGER")
        .error(
          'WARNING: process.env.environment === "development" Auth bypassed'
        );
      if (!session || !session.user) {
        const adminUser = this.usersgroups.users.find(
          (item) => item.login === "admin"
        );
        if (adminUser) session.user = this.getInfoForUi(adminUser.login);
      }
      return true;
    } else {
      return (
        session &&
        session.user &&
        session.user.login &&
        !!this.getUsers().find((item) => item.login === session.user.login)
      );
    }
  };

  /**
   * user connect with token
   * if token found, load user in session
   * @param req
   * @returns
   */
  isAuthBearer = (req: Request) => {
    if (req.headers && req.headers["authorization"]) {
      const bearers = this.getUsersBearers();
      const bearer = bearers.find(
        (bearer) => bearer === req.headers["authorization"]
      );
      if (bearer) {
        const session = req.session as SessionExt;
        for (const user of this.usersgroups.users) {
          const bearer = Authentification.dataDecrypt(
            user.bearer,
            process.env.USER_ENCRYPT_SECRET || ""
          );
          if (bearer === req.headers["authorization"]) {
            // as there is no cookie, the session is completed programmatically.
            session.user = {
              login: user.login,
              bearer: user.bearer,
              uuid: user.uuid,
              groups: this.getUserGroups(user.uuid),
            };

            break;
          }
        }
        if (session && session.user && session.user.uuid) return true;
      }
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
  changePassword = (changepassword: ChangePasswordType, userLogin: string) => {
    // check if all parameters are provided
    if (
      userLogin &&
      changepassword.password &&
      changepassword.newPassword &&
      changepassword.newConfirmPassword
    ) {
      // check if current password is correct
      if (this.verifyPassword(userLogin, changepassword.password)[0] === 200) {
        // if new password and its confirmation match
        if (changepassword.newPassword === changepassword.newConfirmPassword) {
          // if so, find the uid of the user we want to change the password
          // console.log(changepassword.login);
          const uid = this.usersgroups.users.findIndex(
            (u) => u.login === userLogin
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
   * autocleaning groups without users
   */
  cleanGroups = () => {
    const newGroups: GroupsType = {};
    Object.getOwnPropertyNames(this.usersgroups.groups).forEach((group) => {
      // keep only groups with member(s)
      if (this.usersgroups.groups[group].length > 0)
        newGroups[group] = this.usersgroups.groups[group];
    });
    this.usersgroups.groups = newGroups;
    this.writeDB();
  };

  removeUserFromGroups = (userUuid: string) => {
    const newUsersGroups = { ...this.usersgroups.groups };
    const dbGroups = Object.getOwnPropertyNames(this.usersgroups.groups);
    for (const group of dbGroups) {
      const newSet = this.usersgroups.groups[group].filter(
        (item) => item !== userUuid
      );
      newUsersGroups[group] = newSet;
    }
    this.usersgroups.groups = newUsersGroups;
    this.writeDB();
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

  /**
   * return groups list
   * @returns
   */
  getGroups = (req: Request): string[] => {
    const session = req.session as SessionExt;
    if (req.app.get("AUTH").isAdmin(req)) {
      return Object.getOwnPropertyNames(this.usersgroups.groups);
    } else {
      return this.getUserGroups(session.user.uuid);
    }
  };

  /**
   * get user groups
   * @param userUuid
   * @returns
   */
  getUserGroups = (userUuid: string): string[] => {
    const groups: string[] = [];
    if (userUuid) {
      const dbGroups = Object.getOwnPropertyNames(this.usersgroups.groups);
      for (const group of dbGroups) {
        if (this.usersgroups.groups[group].includes(userUuid))
          groups.push(group);
      }
    }
    return groups;
  };

  /**
   * object has a groups attribut (string[]) which are name of groups
   * authorized to manipulate it
   * @param req
   * @param objectGroups
   * @returns
   */
  isAllowedForObject = (req: Request, objectGroups: string[]) => {
    // user is admin
    if (req.app.get("AUTH").isAdmin(req)) {
      return true;
    } else {
      //check groups
      const session = req.session as SessionExt;
      const groupsAuthorized = req.app
        .get("AUTH")
        .getUserGroups(session.user.uuid);
      if (groupsAuthorized.length > 0) {
        return groupsAuthorized.some(
          (v: string) => objectGroups.indexOf(v) !== -1
        );
      } else {
        return false;
      }
    }
  };
}

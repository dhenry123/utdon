import { existsSync, rmSync } from "fs";
import { Authentification } from "../src/lib/Authentification";
import { SessionExt } from "../src/ServerTypes";
import { Request } from "express";

const userDatabase = `${__dirname}/data/userDatabase.json`;

describe("Groups", () => {
  beforeEach(() => {
    // delete userdatabase
    if (existsSync(userDatabase)) rmSync(userDatabase);
    process.env.DATABASE_ENCRYPT_SECRET = "mysecret";
    process.env.USER_ENCRYPT_SECRET = "test";
  });

  test("Add user to Group - admin", () => {
    const auth = new Authentification(userDatabase);
    const user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    expect(auth.addGroupMember("admin", user.uuid)).toBeTruthy();
    expect(auth.usersgroups.groups.admin.includes(user.uuid)).toBeTruthy();
  });

  test("Add user to non-existent group", () => {
    const auth = new Authentification(userDatabase);
    const user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    expect(auth.addGroupMember("test", user.uuid)).toBeTruthy();
    expect(auth.usersgroups.groups.test.includes(user.uuid)).toBeTruthy();
  });

  test("Add empty user to admin group", () => {
    const auth = new Authentification(userDatabase);
    const user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    expect(auth.addGroupMember("admin", "")).toBeFalsy();
    expect(auth.usersgroups.groups.admin.includes(user.uuid)).toBeFalsy();
  });

  test("isMemberOfGroup - admin", () => {
    const auth = new Authentification(userDatabase);
    const user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    expect(auth.addGroupMember("admin", user.uuid)).toBeTruthy();
    expect(auth.isMemberOfGroup("admin", user.uuid)).toBeTruthy();
  });

  test("isMemberOfGroup - group doesn't exist", () => {
    const auth = new Authentification(userDatabase);
    const user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    auth.addGroupMember("admin", user.uuid);
    expect(auth.addGroupMember("admin", user.uuid)).toBeTruthy();
    expect(auth.isMemberOfGroup("test", user.uuid)).toBeFalsy();
  });

  test("isMemberOfGroup - user is not admin", () => {
    const auth = new Authentification(userDatabase);
    let user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    expect(auth.addGroupMember("admin", user.uuid)).toBeTruthy();
    user = auth.makeUser("test", "test");
    auth.addUser(user);
    expect(auth.addGroupMember("test", user.uuid)).toBeTruthy();
    expect(auth.isMemberOfGroup("admin", user.uuid)).toBeFalsy();
  });

  test("getGroups - with groups set and admin user", () => {
    const auth = new Authentification(userDatabase);
    const adminuser = auth.makeUser("admin", "admin");
    auth.addUser(adminuser);
    auth.addGroupMember("admin", adminuser.uuid);
    const user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.isMemberOfGroup("admin", user.uuid);
    const req = {
      body: {},
      app: {
        get: (key: string) => {
          if (key === "AUTH") return auth;
        },
      },
    } as Request;
    req.session = {
      user: {
        login: adminuser.login,
        bearer: adminuser.bearer,
        uuid: adminuser.uuid,
      },
    } as SessionExt;
    const groups = auth.getGroups(req);
    expect(groups.length).toEqual(2);
    expect(groups.includes("admin")).toBeTruthy();
    expect(groups.includes("test")).toBeTruthy();
  });

  test("getGroups - with groups set and normal user", () => {
    const auth = new Authentification(userDatabase);
    const adminuser = auth.makeUser("admin", "admin");
    auth.addUser(adminuser);
    auth.addGroupMember("admin", adminuser.uuid);
    const user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.isMemberOfGroup("admin", user.uuid);
    const req = {
      body: {},
      app: {
        get: (key: string) => {
          if (key === "AUTH") return auth;
        },
      },
    } as Request;
    req.session = {
      user: {
        login: user.login,
        bearer: user.bearer,
        uuid: user.uuid,
      },
    } as SessionExt;
    const groups = auth.getGroups(req);
    expect(groups.length).toEqual(1);
    expect(groups.includes("test")).toBeTruthy();
  });

  test("removeUserFromGroups - user set in multi group then removed from all", () => {
    const auth = new Authentification(userDatabase);
    let user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    auth.addGroupMember("admin", user.uuid);
    user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.addGroupMember("admin", user.uuid);
    expect(auth.usersgroups.groups.admin.includes(user.uuid)).toBeTruthy();
    expect(auth.usersgroups.groups.test.includes(user.uuid)).toBeTruthy();
    auth.removeUserFromGroups(user.uuid);
    expect(auth.usersgroups.groups.admin.includes(user.uuid)).toBeFalsy();
    expect(auth.usersgroups.groups.test.includes(user.uuid)).toBeFalsy();
  });

  test("removeUserFromGroups - user not found", () => {
    const auth = new Authentification(userDatabase);
    let user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    auth.addGroupMember("admin", user.uuid);
    user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.addGroupMember("admin", user.uuid);
    expect(auth.usersgroups.groups.admin.includes(user.uuid)).toBeTruthy();
    expect(auth.usersgroups.groups.test.includes(user.uuid)).toBeTruthy();
    auth.removeUserFromGroups("xxxx");
    expect(auth.usersgroups.groups.admin.includes(user.uuid)).toBeTruthy();
    expect(auth.usersgroups.groups.test.includes(user.uuid)).toBeTruthy();
  });

  test("getUserGroups - existent user", () => {
    const auth = new Authentification(userDatabase);
    let user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    auth.addGroupMember("admin", user.uuid);
    user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.addGroupMember("admin", user.uuid);
    expect(auth.getUserGroups(user.uuid).length).toEqual(2);
    expect(auth.getUserGroups(user.uuid).includes("test")).toBeTruthy();
    expect(auth.getUserGroups(user.uuid).includes("admin")).toBeTruthy();
  });

  test("getUserGroups - non-existent user", () => {
    const auth = new Authentification(userDatabase);
    let user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    auth.addGroupMember("admin", user.uuid);
    user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.addGroupMember("admin", user.uuid);
    expect(auth.getUserGroups("xxx").length).toEqual(0);
  });

  test("cleanGroups - cleaning, without empty groups", () => {
    // adding users with groups
    const auth = new Authentification(userDatabase);

    const admin = auth.makeUser("admin", "admin");
    auth.addUser(admin);
    auth.addGroupMember("admin", admin.uuid);

    const test = auth.makeUser("test", "test");
    auth.addUser(test);
    auth.addGroupMember("test", test.uuid);

    const test1 = auth.makeUser("test1", "test");
    auth.addUser(test1);
    auth.addGroupMember("test1", test1.uuid);

    expect(auth.getUserGroups(admin.uuid).length).toEqual(1);
    expect(auth.getUserGroups(test.uuid).length).toEqual(1);
    expect(auth.getUserGroups(test1.uuid).length).toEqual(1);
    // 3 groups
    expect(Object.getOwnPropertyNames(auth.usersgroups.groups).length).toEqual(
      3
    );
    auth.cleanGroups();
    expect(Object.getOwnPropertyNames(auth.usersgroups.groups).length).toEqual(
      3
    );
    expect(auth.usersgroups.groups.admin).toBeDefined();
    expect(auth.usersgroups.groups.test).toBeDefined();
    expect(auth.usersgroups.groups.test1).toBeDefined();
  });

  test("cleanGroups - I empty 1 group and clean", () => {
    // adding users with groups
    const auth = new Authentification(userDatabase);

    const admin = auth.makeUser("admin", "admin");
    auth.addUser(admin);
    auth.addGroupMember("admin", admin.uuid);

    const test = auth.makeUser("test", "test");
    auth.addUser(test);
    auth.addGroupMember("test", test.uuid);

    const test1 = auth.makeUser("test1", "test");
    auth.addUser(test1);
    auth.addGroupMember("test1", test1.uuid);

    expect(auth.getUserGroups(admin.uuid).length).toEqual(1);
    expect(auth.getUserGroups(test.uuid).length).toEqual(1);
    expect(auth.getUserGroups(test1.uuid).length).toEqual(1);
    // remove test from all groups
    auth.removeUserFromGroups(test.uuid);
    expect(auth.getUserGroups(test.uuid).length).toEqual(0);
    // 3 groups
    expect(Object.getOwnPropertyNames(auth.usersgroups.groups).length).toEqual(
      3
    );
    auth.cleanGroups();
    expect(Object.getOwnPropertyNames(auth.usersgroups.groups).length).toEqual(
      2
    );
    expect(auth.usersgroups.groups.admin).toBeDefined();
    expect(auth.usersgroups.groups.test).not.toBeDefined();
    expect(auth.usersgroups.groups.test1).toBeDefined();
  });

  test("isAllowedForObject - admin user", () => {
    const auth = new Authentification(userDatabase);

    const admin = auth.makeUser("admin", "admin");
    auth.addUser(admin);
    auth.addGroupMember("admin", admin.uuid);

    const test = auth.makeUser("test", "test");
    auth.addUser(test);
    auth.addGroupMember("test", test.uuid);

    const req = {
      body: {},
      app: {
        get: (key: string) => {
          if (key === "AUTH") return auth;
        },
      },
    } as Request;
    req.session = {
      user: {
        login: admin.login,
        bearer: admin.bearer,
        uuid: admin.uuid,
      },
    } as SessionExt;

    expect(auth.isAllowedForObject(req, ["xxx", "yyy"])).toBeTruthy();
  });

  test("isAllowedForObject - NON admin user", () => {
    const auth = new Authentification(userDatabase);

    const admin = auth.makeUser("admin", "admin");
    auth.addUser(admin);
    auth.addGroupMember("admin", admin.uuid);

    const test = auth.makeUser("test", "test");
    auth.addUser(test);
    auth.addGroupMember("test", test.uuid);

    const req = {
      body: {},
      app: {
        get: (key: string) => {
          if (key === "AUTH") return auth;
        },
      },
    } as Request;
    req.session = {
      user: {
        login: test.login,
        bearer: test.bearer,
        uuid: test.uuid,
      },
    } as SessionExt;

    // test is not member of xxx
    expect(auth.isAllowedForObject(req, ["xxx"])).toBeFalsy();
    // test is member of test
    expect(auth.isAllowedForObject(req, ["test"])).toBeTruthy();
  });

  test("isAllowedForObject - user without group", () => {
    const auth = new Authentification(userDatabase);

    const admin = auth.makeUser("admin", "admin");
    auth.addUser(admin);
    auth.addGroupMember("admin", admin.uuid);

    const test = auth.makeUser("test", "test");
    auth.addUser(test);

    const req = {
      body: {},
      app: {
        get: (key: string) => {
          if (key === "AUTH") return auth;
        },
      },
    } as Request;
    req.session = {
      user: {
        login: test.login,
        bearer: test.bearer,
        uuid: test.uuid,
      },
    } as SessionExt;

    // test is not member of xxx
    expect(auth.isAllowedForObject(req, ["xxx"])).toBeFalsy();
    // test is member of test
    expect(auth.isAllowedForObject(req, ["test"])).toBeFalsy();
  });
});

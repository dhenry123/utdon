import { existsSync, rmSync } from "fs";
import { Authentification } from "../src/lib/Authentification";

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

  test("getGroups - with groups set", () => {
    const auth = new Authentification(userDatabase);
    let user = auth.makeUser("admin", "admin");
    auth.addUser(user);
    auth.addGroupMember("admin", user.uuid);
    user = auth.makeUser("test", "test");
    auth.addUser(user);
    auth.addGroupMember("test", user.uuid);
    auth.isMemberOfGroup("admin", user.uuid);
    const groups = auth.getGroups();
    expect(groups.length).toEqual(2);
    expect(groups.includes("admin")).toBeTruthy();
    expect(groups.includes("test")).toBeTruthy();
  });
});

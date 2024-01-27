import ldap, { SearchOptions } from "ldapjs";
import {
  LdapBind,
  LdapSearch,
  LdapUnbind,
} from "../src/lib/LDAPAuthentification";

describe("LDAP AUTH", () => {
  test("bind - OK", async () => {
    const client = await ldap.createClient({
      url: `ldap://127.0.0.1:10389`,
    });

    // User credentials
    const username = "Philip J. Fry";
    const password = "fry";

    await LdapBind(client, username, password)
      .then(async (message) => {
        expect(message).toEqual("Authentication successful");
      })
      .catch((error) => {
        console.error(error);
        expect(error).not.toBeDefined();
      })
      .finally(async () => {
        await LdapUnbind(client)
          .then((message) => {
            expect(message).toEqual("Unbind successful");
          })
          .catch((error) => {
            console.log(error);
            expect(error).not.toBeDefined();
          });
      });
  });
  test("bind - KO - wrong password", async () => {
    const client = await ldap.createClient({
      url: `ldap://127.0.0.1:10389`,
    });

    // User credentials
    const username = "Philip J. Fry";
    const password = "fryxx";

    await LdapBind(client, username, password)
      .then(async () => {
        //unexpected
        expect(true).toBeFalsy();
      })
      .catch((error) => {
        expect(error.lde_message).toEqual("Invalid Credentials");
      })
      .finally(async () => {
        await LdapUnbind(client)
          .then((message) => {
            expect(message).toEqual("Unbind successful");
          })
          .catch((error) => {
            console.log(error);
            expect(error).not.toBeDefined();
          });
      });
  });
  test("bind - KO - wrong user", async () => {
    const client = await ldap.createClient({
      url: `ldap://127.0.0.1:10389`,
    });

    // User credentials
    const username = "Philip J.";
    const password = "fry";

    await LdapBind(client, username, password)
      .then(async () => {
        //unexpected
        expect(true).toBeFalsy();
      })
      .catch((error) => {
        expect(error.lde_message).toEqual("Invalid Credentials");
      })
      .finally(async () => {
        await LdapUnbind(client)
          .then((message) => {
            expect(message).toEqual("Unbind successful");
          })
          .catch((error) => {
            console.log(error);
            expect(error).not.toBeDefined();
          });
      });
  });

  test("LdapSearch - Get All Groups", async () => {
    const client = await ldap.createClient({
      url: `ldap://127.0.0.1:10389`,
    });

    // User credentials
    const username = "Philip J. Fry";
    const password = "fry";

    const filter: SearchOptions = {
      filter: "(objectClass=Group)",
      scope: "sub",
    };

    await LdapBind(client, username, password)
      .then(async (message) => {
        expect(message).toEqual("Authentication successful");
        await LdapSearch(client, "ou=people,dc=planetexpress,dc=com", filter)
          .then((result) => {
            expect(result.length).toEqual(2);
            const cn = result[0].attributes.filter(
              (item) => item.type === "cn"
            );
            expect(cn.length).toEqual(1);
            expect(cn[0].values.length).toEqual(1);
            expect(
              ["ship_crew", "admin_staff"].includes(cn[0].values[0])
            ).toBeTruthy();
          })
          .catch((error) => {
            console.error(error);
            expect(error).not.toBeDefined();
          });
      })
      .catch((error) => {
        console.error(error);
        expect(error).not.toBeDefined();
      })
      .finally(async () => {
        await LdapUnbind(client)
          .then((message) => {
            expect(message).toEqual("Unbind successful");
          })
          .catch((error) => {
            console.log(error);
            expect(error).not.toBeDefined();
          });
      });
  });

  test("LdapSearch - Get All Groups filtered on pattern", async () => {
    const client = await ldap.createClient({
      url: `ldap://127.0.0.1:10389`,
    });

    // User credentials
    const username = "Philip J. Fry";
    const password = "fry";

    const filter: SearchOptions = {
      filter: "(&(objectClass=Group)(cn=admin_*))",
      //filter: "(&(objectClass=Group)(cn=ship_*))",
      scope: "sub",
    };

    await LdapBind(client, username, password)
      .then(async (message) => {
        expect(message).toEqual("Authentication successful");
        await LdapSearch(client, "ou=people,dc=planetexpress,dc=com", filter)
          .then((result) => {
            console.log("result", result);
          })
          .catch((error) => {
            console.error(error);
            expect(error).not.toBeDefined();
          });
      })
      .catch((error) => {
        console.error(error);
        expect(error).not.toBeDefined();
      })
      .finally(async () => {
        await LdapUnbind(client)
          .then((message) => {
            expect(message).toEqual("Unbind successful");
          })
          .catch((error) => {
            console.log(error);
            expect(error).not.toBeDefined();
          });
      });
  });
});

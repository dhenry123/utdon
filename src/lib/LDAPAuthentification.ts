import { Client, SearchEntry, SearchEntryObject, SearchOptions } from "ldapjs";

// Connect and bind to the server
export const LdapBind = (
  client: Client,
  username: string,
  password: string
) => {
  return new Promise((resolv, reject) => {
    client.bind(
      `cn=${username},ou=people,dc=planetexpress,dc=com`,
      password,
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolv("Authentication successful");
        }
      }
    );
  });
};

export const LdapUnbind = (client: Client) => {
  return new Promise((resolv, reject) => {
    client.unbind((err) => {
      if (err) {
        reject(err);
      } else {
        resolv("Unbind successful");
      }
    });
  });
};

/**
 *
 * ldapsearch -H ldap://localhost:10389 -x -b "ou=people,dc=planetexpress,dc=com" -D "cn=Philip J. Fry,ou=people,dc=planetexpress,dc=com" -w fry "(&(objectClass=Group)(cn=ship_*))"
 * @param client
 * @param base
 * @param filter
 * @returns
 */
export const LdapSearch = (
  client: Client,
  base: string,
  filter: SearchOptions
): Promise<SearchEntryObject[]> => {
  return new Promise((resolv, reject) => {
    client.search(base, filter, (err, result) => {
      if (err) {
        reject(new Error(err.message));
      } else {
        const entries: SearchEntryObject[] = [];
        result.on("searchEntry", (entry: SearchEntry) => {
          entries.push(entry.json);
        });
        result.on("end", () => {
          resolv(entries);
        });
      }
    });
  });
};

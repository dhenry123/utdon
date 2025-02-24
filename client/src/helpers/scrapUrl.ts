import { HTTPMethods } from "../../../src/Global.types";

export const scrapUrl = async (
  url: string,
  method: HTTPMethods = "GET",
  customHttpHeader?: string
): Promise<string> => {
  let authHeader: RequestInit = { method: method };
  const header = new Headers();
  if (customHttpHeader) {
    const split = customHttpHeader.split(":");
    if (split[1]) {
      header.append(split[0], split[1]);
      authHeader = { ...authHeader, headers: header };
    }
  }

  const content = await fetch(`${url}`, { ...authHeader }).then(
    async (response) => {
      if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
      }
      // WARNING: (anti XSS) Content must never be interpreted by the browser
      const text = await response.text();
      return text;
    }
  );
  return content;
};

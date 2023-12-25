/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { readFileSync } from "fs";
import {
  filterJson,
  filterText,
  isJsonParsable,
} from "../src/lib/helperProdVersionReader";
import { scrapUrl } from "../src/lib/Features";

describe("helperProdVersionReader", () => {
  test("filterText", async () => {
    // simple test because many cases...
    const output = readFileSync(
      "./test/samples/html-version.response.html",
      "utf-8"
    );
    const version = filterText(output, "Healthchecks (v[\\d.]+)");
    expect(version).toEqual("v3.0.1");
  });

  test("filterText", async () => {
    // simple test because many cases...
    const output = readFileSync(
      "./test/samples/html-version.response.html",
      "utf-8"
    );
    const version = filterText(output, "(v[\\d.]+)");
    expect(version).toEqual("v3.0.1");
  });

  test("filterText - no filter", async () => {
    const output = readFileSync(
      "./test/samples/html-version.response.html",
      "utf-8"
    );
    const version = filterText(output, "");
    expect(version).toEqual("");
  });

  test("filterText - no match", async () => {
    const output = readFileSync(
      "./test/samples/html-version.response.html",
      "utf-8"
    );
    const version = filterText(output, "xxxxx");
    expect(version).toEqual("");
  });

  test("filterText - Error in regexp", async () => {
    const output = readFileSync(
      "./test/samples/html-version.response.html",
      "utf-8"
    );
    const version = filterText(output, "[\\d");
    expect(version).toEqual("");
  });

  test("filterText - no output", async () => {
    const version = filterText("", "");
    expect(version).toEqual("");
  });

  test("filterJson - multikeys", async () => {
    const output = readFileSync(
      "./test/samples/json-version.response.json",
      "utf-8"
    );
    const version = filterJson(output, "api.version");
    expect(version).toEqual("v3.0.1");
  });

  test("filterJson - doesn't match", async () => {
    const output = readFileSync(
      "./test/samples/json-version.response.json",
      "utf-8"
    );
    const version = filterJson(output, "api.versionxxxx");
    expect(version).toEqual("");
  });

  test("filterJson - no filter and response is object", async () => {
    const output = readFileSync(
      "./test/samples/json-version.response.json",
      "utf-8"
    );
    const version = filterJson(output, "");
    expect(version).toEqual("");
  });

  test("filterJson - no filter - concat attributs", async () => {
    const version = filterJson(
      '{ "major": 1, "minor": 85, "patch": 0 }',
      "join('.',*)"
    );
    expect(version).toEqual("1.85.0");
  });

  test("filterJson - Error in jmespath expr", async () => {
    const version = filterJson(
      '{ "major": 1, "minor": 85, "patch": 0 }',
      "join('.)"
    );
    expect(version).toEqual("");
  });

  test("scrapUrl", async () => {
    await scrapUrl("https://www.google.com", "GET").then((output) => {
      const version = filterText(
        (output as string).toLocaleLowerCase(),
        "doctype ([a-zA-Z][^\\s>]*)"
      );
      expect(version).toEqual("html");
    });
  });

  test("scrapUrl - wrong url", async () => {
    await scrapUrl("htxxxxx://www.google.com", "GET")
      .then(() => {
        // unexpected
        expect(true).toBeFalsy();
      })
      .catch((error) => {
        expect(error).toBeDefined();
        expect(error.toString()).toEqual("TypeError: fetch failed");
      });
  });

  test("isJsonParsable - parsable", () => {
    const json = {
      test: "1",
      testA: "2",
    };
    expect(isJsonParsable(JSON.stringify(json))).toBeTruthy();
  });

  test("isJsonParsable - unset", () => {
    expect(isJsonParsable("")).toBeFalsy();
  });

  test("isJsonParsable - null", () => {
    expect(isJsonParsable(null)).toBeFalsy();
  });

  test("isJsonParsable - html", () => {
    const html = "<html><body>test</body</html>";
    expect(isJsonParsable(html)).toBeFalsy();
  });
});

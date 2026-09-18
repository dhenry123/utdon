/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef } from "react";
import {
  buidMultiSelectGroups,
  convertUrlToTabName,
  copyToClipboard,
} from "./UiMiscHelper";

describe("UiMiscHelper", () => {
  describe("buidMultiSelectGroups", () => {
    it("maps group names to label/value options", () => {
      expect(buidMultiSelectGroups(["admin", "dev"])).toEqual([
        { label: "admin", value: "admin" },
        { label: "dev", value: "dev" },
      ]);
    });
    it("empty list gives empty options", () => {
      expect(buidMultiSelectGroups([])).toEqual([]);
    });
  });

  describe("convertUrlToTabName", () => {
    it("strips scheme and www, replaces dots with underscores", () => {
      expect(convertUrlToTabName("https://www.google.com/search")).toEqual(
        "google_com/search"
      );
    });
    it("strips scheme and userinfo, keeps the rest of the url", () => {
      expect(convertUrlToTabName("http://git.example.com:3000/a/b")).toEqual(
        "git_example_com:3000/a/b"
      );
    });
    it("works on a bare domain", () => {
      expect(convertUrlToTabName("github.com/dhenry123/utdon")).toEqual(
        "github_com/dhenry123/utdon"
      );
    });
  });

  describe("copyToClipboard", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it("copies the element text via a temporary textarea", async () => {
      const execCommand = vi.fn(() => true);
      document.execCommand = execCommand as never;
      const ref = createRef<HTMLDivElement>();
      const div = document.createElement("div");
      div.innerText = "copy me";
      document.body.appendChild(div);
      (ref as { current: HTMLDivElement | null }).current = div;
      await expect(copyToClipboard(ref as never)).resolves.toBeNull();
      expect(execCommand).toHaveBeenCalledWith("copy");
      document.body.removeChild(div);
    });
    it("rejects when no element is attached to the ref", async () => {
      const ref = createRef<HTMLDivElement>();
      await expect(copyToClipboard(ref as never)).rejects.toThrow(
        /divRef must be provided/
      );
    });
  });
});

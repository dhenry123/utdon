/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { ScrapGitHubReleaseTags } from "./ScrapGitHubReleaseTags";
import { renderWithIntl } from "../test/testUtils";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import {
  UptodateForm,
  UptodateFormFields,
} from "../../../src/Global.types";

/**
 * issue #26 (client side): the wizard preview must select the GREATEST
 * semver tag, not the first entry — the v1.51.1 backport is listed first
 * by the releases API (internal id order) although v1.52.0 is greater.
 */
const outOfOrderReleases = JSON.stringify([
  { id: 372548656, tag_name: "v1.51.1", name: "v1.51.1" },
  { id: 354834060, tag_name: "v1.52.0", name: "v1.52.0" },
  { id: 340534238, tag_name: "v1.51.0", name: "v1.51.0" },
  { id: 309001849, tag_name: "v1.50.0", name: "v1.50.0" },
]);

const scrapUrl = vi.fn(
  async () => outOfOrderReleases as unknown as Promise<unknown>
);

const Harness = () => {
  const [form, setForm] = useState<UptodateForm>({
    ...INITIALIZED_UPTODATEFORM,
    urlGitHub: "https://github.com/VictoriaMetrics/VictoriaLogs",
  } as UptodateForm);
  const handleOnChange = (key: UptodateFormFields, value: string | string[]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  return (
    <ScrapGitHubReleaseTags
      activeUptodateForm={form}
      handleOnChange={handleOnChange}
      scrapUrl={scrapUrl}
      displayError={() => {}}
      onDone={() => {}}
    />
  );
};

const getLatestDetected = (container: HTMLElement) =>
  container.querySelector(".version .success")?.textContent;

describe("ScrapGitHubReleaseTags", () => {
  it("fetches the releases api url derived from the repository url", async () => {
    const { container } = renderWithIntl(<Harness />);
    fireEvent.click(
      screen.getByText("Get release tag names list").closest("button")!
    );
    await waitFor(() => {
      expect(
        container.querySelectorAll(".scrapContent .tagitem").length
      ).toEqual(4);
    });
    expect(scrapUrl).toHaveBeenCalledWith(
      "https://api.github.com/repos/VictoriaMetrics/VictoriaLogs/releases",
      INITIALIZED_UPTODATEFORM.headerkeyGit,
      INITIALIZED_UPTODATEFORM.headervalueGit
    );
    // next step is disabled until a filter detects a latest release
    expect(
      screen.getByText("Next step").closest("button")
    ).toBeDisabled();
    expect(getLatestDetected(container)).toBeUndefined();
  });

  it("detects the greatest semver tag, not the first entry (issue #26)", async () => {
    const { container } = renderWithIntl(<Harness />);
    fireEvent.click(
      screen.getByText("Get release tag names list").closest("button")!
    );
    await waitFor(() => {
      expect(
        container.querySelectorAll(".scrapContent .tagitem").length
      ).toEqual(4);
    });
    fireEvent.change(container.querySelector(".expression input")!, {
      target: { value: "^v[0-9.]+$" },
    });
    await waitFor(() => {
      expect(getLatestDetected(container)).toEqual("v1.52.0");
    });
    expect(
      screen.getByText("Next step").closest("button")
    ).not.toBeDisabled();
  });

  it("scopes the selection to the tags matching the keep-regexp", async () => {
    const { container } = renderWithIntl(<Harness />);
    fireEvent.click(
      screen.getByText("Get release tag names list").closest("button")!
    );
    await waitFor(() => {
      expect(
        container.querySelectorAll(".scrapContent .tagitem").length
      ).toEqual(4);
    });
    fireEvent.change(container.querySelector(".expression input")!, {
      target: { value: "^v1\\.51\\." },
    });
    await waitFor(() => {
      expect(getLatestDetected(container)).toEqual("v1.51.1");
    });
    // v1.52.0 and v1.50.0 are excluded by the filter
    expect(container.querySelector(".excluded")?.textContent).toContain(
      "v1.52.0"
    );
  });

  it("reports when the filter detects nothing", async () => {
    const { container } = renderWithIntl(<Harness />);
    fireEvent.click(
      screen.getByText("Get release tag names list").closest("button")!
    );
    await waitFor(() => {
      expect(
        container.querySelectorAll(".scrapContent .tagitem").length
      ).toEqual(4);
    });
    fireEvent.change(container.querySelector(".expression input")!, {
      target: { value: "^nothing-matches-this$" },
    });
    await waitFor(() => {
      expect(container.querySelector(".version .error")).toBeDefined();
    });
    expect(
      screen.getByText("Next step").closest("button")
    ).toBeDisabled();
  });
});

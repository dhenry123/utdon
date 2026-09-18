/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { DisplayVersions } from "./DisplayVersions";
import { renderWithIntl } from "../test/testUtils";

describe("DisplayVersions", () => {
  it("shows production and latest versions when a compare result exists", () => {
    renderWithIntl(
      <DisplayVersions
        data={{
          compareResult: {
            productionVersion: "1.51.1",
            githubLatestRelease: "v1.52.0",
          },
        }}
      />
    );
    expect(screen.getByText("1.51.1")).toBeDefined();
    expect(screen.getByText("v1.52.0")).toBeDefined();
    expect(screen.getByText("/")).toBeDefined();
  });

  it("shows no version detected without a compare result", () => {
    renderWithIntl(<DisplayVersions data={{ compareResult: null }} />);
    expect(screen.getByText(/No version detected/)).toBeDefined();
  });
});

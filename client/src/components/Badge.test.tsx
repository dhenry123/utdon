/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("up to date without warning renders the green tier", () => {
    render(<Badge isSuccess={true} />);
    const value = screen.getByText("UP to date");
    expect(value).toHaveClass("uptodate");
    expect(value).not.toHaveClass("uptodatewithwarn");
  });

  it("up to date with warning renders the warning tier (v-prefix, production ahead...)", () => {
    render(<Badge isSuccess={true} isWarning={true} />);
    const value = screen.getByText("UP to date");
    expect(value).toHaveClass("uptodatewithwarn");
  });

  it("not up to date renders OUT of date", () => {
    render(<Badge isSuccess={false} />);
    const value = screen.getByText("OUT of date");
    expect(value).toHaveClass("toupdate");
  });

  it("no state renders the neutral tier", () => {
    render(<Badge isSuccess={false} noState={true} />);
    const value = screen.getByText("No State");
    expect(value).toHaveClass("nostate");
  });
});

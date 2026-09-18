/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { HttpHeader } from "./HttpHeader";
import { renderWithIntl } from "../test/testUtils";

describe("HttpHeader", () => {
  it("renders the provided key/value", () => {
    const { container } = renderWithIntl(
      <HttpHeader
        handleOnChange={() => {}}
        headerkey="Authorization"
        headervalue="Bearer tok"
        headerkeyField="headerkeyGit"
        headervalueField="headervalueGit"
      />
    );
    expect(
      (container.querySelector(".headerhttpkey") as HTMLInputElement).value
    ).toEqual("Authorization");
    expect(
      (container.querySelector(".headerhttpvalue") as HTMLInputElement).value
    ).toEqual("Bearer tok");
  });

  it("typing reports changes with the bound form field names", () => {
    const handleOnChange = vi.fn();
    const { container } = renderWithIntl(
      <HttpHeader
        handleOnChange={handleOnChange}
        headerkey=""
        headervalue=""
        headerkeyField="headerkeyGit"
        headervalueField="headervalueGit"
      />
    );
    fireEvent.change(container.querySelector(".headerhttpkey")!, {
      target: { value: "Authorization" },
    });
    fireEvent.change(container.querySelector(".headerhttpvalue")!, {
      target: { value: "Bearer tok" },
    });
    expect(handleOnChange).toHaveBeenCalledWith(
      "headerkeyGit",
      "Authorization"
    );
    expect(handleOnChange).toHaveBeenCalledWith("headervalueGit", "Bearer tok");
  });
});

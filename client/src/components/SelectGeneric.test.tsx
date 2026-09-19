/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import SelectGeneric from "./SelectGeneric";
import { renderWithIntl } from "../test/testUtils";

describe("SelectGeneric", () => {
  const options = [
    { value: "join('.',*)", label: "join('.',*)" },
    { value: "^v[0-9.]+$", label: "^v[0-9.]+$" },
  ];

  it("renders the default option and the provided options", () => {
    renderWithIntl(
      <SelectGeneric options={options} value="" onChange={() => {}} />
    );
    const select = screen.getByRole("combobox");
    // default option labelled with its id (en catalog is empty)
    expect(screen.getByText("None")).toBeDefined();
    expect(
      Array.from(select.querySelectorAll("option")).map((o) => o.value)
    ).toEqual(["", "join('.',*)", "^v[0-9.]+$"]);
  });

  it("hides the default option when disabled", () => {
    renderWithIntl(
      <SelectGeneric
        options={options}
        value=""
        onChange={() => {}}
        disableDefaultOption
      />
    );
    expect(screen.queryByText("None")).toBeNull();
  });

  it("fires onChange with the selected value", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <SelectGeneric options={options} value="" onChange={onChange} />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "^v[0-9.]+$" },
    });
    expect(onChange).toHaveBeenCalledWith("^v[0-9.]+$");
  });

  it("can be disabled", () => {
    renderWithIntl(
      <SelectGeneric
        options={options}
        value=""
        onChange={() => {}}
        disabled
      />
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

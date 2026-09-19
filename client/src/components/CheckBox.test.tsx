/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckBox } from "./CheckBox";

describe("CheckBox", () => {
  it("renders the checked state and a label", () => {
    render(
      <CheckBox checked={true} label="Disable actions" onChange={() => {}} />
    );
    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();
    expect(screen.getByText("Disable actions")).toBeDefined();
  });

  it("forwards the change event", () => {
    const onChange = vi.fn();
    render(<CheckBox checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InputGeneric from "./InputGeneric";

describe("InputGeneric", () => {
  it("renders the value and fires onChange on typing", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InputGeneric value="initial" onChange={onChange} />
    );
    const input = screen.getByDisplayValue("initial");
    fireEvent.change(input, { target: { value: "typed" } });
    expect(onChange).toHaveBeenCalledWith("typed");
    rerender(<InputGeneric value="updated" onChange={onChange} />);
    expect(screen.getByDisplayValue("updated")).toBeDefined();
  });

  it("fires onChange on mount and on programmatic value change", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InputGeneric value="a" onChange={onChange} />
    );
    expect(onChange).toHaveBeenCalledWith("a");
    rerender(<InputGeneric value="b" onChange={onChange} />);
    expect(onChange).toHaveBeenLastCalledWith("b");
  });

  it("reports keyboard keys through onKeyUp/onKeyDown", () => {
    const onKeyUp = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <InputGeneric
        value=""
        onChange={() => {}}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyUp(input, { key: "Enter" });
    expect(onKeyDown).toHaveBeenCalledWith("Enter");
    expect(onKeyUp).toHaveBeenCalledWith("Enter");
  });

  it("supports type, placeholder, title and disabled", () => {
    render(
      <InputGeneric
        value="x"
        onChange={() => {}}
        type="password"
        placeholder="pass"
        title="the title"
        disabled
      />
    );
    const input = screen.getByPlaceholderText("pass");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("title", "the title");
    expect(input).toBeDisabled();
  });
});

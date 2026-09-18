/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Stepper } from "./Stepper";
import { renderWithIntl } from "../test/testUtils";

describe("Stepper", () => {
  const steps = [
    { label: "Service to be monitored", done: true },
    { label: "Git repository" },
    { label: "Action to perform" },
  ];

  it("renders all step labels", () => {
    renderWithIntl(<Stepper steps={steps} active={1} onChange={() => {}} />);
    expect(screen.getByText("Service to be monitored")).toBeDefined();
    expect(screen.getByText("Git repository")).toBeDefined();
    expect(screen.getByText("Action to perform")).toBeDefined();
  });

  it("marks the active step and the done ones", () => {
    const { container } = renderWithIntl(
      <Stepper steps={steps} active={1} onChange={() => {}} />
    );
    const buttons = container.querySelectorAll(".ButtonGeneric");
    expect(buttons[1]).toHaveClass("active");
    expect(buttons[0]).toHaveClass("done");
    expect(buttons[0].querySelector("i")).toHaveClass("ti-check");
    expect(buttons[1]).toHaveClass("undone");
  });

  it("clicking a step reports its index", () => {
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <Stepper steps={steps} active={1} onChange={onChange} />
    );
    fireEvent.click(container.querySelectorAll(".ButtonGeneric")[1]);
    expect(onChange).toHaveBeenCalledWith(false, 1);
  });
});

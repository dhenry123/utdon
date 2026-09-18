/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepperStep } from "./StepperStep";

describe("StepperStep", () => {
  it("shows the step content when active", () => {
    const { container } = render(
      <StepperStep stepId={1} active={1}>
        <div>step content</div>
      </StepperStep>
    );
    expect(screen.getByText("step content")).toBeDefined();
    expect(container.firstChild).not.toHaveClass("notVisibleComponent");
  });

  it("hides the content of inactive steps", () => {
    const { container } = render(
      <StepperStep stepId={1} active={2}>
        <div>step content</div>
      </StepperStep>
    );
    expect(container.firstChild).toHaveClass("notVisibleComponent");
  });
});

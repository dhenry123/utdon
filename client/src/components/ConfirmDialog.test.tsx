/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { renderWithIntl } from "../test/testUtils";

describe("ConfirmDialog", () => {
  it("renders nothing when not visible", () => {
    renderWithIntl(
      <ConfirmDialog
        visible={false}
        message="delete it?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText("delete it?")).toBeNull();
  });

  it("shows the message and fires onConfirm / onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderWithIntl(
      <ConfirmDialog
        visible={true}
        message="delete it?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByText("delete it?")).toBeDefined();
    fireEvent.click(screen.getByText("Yes").closest("button")!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("No").closest("button")!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

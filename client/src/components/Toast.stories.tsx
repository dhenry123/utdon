import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "./Toast";
import { INITIALIZED_TOAST } from "../../../src/Constants";

const meta = {
  title: "Components/Alert/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    toast: {
      ...INITIALIZED_TOAST,
      summary: "severity info",
      detail: "details of alert",
      life: 1000000,
    },
  },
};

export const Success: Story = {
  args: {
    toast: {
      ...INITIALIZED_TOAST,
      severity: "success",
      summary: "severity success",
      detail: "details of alert",
      life: 1000000,
    },
  },
};

export const Warn: Story = {
  args: {
    toast: {
      ...INITIALIZED_TOAST,
      severity: "warn",
      summary: "severity warn",
      detail: "details of alert",
      life: 1000000,
    },
  },
};

export const Error: Story = {
  args: {
    toast: {
      ...INITIALIZED_TOAST,
      severity: "error",
      summary: "severity error",
      detail: "details of alert",
      life: 5000,
    },
  },
};

export const Sticky: Story = {
  args: {
    toast: {
      ...INITIALIZED_TOAST,
      severity: "error",
      summary: "severity error",
      detail: "details of alert",
      sticky: true,
    },
  },
};

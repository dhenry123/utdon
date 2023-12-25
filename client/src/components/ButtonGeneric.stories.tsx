import type { Meta, StoryObj } from "@storybook/react";

import ButtonGeneric from "./ButtonGeneric";

const meta = {
  title: "Components/Input/ButtonGeneric",
  component: ButtonGeneric,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ButtonGeneric>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: "label",
    onClick: () => {},
  },
};

export const Success: Story = {
  args: {
    label: "label",
    className: "success",
    onClick: () => {},
  },
};

export const Warning: Story = {
  args: {
    label: "label",
    className: "warning",
    onClick: () => {},
  },
};

export const WithIcon: Story = {
  args: {
    label: "label",
    onClick: () => {},
    icon: "ti ti-360",
  },
};

export const OnlyIcon: Story = {
  args: {
    onClick: () => {},
    icon: "ti ti-360",
  },
};

export const RoundOnlyIcon: Story = {
  args: {
    onClick: () => {},
    icon: "ti ti-360",
    className: "round",
  },
};

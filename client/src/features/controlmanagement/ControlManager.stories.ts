import type { Meta, StoryObj } from "@storybook/react";

import { ControlManager } from "./ControlManager";
import { withRouter } from "storybook-addon-remix-react-router";

const meta = {
  title: "Features/ControlManager",
  component: ControlManager,
  decorators: [withRouter],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ControlManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};

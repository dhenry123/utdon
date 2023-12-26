import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "./Badge";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";

const meta = {
  title: "Ui/Badge",
  component: Badge,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpToDate: Story = {
  args: {
    isSuccess: true,
  },
};

export const ToUpDate: Story = {
  args: {
    isSuccess: false,
  },
};

export const Warn: Story = {
  args: {
    isWarning: true,
    isSuccess: true,
  },
};

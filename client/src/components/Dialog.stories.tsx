import type { Meta, StoryObj } from "@storybook/react";

import { Dialog } from "./Dialog";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";

const meta = {
  title: "Ui/Dialog",
  component: Dialog,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: <div>TEST</div>,
    visible: true,
    header: "Header Dialog",
    closeButton: true,
  },
};

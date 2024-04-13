import type { Meta, StoryObj } from "@storybook/react";

import { ChangePassword } from "./ChangePassword";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { fn } from "@storybook/test";

const meta = {
  title: "Features/ChangePassword",
  component: ChangePassword,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  args: {
    onHide: fn(),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ChangePassword>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

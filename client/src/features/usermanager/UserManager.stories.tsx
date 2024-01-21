import type { Meta, StoryObj } from "@storybook/react";

import { UserManager } from "./UserManager.tsx";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";

const meta = {
  title: "Features/UserManager",
  component: UserManager,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof UserManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};

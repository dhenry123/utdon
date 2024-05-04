import type { Meta, StoryObj } from "@storybook/react";

import { LoginBlock } from "./LoginBlock";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Forms/LoginBlock",
  component: LoginBlock,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof LoginBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    onLogin: (data) => {
      console.log(data);
    },
  },
};

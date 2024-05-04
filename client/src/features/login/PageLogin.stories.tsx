import type { Meta, StoryObj } from "@storybook/react";

import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { PageLogin } from "./PageLogin";

const meta = {
  title: "Features/PageLogin",
  component: PageLogin,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof PageLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};

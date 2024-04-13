import type { Meta, StoryObj } from "@storybook/react";

import { Header } from "./Header";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Components/Navigation/Header",
  component: Header,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileNormalUser: Story = {
  args: {
    isAdmin: false,
    isMobile: true,
  },
};

export const MobileAdinistrator: Story = {
  args: {
    isAdmin: true,
    isMobile: true,
  },
};

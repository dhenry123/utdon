import type { Meta, StoryObj } from "@storybook/react";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { ErrorInRouter } from "./ErrorInRouter";

const meta = {
  title: "Features/ErrorInRouter",
  component: ErrorInRouter,
  decorators: [withRouter],
  parameters: {
    layout: "centered",
    reactRouter: reactRouterParameters({
      location: { path: "/test" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ErrorInRouter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Error Page when route not found
 */
export const RouteNotFound: Story = {
  args: {},
};

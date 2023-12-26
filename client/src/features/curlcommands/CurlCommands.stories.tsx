import type { Meta, StoryObj } from "@storybook/react";

import { CurlCommands } from "./CurlCommands";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";
import { STORYBOOK_UPTODATEFORM } from "../../../../src/Constants-dev";

const meta = {
  title: "Features/CurlCommands",
  component: CurlCommands,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof CurlCommands>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ForOneControl: Story = {
  args: {
    uptodateForm: STORYBOOK_UPTODATEFORM,
    userAuthBearer: "xxxxx",
  },
};

export const ForAllControls: Story = {
  args: {
    uptodateForm: "all",
    userAuthBearer: "xxxxx",
  },
};

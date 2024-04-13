import type { Meta, StoryObj } from "@storybook/react";

import { ActionsSettings } from "./ActionsSettings";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { STORYBOOK_UPTODATEFORM } from "../../../src/Constants-dev";
import { fn } from "@storybook/test";

const meta = {
  title: "Forms/ActionsSettings",
  component: ActionsSettings,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ActionsSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    activeUptodateForm: { ...STORYBOOK_UPTODATEFORM },
    handleOnChange: fn(),
    onDone: fn(),
  },
};

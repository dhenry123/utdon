import type { Meta, StoryObj } from "@storybook/react";

import { Control } from "./Control";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { STORYBOOK_UPTODATEFORM } from "../../../src/Constants-dev";

const meta = {
  title: "Ui/Control",
  component: Control,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Control>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    data: { ...STORYBOOK_UPTODATEFORM },

    handleOnDelete: () => {},
    handleOnCompare: () => {},
    handleOnPause: () => {},
    handleOnEdit: () => {},
    handleOnCurlCommands: () => {},
    setConfirmDeleteIsVisible: () => {},
    confirmDeleteIsVisible: false,
    setIsDialogCompareVisible: () => {},
    setResultCompare: () => {},
    handleOnDuplicate: () => {},
  },
};

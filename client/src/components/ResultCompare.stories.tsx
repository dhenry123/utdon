import type { Meta, StoryObj } from "@storybook/react";

import { ResultCompare } from "./ResultCompare";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";
import {
  STORYBOOK_UPDATEORNOTSTATE,
  STORYBOOK_UPTODATEFORM,
} from "../../../src/Constants-dev";

const meta = {
  title: "Ui/ResultCompare",
  component: ResultCompare,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ResultCompare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    check: STORYBOOK_UPTODATEFORM,
    result: STORYBOOK_UPDATEORNOTSTATE,
  },
};

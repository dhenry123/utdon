import type { Meta, StoryObj } from "@storybook/react";

import { CheckBox } from "./CheckBox";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Components/Input/CheckBox",
  component: CheckBox,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof CheckBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// If you need to keep state in storybook, you also could use the app redux store
export const Primary: Story = {
  args: {
    checked: true,
    label: "checkbox, move cursor hover the check to display title",
    title: "checkbox title",
    onChange: () => {},
  },
};

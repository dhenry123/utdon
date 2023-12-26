import type { Meta, StoryObj } from "@storybook/react";

import { InputIcon } from "./InputIcon";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";

const meta = {
  title: "Components/Input/InputIcon",
  component: InputIcon,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof InputIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    placeholder: "Placeholder type your text",
    value: "",
    onChange: (event) => {
      console.log(event);
    },
    icon: "plus",
  },
};

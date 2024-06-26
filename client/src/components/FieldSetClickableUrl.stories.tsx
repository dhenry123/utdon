import type { Meta, StoryObj } from "@storybook/react";

import { FieldSetClickableUrl } from "./FieldSetClickableUrl";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Ui/FieldSetClickableUrl",
  component: FieldSetClickableUrl,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof FieldSetClickableUrl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    url: "http://test.com",
    legend: "myurl",
  },
};

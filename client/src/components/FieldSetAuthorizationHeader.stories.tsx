import type { Meta, StoryObj } from "@storybook/react";

import { FieldSetAuthorizationHeader } from "./FieldSetAuthorizationHeader";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Ui/FieldSetAuthorizationHeader",
  component: FieldSetAuthorizationHeader,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof FieldSetAuthorizationHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    authToken: "xxxxxxxxx",
  },
};

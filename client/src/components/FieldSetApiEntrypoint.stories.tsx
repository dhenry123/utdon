import type { Meta, StoryObj } from "@storybook/react";

import { FieldSetApiEntrypoint } from "./FieldSetApiEntrypoint";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Ui/FieldSetApiEntrypoint",
  component: FieldSetApiEntrypoint,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof FieldSetApiEntrypoint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneControl: Story = {
  args: {
    apiEntrypoint: "/api/v1/action/compare/xxxx/0",
    method: "GET",
    commandTitle: "test",
    userAuthToken: "xxxx",
  },
};

export const AllControl: Story = {
  args: {
    apiEntrypoint: "/api/v1/action/compare/all/0",
    method: "GET",
    commandTitle: "test",
    userAuthToken: "xxxx",
  },
};

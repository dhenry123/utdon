import type { Meta, StoryObj } from "@storybook/react";

import { UrlLinkButtons } from "./UrlLinkButtons";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "NewComponent/UrlLinkButtons",
  component: UrlLinkButtons,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof UrlLinkButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    url: "https://github.com/dhenry123/utdon",
  },
};

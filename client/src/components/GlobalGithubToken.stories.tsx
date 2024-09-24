import type { Meta, StoryObj } from "@storybook/react";
// import { useArgs } from "@storybook/preview-api";

import { GlobalGithubToken } from "./GlobalGithubToken";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: "Forms/GlobalGithubToken",
  component: GlobalGithubToken,
  decorators: [withRouter],
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof GlobalGithubToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    handleOnPost: () => {},
    onHide: () => {},
  },
};

import type { Meta, StoryObj } from "@storybook/react";
// import { useArgs } from "@storybook/preview-api";

import { Search } from "./Search";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: "Components/Input/Search",
  component: Search,
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
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

// If you need to keep state in storybook, you also could use the app redux store
// const Component = ({ ...args }) => {
//   const [, setArgs] = useArgs();
//   const onChange = (value: string) => {
//     // Call the provided callback
//     // This is used for the Actions tab
//     args.onChange?.(value);
//
//     // Update the arg in Storybook
//     setArgs({ value });
//   };
//   return <Search {...args} onChange={onChange} />;
// };
export const Primary: Story = {
  args: {
    searchString: "",
  },
  // if you need to get a specific render see SelectArs component...
  // render: (args) => Component(args),
};

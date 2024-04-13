import type { Meta, StoryObj } from "@storybook/react";

import { ImageUploader } from "./ImageUploader";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { useState } from "react";

const meta = {
  title: "Components/Input/ImageUploader",
  component: ImageUploader,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ImageUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = ({ ...args }) => {
  const [image, setImage] = useState(args.image);

  const onChange = (value: string) => {
    setImage(value);
  };

  return (
    <ImageUploader
      {...args}
      image={image}
      onError={args.onError}
      onChange={onChange}
    />
  );
};

export const Primary: Story = {
  args: {
    image: "",
    onError: (error: string) => {
      console.log(error);
    },
    onChange: (image: string) => {
      console.log(image);
    },
  },
  render: (args) => Component(args),
};

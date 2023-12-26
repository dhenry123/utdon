import type { Meta, StoryObj } from "@storybook/react";

import InputGeneric from "./InputGeneric";
import { useArgs } from "@storybook/preview-api";

const meta = {
  title: "Components/Input/InputGeneric",
  component: InputGeneric,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof InputGeneric>;

export default meta;
type Story = StoryObj<typeof meta>;

function Component({ ...args }) {
  const [, setArgs] = useArgs();

  const onChange = (value: string) => {
    args.onChange?.(value);
    setArgs({ value });
  };

  return <InputGeneric {...args} value={args.value} onChange={onChange} />;
}

export const Primary: Story = {
  args: {
    placeholder: "Placeholder type your text",
    value: "",
    onChange: (event) => {
      console.log(event);
    },
  },
  render: Component,
};

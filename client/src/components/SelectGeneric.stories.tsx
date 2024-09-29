import type { Meta, StoryObj } from "@storybook/react";

import SelectGeneric from "./SelectGeneric";
import { useArgs } from "@storybook/preview-api";
import { SelectOptionType } from "../../../src/Global.types";
import React from "react";

const meta = {
  title: "Components/Input/SelectGeneric",
  component: SelectGeneric,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof SelectGeneric>;

export default meta;
type Story = StoryObj<typeof meta>;

function Component(args: SelectGeneric) {
  const [, setArgs] = useArgs();

  const onChange = (value: string) => {
    args.onChange?.(value);
    setArgs({ value });
  };
  return <SelectGeneric {...args} onChange={onChange} />;
}

const options: SelectOptionType[] = [
  { value: "test1", label: "Label for test1" },
  { value: "test2", label: "Label for test2" },
];

export const Primary: Story = {
  args: {
    value: "",
    options: options,
    onChange: (event) => {
      console.log(event);
    },
  },
  render: Component,
};

export const DefaultOptionLabel: Story = {
  args: {
    value: "",
    options: options,
    onChange: (event) => {
      console.log(event);
    },
    defaultOptionValue: "My default option label",
    defaultOptionLabel: "My default option label",
  },
  render: Component,
};

export const DefaultOptionValue: Story = {
  args: {
    value: "",
    options: options,
    onChange: (event) => {
      console.log(event);
    },
    defaultOptionValue: "My default option value",
  },
  render: Component,
};

export const WithoutDefaultOption: Story = {
  args: {
    value: "",
    options: options,
    onChange: (event) => {
      console.log(event);
    },
    disableDefaultOption: true,
  },
  render: Component,
};

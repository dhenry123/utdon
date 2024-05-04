import type { Meta, StoryObj } from "@storybook/react";

import { Stepper } from "./Stepper";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

const meta = {
  title: "Components/Navigation/Stepper",
  component: Stepper,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Must be associated with the component StepperStep
 * controlled by parent
 * Here the first item is active so the associated StepperStep must be visible...
 */
export const Primary: Story = {
  args: {
    active: 0,
    steps: [
      {
        label: "first step",
      },
      {
        label: "second step",
        done: true,
      },
    ],
    onChange: (changeDoneState: boolean, setNewActiveStep: number) =>
      console.log(changeDoneState, setNewActiveStep),
  },
};

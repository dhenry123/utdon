import type { Meta, StoryObj } from "@storybook/react";

import { StepperStep } from "./StepperStep";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";

const meta = {
  title: "Components/Navigation/StepperStep",
  component: StepperStep,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof StepperStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Active because the property active === the property stepId
 * Controlled by parent
 */
export const Active: Story = {
  args: {
    active: 0,
    stepId: 0,
    children: <div>This is the component included in step of stepper</div>,
  },
};

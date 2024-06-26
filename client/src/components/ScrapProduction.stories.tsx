import type { Meta, StoryObj } from "@storybook/react";

import { ScrapProduction, ScrapProductionProps } from "./ScrapProduction";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { UptodateForm, UptodateFormFields } from "../../../src/Global.types";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import { useState } from "react";
import { fn } from "@storybook/test";

const meta = {
  title: "Forms/ScrapProduction",
  component: ScrapProduction,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  args: {
    onDone: fn(),
    handleOnChange: fn(),
    displayError: fn(),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ScrapProduction>;

export default meta;
type Story = StoryObj<typeof meta>;

const activeUptodateForm: UptodateForm = {
  ...INITIALIZED_UPTODATEFORM,
  urlProduction: "https://test.com",
  scrapTypeProduction: "text",
  exprProduction: "version: (v[\\d.]+)",
};

const Component = (args: ScrapProductionProps) => {
  const [control, setControl] = useState(args.activeUptodateForm);
  args = {
    ...args,
    handleOnChange: (key: UptodateFormFields, value: string | string[]) => {
      // defined by stories
      if (key === "scrapTypeProduction") return;
      setControl({ ...control, [key]: value });
    },
  };
  return <ScrapProduction {...args} activeUptodateForm={control} />;
};

export const ScrapAsText: Story = {
  args: {
    activeUptodateForm: { ...activeUptodateForm, scrapTypeProduction: "text" },
    scrapUrl: async (url: string) => {
      return new Promise((resolv) => {
        resolv(`
      <html> 
      url asked : ${url}
      <body>
      test version: v3.0.1
      </body>
      </html>
      `);
      });
    },
  },
  render: (args) => Component(args),
};

export const ScrapAsJSON: Story = {
  args: {
    activeUptodateForm: { ...activeUptodateForm, scrapTypeProduction: "json" },
    scrapUrl: () => {
      return new Promise((resolv) => {
        resolv(
          JSON.stringify({
            version: "3.0.1",
          }),
        );
      });
    },
  },
  render: (args) => Component(args),
};

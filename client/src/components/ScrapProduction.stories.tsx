import type { Meta, StoryObj } from "@storybook/react";

import { ScrapProduction, ScrapProductionProps } from "./ScrapProduction";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";
import { UptodateForm, UptodateFormFields } from "../../../src/Global.types";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import { useState } from "react";

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
  const [check, setCheck] = useState(args.activeUptodateForm);
  args = {
    ...args,
    handleOnChange: (key: UptodateFormFields, value: string | string[]) => {
      // defined by stories
      if (key === "scrapTypeProduction") return;
      setCheck({ ...check, [key]: value });
    },
  };
  return <ScrapProduction {...args} activeUptodateForm={check} />;
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

    onDone: () => {},
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
          })
        );
      });
    },

    onDone: () => {},
  },
  render: (args) => Component(args),
};

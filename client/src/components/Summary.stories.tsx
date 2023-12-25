import type { Meta, StoryObj } from "@storybook/react";

import { Summary } from "./Summary";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-react-router-v6";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import { UptoDateOrNotState, UptodateForm } from "../../../src/Global.types";

const meta = {
  title: "Forms/Summary",
  component: Summary,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Summary>;

const activeUptodateForm: UptodateForm = {
  ...INITIALIZED_UPTODATEFORM,
  urlProduction: "https://test.com",
  scrapTypeProduction: "text",
  exprProduction: "version: (v[\\d.]+)",
};

const compareResult: UptoDateOrNotState = {
  name: "xxxx",
  githubLatestRelease: "1.0.0",
  githubLatestReleaseIncludesProductionVersion: false,
  productionVersionIncludesGithubLatestRelease: false,
  productionVersion: "1.0.0",
  state: true,
  strictlyEqual: true,
  urlGitHub: "",
  urlProduction: "",
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    uptodateForm: activeUptodateForm,
    isChangesOnModel: true,
    onSave: () => {
      return new Promise((resolv) => {
        resolv(null);
      });
    },
    onCompare: () => {
      return new Promise((resolv) => {
        resolv(compareResult);
      });
    },
    isRecordable: true,
  },
};

import type { Meta, StoryObj } from "@storybook/react";

import {
  ScrapGitHubReleaseTags,
  ScrapGitHubReleaseTagsProps,
} from "./ScrapGitHubReleaseTags";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";
import { UptodateForm, UptodateFormFields } from "../../../src/Global.types";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import { fn } from "@storybook/test";
import { useState } from "react";
import React from "react";

const releaseTagNameSample = [
  {
    name: "rc-4.0.0",
    zipball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/zipball/refs/tags/v3.0.1",
    tarball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/tarball/refs/tags/v3.0.1",
    commit: {
      sha: "f08ac87888a3b715e56bc10f60d5895a029d4c4b",
      url: "https://api.github.com/repos/healthchecks/healthchecks/commits/f08ac87888a3b715e56bc10f60d5895a029d4c4b",
    },
    node_id: "MDM6UmVmMzgwNjcwNzg6cmVmcy90YWdzL3YzLjAuMQ==",
  },
  {
    name: "v3.0.1",
    zipball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/zipball/refs/tags/v3.0.1",
    tarball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/tarball/refs/tags/v3.0.1",
    commit: {
      sha: "f08ac87888a3b715e56bc10f60d5895a029d4c4b",
      url: "https://api.github.com/repos/healthchecks/healthchecks/commits/f08ac87888a3b715e56bc10f60d5895a029d4c4b",
    },
    node_id: "MDM6UmVmMzgwNjcwNzg6cmVmcy90YWdzL3YzLjAuMQ==",
  },
  {
    name: "v3.0",
    zipball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/zipball/refs/tags/v3.0",
    tarball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/tarball/refs/tags/v3.0",
    commit: {
      sha: "1553a792057418f23626487d204d2c2576d79971",
      url: "https://api.github.com/repos/healthchecks/healthchecks/commits/1553a792057418f23626487d204d2c2576d79971",
    },
    node_id: "MDM6UmVmMzgwNjcwNzg6cmVmcy90YWdzL3YzLjA=",
  },
  {
    name: "v2.10",
    zipball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/zipball/refs/tags/v2.10",
    tarball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/tarball/refs/tags/v2.10",
    commit: {
      sha: "a2fdb5dc52d8b1b459bbea38a0859ff44856139e",
      url: "https://api.github.com/repos/healthchecks/healthchecks/commits/a2fdb5dc52d8b1b459bbea38a0859ff44856139e",
    },
    node_id: "MDM6UmVmMzgwNjcwNzg6cmVmcy90YWdzL3YyLjEw",
  },
  {
    name: "v2.9.2",
    zipball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/zipball/refs/tags/v2.9.2",
    tarball_url:
      "https://api.github.com/repos/healthchecks/healthchecks/tarball/refs/tags/v2.9.2",
    commit: {
      sha: "ee73091b72088cba6a5dd2140a9f95a7d232d3ae",
      url: "https://api.github.com/repos/healthchecks/healthchecks/commits/ee73091b72088cba6a5dd2140a9f95a7d232d3ae",
    },
    node_id: "MDM6UmVmMzgwNjcwNzg6cmVmcy90YWdzL3YyLjkuMg==",
  },
];

const activeUptodateForm: UptodateForm = {
  ...INITIALIZED_UPTODATEFORM,
  urlGitHub: "https://github.com/healthchecks/healthchecks",
  exprGithub: "v[\\d+.]+",
};

const Component = (args: ScrapGitHubReleaseTagsProps) => {
  const [control, setControl] = useState(args.activeUptodateForm);
  args = {
    ...args,
    handleOnChange: (key: UptodateFormFields, value: string | string[]) => {
      setControl({ ...control, [key]: value });
    },
  };
  return <ScrapGitHubReleaseTags {...args} activeUptodateForm={control} />;
};

const meta = {
  title: "Forms/ScrapGitHubReleaseTags",
  component: ScrapGitHubReleaseTags,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
    reactRouter: reactRouterParameters({
      location: { path: "/" },
    }),
  },
  args: {
    activeUptodateForm: activeUptodateForm,
    scrapUrl: (url: string) => {
      console.log(url);
      return new Promise((resolv) => {
        resolv(JSON.stringify(releaseTagNameSample));
      });
    },
    onDone: fn(),
    handleOnChange: fn(),
    displayError: fn(),
  },
  render: (args) => Component(args),
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ScrapGitHubReleaseTags>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

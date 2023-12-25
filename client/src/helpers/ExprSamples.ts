/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { SelectOptionType } from "../../../src/Global.types";

export const jmespathProductionSamples: SelectOptionType[] = [
  {
    value: "version",
    label: "One of the properties (eg: version)",
  },
  {
    value: "api.version",
    label: "A property of property (eg: api.version)",
  },
  {
    value: "join('.',*)",
    label: "Gather all properties",
  },
  {
    value: "{prefix: 'v',test:join('.',*)}|join('',*)",
    label: "Gather all properties & prefix with v",
  },
  {
    value: "{prefix: 'V',test:join('.',*)}|join('',*)",
    label: "Gather all properties & prefix with V",
  },
  {
    value: "{prefix: 'Version',test:join('.',*)}|join('',*)",
    label: "Gather all properties & prefix with Version",
  },
];

export const regExprProductionSamples: SelectOptionType[] = [
  {
    value: "(v[\\d+\\.+]+)",
    label: "v[x.] repetead (eg: vx, vx.y, vx.y.x...)",
  },
  {
    value: "(v[\\d+]\\.[\\d+]\\.[\\d+])",
    label: "vx.y.z strict",
  },
  {
    value: "(v[\\d+]\\.[\\d+])",
    label: "vx.y strict",
  },
  {
    value: "(V[\\d+]\\.[\\d+]\\.[\\d+])",
    label: "Vx.y.z strict",
  },
  {
    value: "(V[\\d+]\\.[\\d+])",
    label: "Vx.y strict",
  },
  {
    value: "([v|V][\\d+]\\.[\\d+]\\.[\\d+])",
    label: "vx.y.z | Vx.y.z strict",
  },
  {
    value: "([v|V][\\d+]\\.[\\d+])",
    label: "vx.y | Vx.y strict",
  },

  {
    value: "([\\d+]\\.[\\d+]\\.[\\d+])",
    label: "x.y.z strict",
  },
  {
    value: "([\\d+]\\.[\\d+])",
    label: "x.y strict",
  },
];

export const regExprGithubSamples: SelectOptionType[] = [
  { value: "^[v|V][0-9\\.]+$", label: "Keep vx.y & vx.y.z & Vx.y & Vx.y.z" },
  { value: "^[v|V]([0-9.]+$)", label: "Exclude prefix and keep x.y & x.y.z" },
  { value: "^v[0-9\\.]+$", label: "Keep vx.y & vx.y.z" },
  { value: "^V[0-9\\.]+$", label: "Keep Vx.y & Vx.y.z" },
  { value: "^v[0-9]+\\.[0-9]+$", label: "Keep vx.y" },
  { value: "^V[0-9]+\\.[0-9]+$", label: "Keep Vx.y" },
  { value: "^[0-9\\.]+$", label: "Keep x.y & x.y.z" },
  { value: "^[0-9]+\\.[0-9]+\\.[0-9]+\\.$", label: "Keep x.y.z" },
  { value: "^[0-9]+\\.[0-9]+$", label: "Keep x.y" },
  {
    value: "(^v1.[0-9]+.[0-9]+$)",
    label: "Keep only v1.x.y",
  },
  { value: ".*", label: "All" },
];

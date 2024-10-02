import { scrapUrlHeaderType } from "../../../src/Global.types";

export const buildHeader = (value: string): scrapUrlHeaderType => {
  return { scrapUrlHeader: value };
};

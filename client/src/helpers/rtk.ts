import { productionHttpHeaderType } from "../../../src/Global.types";

export const buildHeader = (value: string): productionHttpHeaderType => {
  return { productionhttpheader: value };
};

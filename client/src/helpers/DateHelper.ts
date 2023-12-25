/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { IntlShape } from "react-intl";

export const getRelativeTime = (ts: number, intl: IntlShape) => {
  const formatter = new Intl.RelativeTimeFormat(intl.locale, {
    style: `long`,
  });
  let period: Intl.RelativeTimeFormatUnit = "day";
  let diff = (new Date(ts).valueOf() - new Date().valueOf()) / 1000 / 86400;
  if (Math.abs(diff) < 1) {
    period = "hour";
    diff = (new Date(ts).valueOf() - new Date().valueOf()) / 1000 / 3600;
    if (Math.abs(diff) < 1) {
      period = "minute";
      diff = (new Date(ts).valueOf() - new Date().valueOf()) / 1000 / 60;
    }
  }
  return `${intl.formatMessage({
    id: "Execution date",
  })}: ${new Date(ts).toLocaleDateString()} ${new Date(
    ts
  ).toLocaleTimeString()} (${formatter.format(Math.trunc(diff), period)})`;
};

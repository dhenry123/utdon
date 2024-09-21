/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./UrlOpener.scss";

interface UrlOpenerProp {
  url: string;
}
export const UrlOpener = ({ url }: UrlOpenerProp) => {
  return (
    <div className={`UrlOpener`}>
      <a
        href={url}
        title={url}
        target={`_${url
          .replace(
            /^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+\.+[^:/?\n]+)/,
            "$1"
          )
          .replace(/\.+/g, "_")}`}
      >
        {url}
      </a>
    </div>
  );
};

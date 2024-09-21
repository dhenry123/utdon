/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./UrlOpener.scss";

interface UrlOpenerProp {
  url: string;
  className?: string;
}
export const UrlOpener = ({ url, className }: UrlOpenerProp) => {
  return (
    <div className={`UrlOpener`}>
      <a
        className={className ? className : ""}
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

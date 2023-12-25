/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./FieldSetClickableUrl.scss";
import { FieldSet, FieldSetProps } from "./FieldSet";

interface FieldSetClickableUrlProps extends FieldSetProps {
  url: string;
}
export const FieldSetClickableUrl = ({
  ...props
}: FieldSetClickableUrlProps) => {
  return (
    <FieldSet
      className={`FieldSetClickableUrl ${
        props.className ? props.className : ""
      }`}
      legend={props.legend}
    >
      <a
        href={props.url}
        title={props.url}
        target={`_${props.url
          .replace(
            /^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+\.+[^:/?\n]+)/,
            "$1"
          )
          .replace(/\.+/g, "_")}`}
      >
        {props.url}
      </a>
    </FieldSet>
  );
};

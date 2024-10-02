/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./FieldSetClickableUrl.scss";
import { FieldSet, FieldSetProps } from "./FieldSet";
import { UrlOpener } from "./UrlOpener";

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
      <UrlOpener url={props.url} />
    </FieldSet>
  );
};

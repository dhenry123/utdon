/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./FieldSet.scss";

export interface FieldSetProps {
  children?: JSX.Element | string | JSX.Element[];
  legend: string;
  className?: string;
}
export const FieldSet = ({ legend, children, className }: FieldSetProps) => {
  return (
    <fieldset className={`FieldSet ${className ? className : ""}`}>
      <legend>{legend}</legend>
      <div className="content">{children}</div>
    </fieldset>
  );
};

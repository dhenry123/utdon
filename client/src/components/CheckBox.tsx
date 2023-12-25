/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./CheckBox.scss";
import { ChangeEvent } from "react";

interface CheckBoxProps {
  label?: string;
  title?: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
export const CheckBox = ({
  label,
  title,
  checked,
  onChange,
}: CheckBoxProps) => {
  return (
    <div className={`CheckBox`} title={title ? title : ""}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label ? <div className="label">{label}</div> : null}
    </div>
  );
};

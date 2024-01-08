/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./InputIcon.scss";
import InputGeneric, { InputGenericProps } from "./InputGeneric";

interface InputIconProps extends InputGenericProps {
  icon: string;
}

export const InputIcon = ({ ...props }: InputIconProps) => {
  return (
    <div className={`InputIcon`}>
      <i className={`ti ti-${props.icon}`}></i>
      <InputGeneric
        type={props.type}
        value={props.value}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        onChange={props.onChange}
        onKeyUp={props.onKeyUp}
      />
    </div>
  );
};

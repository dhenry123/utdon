/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./ButtonGeneric.scss";

interface ButtonGenericProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  /**
   * enter only the name of Tabler icon
   */
  icon?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const ButtonGeneric = ({
  onClick,
  title,
  icon,
  label,
  className,
  disabled = false,
  autoFocus = false,
}: ButtonGenericProps) => {
  return (
    <button
      className={`ButtonGeneric ${disabled ? "disabled" : ""} ${
        className ? className : ""
      }`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      autoFocus={autoFocus}
    >
      {icon ? <i className={`ti ti-${icon}`}></i> : ""}
      {label ? <label className="label">{label}</label> : ""}
    </button>
  );
};

export default ButtonGeneric;

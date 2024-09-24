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
  onMouseDown?: () => void;
  onMouseUP?: () => void;
}

const ButtonGeneric = ({
  onClick,
  title,
  icon,
  label,
  className,
  disabled = false,
  autoFocus = false,
  onMouseDown,
  onMouseUP,
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
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUP}
      onKeyDown={onMouseDown}
      onKeyUp={onMouseUP}
    >
      {icon ? <i className={`ti ti-${icon}`}></i> : ""}
      {label ? <label className="label">{label}</label> : ""}
    </button>
  );
};

export default ButtonGeneric;

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useEffect } from "react";
import "./InputGeneric.scss";

export interface InputGenericProps {
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  title?: string;
  ref?: React.LegacyRef<HTMLInputElement>;
  className?: string;
  autoComplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onBlur?: React.FocusEventHandler;
  onKeyUp?: (keyboardKeyAsString: string) => void;
  onKeyDown?: (keyboardKeyAsString: string) => void;
}

const InputGeneric = ({
  type = "text",
  title,
  value,
  className,
  autoComplete = "on",
  placeholder,
  autoFocus = false,
  onChange,
  onBlur,
  onKeyUp,
  onKeyDown,
  ref,
}: InputGenericProps) => {
  useEffect(() => {
    onChange(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      className={`inputgeneric ${className}`}
      type={type}
      value={value}
      // return e => target.value
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyUp={(event) => (onKeyUp ? onKeyUp(event.key) : null)}
      onKeyDown={(event) => (onKeyDown ? onKeyDown(event.key) : null)}
      autoComplete={autoComplete}
      ref={ref}
      placeholder={placeholder}
      title={title}
      // Only one per page !!!!
      autoFocus={autoFocus}
    />
  );
};

export default InputGeneric;

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { SelectOptionType } from "../../../src/Global.types";

import "./SelectGeneric.scss";

interface SelectGeneric {
  options: SelectOptionType[];
  value: string;
  onChange: (value: string) => void;
  title?: string;
  className?: string;
  disableDefaultOption?: boolean;
  defaultOptionLabel?: string;
  defaultOptionValue?: string;
  disabled?: boolean;
}

const SelectGeneric = ({
  options = [],
  value,
  title,
  className,
  onChange,
  disableDefaultOption = false,
  defaultOptionLabel = "None",
  defaultOptionValue = "",
  disabled = false,
}: SelectGeneric) => {
  const intl = useIntl();
  return (
    <select
      className={`SelectGeneric ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      disabled={disabled}
    >
      {!disableDefaultOption ? (
        <option key="defaultoption" value={defaultOptionValue}>
          {intl.formatMessage({ id: defaultOptionLabel })}
        </option>
      ) : null}
      {options.map((item) => {
        return (
          <option key={item.key || item.value} value={item.value}>
            {intl.formatMessage({ id: item.label || item.value })}
          </option>
        );
      })}
    </select>
  );
};

export default SelectGeneric;

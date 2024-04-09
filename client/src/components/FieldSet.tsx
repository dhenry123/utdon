/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./FieldSet.scss";
import { IconWithTooltip } from "./IconWithTooltip";

export interface FieldSetProps {
  children?: JSX.Element | string | JSX.Element[];
  legend: string;
  className?: string;
  toolTipIcon?: string;
  toolTipContent?: string;
}
export const FieldSet = ({
  legend,
  children,
  className,
  toolTipIcon = "help",
  toolTipContent,
}: FieldSetProps) => {
  return (
    <fieldset className={`FieldSet ${className ? className : ""}`}>
      <legend>
        {legend}
        {toolTipContent ? (
          <IconWithTooltip icon={toolTipIcon} tooltipContent={toolTipContent} />
        ) : null}
      </legend>
      <div className="content">{children}</div>
    </fieldset>
  );
};

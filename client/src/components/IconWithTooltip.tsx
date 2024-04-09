/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./IconWithTooltip.scss";
import { useState } from "react";
interface IconWithTooltipProps {
  icon: string;
  tooltipContent: React.ReactNode;
}

export const IconWithTooltip = ({
  icon,
  tooltipContent,
}: IconWithTooltipProps) => {
  const intl = useIntl();

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = event;
    setShowTooltip(true);
    setTooltipPosition({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div
      className={`IconWithTooltip`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {icon ? <i className={`ti ti-${icon}`}></i> : ""}
      {showTooltip && (
        <div
          className="tooltip"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="tooltiptitle">
            {intl.formatMessage({ id: "Help" })}
          </div>
          <div className="tooltipbody">{tooltipContent}</div>
        </div>
      )}
    </div>
  );
};

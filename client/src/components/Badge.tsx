/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./Badge.scss";

interface BadgeProps {
  isSuccess: boolean;
  isWarning?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  title?: string;
  noState?: boolean;
}
export const Badge = ({
  isSuccess,
  isWarning,
  onClick,
  title,
  noState,
}: BadgeProps) => {
  return (
    <div
      className={`Badge`}
      onClick={onClick ? onClick : () => {}}
      title={title ? title : ""}
    >
      <div className={`label`}>State</div>
      <div
        className={`value ${
          isSuccess
            ? isWarning
              ? "uptodatewithwarn"
              : "uptodate"
            : noState
            ? "nostate"
            : "toupdate"
        }`}
      >
        {isSuccess ? "UP to date" : noState ? "No State" : "OUT of date"}
      </div>
    </div>
  );
};

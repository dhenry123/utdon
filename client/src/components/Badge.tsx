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
}
export const Badge = ({ isSuccess, isWarning, onClick, title }: BadgeProps) => {
  return (
    <div
      className={`Badge`}
      onClick={onClick ? onClick : () => {}}
      title={title ? title : ""}
    >
      <div className={`label`}>State</div>
      <div
        className={`value ${
          isSuccess ? (isWarning ? "uptodatewithwarn" : "uptodate") : "toupdate"
        }`}
      >
        {isSuccess ? "UP to date" : "OUT of date"}
      </div>
    </div>
  );
};

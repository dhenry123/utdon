/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./Block.scss";

interface BlockProps {
  children: JSX.Element | string | JSX.Element[];
  className?: string;
}
export const Block = ({ children, className }: BlockProps) => {
  return (
    <div className={`Block ${className ? className : ""}`}>{children}</div>
  );
};

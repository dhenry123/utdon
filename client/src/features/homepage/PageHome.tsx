/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { Header } from "../../components/Header";
import { Outlet } from "react-router-dom";

export const PageHome = () => {
  return (
    <div className={`PageHome`}>
      <Header />
      <Outlet />
    </div>
  );
};

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { Header } from "../../components/Header";
import { Outlet } from "react-router-dom";
import "./PageHome.scss";

export const PageHome = () => {
  return (
    <div className={`PageHome`}>
      <Header />
      <Outlet />
    </div>
  );
};

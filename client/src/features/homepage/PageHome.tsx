/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useAppSelector } from "../../app/hook";
import { Header } from "../../components/Header";
import { Outlet } from "react-router-dom";

export const PageHome = () => {
  const theme = useAppSelector((state) => state.context.theme);
  return (
    <div className={`main ${theme}`}>
      <Header />
      <Outlet />
    </div>
  );
};

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch } from "../app/hook";
import { useNavigate } from "react-router-dom";

import "./TPL.scss";
export const TPL = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return <div className={`TPL`}></div>;
};

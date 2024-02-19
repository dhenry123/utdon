/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./PageLogin.scss";

import { useIntl } from "react-intl";
import { usePostUserLoginMutation } from "../../api/mytinydcUPDONApi";
import { clearToast, showServiceMessage } from "../../app/serviceMessageSlice";
import { useAppDispatch, useAppSelector } from "../../app/hook";
import { useNavigate } from "react-router-dom";
import { LoginBlock } from "../../components/LoginBlock";
import { PostAuthent } from "../../../../src/Global.types";
import {
  APPLICATION_VERSION,
  INITIALIZED_TOAST,
} from "../../../../src/Constants";

export const PageLogin = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const navigate = useNavigate();
  const [userLogin] = usePostUserLoginMutation();

  const applicationContext = useAppSelector(
    (state) => state.context.application
  );
  /**
   * @param {string} jsonloginpassword - see swagger documentation (data model)
   */
  const handleOnLogin = async (jsonloginpassword: PostAuthent) => {
    return await userLogin(jsonloginpassword)
      .unwrap()
      .then(async () => {
        // user info will be set by header. Header is calle even user press F5
        // if already connected, info will be redispatch on global state
        // reset Toast
        await dispatch(clearToast());
        return navigate("/");
      })
      .catch((error) => {
        let message = intl.formatMessage({ id: "Authentication failure" });
        if (error.originalStatus !== 401)
          message = intl.formatMessage({
            id: "Unexpected error, see server logs",
          });
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            detail: intl.formatMessage({ id: message }),
          })
        );
        return null;
      });
  };

  return (
    <div className="PageLogin">
      <div className="container">
        <div className="logo"></div>
        <div className="login">
          <div className="explanations">
            <span
              className="title"
              title={intl.formatMessage({
                id: "Is Your FOSS Application UpToDate OR Not",
              })}
            >
              Is Your FOSS Application UpToDateOrNot?
            </span>
          </div>
          <LoginBlock onLogin={handleOnLogin} />
        </div>
        <div className="bottom">
          &copy; Copyright{" "}
          <a href="https://www.mytinydc.com" target="_mytinydc_com">
            Mytinydc.com
          </a>
          {" - "} {applicationContext.copyrightts} - Licence{" "}
          {applicationContext.licence}
          {" - "}
          <a href="/api/doc" target="_swagger_api_doc">
            {intl.formatMessage({ id: "API Documentation" })}
          </a>
          {` - Version: ${APPLICATION_VERSION}`}
        </div>
      </div>
    </div>
  );
};

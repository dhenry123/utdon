/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useNavigate } from "react-router-dom";
import { mytinydcUPDONApi, useGetUserInfoQuery } from "../api/mytinydcUPDONApi";
import { useIntl } from "react-intl";
import ButtonGeneric from "./ButtonGeneric";
import { useAppDispatch } from "../app/hook";

import "./Header.scss";
import { useState } from "react";
import { Dialog } from "./Dialog";
import { ChangePassword } from "../features/changepassword/ChangePassword";
import { CurlCommands } from "../features/curlcommands/CurlCommands";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { ErrorServer } from "../../../src/Global.types";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { APPLICATION_VERSION, INITIALIZED_TOAST } from "../../../src/Constants";
import { setRefetchuptodateForm } from "../app/contextSlice";
import { UserManager } from "../features/usermanager/UserManager.tsx";

export const Header = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const [dialogHeader, setDialogHeader] = useState("");

  /**
   * Used for server errors (api entrypoint call)
   * @param error
   * @returns
   */
  const dispatchServerError = (error: FetchBaseQueryError) => {
    if (error) {
      const servererror = error.data as ErrorServer;
      if (servererror.error) {
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "error",
            sticky: true,
            detail: intl.formatMessage({ id: servererror.error }),
          })
        );
      }
      if (error.status === 401) return navigate("/login");
    }
  };

  const handleOnLogout = () => {
    dispatch(mytinydcUPDONApi.endpoints.getUserLogout.initiate(null)).then(
      () => {
        return navigate("/login");
      }
    );
  };

  const handleOnNavigateToApiDoc = () => {
    window.open("/api/doc/", "_swagger_api_doc");
  };

  const displayDialogChangePassword = () => {
    setDialogHeader(
      intl.formatMessage({
        id: "Renew your password or API authentication token",
      })
    );
    setDialogContent(
      <ChangePassword onHide={() => setIsDialogVisible(false)} />
    );
    setIsDialogVisible(true);
  };

  const displayDialogCurlCommands = () => {
    dispatch(mytinydcUPDONApi.endpoints.getBearer.initiate(null))
      .unwrap()
      .then((response) => {
        setDialogHeader(
          intl.formatMessage({ id: "Curl commands for all controls" })
        );
        setDialogContent(
          <CurlCommands
            uptodateForm={"all"}
            userAuthBearer={response.bearer}
            onClose={() => setIsDialogVisible(false)}
          />
        );
        setIsDialogVisible(true);
      })
      .catch((error) => {
        dispatchServerError(error);
      });
  };

  const displayDialogUsersManager = () => {
      setDialogHeader(
          intl.formatMessage({
              id: "Users manager",
          })
      );
      setDialogContent(
          <UserManager />
      );
      setIsDialogVisible(true);
  }

  const [dialogContent, setDialogContent] = useState(<></>);

  const {
      data: userInfo,
      isSuccess
  } = useGetUserInfoQuery(null, {
      skip: false,
  });

  return (
    <div className="header">
      <div className="buttonsgroup">
        <div
          className={`logo`}
          onClick={() => navigate("/")}
          title={`${intl.formatMessage({
            id: "Homepage",
          })} - Version ${APPLICATION_VERSION}`}
        />
        <div className="borderLeft"></div>
        <ButtonGeneric
          icon={"cylinder"}
          title={intl.formatMessage({ id: "Display all controls" })}
          onClick={() => {
            return navigate("/");
          }}
        />
        {location.pathname === "/" ? (
          <ButtonGeneric
            icon={"refresh"}
            title={intl.formatMessage({
              id: "Update the content of all controls",
            })}
            onClick={() => {
              dispatch(setRefetchuptodateForm(true));
            }}
          />
        ) : null}

        <ButtonGeneric
          icon={"plus"}
          title={intl.formatMessage({ id: "Add a control" })}
          onClick={() => {
            return navigate("/ui/addcontrol");
          }}
          className="addcontrol"
        />
        <ButtonGeneric
          icon={"slashes"}
          title={intl.formatMessage({ id: "General curl commands" })}
          onClick={displayDialogCurlCommands}
          className="curlcommands"
        />
        <div className="flexPushLeft logout">
            <div className="loginName">
                <div className="ti ti-user"></div>
                {isSuccess ? userInfo.login && userInfo.login : "..."}
            </div>
            <ButtonGeneric onClick={displayDialogUsersManager} icon={"users"} title={intl.formatMessage({ id: "Change you password" })} />

            <ButtonGeneric
            icon={"file-function"}
            title={intl.formatMessage({ id: "API Documentation" })}
            onClick={handleOnNavigateToApiDoc}
          />
          <ButtonGeneric
            icon={"key"}
            title={intl.formatMessage({ id: "Change you password" })}
            onClick={displayDialogChangePassword}
          />
          <ButtonGeneric
            icon={"ti ti-logout"}
            title={intl.formatMessage({ id: "Logout" })}
            onClick={handleOnLogout}
          />
        </div>
      </div>
      <Dialog
        visible={isDialogVisible}
        onHide={() => setIsDialogVisible(false)}
        closeButton
        header={dialogHeader}
      >
        {dialogContent}
      </Dialog>
    </div>
  );
};

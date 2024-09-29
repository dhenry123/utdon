/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useNavigate } from "react-router-dom";
import {
  mytinydcUPDONApi,
  useGetAuthTokenQuery,
  useGetUserLoginQuery,
} from "../api/mytinydcUPDONApi";
import { useIntl } from "react-intl";
import ButtonGeneric from "./ButtonGeneric";
import { useAppDispatch, useAppSelector } from "../app/hook";

import "./Header.scss";
import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { ChangePassword } from "../features/changepassword/ChangePassword";
import { CurlCommands } from "../features/curlcommands/CurlCommands";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { ErrorServer } from "../../../src/Global.types";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { APPLICATION_VERSION, INITIALIZED_TOAST } from "../../../src/Constants";
import {
  setAuthToken,
  setDisplayControlsAsList,
  setIsAdmin,
  setRefetchuptodateForm,
} from "../app/contextSlice";
import { UserManager } from "../features/usermanager/UserManager.tsx";
import { Search } from "./Search.tsx";
import { GlobalGithubToken } from "./GlobalGithubToken.tsx";

export const Header = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const [dialogHeader, setDialogHeader] = useState("");

  const isAdmin = useAppSelector((state) => state.context.isAdmin);

  const searchString = useAppSelector((state) => state.context.search);

  const displayControlsAsList = useAppSelector(
    (state) => state.context.displayControlsType
  );

  const { data: authToken } = useGetAuthTokenQuery(null);

  /**
   * Used for server errors (api entrypoint call)
   * @param error
   * @returns
   */

  useEffect(() => {
    if (authToken) dispatch(setAuthToken(authToken));
  }, [authToken]);

  const dispatchServerError = (error: FetchBaseQueryError) => {
    if (error && error.data) {
      const servererror = error.data as ErrorServer;
      if (servererror.error) {
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "error",
            sticky: true,
            detail: `Header: ${servererror.error}}`,
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

  const handleOnSetGlobalGithubToken = (token: string) => {
    if (token) {
      dispatch(
        mytinydcUPDONApi.endpoints.pubGlobalgithubtoken.initiate({ token })
      )
        .unwrap()
        .then((response) => {
          if (response === "OK") {
            setIsDialogVisible(false);
            dispatch(
              showServiceMessage({
                ...INITIALIZED_TOAST,
                severity: "info",
                sticky: true,
                detail: intl.formatMessage({
                  id: "The global Github token has been updated",
                }),
              })
            );
          }
        })
        .catch((error: FetchBaseQueryError) => {
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "error",
              sticky: true,
              detail: error.data ? error.data : "unknown error",
            })
          );
        });
    }
  };

  const displayDialogGlobalGithubToken = () => {
    setDialogHeader(intl.formatMessage({ id: "Global Github token" }));
    setDialogContent(
      <GlobalGithubToken
        onHide={() => setIsDialogVisible(false)}
        handleOnPost={handleOnSetGlobalGithubToken}
      />
    );
    setIsDialogVisible(true);
  };

  const toggleListTable = () => {
    dispatch(
      setDisplayControlsAsList(
        displayControlsAsList === "cards" ? "table" : "cards"
      )
    );
  };

  const displayDialogCurlCommands = () => {
    if (authToken) {
      setDialogHeader(
        intl.formatMessage({ id: "Curl commands for all controls" })
      );
      setDialogContent(
        <CurlCommands
          uptodateForm={"all"}
          userAuthToken={authToken}
          onClose={() => setIsDialogVisible(false)}
        />
      );
      setIsDialogVisible(true);
    }
  };

  const displayDialogUsersManager = () => {
    setDialogHeader(
      intl.formatMessage({
        id: "Users manager",
      })
    );
    setDialogContent(<UserManager />);
    setIsDialogVisible(true);
  };

  const [dialogContent, setDialogContent] = useState(<></>);

  const { data: userInfo, isSuccess } = useGetUserLoginQuery(null, {
    skip: false,
  });

  useEffect(() => {
    dispatch(
      mytinydcUPDONApi.endpoints.isAdmin.initiate(null, { forceRefetch: true })
    )
      .unwrap()
      .then(() => {
        dispatch(setIsAdmin(true));
      })
      .catch((error: FetchBaseQueryError) => {
        dispatch(setIsAdmin(false));
        if (error && error.status !== 401) dispatchServerError(error);
      });
  }, []);

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
        <div className="apicontrols">
          <ButtonGeneric
            icon={"file-function"}
            title={intl.formatMessage({ id: "API Documentation" })}
            onClick={handleOnNavigateToApiDoc}
          />
          <ButtonGeneric
            icon={"slashes"}
            title={intl.formatMessage({ id: "General curl commands" })}
            onClick={displayDialogCurlCommands}
          />
        </div>
        {location.pathname === "/" ? (
          <Search searchString={searchString} />
        ) : null}
        <div className="flexPushLeft logout">
          <div className="manager">
            {isAdmin ? (
              <>
                <ButtonGeneric
                  onClick={displayDialogUsersManager}
                  icon={"users"}
                  title={intl.formatMessage({ id: "Users manager" })}
                />

                <ButtonGeneric
                  icon={"brand-github"}
                  title={intl.formatMessage({ id: "Global Github token" })}
                  onClick={displayDialogGlobalGithubToken}
                />
              </>
            ) : null}
            <ButtonGeneric
              icon={"key"}
              title={intl.formatMessage({ id: "Change you password" })}
              onClick={displayDialogChangePassword}
            />
          </div>
          <ButtonGeneric
            icon={`${
              displayControlsAsList === "cards" ? "article" : "border-all"
            }`}
            title={intl.formatMessage({
              id:
                displayControlsAsList === "cards"
                  ? "Display in table format"
                  : "Display in card format",
            })}
            onClick={toggleListTable}
          />
          <ButtonGeneric
            icon={"logout"}
            title={`${intl.formatMessage({ id: "Logout" })}: ${
              userInfo && userInfo.login ? userInfo.login : ""
            }`}
            onClick={handleOnLogout}
            label={isSuccess ? userInfo.login && userInfo.login : "..."}
            className="buttonlogout"
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

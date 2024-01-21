/**
 * @author Lucie Delestre
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hook";
import { useNavigate } from "react-router-dom";

import "./UserManager.scss";
import InputGeneric from "../../components/InputGeneric";
import { useEffect, useState } from "react";
import {
  INITIALIZED_NEWUSER,
  INITIALIZED_TOAST,
} from "../../../../src/Constants";
import { ErrorServer, NewUserType } from "../../../../src/Global.types";
import { FieldSet } from "../../components/FieldSet";
import ButtonGeneric from "../../components/ButtonGeneric";
import { Block } from "../../components/Block";
import { mytinydcUPDONApi, useGetUsersQuery } from "../../api/mytinydcUPDONApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { showServiceMessage } from "../../app/serviceMessageSlice";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export const UserManager = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<NewUserType>(INITIALIZED_NEWUSER);
  const [httpMethod, setHttpMethod] = useState<"POST" | "PUT">("POST");

  const { data: users, isSuccess } = useGetUsersQuery(null, {
    skip: false,
  });

  const userLogger = useAppSelector((state) => state.context.user);

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [userToDelete, setUserToDelete] = useState<null | string>(null);
  const [confirmDeleteIsVisible, setConfirmDeleteIsVisible] = useState(false);
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

  const handleOnPost = async (e: React.FormEvent | null) => {
    e?.preventDefault();
    if (formData.login && formData.password) {
      (httpMethod === "POST"
        ? dispatch(mytinydcUPDONApi.endpoints.postUser.initiate(formData))
        : dispatch(mytinydcUPDONApi.endpoints.putUser.initiate(formData))
      )
        .unwrap()
        .then(() => {
          // onHide();
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "info",
              sticky: false,
              detail: `${
                httpMethod === "POST"
                  ? intl.formatMessage({ id: `User created` })
                  : intl.formatMessage({ id: `User updated` })
              }: ${formData.login}`,
            })
          );
          setFormData(INITIALIZED_NEWUSER);
        })
        .catch((error) => {
          dispatchServerError(error);
        })
        .finally(() => {
          setHttpMethod("POST");
        });
    }
  };

  const deleteUser = () => {
    if (userToDelete) {
      dispatch(mytinydcUPDONApi.endpoints.deleteUser.initiate(userToDelete))
        .unwrap()
        .then(() => {
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "info",
              sticky: false,
              detail: `${intl.formatMessage({
                id: `User deleted`,
              })}: ${userToDelete}`,
            })
          );
        })
        .catch((error) => {
          dispatchServerError(error);
        })
        .finally(() => {
          setUserToDelete(null);
        });
    }
  };
  const handleOnDelete = async (user: string) => {
    setUserToDelete(user);
    setConfirmDeleteIsVisible(true);
    return;
  };

  const handleOnEdit = async (user: string) => {
    setFormData({ login: user, password: "" });
    setHttpMethod("PUT");
    dispatch(
      showServiceMessage({
        ...INITIALIZED_TOAST,
        severity: "info",
        sticky: false,
        detail: `${intl.formatMessage({
          id: `You can assign a new password for the selected user`,
        })}: ${user}`,
      })
    );
  };

  const handleOnChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  useEffect(() => {
    if (formData.password && formData.login) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [formData]);

  return (
    <div className="UserManager">
      <h2 className={"new-user-label"}>
        {intl.formatMessage({ id: "Add a new user" })}
      </h2>
      <Block>
        <form onSubmit={handleOnPost} className={"form"}>
          <FieldSet
            legend={intl.formatMessage({ id: "Username" })}
            className="expression"
          >
            <InputGeneric
              value={formData.login}
              onChange={(value) => handleOnChange("login", value)}
              autoComplete="off"
            />
          </FieldSet>
          <FieldSet
            legend={intl.formatMessage({ id: "Password" })}
            className="password"
          >
            <InputGeneric
              value={formData.password}
              type={"password"}
              onChange={(value) => handleOnChange("password", value)}
              autoComplete="new-password"
            />
          </FieldSet>
          <FieldSet
            legend={intl.formatMessage({ id: "Submit" })}
            className={"submit-button"}
          >
            <ButtonGeneric
              className="success submit-button"
              onClick={handleOnPost}
              label={intl.formatMessage({ id: "Submit" })}
              disabled={isButtonDisabled}
            />
          </FieldSet>
        </form>
      </Block>

      <Block className="userslist">
        <h2 className={"new-user-label"}>
          {intl.formatMessage({ id: "Users list" })}
        </h2>
        <div className="table-container">
          <div className="flex-table flex-header" role="rowgroup">
            <div className="flex-row first" role="columnheader">
              #
            </div>
            <div className="flex-row" role="columnheader">
              {intl.formatMessage({ id: "Username" })}
            </div>
            <div className="flex-row" role="columnheader">
              {intl.formatMessage({ id: "Actions" })}
            </div>
          </div>
          {isSuccess &&
            (users as string[]).map((user) => {
              return (
                <div key={user} className="flex-table row" role="rowgroup">
                  <div className="flex-row first" role="cell">
                    {""}
                  </div>
                  <div className="flex-row " role="cell">
                    {user}
                  </div>
                  <div className="flex-row " role="cell">
                    {user !== "admin" && user !== userLogger.login ? (
                      <div className="buttonsgroup">
                        <ButtonGeneric
                          onClick={() => handleOnDelete(user)}
                          title={intl.formatMessage({ id: "Delete" })}
                          icon={"trash"}
                        />
                        <ButtonGeneric
                          onClick={() => handleOnEdit(user)}
                          title={intl.formatMessage({ id: "Edit" })}
                          icon={"edit"}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
        </div>
      </Block>
      <ConfirmDialog
        visible={confirmDeleteIsVisible}
        message={
          intl.formatMessage({ id: "Are you sure to delete this user" }) + " ?"
        }
        onConfirm={() => {
          setConfirmDeleteIsVisible(false);
          deleteUser();
        }}
        onCancel={() => setConfirmDeleteIsVisible(false)}
      />
    </div>
  );
};

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
import {
  ErrorServer,
  NewUserType,
  UserDescriptionType,
} from "../../../../src/Global.types";
import { FieldSet } from "../../components/FieldSet";
import ButtonGeneric from "../../components/ButtonGeneric";
import { Block } from "../../components/Block";
import {
  mytinydcUPDONApi,
  useGetGroupsQuery,
  useGetUsersQuery,
} from "../../api/mytinydcUPDONApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { showServiceMessage } from "../../app/serviceMessageSlice";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { MultiSelect, Option } from "react-multi-select-component";
import { buidMultiSelectGroups } from "../../helpers/UiMiscHelper";

export const UserManager = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<NewUserType>(INITIALIZED_NEWUSER);
  const [httpMethod, setHttpMethod] = useState<"POST" | "PUT">("POST");
  const [editMode, setEditMode] = useState<boolean>(false);

  const [userGroups, setUserGroups] = useState<string[]>([]);

  const {
    data: users,
    isSuccess,
    refetch,
    isUninitialized,
  } = useGetUsersQuery(null, {
    skip: false,
  });

  const {
    data: groupsFromServer,
    isSuccess: isSuccessGroups,
    refetch: refetchGroups,
    isUninitialized: isUninitializedGroups,
  } = useGetGroupsQuery(null, {
    skip: false,
  });

  const userLogger = useAppSelector((state) => state.context.user);

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [userToDelete, setUserToDelete] = useState<null | UserDescriptionType>(
    null
  );
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

  const setContextAsNewUser = () => {
    setEditMode(false);
    setFormData({ ...INITIALIZED_NEWUSER });
    setHttpMethod("POST");
  };

  const handleOnPost = async (e: React.FormEvent | null) => {
    e?.preventDefault();
    if (isFormComplete()) {
      (httpMethod === "POST"
        ? dispatch(mytinydcUPDONApi.endpoints.postUser.initiate(formData))
        : dispatch(mytinydcUPDONApi.endpoints.putUser.initiate(formData))
      )
        .unwrap()
        .then(() => {
          setContextAsNewUser();
          // onHide();
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "info",
              sticky: false,
              detail: `${
                httpMethod === "POST"
                  ? intl.formatMessage({ id: `The user has been created` })
                  : intl.formatMessage({ id: `The user has been updated` })
              }: ${formData.login}`,
            })
          );
          setFormData(INITIALIZED_NEWUSER);
        })
        .catch((error: FetchBaseQueryError) => {
          dispatchServerError(error);
        });
    }
  };

  const deleteUser = () => {
    if (userToDelete) {
      dispatch(
        mytinydcUPDONApi.endpoints.deleteUser.initiate(userToDelete.uuid)
      )
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
  const handleOnDelete = async (user: UserDescriptionType) => {
    setContextAsNewUser();
    setUserToDelete(user);
    setConfirmDeleteIsVisible(true);
  };

  const handleOnEdit = async (user: UserDescriptionType) => {
    const userDesc = {
      ...user,
      groups: user.groups,
      password: "",
      uuid: user.uuid,
    } as NewUserType;
    setEditMode(true);
    setFormData(userDesc);
    setHttpMethod("PUT");
    dispatch(
      showServiceMessage({
        ...INITIALIZED_TOAST,
        severity: "info",
        sticky: false,
        detail: `${intl.formatMessage({
          id: `You can assign a new password, or groups to the selected user`,
        })}: ${user.login}`,
        life: 8000,
      })
    );
  };

  const handleOnChange = (key: string, value: string | string[] | Option[]) => {
    // Convert Option[] to string[]
    if (key === "groups" && Array.isArray(value)) {
      const updateGroups: string[] = [];
      const newGroups: string[] = [];
      for (const option of value as Option[]) {
        const test = { ...option } as any; //__isNew__ not set as normal attribut ???
        if (test.__isNew__) updateGroups.push(option.label);
        newGroups.push(option.label);
      }
      value = [...newGroups];
      if (updateGroups.length > 0) {
        setUserGroups(userGroups.concat(updateGroups));
      }
    }
    setFormData({ ...formData, [key]: value });
  };

  const isFormComplete = () => {
    // mandatory password if new user
    if (!formData.uuid && !formData.password) return false;
    // mandatory login and group
    if (formData.login && formData.groups.length > 0) return true;
    return false;
  };

  useEffect(() => {
    if (isFormComplete()) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [formData]);

  useEffect(() => {
    if (groupsFromServer) setUserGroups(groupsFromServer);
  }, [groupsFromServer]);

  useEffect(() => {
    if (!isUninitialized) refetch();
    if (!isUninitializedGroups) refetchGroups();
  }, []);

  return (
    <div className="UserManager">
      {!editMode ? (
        <div className="title">
          <h2 className={"new-user-label"}>
            {intl.formatMessage({ id: "Add a new user" })}
          </h2>
        </div>
      ) : (
        <div className="title">
          <h2 className={"new-user-label"}>
            {intl.formatMessage({ id: "Edit user" })}
          </h2>
          <ButtonGeneric
            icon="plus"
            onClick={() => {
              setFormData(INITIALIZED_NEWUSER);
              setEditMode(false);
              setHttpMethod("POST");
            }}
            title={intl.formatMessage({ id: "Add a new user" })}
          />
        </div>
      )}
      <Block>
        <form onSubmit={handleOnPost} className={"form"}>
          <FieldSet
            legend={intl.formatMessage({ id: "Username" })}
            className="username"
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
            legend={intl.formatMessage({ id: "Groups" })}
            className="groups"
          >
            <MultiSelect
              options={userGroups ? buidMultiSelectGroups(userGroups) : []}
              value={
                formData.groups && formData.groups.length > 0
                  ? buidMultiSelectGroups(formData.groups)
                  : []
              }
              onChange={(values: Option[]) => handleOnChange("groups", values)}
              labelledBy={intl.formatMessage({ id: "Includes in group(s)" })}
              isCreatable={true}
              disabled={!formData.login}
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
              {intl.formatMessage({ id: "Groups" })}
            </div>
            <div className="flex-row" role="columnheader">
              {intl.formatMessage({ id: "Actions" })}
            </div>
          </div>
          {isSuccess &&
            isSuccessGroups &&
            (users as UserDescriptionType[]).map((user) => {
              return (
                <div key={user.uuid} className="flex-table row" role="rowgroup">
                  <div className="flex-row first" role="cell">
                    {""}
                  </div>
                  <div className="flex-row " role="cell">
                    {user.login}
                  </div>
                  <div
                    className="flex-row groups"
                    role="cell"
                    title={user.groups.join(",")}
                  >
                    {user.groups.join(",")}
                  </div>
                  <div className="flex-row " role="cell">
                    {user.login !== "admin" &&
                    user.login !== userLogger.login ? (
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
        message={`${
          intl.formatMessage({ id: "Are you sure to delete this user" }) + " ?"
        } [${userToDelete?.login} - ${userToDelete?.uuid}]`}
        onConfirm={() => {
          setConfirmDeleteIsVisible(false);
          deleteUser();
        }}
        onCancel={() => setConfirmDeleteIsVisible(false)}
      />
    </div>
  );
};

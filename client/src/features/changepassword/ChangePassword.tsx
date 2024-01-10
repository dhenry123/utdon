/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hook";
import { useNavigate } from "react-router-dom";

import "./ChangePassword.scss";
import InputGeneric from "../../components/InputGeneric";
import { useEffect, useState } from "react";
import {
  INITIALIZED_CHANGEPASSWORD,
  INITIALIZED_TOAST,
} from "../../../../src/Constants";
import { ChangePasswordType, ErrorServer } from "../../../../src/Global.types";
import { FieldSet } from "../../components/FieldSet";
import ButtonGeneric from "../../components/ButtonGeneric";
import { Block } from "../../components/Block";
import { mytinydcUPDONApi } from "../../api/mytinydcUPDONApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { showServiceMessage } from "../../app/serviceMessageSlice";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface ChangePasswordProps {
  onHide: () => void;
}
export const ChangePassword = ({ onHide }: ChangePasswordProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const login = useAppSelector((state) => state.context.user.login);

    const [formData, setFormData] = useState<ChangePasswordType>(
    INITIALIZED_CHANGEPASSWORD
  );

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [isDialogVisible, setIsDialogVisible] = useState(false);

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

  const handleOnPost = async () => {
    if (
      formData.password &&
      formData.newPassword &&
      formData.newConfirmPassword &&
      formData.newPassword === formData.newConfirmPassword
    ) {
    dispatch(mytinydcUPDONApi.endpoints.putChangePassword.initiate({
        ...formData,
        login
      }))
        .unwrap()
        .then(() => {
          onHide();
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "info",
              sticky: true,
              detail: intl.formatMessage({
                id: "Your password has been changed",
              }),
            })
          );
        })
        .catch((error) => {
          dispatchServerError(error);
        });
    }
  };
  const handleOnChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleOnRenewTokenApi = () => {
    setIsDialogVisible(false);
    dispatch(mytinydcUPDONApi.endpoints.putBearer.initiate(null))
      .unwrap()
      // 204 no response
      .then(() => {
        onHide();
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "info",
            sticky: true,
            detail: intl.formatMessage({
              id: "Your authentication token has been changed",
            }),
          })
        );
      })
      .catch((error: FetchBaseQueryError) => {
        dispatchServerError(error);
      });
  };

  useEffect(() => {
    if (
      formData.password &&
      formData.newPassword &&
      formData.newConfirmPassword &&
      formData.newPassword === formData.newConfirmPassword
    ) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [formData]);

  return (
    <Block className={`ChangePassword`}>
      <FieldSet legend={intl.formatMessage({ id: "Your current password" })}>
        <InputGeneric
          value={formData.password}
          onChange={(value: string) => handleOnChange("password", value)}
          autoComplete="new-password"
          type="password"
        />
      </FieldSet>
      <FieldSet legend={intl.formatMessage({ id: "Your new password" })}>
        <InputGeneric
          value={formData.newPassword}
          onChange={(value: string) => handleOnChange("newPassword", value)}
          type="password"
          autoComplete="new-password"
        />
      </FieldSet>
      <FieldSet
        legend={intl.formatMessage({ id: "Confirm your current password" })}
      >
        <InputGeneric
          value={formData.newConfirmPassword}
          onChange={(value: string) =>
            handleOnChange("newConfirmPassword", value)
          }
          type="password"
          autoComplete="new-password"
          onKeyUp={(key: string) => {
            if (key === "Enter") handleOnPost();
          }}
        />
      </FieldSet>
      <div className="groupButtons">
        <ButtonGeneric
          label={intl.formatMessage({ id: "Save" })}
          onClick={handleOnPost}
          disabled={isButtonDisabled}
          className={isButtonDisabled ? "disabled" : ""}
          title={
            isButtonDisabled
              ? intl.formatMessage({
                  id: "Disabled because form not filled in",
                })
              : ""
          }
        />
        <ButtonGeneric
          label={intl.formatMessage({
            id: "Renew your API authentication token",
          })}
          onClick={() => setIsDialogVisible(true)}
          className={"error"}
        />
      </div>
      <ConfirmDialog
        message={intl.formatMessage({
          id: "Are you sure you want to change the authentication token? You'll need to update all tools calling this API.",
        })}
        onCancel={() => setIsDialogVisible(false)}
        onConfirm={() => handleOnRenewTokenApi()}
        visible={isDialogVisible}
      />
    </Block>
  );
};

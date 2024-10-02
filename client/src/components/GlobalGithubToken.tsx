/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./GlobalGithubToken.scss";
import { Block } from "./Block";
import ButtonGeneric from "./ButtonGeneric";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { FieldSet } from "./FieldSet";
import InputGeneric from "./InputGeneric";
import { useGetGlobalgithubtokenQuery } from "../api/mytinydcUPDONApi";

interface GlobalGithubTokenProps {
  onHide: () => void;
  handleOnPost: (token: string) => void;
}
export const GlobalGithubToken = ({
  onHide,
  handleOnPost,
}: GlobalGithubTokenProps) => {
  const intl = useIntl();

  const defaultInputType = "password";
  const [globalGithubToken, setGlobalGithubToken] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [inputType, setInputType] = useState(defaultInputType);

  const { data } = useGetGlobalgithubtokenQuery(null);

  useEffect(() => {
    setIsButtonDisabled(!(globalGithubToken.length >= 40));
  }, [globalGithubToken]);

  useEffect(() => {
    if (data) setGlobalGithubToken(data);
  }, [data]);

  return (
    <Block className={`GlobalGithubToken`}>
      <FieldSet
        className="githubtoken"
        legend={intl.formatMessage({ id: "Specify Github token" })}
      >
        <div className="explain">
          <label>
            {intl.formatMessage({
              id: "This github token is used to query all Github repositories linked to the controls",
            })}
            .
          </label>
          <label>
            <b>{intl.formatMessage({ id: "It is not used" })}</b>{" "}
            {intl.formatMessage({
              id: "when the control already has an authentication header",
            })}{" "}
            ({intl.formatMessage({ id: "e.g. for private repositories" })}).
          </label>
          <label>
            {intl.formatMessage({
              id: "This prevents Github from blocking the rate-limit",
            })}
            .
          </label>
        </div>
        <div className="input">
          <InputGeneric
            value={globalGithubToken}
            onChange={(value: string) => setGlobalGithubToken(value)}
            type={inputType}
            autoComplete="new-password"
            onKeyUp={(key: string) => {
              if (key === "Enter") handleOnPost(globalGithubToken);
            }}
          />
          <ButtonGeneric
            icon="eye-question"
            onClick={() => {}}
            onMouseDown={() => setInputType("")}
            onMouseUP={() => setInputType(defaultInputType)}
          />
        </div>
      </FieldSet>
      <div className="groupButtons">
        <ButtonGeneric
          label={intl.formatMessage({
            id: "Modifying the global Github token",
          })}
          onClick={() => setIsDialogVisible(true)}
          className={"error"}
          disabled={isButtonDisabled}
        />
        <ButtonGeneric
          label={intl.formatMessage({ id: "Close" })}
          onClick={onHide}
        />
      </div>
      <ConfirmDialog
        message={`${intl.formatMessage({
          id: "Are you sure you want to change the Global Github token",
        })} ?`}
        onCancel={() => {
          setIsDialogVisible(false);
          onHide();
        }}
        onConfirm={() => handleOnPost(globalGithubToken)}
        visible={isDialogVisible}
      />
    </Block>
  );
};

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useState } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../app/hook";
import ButtonGeneric from "./ButtonGeneric";
import { Block } from "./Block";
import { InputIcon } from "./InputIcon";
import { PostAuthent } from "../../../src/Global.types";

import "./LoginBlock.scss";

export interface LoginBlockProps {
  onLogin: (data: PostAuthent) => void;
}
export const LoginBlock = ({ onLogin }: LoginBlockProps) => {
  const intl = useIntl();

  const applicationContext = useAppSelector(
    (state) => state.context.application
  );
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleOnLogin = () => {
    if (login && password) onLogin({ login: login, password: password });
  };
  return (
    <Block className="LoginBlock">
      <h1>{applicationContext.name}</h1>

      <InputIcon
        icon={"user"}
        value={login}
        placeholder={intl.formatMessage({ id: "User" })}
        onChange={setLogin}
      />

      <InputIcon
        icon={"key"}
        type="password"
        value={password}
        placeholder={intl.formatMessage({ id: "Password" })}
        onChange={setPassword}
        onKeyUp={(key: string) => {
          if (key == "Enter") handleOnLogin();
        }}
      />

      <div className="buttonsgroup">
        <ButtonGeneric
          label={intl.formatMessage({ id: "Enter" })}
          onClick={handleOnLogin}
        />
      </div>
    </Block>
  );
};

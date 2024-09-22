/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./CurlCommands.scss";
import { Block } from "../../components/Block";
import { FieldSetApiEntrypoint } from "../../components/FieldSetApiEntrypoint";
import { UptodateForm } from "../../../../src/Global.types";
import { useIntl } from "react-intl";
import ButtonGeneric from "../../components/ButtonGeneric";
import { FieldSet } from "../../components/FieldSet";
import { FieldSetAuthorizationHeader } from "../../components/FieldSetAuthorizationHeader";

interface CurlCommandsProps {
  uptodateForm: UptodateForm | "all";
  onClose?: () => void;
  userAuthBearer: string;
}

export const CurlCommands = ({
  uptodateForm,
  onClose,
  userAuthBearer,
}: CurlCommandsProps) => {
  const intl = useIntl();

  const auth = `${userAuthBearer}`;

  return (
    <Block className={`CurlCommands`}>
      {uptodateForm !== "all" ? (
        <FieldSet
          legend={intl.formatMessage({
            id: "Name",
          })}
          className="name"
        >
          <div>{uptodateForm.name}</div>
        </FieldSet>
      ) : (
        <></>
      )}
      <FieldSetAuthorizationHeader authBearer={auth} />

      <div className="listcurlcommands">
        <FieldSetApiEntrypoint
          commandTitle={intl.formatMessage({
            id: "API entry point to compare versions",
          })}
          userAuthBearer={auth}
          apiEntrypoint={`/api/v1/action/compare/${
            uptodateForm !== "all" ? uptodateForm.uuid : uptodateForm
          }/0`}
          method={"PUT"}
        />
        <FieldSetApiEntrypoint
          commandTitle={intl.formatMessage({
            id: "API entry point to compare versions and send status to monitoring service",
          })}
          userAuthBearer={auth}
          apiEntrypoint={`/api/v1/action/compare/${
            uptodateForm !== "all" ? uptodateForm.uuid : uptodateForm
          }/1`}
          method={"PUT"}
        />
        {uptodateForm !== "all" ? (
          <>
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entry point for the github version of the latest comparison",
              })}
              userAuthBearer={auth}
              apiEntrypoint={`/api/v1/action/lastcomparegitrelease/${uptodateForm.uuid}`}
              method={"GET"}
            />
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entry point for calling the CI/CD chain for this control",
              })}
              userAuthBearer={auth}
              apiEntrypoint={`/api/v1/action/cicd/`}
              body={JSON.stringify({ uuid: uptodateForm.uuid })}
              method={"PUT"}
            />
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entry point for this control",
              })}
              userAuthBearer={auth}
              apiEntrypoint={`/api/v1/control/${uptodateForm.uuid}`}
              method={"GET"}
            />
          </>
        ) : (
          <>
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entry point for all controls",
              })}
              userAuthBearer={auth}
              apiEntrypoint={"/api/v1/control/all"}
              method={"GET"}
            />
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entrypoint for UTDON version",
              })}
              userAuthBearer={""}
              apiEntrypoint={"/api/v1/version"}
              method={"GET"}
            />
          </>
        )}
      </div>
      {onClose ? (
        <div className="closeButton">
          <ButtonGeneric
            onClick={() => {
              onClose();
            }}
            label={intl.formatMessage({ id: "Close" })}
          />
        </div>
      ) : (
        <div></div>
      )}
    </Block>
  );
};

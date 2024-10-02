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
  userAuthToken: string;
}

export const CurlCommands = ({
  uptodateForm,
  onClose,
  userAuthToken,
}: CurlCommandsProps) => {
  const intl = useIntl();

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
      <FieldSetAuthorizationHeader authToken={userAuthToken} />

      <div className="listcurlcommands">
        <FieldSetApiEntrypoint
          commandTitle={intl.formatMessage({
            id: "API entry point to compare versions",
          })}
          userAuthToken={userAuthToken}
          apiEntrypoint={`/api/v1/action/compare/${
            uptodateForm !== "all" ? uptodateForm.uuid : uptodateForm
          }/0`}
          method={"PUT"}
        />
        <FieldSetApiEntrypoint
          commandTitle={intl.formatMessage({
            id: "API entry point to compare versions and send status to monitoring service",
          })}
          userAuthToken={userAuthToken}
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
              userAuthToken={userAuthToken}
              apiEntrypoint={`/api/v1/action/lastcomparegitrelease/${uptodateForm.uuid}`}
              method={"GET"}
            />
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entry point for calling the CI/CD chain for this control",
              })}
              userAuthToken={userAuthToken}
              apiEntrypoint={`/api/v1/action/cicd/`}
              body={JSON.stringify({ uuid: uptodateForm.uuid })}
              method={"PUT"}
            />
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entry point for this control",
              })}
              userAuthToken={userAuthToken}
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
              userAuthToken={userAuthToken}
              apiEntrypoint={"/api/v1/control/all"}
              method={"GET"}
            />
            <FieldSetApiEntrypoint
              commandTitle={intl.formatMessage({
                id: "API entrypoint for UTDON version",
              })}
              userAuthToken={""}
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

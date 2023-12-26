/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import InputGeneric from "./InputGeneric";
import ButtonGeneric from "./ButtonGeneric";
import { UptodateForm, UptodateFormFields } from "../../../src/Global.types";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";

import "./ActionsSettings.scss";
import { BEARERDEF, HTTP_METHOD_ENUM } from "../../../src/Constants";
import SelectGeneric from "./SelectGeneric";

export interface ActionsSettingsProps {
  activeUptodateForm: UptodateForm;
  handleOnChange: (key: UptodateFormFields, value: string) => void;
  onDone: (changeDoneState: boolean) => void;
}

export const ActionsSettings = ({
  activeUptodateForm,
  handleOnChange,
  onDone,
}: ActionsSettingsProps) => {
  const intl = useIntl();

  return (
    <div className={`ActionsSettings`}>
      <Block className="notify">
        <h2>{intl.formatMessage({ id: "Notification service" })}</h2>
        <FieldSet
          legend={intl.formatMessage({
            id: "Url of the notification service",
          })}
          className="url"
        >
          <InputGeneric
            className=""
            value={activeUptodateForm.urlCronJobMonitoring}
            onChange={(value) => handleOnChange("urlCronJobMonitoring", value)}
            placeholder="https://exemple.yourcronjobmonitoring.tools"
          />
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({ id: "Http method" })}
          className="httpmethod"
        >
          <SelectGeneric
            options={HTTP_METHOD_ENUM}
            value={activeUptodateForm.httpMethodCronJobMonitoring || "GET"}
            onChange={(value) =>
              handleOnChange("httpMethodCronJobMonitoring", value)
            }
            disableDefaultOption
          />
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({ id: "HEADER for API authentication" })}
          className="auth"
        >
          <InputGeneric
            className=""
            value={activeUptodateForm.urlCronJobMonitoringAuth}
            onChange={(value) =>
              handleOnChange("urlCronJobMonitoringAuth", value)
            }
            placeholder={`${BEARERDEF} xxxxxxx`}
          />
        </FieldSet>
      </Block>
      <Block className="cicd">
        <h2>{intl.formatMessage({ id: "CI/CD: Send update signal" })}</h2>
        <FieldSet
          legend={intl.formatMessage({ id: "Url of the CI/CD API entrypoint" })}
          className="url"
        >
          <InputGeneric
            className=""
            value={activeUptodateForm.urlCICD}
            onChange={(value) => handleOnChange("urlCICD", value)}
            placeholder="https://yourCi/CD/Apientrypoint.com/"
          />
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({ id: "Http method" })}
          className="httpmethod"
        >
          <SelectGeneric
            options={HTTP_METHOD_ENUM}
            value={activeUptodateForm.httpMethodCICD || "GET"}
            onChange={(value) => handleOnChange("httpMethodCICD", value)}
            disableDefaultOption
          />
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({ id: "HEADER for API authentication" })}
          className="auth"
        >
          <InputGeneric
            className=""
            value={activeUptodateForm.urlCICDAuth}
            onChange={(value) => handleOnChange("urlCICDAuth", value)}
            placeholder={`${BEARERDEF} xxxxxxx`}
          />
        </FieldSet>
        <FieldSet legend={intl.formatMessage({ id: "Next step" })}>
          <ButtonGeneric
            className="success"
            onClick={() => onDone(true)}
            label={intl.formatMessage({ id: "Next" })}
          />
        </FieldSet>
      </Block>
    </div>
  );
};

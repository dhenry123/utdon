/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { UptodateForm } from "../../../src/Global.types";
import { ChangeEvent } from "react";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";
import { FieldSetClickableUrl } from "./FieldSetClickableUrl";
import { Badge } from "./Badge";
import { getRelativeTime } from "../helpers/DateHelper";
import { useAppSelector } from "../app/hook";
import { ControlGroupButtons } from "./ControlGroupButtons";

import "./Control.scss";

interface ControlProps {
  data: UptodateForm;
  handleOnDelete: (control: UptodateForm) => void;
  handleOnCompare: (control: UptodateForm) => void;
  handleOnPause: (
    event: ChangeEvent<HTMLInputElement>,
    control: UptodateForm
  ) => void;
  handleOnEdit: (control: UptodateForm) => void;
  handleOnCurlCommands: (control: UptodateForm) => void;
  handleOnDisplayLatestCompare: (control: UptodateForm) => void;
  handleOnDuplicate: (control: UptodateForm) => void;
}
export const Control = ({
  data,
  handleOnDelete,
  handleOnCompare,
  handleOnPause,
  handleOnEdit,
  handleOnCurlCommands,
  handleOnDisplayLatestCompare,
  handleOnDuplicate,
}: ControlProps) => {
  const intl = useIntl();

  const isAdmin = useAppSelector((state) => state.context.isAdmin);

  return (
    <Block className={`Control`}>
      <div className="identity">
        <FieldSet
          className={"appLogo"}
          legend={intl.formatMessage({ id: "Logo" })}
        >
          {data.logo ? (
            <img
              className="image"
              src={data.logo}
              alt={`logo app ${data.name}`}
            />
          ) : (
            <></>
          )}
        </FieldSet>
        <div className="nameuuid">
          <FieldSet
            className="name"
            legend={intl.formatMessage({ id: "Name" })}
          >
            <div>{data.name}</div>
          </FieldSet>
          <FieldSet className="uuid" legend={"Uuid"}>
            <div>{data.uuid}</div>
          </FieldSet>
        </div>
      </div>
      {isAdmin ? (
        <FieldSet
          className="groups"
          legend={intl.formatMessage({ id: "Groups" })}
        >
          <div>{data.groups && data.groups.join(" ")}</div>
        </FieldSet>
      ) : (
        <></>
      )}

      <FieldSetClickableUrl
        legend={intl.formatMessage({ id: "Production version url" })}
        url={data.urlProduction}
      />
      <FieldSetClickableUrl
        legend={intl.formatMessage({ id: "Git repository url" })}
        url={data.urlGitHub}
      />

      <FieldSet
        className="lastestCompare"
        legend={intl.formatMessage({ id: "Latest comparison" })}
      >
        <div className="details">
          {data.compareResult && data.compareResult.ts ? (
            <Badge
              isSuccess={data.compareResult.state}
              isWarning={!data.compareResult.strictlyEqual}
              onClick={() => {
                handleOnDisplayLatestCompare(data);
              }}
              title={getRelativeTime(data.compareResult.ts, intl)}
            />
          ) : (
            <Badge
              noState={true}
              isSuccess={false}
              title={intl.formatMessage({ id: "Start comparison" })}
            />
          )}
          {data.compareResult && data.compareResult.productionVersion ? (
            <div className="compareVersions">
              <div
                className="productionVersion"
                title={`${intl.formatMessage({
                  id: "Your production version",
                })}: ${data.compareResult.productionVersion}`}
              >
                {data.compareResult.productionVersion}
              </div>
              <div className="separator">/</div>
              <div
                className="githubLatestRelease"
                title={`${intl.formatMessage({
                  id: "Latest available version detected",
                })}: ${data.compareResult.githubLatestRelease}`}
              >
                {data.compareResult.githubLatestRelease}
              </div>
            </div>
          ) : (
            <div className="compareVersions">"No version detected"</div>
          )}
        </div>
      </FieldSet>
      <ControlGroupButtons
        data={data}
        handleOnDuplicate={handleOnDuplicate}
        handleOnDelete={() => handleOnDelete(data)}
        handleOnEdit={() => handleOnEdit(data)}
        handleOnCurlCommands={handleOnCurlCommands}
        handleOnCompare={handleOnCompare}
        handleOnPause={handleOnPause}
      />
    </Block>
  );
};

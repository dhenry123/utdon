/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { UptoDateOrNotState, UptodateForm } from "../../../src/Global.types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ChangeEvent, useState } from "react";
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
  handleOnDelete: (uuid: string) => void;
  handleOnCompare: (control: UptodateForm) => void;
  handleOnPause: (control: ChangeEvent<HTMLInputElement>, uuid: string) => void;
  handleOnEdit: (value: string) => void;
  handleOnCurlCommands: (value: string) => void;
  setConfirmDeleteIsVisible: (value: boolean) => void;
  confirmDeleteIsVisible: boolean;
  setIsDialogCompareVisible: (value: boolean) => void;
  setResultCompare: (control: UptoDateOrNotState) => void;
}
export const Control = ({
  data,
  handleOnDelete,
  handleOnCompare,
  handleOnPause,
  handleOnEdit,
  handleOnCurlCommands,
  setConfirmDeleteIsVisible,
  confirmDeleteIsVisible,
  setIsDialogCompareVisible,
  setResultCompare,
}: ControlProps) => {
  const intl = useIntl();

  const isAdmin = useAppSelector((state) => state.context.isAdmin);

  /**
   * To update the badge's relative time without having to update the entire content
   */
  const [relativeTime, setRelativeTime] = useState("");
  const updateRelativeTime = () => {
    if (data.compareResult && data.compareResult.ts) {
      setRelativeTime(getRelativeTime(data.compareResult.ts, intl));
    }
  };

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
          <FieldSet className="uuid" legend={"uuid"}>
            <div>{data.uuid}</div>
          </FieldSet>
        </div>
      </div>
      {isAdmin ? (
        <FieldSet
          className="groups"
          legend={intl.formatMessage({ id: "Groups" })}
        >
          <div>{data.groups && data.groups.join(",")}</div>
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
        <div
          className="details"
          onMouseEnter={() => {
            updateRelativeTime();
          }}
        >
          {data.compareResult && data.compareResult.ts ? (
            <Badge
              isSuccess={data.compareResult.state}
              isWarning={!data.compareResult.strictlyEqual}
              onClick={() => {
                if (data.compareResult) {
                  setResultCompare(data.compareResult);
                  setTimeout(() => {
                    setIsDialogCompareVisible(true);
                  }, 100);
                }
              }}
              title={relativeTime}
            />
          ) : (
            <Badge isSuccess={false} />
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
        handleOnEdit={() => handleOnEdit(data.uuid)}
        setConfirmDeleteIsVisible={setConfirmDeleteIsVisible}
        handleOnCurlCommands={handleOnCurlCommands}
        handleOnCompare={handleOnCompare}
        handleOnPause={handleOnPause}
      />
      <ConfirmDialog
        visible={confirmDeleteIsVisible}
        message={
          intl.formatMessage({ id: "Are you sure to delete this control" }) +
          " ?"
        }
        onConfirm={() => {
          setConfirmDeleteIsVisible(false);
          handleOnDelete(data.uuid as string);
        }}
        onCancel={() => setConfirmDeleteIsVisible(false)}
      />
    </Block>
  );
};

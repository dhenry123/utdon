/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";

import "./Control.scss";
import { UptoDateOrNotState, UptodateForm } from "../../../src/Global.types";
import ButtonGeneric from "./ButtonGeneric";
import { ConfirmDialog } from "./ConfirmDialog";
import { ChangeEvent, useState } from "react";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";
import { FieldSetClickableUrl } from "./FieldSetClickableUrl";
import { Dialog } from "./Dialog";
import { CurlCommands } from "../features/curlcommands/CurlCommands";
import { CheckBox } from "./CheckBox";
import { Badge } from "./Badge";
import { ResultCompare } from "./ResultCompare";
import { getRelativeTime } from "../helpers/DateHelper";
import { INPROGRESS_UPTODATEORNOTSTATE } from "../../../src/Constants";
import { useAppSelector } from "../app/hook";

interface ControlProps {
  data: UptodateForm;
  handleOnDelete: (uuid: string) => void;
  handleOnCompare: (control: UptodateForm) => void;
  handleOnPause: (control: ChangeEvent<HTMLInputElement>, uuid: string) => void;
  userAuthBearer: string;
}
export const Control = ({
  data,
  handleOnDelete,
  handleOnCompare,
  handleOnPause,
  userAuthBearer,
}: ControlProps) => {
  const intl = useIntl();
  const navigate = useNavigate();

  const handleOnEdit = () => {
    return navigate(`/ui/editcontrol/${data.uuid}`);
  };

  const handleOnCurlCommands = () => {
    setIsCurlCommandVisible(true);
  };

  const [confirmDeleteIsVisible, setConfirmDeleteIsVisible] = useState(false);
  const [isCurlCommandVisible, setIsCurlCommandVisible] = useState(false);

  const [resultCompare, setResultCompare] = useState<UptoDateOrNotState>(
    INPROGRESS_UPTODATEORNOTSTATE
  );
  const [isDialogCompareVisible, setIsDialogCompareVisible] = useState(false);

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
      <div className="groupButtons">
        <div className="buttons">
          <ButtonGeneric
            title={intl.formatMessage({ id: "Edit" })}
            onClick={handleOnEdit}
            icon="pencil"
          />
          <ButtonGeneric
            className="warning"
            title={intl.formatMessage({ id: "Delete" })}
            onClick={() => setConfirmDeleteIsVisible(true)}
            icon="trash"
          />
          <ButtonGeneric
            title={intl.formatMessage({ id: "Curl commands for this control" })}
            onClick={handleOnCurlCommands}
            icon="slashes"
          />
          <ButtonGeneric
            className="success"
            title={intl.formatMessage({ id: "Start comparison" })}
            onClick={() => handleOnCompare(data)}
            icon="git-compare"
          />
        </div>
        <CheckBox
          label={intl.formatMessage({ id: "Disable actions for this control" })}
          onChange={(event) => {
            handleOnPause(event, data.uuid);
          }}
          title={intl.formatMessage({
            id: "In the case of a global selection, only the comparison will be processed",
          })}
          checked={data.isPause}
        />
      </div>
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
      <Dialog
        visible={isCurlCommandVisible}
        onHide={() => setIsCurlCommandVisible(false)}
        header={intl.formatMessage({ id: "Curl commands for this control" })}
        closeButton
      >
        <CurlCommands
          uptodateForm={data}
          onClose={() => setIsCurlCommandVisible(false)}
          userAuthBearer={userAuthBearer}
        />
      </Dialog>
      <Dialog
        visible={isDialogCompareVisible}
        onHide={() => setIsDialogCompareVisible(false)}
        header={intl.formatMessage({ id: "Comparison result" })}
        closeButton
        footerClose
      >
        <ResultCompare
          result={resultCompare ? resultCompare : INPROGRESS_UPTODATEORNOTSTATE}
          control={data}
        />
      </Dialog>
    </Block>
  );
};

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hook";

import "./DisplayControls.scss";
import {
  mytinydcUPDONApi,
  useGetControlQuery,
} from "../../api/mytinydcUPDONApi";
import {
  ControlToPause,
  ErrorServer,
  UptodateForm,
} from "../../../../src/Global.types";
import { Control } from "../../components/Control";
import { showServiceMessage } from "../../app/serviceMessageSlice";
import { Dialog } from "../../components/Dialog";
import { ResultCompare } from "../../components/ResultCompare";
import { ChangeEvent, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  INITIALIZED_TOAST,
  INTIALIZED_CONTROL_TO_PAUSE,
} from "../../../../src/Constants";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  setIsLoaderShip,
  setRefetchuptodateForm,
} from "../../app/contextSlice";
import { Badge } from "../../components/Badge";
import { ControlGroupButtons } from "../../components/ControlGroupButtons";
import { CurlCommands } from "../curlcommands/CurlCommands";
import { getRelativeTime } from "../../helpers/DateHelper";
import { UrlLinkButtons } from "../../components/UrlLinkButtons";

export const DisplayControls = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // refreshing requested by external component
  const refetchAskedFromOtherComponent = useAppSelector(
    (state) => state.context.refetchuptodateForm
  );

  const [uuidToPause, setUuidToPause] = useState<ControlToPause>(
    INTIALIZED_CONTROL_TO_PAUSE
  );

  const authToken = useAppSelector((state) => state.context.authToken);

  const searchString = useAppSelector((state) => state.context.search);
  const displayControlsAsList = useAppSelector(
    (state) => state.context.displayControlsType
  );

  // Dialogs & Confirms
  // control to manage with dialog or confirm
  const [controlToManage, setControlToManage] = useState<UptodateForm | null>(
    null
  );
  // To display curl commands
  const [isDialogCurlCommandsVisible, setIsDialogCurlCommandsVisible] =
    useState(false);
  const [isDialogCompareVisible, setIsDialogCompareVisible] = useState(false);
  //Confirms
  // delete control
  const [isConfirmDialogDeleteVisible, setIsConfirmDialogDeleteVisible] =
    useState(false);
  // duplicate control
  const [isConfirmDialogDuplicateVisible, setIsConfirmDialogDuplicateVisible] =
    useState(false);
  // disable action control
  const [
    isConfirmDialogDisableActionsVisible,
    setIsConfirmDialogDisableActionsVisible,
  ] = useState(false);

  const {
    data,
    isSuccess,
    isError,
    refetch,
    error: ErrorOnFetch,
  } = useGetControlQuery("all", {
    skip: false,
  });

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

  useEffect(() => {
    if (isError && ErrorOnFetch) {
      const error = ErrorOnFetch as FetchBaseQueryError;
      dispatchServerError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  // refectch asked from other component
  useEffect(() => {
    if (refetchAskedFromOtherComponent) {
      refetch();
      dispatch(setRefetchuptodateForm(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchAskedFromOtherComponent]);

  const handleOnCurlCommands = (uptodateForm: UptodateForm) => {
    setControlToManage(uptodateForm);
    setIsDialogCurlCommandsVisible(true);
  };

  const handleOnConfirmDelete = async () => {
    if (!controlToManage) return;
    await dispatch(
      mytinydcUPDONApi.endpoints.deleteCheck.initiate(controlToManage.uuid)
    )
      .unwrap()
      .then((response) => {
        if (response.uuid === controlToManage.uuid) {
          setControlToManage(null);
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "success",
              detail:
                intl.formatMessage({
                  id: intl.formatMessage({ id: "Control has been deleted" }),
                }) + `: ${controlToManage.uuid}`,
            })
          );
        } else {
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "error",
              sticky: true,
              detail: intl.formatMessage({
                id: "Warn delete has been fired, but response is unexpected",
              }),
            })
          );
        }
      })
      .catch((error: FetchBaseQueryError) => {
        dispatchServerError(error);
      });
  };

  const handleOnCompare = async (uptodateForm: UptodateForm) => {
    if (uptodateForm.uuid) {
      setControlToManage(uptodateForm);
      dispatch(setIsLoaderShip(true));
      await dispatch(
        mytinydcUPDONApi.endpoints.putCompare.initiate(uptodateForm.uuid)
      )
        .unwrap()
        .then((response) => {
          if (response) {
            setIsDialogCompareVisible(true);
          }
        })
        .catch((error: FetchBaseQueryError) => {
          dispatchServerError(error);
        })
        .finally(() => {
          setTimeout(() => {
            dispatch(setIsLoaderShip(false));
          }, 500);
        });
    } else {
      dispatch(
        showServiceMessage({
          ...INITIALIZED_TOAST,
          sticky: true,
          detail: intl.formatMessage({ id: "uuid not provided" }),
        })
      );
    }
  };

  const handleOnDisplayLatestCompare = (uptodateForm: UptodateForm) => {
    setControlToManage(uptodateForm);
    setIsDialogCompareVisible(true);
  };

  const handleOnPause = async (
    event: ChangeEvent<HTMLInputElement>,
    uptodateForm: UptodateForm
  ) => {
    if (uptodateForm.uuid) {
      setControlToManage(uptodateForm);
      const controlToPause: ControlToPause = {
        uuid: uptodateForm.uuid,
        state: event.target.checked,
      };
      setUuidToPause(controlToPause);
      if (event.target.checked) {
        setIsConfirmDialogDisableActionsVisible(true);
      } else {
        // update to false if opposite
        handleUpdatePauseStatus(controlToPause);
      }
    }
  };

  const handleUpdatePauseStatus = (control: ControlToPause) => {
    console.log("handleUpdatePauseStatus", control);
    if (control && control.uuid) {
      const controlData = data.filter(
        (item: UptodateForm) => item.uuid === control.uuid
      );
      if (controlData[0] && controlData[0].isPause !== uuidToPause.state) {
        const dataToUpdate: UptodateForm = {
          ...controlData[0],
          isPause: uuidToPause.state,
        };
        dispatch(
          mytinydcUPDONApi.endpoints.postUptodateForm.initiate(dataToUpdate)
        )
          .unwrap()
          .catch((error: FetchBaseQueryError) => {
            dispatchServerError(error);
          });
      }
    }
    setIsConfirmDialogDisableActionsVisible(false);
    setUuidToPause(INTIALIZED_CONTROL_TO_PAUSE);
  };

  const handleOnDuplicate = (uptodateForm: UptodateForm) => {
    setControlToManage(uptodateForm);
    setIsConfirmDialogDuplicateVisible(true);
  };

  const handleOnDelete = async (uptodateForm: UptodateForm) => {
    setControlToManage(uptodateForm);
    setIsConfirmDialogDeleteVisible(true);
  };

  const handleOnEdit = (uptodateForm: UptodateForm) => {
    return navigate(`/ui/editcontrol/${uptodateForm.uuid}`);
  };

  const handleOnConfirmDuplicate = () => {
    if (!controlToManage) return;
    const constrolToDuplicate = controlToManage as UptodateForm;
    dispatch(
      mytinydcUPDONApi.endpoints.postUptodateForm.initiate({
        ...constrolToDuplicate,
        name: `${constrolToDuplicate.name} (copy)`,
        uuid: "",
        compareResult: null,
      })
    )
      .unwrap()
      .then((response) => {
        const control = response?.control as UptodateForm;
        setControlToManage(null);
        if (control.uuid) {
          handleOnEdit(control);
        } else {
          throw new Error(
            intl.formatMessage({
              id: "Unexpected error after duplicating a control",
            })
          );
        }
      })
      .catch((error: FetchBaseQueryError) => {
        dispatchServerError(error);
      });
  };

  const isMatchString = (item: UptodateForm): boolean => {
    if (
      searchString &&
      !item.name.match(new RegExp(searchString, "i")) &&
      !item.uuid.match(new RegExp(searchString, "i"))
    ) {
      return false;
    }
    return true;
  };

  console.log(searchString);
  return (
    <div className={`DisplayControls`}>
      {isSuccess ? (
        <>
          {displayControlsAsList === "cards" ? (
            <div className="list">
              {data.map((item: UptodateForm) => {
                if (!isMatchString(item)) {
                  return null;
                }
                return (
                  <Control
                    key={item.uuid}
                    data={item}
                    handleOnDuplicate={handleOnDuplicate}
                    handleOnDelete={handleOnDelete}
                    handleOnEdit={handleOnEdit}
                    handleOnCompare={handleOnCompare}
                    handleOnDisplayLatestCompare={handleOnDisplayLatestCompare}
                    handleOnPause={handleOnPause}
                    handleOnCurlCommands={handleOnCurlCommands}
                  />
                );
              })}
            </div>
          ) : (
            <div className="table-container">
              <div className={`flex-table flex-header `} role="rowgroup">
                <div className="flex-row first" role="columnheader"></div>
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "Name" })}
                </div>
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "Uuid" })}
                </div>
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "Groups" })}
                </div>
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "Production url" })}
                </div>
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "Git url" })}
                </div>
                <div className="flex-row" role="columnheader"></div>
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "State" })}
                </div>
              </div>
              {data.map((item: UptodateForm) => {
                if (!isMatchString(item)) return null;
                return (
                  <div
                    key={`control${item.uuid}`}
                    className={`flex-table row`}
                    role="rowgroup"
                  >
                    <div className="flex-row  first" role="cell">
                      {item.logo ? (
                        <img
                          className="image"
                          src={item.logo}
                          alt={`logo app ${item.name}`}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className={`flex-row name`} role="cell">
                      <div className="name">{item.name}</div>
                    </div>
                    <div className={`flex-row`} role="cell">
                      <div className="uuid">{item.uuid}</div>
                    </div>
                    <div
                      className={`flex-row`}
                      role="cell"
                      title={`${intl.formatMessage({
                        id: "Groups",
                      })}: ${item.groups.join(" ")}`}
                    >
                      <div className="groups">{item.groups.join(" ")}</div>
                    </div>
                    <div className={`flex-row `} role="cell">
                      <UrlLinkButtons url={item.urlProduction} />
                    </div>
                    <div className={`flex-row urlGitHub`} role="cell">
                      <UrlLinkButtons url={item.urlGitHub} />
                    </div>
                    <div className={`flex-row`} role="cell">
                      <ControlGroupButtons
                        data={item}
                        handleOnDuplicate={handleOnDuplicate}
                        handleOnDelete={handleOnDelete}
                        handleOnEdit={handleOnEdit}
                        handleOnCompare={handleOnCompare}
                        handleOnPause={handleOnPause}
                        handleOnCurlCommands={handleOnCurlCommands}
                      />
                    </div>
                    <div className={`flex-row state`} role="cell">
                      {item.compareResult && item.compareResult.ts ? (
                        <Badge
                          isSuccess={item.compareResult.state}
                          isWarning={!item.compareResult.strictlyEqual}
                          onClick={() => {
                            handleOnDisplayLatestCompare(item);
                          }}
                          title={getRelativeTime(item.compareResult.ts, intl)}
                        />
                      ) : (
                        <Badge
                          noState={true}
                          isSuccess={false}
                          title={intl.formatMessage({ id: "Start comparison" })}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : isError ? (
        <div>Error</div>
      ) : null}
      {/* control management display and confirm, available only if controlToManage is set */}
      {controlToManage ? (
        <>
          {/* Dialog */}
          <Dialog
            visible={isDialogCurlCommandsVisible}
            onHide={() => setIsDialogCurlCommandsVisible(false)}
            header={intl.formatMessage({
              id: "Curl commands for this control",
            })}
            closeButton
          >
            <CurlCommands
              uptodateForm={controlToManage as UptodateForm}
              onClose={() => setIsDialogCurlCommandsVisible(false)}
              userAuthToken={authToken}
            />
          </Dialog>
          {/* Duplicate */}
          <Dialog
            visible={isDialogCompareVisible}
            onHide={() => setIsDialogCompareVisible(false)}
            header={intl.formatMessage({ id: "Comparison result" })}
            closeButton
            footerClose
          >
            {/* get Fresh data */}
            <ResultCompare
              control={
                data &&
                (data as UptodateForm[]).filter(
                  (item) => item.uuid === controlToManage.uuid
                )[0]
              }
            />
          </Dialog>
          {/* ConfirmDialogs */}
          <ConfirmDialog
            visible={isConfirmDialogDeleteVisible}
            message={`${intl.formatMessage({
              id: "Are you sure to delete this control",
            })} (${controlToManage.uuid}) ?`}
            onConfirm={() => {
              setIsConfirmDialogDeleteVisible(false);
              handleOnConfirmDelete();
            }}
            onCancel={() => setIsConfirmDialogDeleteVisible(false)}
          />
          <ConfirmDialog
            visible={isConfirmDialogDuplicateVisible}
            message={`${intl.formatMessage({
              id: "Are you sure to duplicate this control",
            })} (${(controlToManage as UptodateForm).uuid}) ?`}
            onConfirm={() => {
              setIsConfirmDialogDuplicateVisible(false);
              handleOnConfirmDuplicate();
            }}
            onCancel={() => setIsConfirmDialogDuplicateVisible(false)}
          />
          <ConfirmDialog
            visible={isConfirmDialogDisableActionsVisible}
            message={`${intl.formatMessage({
              id: "Are you sure you want to disable actions for this control",
            })}: ${uuidToPause.uuid} ?`}
            onCancel={() => setIsConfirmDialogDisableActionsVisible(false)}
            onConfirm={() => handleUpdatePauseStatus(uuidToPause)}
          />
        </>
      ) : null}
    </div>
  );
};

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
  INITIALIZED_UPTODATEFORM,
  INPROGRESS_UPTODATEORNOTSTATE,
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

  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [resultCompare, setResultCompare] = useState(
    INPROGRESS_UPTODATEORNOTSTATE
  );

  const [uuidToPause, setUuidToPause] = useState<ControlToPause>(
    INTIALIZED_CONTROL_TO_PAUSE
  );

  const [checkInProgress, setcheckInProgress] = useState(
    INITIALIZED_UPTODATEFORM
  );

  const [userAuthBearer, setuserAuthBearer] = useState("");

  const searchString = useAppSelector((state) => state.context.search);
  const displayControlsAsList = useAppSelector(
    (state) => state.context.displayControlsType
  );

  const [confirmDeleteIsVisible, setConfirmDeleteIsVisible] = useState(false);
  const [confirmDuplicatControlIsVisible, setConfirmDuplicatControlIsVisible] =
    useState(false);

  const [controlUuidToManage, setControlUuidToManage] = useState<
    UptodateForm | null | string
  >(null);

  const [isCurlCommandVisible, setIsCurlCommandVisible] = useState(false);
  const [isDialogCompareVisible, setIsDialogCompareVisible] = useState(false);

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
    //Reload
    refetch();
    // get auth bearer
    if (!userAuthBearer) {
      dispatch(mytinydcUPDONApi.endpoints.getBearer.initiate(null))
        .unwrap()
        .then((response) => {
          setuserAuthBearer(response.bearer);
        })
        .catch((error) => {
          dispatchServerError(error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setControlUuidToManage(uptodateForm);
    setIsCurlCommandVisible(true);
  };

  const handleOnDelete = async (uuid: string) => {
    setControlUuidToManage(uuid);
    setConfirmDeleteIsVisible(true);
  };

  const handleOnConfirmDelete = async () => {
    if (!controlUuidToManage) return;
    await dispatch(
      mytinydcUPDONApi.endpoints.deleteCheck.initiate(
        controlUuidToManage as string
      )
    )
      .unwrap()
      .then((response) => {
        refetch();
        if (response.uuid === controlUuidToManage) {
          setControlUuidToManage(null);
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "success",
              detail:
                intl.formatMessage({
                  id: intl.formatMessage({ id: "Control has been deleted" }),
                }) + `: ${controlUuidToManage}`,
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

  const handleOnCompare = async (control: UptodateForm) => {
    if (control.uuid) {
      dispatch(setIsLoaderShip(true));
      await dispatch(
        mytinydcUPDONApi.endpoints.getCompare.initiate(control.uuid, {
          forceRefetch: true,
        })
      )
        .unwrap()
        .then((response) => {
          if (response) {
            setIsDialogVisible(true);
            setResultCompare(response);
            setcheckInProgress(control);
            refetch();
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

  const handleOnPause = async (
    event: ChangeEvent<HTMLInputElement>,
    uuid: string
  ) => {
    if (uuid) {
      const controlToPause: ControlToPause = {
        uuid: uuid,
        state: event.target.checked,
      };
      setUuidToPause(controlToPause);
      if (event.target.checked) {
        setIsConfirmVisible(true);
      } else {
        // update to false if opposite
        handleUpdatePauseStatus(controlToPause);
      }
    }
  };

  const handleUpdatePauseStatus = (control: ControlToPause) => {
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
          .then(() => {
            refetch();
          })
          .catch((error: FetchBaseQueryError) => {
            dispatchServerError(error);
          });
      }
    }
    setIsConfirmVisible(false);
    setUuidToPause(INTIALIZED_CONTROL_TO_PAUSE);
  };

  const handleOnEdit = (uuid: string) => {
    return navigate(`/ui/editcontrol/${uuid}`);
  };

  const handleOnDuplicate = (uptodateForm: UptodateForm) => {
    setControlUuidToManage(uptodateForm);
    setConfirmDuplicatControlIsVisible(true);
  };

  const handleOnConfirmDuplicate = () => {
    if (!controlUuidToManage) return;
    const constrolToDuplicate = controlUuidToManage as UptodateForm;
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
        setControlUuidToManage(null);
        if (control.uuid) {
          handleOnEdit(control.uuid);
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

  return (
    <div className={`DisplayControls`}>
      {isSuccess ? (
        <>
          {displayControlsAsList === "cards" ? (
            <div className="list">
              {data.map((item: UptodateForm) => {
                if (
                  searchString &&
                  !item.name.match(new RegExp(searchString, "i"))
                )
                  return null;
                return (
                  <Control
                    handleOnDelete={handleOnDelete}
                    handleOnCompare={handleOnCompare}
                    key={item.uuid}
                    data={item}
                    handleOnPause={handleOnPause}
                    handleOnEdit={handleOnEdit}
                    handleOnCurlCommands={handleOnCurlCommands}
                    setIsDialogCompareVisible={setIsDialogCompareVisible}
                    setResultCompare={setResultCompare}
                    handleOnDuplicate={handleOnDuplicate}
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
                if (
                  searchString &&
                  !item.name.match(new RegExp(searchString, "i"))
                )
                  return null;
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
                        handleOnEdit={handleOnEdit}
                        handleOnCurlCommands={handleOnCurlCommands}
                        handleOnCompare={handleOnCompare}
                        handleOnPause={handleOnPause}
                        handleOnDuplicate={handleOnDuplicate}
                        handleOnDelete={handleOnDelete}
                      />
                    </div>
                    <div className={`flex-row state`} role="cell">
                      {item.compareResult && item.compareResult.ts ? (
                        <Badge
                          isSuccess={item.compareResult.state}
                          isWarning={!item.compareResult.strictlyEqual}
                          onClick={() => {
                            if (item.compareResult) {
                              setResultCompare(item.compareResult);
                              setTimeout(() => {
                                setIsDialogCompareVisible(true);
                              }, 100);
                            }
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
      <Dialog
        visible={isDialogVisible}
        onHide={() => setIsDialogVisible(false)}
        header={intl.formatMessage({ id: "Comparison result" })}
        closeButton
        footerClose
      >
        <ResultCompare
          result={resultCompare ? resultCompare : INPROGRESS_UPTODATEORNOTSTATE}
          control={checkInProgress}
        />
      </Dialog>
      <Dialog
        visible={isCurlCommandVisible}
        onHide={() => setIsCurlCommandVisible(false)}
        header={intl.formatMessage({ id: "Curl commands for this control" })}
        closeButton
      >
        <CurlCommands
          uptodateForm={controlUuidToManage as UptodateForm}
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
          control={
            data &&
            (data as UptodateForm[]).filter((item) => {
              //compat 1.60. -> 1.7.0 because of duplication implementation
              if (resultCompare.uuid) {
                return item.uuid === resultCompare.uuid;
              } else {
                return item.name === resultCompare.name;
              }
            })[0]
          }
        />
      </Dialog>
      <ConfirmDialog
        visible={confirmDeleteIsVisible}
        message={`${intl.formatMessage({
          id: "Are you sure to delete this control",
        })} (${controlUuidToManage as string}) ?`}
        onConfirm={() => {
          setConfirmDeleteIsVisible(false);
          handleOnConfirmDelete();
        }}
        onCancel={() => setConfirmDeleteIsVisible(false)}
      />
      {controlUuidToManage ? (
        <ConfirmDialog
          visible={confirmDuplicatControlIsVisible}
          message={`${intl.formatMessage({
            id: "Are you sure to duplicate this control",
          })} (${(controlUuidToManage as UptodateForm).uuid}) ?`}
          onConfirm={() => {
            setConfirmDuplicatControlIsVisible(false);
            handleOnConfirmDuplicate();
          }}
          onCancel={() => setConfirmDuplicatControlIsVisible(false)}
        />
      ) : null}
      <ConfirmDialog
        message={`${intl.formatMessage({
          id: "Are you sure you want to pause this control",
        })} (${uuidToPause.uuid})?`}
        visible={isConfirmVisible}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={() => handleUpdatePauseStatus(uuidToPause)}
      />
    </div>
  );
};

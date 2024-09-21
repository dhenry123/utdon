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
import { UrlOpener } from "../../components/UrlOpener";

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

  const handleOnCurlCommands = () => {
    setIsCurlCommandVisible(true);
  };

  const handleOnDelete = async (uuid: string) => {
    await dispatch(mytinydcUPDONApi.endpoints.deleteCheck.initiate(uuid))
      .unwrap()
      .then((response) => {
        refetch();
        if (response.uuid === uuid) {
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "success",
              detail:
                intl.formatMessage({
                  id: intl.formatMessage({ id: "Control has been deleted" }),
                }) + `: ${uuid}`,
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
        dispatch(mytinydcUPDONApi.endpoints.postCheck.initiate(dataToUpdate))
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

  const handleOnDuplicate = (control: UptodateForm) => {
    console.log("Control to duplicate", control);
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
                    setConfirmDeleteIsVisible={setConfirmDeleteIsVisible}
                    confirmDeleteIsVisible={confirmDeleteIsVisible}
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
                <div className="flex-row" role="columnheader">
                  {intl.formatMessage({ id: "State" })}
                </div>
                <div className="flex-row" role="columnheader"></div>
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
                    className={`flex-table`}
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
                      {item.name}
                    </div>
                    <div className={`flex-row`} role="cell">
                      {item.uuid}
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
                      <UrlOpener url={item.urlProduction} />
                    </div>
                    <div className={`flex-row urlGitHub`} role="cell">
                      <UrlOpener url={item.urlGitHub} />
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
                        <Badge isSuccess={false} />
                      )}
                    </div>
                    <div className={`flex-row`} role="cell">
                      <ControlGroupButtons
                        data={item}
                        handleOnEdit={handleOnEdit}
                        setConfirmDeleteIsVisible={setConfirmDeleteIsVisible}
                        handleOnCurlCommands={handleOnCurlCommands}
                        handleOnCompare={handleOnCompare}
                        handleOnPause={handleOnPause}
                        handleOnDuplicate={handleOnDuplicate}
                      />
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
        message={`${intl.formatMessage({
          id: "Are you sure you want to pause this control",
        })}?`}
        visible={isConfirmVisible}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={() => handleUpdatePauseStatus(uuidToPause)}
      />
    </div>
  );
};

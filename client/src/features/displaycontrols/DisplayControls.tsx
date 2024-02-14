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
import { setRefetchuptodateForm } from "../../app/contextSlice";

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
      await dispatch(
        mytinydcUPDONApi.endpoints.getCompare.initiate(control.uuid, {
          forceRefetch: true,
        })
      )
        .unwrap()
        .then((response) => {
          if (response) {
            refetch();
            setIsDialogVisible(true);
            setResultCompare(response);
            setcheckInProgress(control);
          }
        })
        .catch((error: FetchBaseQueryError) => {
          dispatchServerError(error);
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

  return (
    <div className={`DisplayControls`}>
      {isSuccess ? (
        <>
          {/* <div className="filters">Filter on :</div> */}
          <div className="list">
            {data.map((item: UptodateForm) => {
              return (
                <Control
                  handleOnDelete={handleOnDelete}
                  handleOnCompare={handleOnCompare}
                  key={item.uuid}
                  data={item}
                  userAuthBearer={userAuthBearer}
                  handleOnPause={handleOnPause}
                />
              );
            })}
          </div>
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

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./ControlManager.scss";
import { useEffect, useState } from "react";
import { mytinydcUPDONApi } from "../../api/mytinydcUPDONApi";
import { useAppDispatch, useAppSelector } from "../../app/hook";
import { ScrapProduction } from "../../components/ScrapProduction";
import {
  ErrorServer,
  UptodateForm,
  UptodateFormFields,
} from "../../../../src/Global.types";
import {
  resetUpdateForm,
  setUpdateForm,
  updateKeyUptodateFrom,
} from "../../app/contextSlice";
import { StepType, Stepper } from "../../components/Stepper";
import { ScrapGitHubReleaseTags } from "../../components/ScrapGitHubReleaseTags";
import { ActionsSettings } from "../../components/ActionsSettings";
import { Summary } from "../../components/Summary";
import { showServiceMessage } from "../../app/serviceMessageSlice";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useLocation, useNavigate } from "react-router-dom";
import { StepperStep } from "../../components/StepperStep";
import { INITIALIZED_TOAST } from "../../../../src/Constants";
import { useIntl } from "react-intl";
import { Dialog } from "../../components/Dialog";
import { ResultCompare } from "../../components/ResultCompare";

export const ControlManager = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const intl = useIntl();
  const navigate = useNavigate();

  const [isRecordable, setIsRecordable] = useState(false);

  // to control where save is needed in summary form
  const [isChangesOnModel, setIsChangesOnModel] = useState(true);

  /**
   * Stepper methods
   */
  const [steps, setSteps] = useState<StepType[]>([
    { label: intl.formatMessage({ id: "Service to be monitored" }) },
    { label: intl.formatMessage({ id: "Github repository" }) },
    { label: intl.formatMessage({ id: "Action to perform" }) },
    { label: intl.formatMessage({ id: "Summary" }) },
  ]);

  const [stepActive, setStepActive] = useState<number>(0);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [uptodateFormWithFreshCompare, setUptodateFormWithFreshCompare] =
    useState<UptodateForm>();
  /**
   * production server to test
   */
  const activeUptodateForm = useAppSelector(
    (state) => state.context.uptodateForm
  );
  const uptodateForm = useAppSelector((state) => state.context.uptodateForm);

  /**
   * Used for server errors (api entrypoint call)
   * @param error
   * @returns
   */
  const dispatchServerError = (error: FetchBaseQueryError) => {
    if (error) {
      let servererror = error.data as ErrorServer;
      if (typeof servererror === "string")
        servererror = JSON.parse(servererror);
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

  /**
   * to change the done property on each step
   * @param state
   */
  const setDoneStateAllSteps = (state: boolean) => {
    const newSteps = [...steps];
    newSteps.forEach((item) => {
      item.done = state;
    });
  };

  const checkIsRecordable = () => {
    let recordableState = true;
    for (let i = 1; i < steps.length; i++) {
      // last form in steps
      if (i === steps.length - 1) continue;
      if (!steps[i].done) {
        recordableState = false;
        break;
      }
    }
    if (activeUptodateForm.groups && activeUptodateForm.groups.length === 0) {
      recordableState = false;
    }
    setIsRecordable(recordableState);
  };

  /**
   * Used by child components to display a message as a string
   */
  const handleOnComponentError = (message: string) => {
    dispatch(
      showServiceMessage({
        ...INITIALIZED_TOAST,
        detail: message,
      })
    );
  };

  const handleOnStepDone = (
    changeDoneState: boolean,
    setNewActiveStep?: number
  ) => {
    const newSteps = [...steps];
    if (changeDoneState) {
      newSteps[stepActive].done = true;
      setSteps(newSteps);
    }
    // called by the stepper - the user clicks on one of the stepper's steps
    if (typeof setNewActiveStep === "number") {
      setStepActive(setNewActiveStep);
    } else {
      if (stepActive < newSteps.length - 1) {
        setStepActive(stepActive + 1);
      }
    }
    checkIsRecordable();
  };

  /**
   * Update data model
   * @param key
   * @param value
   */
  const handleOnChangeUptodateForm = (
    key: UptodateFormFields,
    value: string | string[]
  ) => {
    dispatch(updateKeyUptodateFrom({ key: key, value: value }));
    // each time the model change to indicate user have to save
    setIsChangesOnModel(true);
    checkIsRecordable();
  };

  /**
   * All scrap contents are text
   */
  const handleOnScrapUrl = async (
    url: string,
    headerkey?: string,
    headervalue?: string
  ): Promise<string> => {
    return await new Promise((resolv, reject) => {
      dispatch(
        mytinydcUPDONApi.endpoints.getScrapUrl.initiate(
          {
            url: url,
            headerkey: headerkey,
            headervalue: headervalue,
          },
          {
            forceRefetch: true,
          }
        )
      )
        .unwrap()
        .then((response: string) => {
          resolv(response);
        })
        .catch((error: FetchBaseQueryError) => {
          dispatchServerError(error);
          reject(error.data);
        });
    });
  };

  /**
   * ask server to store changes
   * @returns
   */
  const handleOnSave = async () => {
    return new Promise((resolv, reject) => {
      dispatch(
        mytinydcUPDONApi.endpoints.postUptodateForm.initiate(uptodateForm)
      )
        .unwrap()
        .then((response) => {
          const control = response?.control as UptodateForm;
          //update uuid
          if (control.uuid) {
            handleOnChangeUptodateForm("uuid", control.uuid);
            setIsChangesOnModel(false);
            resolv(control);
          } else {
            const message = "the uuid is missing from the server response";
            dispatch(
              showServiceMessage({
                ...INITIALIZED_TOAST,
                severity: "error",
                sticky: true,
                detail: intl.formatMessage({ id: message }),
              })
            );
            reject(new Error(message));
          }
        })
        .catch((error: FetchBaseQueryError) => {
          dispatchServerError(error);
          reject(error.data);
        });
    });
  };

  /**
   * ask server to compare
   * @returns
   */
  const handleOnCompare = () => {
    if (uptodateForm.uuid) {
      dispatch(
        mytinydcUPDONApi.endpoints.putCompare.initiate(uptodateForm.uuid)
      )
        .unwrap()
        .then((response) => {
          const newUptodateFrom = { ...uptodateForm };
          newUptodateFrom.compareResult = response;
          setUptodateFormWithFreshCompare(newUptodateFrom);
          setIsDialogVisible(true);
        })
        .catch((error: FetchBaseQueryError) => {
          dispatchServerError(error);
        });
    } else {
      dispatch(
        showServiceMessage({
          ...INITIALIZED_TOAST,
          severity: "error",
          sticky: true,
          detail: intl.formatMessage({ id: "uuid not provided" }),
        })
      );
    }
  };

  /**
   * Browser location change
   */
  useEffect(() => {
    if (location.pathname.match(/ui\/editcontrol/)) {
      const uuid = location.pathname.replace(/\/ui\/editcontrol\//, "");
      if (uuid) {
        dispatch(
          mytinydcUPDONApi.endpoints.getControl.initiate(uuid, {
            forceRefetch: true,
          })
        )
          .then((response) => {
            // Edit load data
            dispatch(setUpdateForm(response.data));
            // Done all steps
            setDoneStateAllSteps(true);
            // during loading data changed because of process - so there is not changes in reality
            // as there is no promise to execute i ve set timeout
            setTimeout(() => {
              setIsChangesOnModel(false);
            }, 300);
          })
          .catch((error) => {
            dispatch(
              showServiceMessage({
                ...INITIALIZED_TOAST,
                detail: error.toString(),
              })
            );
          });
      }
    } else {
      dispatch(resetUpdateForm());
      // unDone all steps
      setDoneStateAllSteps(false);
      setIsChangesOnModel(false);
      checkIsRecordable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  /**
   * If all steps are done, is Recordable ?
   */
  useEffect(() => {
    checkIsRecordable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepActive]);

  return (
    <div className="ControlManager">
      <Stepper active={stepActive} onChange={handleOnStepDone} steps={steps} />
      <StepperStep stepId={0} active={stepActive}>
        <ScrapProduction
          activeUptodateForm={activeUptodateForm}
          scrapUrl={handleOnScrapUrl}
          handleOnChange={handleOnChangeUptodateForm}
          onDone={handleOnStepDone}
          displayError={handleOnComponentError}
        />
      </StepperStep>
      <StepperStep stepId={1} active={stepActive}>
        <ScrapGitHubReleaseTags
          activeUptodateForm={activeUptodateForm}
          handleOnChange={handleOnChangeUptodateForm}
          scrapUrl={handleOnScrapUrl}
          displayError={handleOnComponentError}
          onDone={handleOnStepDone}
        />
      </StepperStep>
      <StepperStep stepId={2} active={stepActive}>
        <ActionsSettings
          activeUptodateForm={activeUptodateForm}
          handleOnChange={handleOnChangeUptodateForm}
          onDone={handleOnStepDone}
        />
      </StepperStep>
      <StepperStep stepId={3} active={stepActive}>
        <Summary
          uptodateForm={uptodateForm}
          onSave={handleOnSave}
          handleOnCompare={handleOnCompare}
          isRecordable={isRecordable}
          isChangesOnModel={isChangesOnModel}
        />
      </StepperStep>
      {uptodateFormWithFreshCompare ? (
        <Dialog
          visible={isDialogVisible}
          onHide={() => setIsDialogVisible(false)}
          header={intl.formatMessage({ id: "Action" })}
          closeButton
        >
          <ResultCompare control={uptodateFormWithFreshCompare} />
        </Dialog>
      ) : null}
    </div>
  );
};

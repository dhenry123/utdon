/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import ButtonGeneric from "./ButtonGeneric";

import "./Stepper.scss";
import { useIntl } from "react-intl";

export type StepType = {
  label: string;
  done?: boolean;
  icon?: string;
};

interface InternalStepProps {
  step: StepType;
  idx: number;
}

type SeparatorProps = {
  className?: string;
};
interface StepperProps {
  steps: StepType[];
  active: number;
  onChange: (changeDoneState: boolean, setNewActiveStep: number) => void;
}
export const Stepper = ({ steps = [], active, onChange }: StepperProps) => {
  const Separator = ({ className }: SeparatorProps) => {
    return <div className={`separator ${className}`} />;
  };

  const InternalStep = ({ step, idx }: InternalStepProps) => {
    const intl = useIntl();

    return (
      <div className="step">
        <Separator className={`${step.done || idx === 0 ? "done" : ""}`} />
        <ButtonGeneric
          onClick={() => {
            onChange(false, idx);
          }}
          // if latest: special css
          icon={
            step.done
              ? "check"
              : idx == steps.length - 1
              ? "eyeglass-2"
              : "arrows-minimize"
          }
          className={`button ${idx === active ? "active" : ""} ${
            step.done ? "done" : "undone"
          }`}
        />
        <label title={` ${intl.formatMessage({ id: "step" })}: ${step.label}`}>
          {step.label}
        </label>
      </div>
    );
  };

  return (
    <div className={`Stepper`}>
      {steps.map((item, idx) => {
        return <InternalStep key={`step_${idx}`} step={item} idx={idx} />;
      })}
    </div>
  );
};

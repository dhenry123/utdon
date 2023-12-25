/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./StepperStep.scss";

interface StepperStepProps {
  children?: JSX.Element | string | JSX.Element[];
  stepId: number;
  active: number;
}
export const StepperStep = ({ children, stepId, active }: StepperStepProps) => {
  return (
    <div
      className={`StepperStep ${
        stepId !== active ? "notVisibleComponent" : ""
      }`}
    >
      {children}
    </div>
  );
};

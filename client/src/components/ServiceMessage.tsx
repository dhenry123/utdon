/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useEffect, useState } from "react";
import "./ServiceMessage.scss";
import { Toast } from "./Toast";
import { useAppSelector } from "../app/hook";
import { INITIALIZED_TOAST } from "../../../src/Constants";

/**
 * Service Message for app
 * using Toast
 */
function ServiceMessage() {
  const serviceMessage = useAppSelector((state) => state.servicemessage);

  const [toast, setToast] = useState(INITIALIZED_TOAST);

  useEffect(() => {
    if (serviceMessage.toast.timestamp) setToast(serviceMessage.toast);
  }, [serviceMessage.toast.timestamp]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ServiceMessage">
      <Toast toast={toast} />
    </div>
  );
}

export default ServiceMessage;

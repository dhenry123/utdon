/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useEffect, useState, useRef } from "react";

import "./Toast.scss";
import { ToastType } from "../../../src/Global.types";
import { TOAST_DEFAULT_LIFETIME } from "../../../src/Constants";

let mysetInterval: number | null;

export interface ToastProps {
  toast: ToastType;
}
export const Toast = ({ toast }: ToastProps) => {
  const [toastitem, setToastItem] = useState<ToastType[]>([]);

  const toastitemRef = useRef(toastitem);

  const icons = {
    info: "ti-info-circle",
    success: "ti-circle-check",
    warn: "ti-alert-circle",
    error: "ti-circle-x",
  };

  /**
   * Each time the toastitem is updated, its ref must also be updated.
   */
  useEffect(() => {
    toastitemRef.current = toastitem;
    if (mysetInterval) {
      if (toastitem.length === 0) {
        clearInterval(mysetInterval);
        mysetInterval = null;
        return;
      }
    } else if (toastitem.length > 0) {
      // interval not set, start interval which will destroy old messages
      mysetInterval = window.setInterval(() => {
        // see comment above
        const toastactive = toastitemRef.current.filter(
          (x: ToastType) =>
            (!x.sticky &&
              x.timestamp &&
              x.timestamp + x.life > new Date().valueOf()) ||
            x.sticky
        );
        setToastItem([...toastactive]);
      }, 500);
    }
  }, [toastitem]);

  /**
   * New toast is coming..
   */
  useEffect(() => {
    /**
     * if empty attribut is true, special hack to emptying queue... and sending something
     * to give more focus
     */
    if (toast.empty) {
      toastitemRef.current = [];
      setToastItem([]);
      return;
    }
    if (toast.detail || toast.summary) {
      const comingToast = { ...toast };
      // set defaults values if not provided
      if (!comingToast.severity) comingToast.severity = "info";
      if (!comingToast.life) comingToast.life = TOAST_DEFAULT_LIFETIME;
      if (!comingToast.timestamp) comingToast.timestamp = new Date().valueOf();
      const newitems: ToastType[] = [...toastitem];
      newitems.push({ ...comingToast });
      setToastItem(newitems);
    }
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * remove toast.timestamp item from list,
   * item must have sticky attr to display close button
   *
   */
  const closeButtonHandler = (toastid: number) => {
    const toastactive = toastitemRef.current.filter(
      (x) => x.timestamp !== toastid
    );
    const newSet = [...toastactive];
    setToastItem(newSet);
  };

  const displayItem = (items: ToastType[]) => {
    return items.map((item: ToastType) => (
      <div
        className={"toast " + item.severity}
        key={"toast_key_" + item.timestamp}
      >
        <div className="container-1">
          <i className={`ti ${item.severity ? icons[item.severity] : ""}`}></i>
        </div>
        <div className="container-2">
          {item.summary ? <p className="summary">{item.summary}</p> : null}

          <p className="detail">{item.detail}</p>
        </div>
        <button
          onClick={() => {
            if (item.timestamp) closeButtonHandler(item.timestamp);
          }}
        >
          &times;
        </button>
      </div>
    ));
  };

  return <div className="containertoast">{displayItem(toastitem)}</div>;
};

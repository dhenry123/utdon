import { Request } from "express";
import { logError, logInfo, OptionsLogType } from "../Global.types";
import { SessionExt } from "../ServerTypes";

const getBase = (req: Request): logInfo => {
  const session = req.session as SessionExt;
  return {
    userId: session.user?.uuid ? session.user.uuid : "uuid unknown",
    userLogin: session.user?.login
      ? session.user.login
      : "session user unknown",
    ipAddr: req.ip || "unknown",
    apiPath: req.path,
    apiMethod: req.method,
  };
};
export const getLogObjectInfo = (
  req: Request,
  optionsLog?: OptionsLogType
): logInfo => {
  let logItem: logInfo = getBase(req);
  if (optionsLog) {
    if (optionsLog.message)
      logItem = { ...logItem, message: optionsLog.message };
    if (optionsLog.uuid) logItem = { ...logItem, message: optionsLog.uuid };
    if (optionsLog.scrapResponse)
      logItem = { ...logItem, message: optionsLog.scrapResponse };

    if (optionsLog.gitAuthenticationProvided)
      logItem = {
        ...logItem,
        gitAuthenticationProvided: optionsLog.gitAuthenticationProvided,
      };
    if (optionsLog.productionAuthenticationProvided)
      logItem = {
        ...logItem,
        productionAuthenticationProvided:
          optionsLog.productionAuthenticationProvided,
      };
    if (optionsLog.newUser)
      logItem = { ...logItem, newUser: optionsLog.newUser };
    if (optionsLog.userDeleted)
      logItem = { ...logItem, userDeleted: optionsLog.userDeleted };
    if (optionsLog.userUpdated)
      logItem = { ...logItem, userUpdated: optionsLog.userUpdated };
    if (optionsLog.userLogout)
      logItem = { ...logItem, userUpdated: optionsLog.userLogout };
  }
  return logItem;
};

export const getLogObjectError = (
  req: Request,
  error: string,
  optionsLog?: OptionsLogType
): logError => {
  let logItem: logInfo = getBase(req);
  if (optionsLog) {
    if (optionsLog.message)
      logItem = { ...logItem, message: optionsLog.message };
    if (optionsLog.uuid) logItem = { ...logItem, message: optionsLog.uuid };
    if (optionsLog.scrapResponse)
      logItem = { ...logItem, message: optionsLog.scrapResponse };
  }
  return { ...logItem, error: error };
};

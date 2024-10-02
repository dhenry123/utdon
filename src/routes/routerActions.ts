/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { NextFunction, Request, Response } from "express";
import {
  ErrorServerJson,
  UptoDateOrNotStateResponseMonitoring,
  UptodateForm,
} from "../Global.types";
import { dbCommit, dbGetRecord, dbUpdateRecord } from "../lib/Database";
import { scrapUrl, getUpToDateOrNotState } from "../lib/Features";
import { UUIDNOTFOUND, UUIDNOTPROVIDED } from "../Constants";
import { SessionExt } from "../ServerTypes";
import { getLogObjectError, getLogObjectInfo } from "../lib/logs";
import {
  getGlobalGithubToken,
  setControlGlobalGithubToken,
} from "../lib/GlobalGithubToken";

const routerActions = express.Router();

const updateExternalStatus = (
  control: UptodateForm,
  state: "0" | "1"
): Promise<string> => {
  return new Promise((resolv, reject) => {
    scrapUrl(
      `${control.urlCronJobMonitoring}/${state}`,
      control.httpMethodCronJobMonitoring,
      `Authorization:${control.urlCronJobMonitoringAuth}`
    )
      .then((response) => {
        resolv(response.toString());
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
};

/**
 * Call up the comparison method and can update the monitoring status: 'all' is accepted
 */
routerActions.put(
  "/action/compare/:controlUuid/:setStatus",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // controlUuid could be an uuid or 'all'
      const session = req.session as SessionExt;
      const userGroups = req.app.get("AUTH").getUserGroups(session.user.uuid);
      // in regards the value of controlUuid, response could be UptodateForm | UptodateForm[]
      // data will processed as UptodateForm[]
      let finalRecords: UptodateForm[] = [];
      const finalResponseArray: UptoDateOrNotStateResponseMonitoring[] &
        ErrorServerJson[] = [];
      const record = dbGetRecord(
        req.app.get("DB"),
        req.params.controlUuid,
        userGroups,
        req.app.get("AUTH").isAdmin(req),
        req.app.get("LOGGER")
      );
      let errorFound = false;
      if (record) {
        if (!Array.isArray(record)) {
          // convert uniq record to UptodateForm[]
          finalRecords.push(record);
        } else {
          finalRecords = record;
        }

        const globalGithubToken = getGlobalGithubToken();

        for (let item of finalRecords) {
          req.app.get("LOGGER").info(
            getLogObjectInfo(req, {
              uuid: item.uuid,
              gitAuthenticationProvided: item.headerkeyGit ? true : false,
              productionAuthenticationProvided: item.headerkey ? true : false,
            })
          );
          item = setControlGlobalGithubToken({ ...item }, globalGithubToken);
          // get state
          await getUpToDateOrNotState(item)
            .then(async (compareResult) => {
              // Update dbRecord
              dbUpdateRecord(req.app.get("DB"), {
                ...item,
                compareResult: compareResult,
              });
              dbCommit(req.app.get("DBFILE") || "", req.app.get("DB"));
              // have to update external state ?
              if (req.params.setStatus === "1") {
                if (item.urlCronJobMonitoring && !item.isPause) {
                  // 0 : uptodate 1:toupdate state is true when uptodate
                  const payload = compareResult.state ? "0" : "1";
                  // call and set external status
                  await updateExternalStatus(item, payload)
                    .then((response) => {
                      const finalResponse: UptoDateOrNotStateResponseMonitoring =
                        {
                          ...compareResult,
                          uuid: item.uuid,
                          isPause: item.isPause,
                          urlCronJobMonitoringWithPayload: `${item.urlCronJobMonitoring}/${payload}`,
                          urlCronJobMonitoringWithPayloadResponse: response,
                        };
                      req.app.get("LOGGER").info(
                        getLogObjectInfo(req, {
                          scrapResponse: response,
                          uuid: item.uuid,
                        })
                      );
                      finalResponseArray.push(finalResponse);
                    })
                    .catch((error: Error) => {
                      next(error);
                    });
                } else {
                  const message =
                    "Impossible to send state, this item does not contain urlCronJobMonitoring attribut or pause is set";
                  const finalResponse: UptoDateOrNotStateResponseMonitoring = {
                    ...compareResult,
                    isPause: item.isPause,
                    uuid: item.uuid,
                    error: message,
                  };
                  req.app.get("LOGGER").error(
                    getLogObjectError(req, message, {
                      uuid: item.uuid,
                    })
                  );
                  finalResponseArray.push({ ...finalResponse });
                }
              } else {
                const finalResponse: UptoDateOrNotStateResponseMonitoring = {
                  ...compareResult,
                  isPause: item.isPause,
                  uuid: item.uuid,
                };
                finalResponseArray.push({ ...finalResponse });
              }
            })
            .catch(async (error: Error) => {
              errorFound = true;
              let itemResponse: ErrorServerJson = {
                error: error.toString(),
                uuid: item.uuid,
              };
              // if update was asked must set external status with erreur
              if (req.params.setStatus === "1" && item.urlCronJobMonitoring) {
                await updateExternalStatus(item, "1")
                  .then((response) => {
                    itemResponse = {
                      ...itemResponse,
                      urlCronJobMonitoringWithPayload: `${item.urlCronJobMonitoring}/1`,
                      urlCronJobMonitoringWithPayloadResponse: response,
                    };
                  })
                  .catch((error: Error) => {
                    req.app
                      .get("LOGGER")
                      .error(getLogObjectError(req, error.toString()));
                  });
              }
              finalResponseArray.push(itemResponse);
            });
        }
        // is request is uniq uuid : if "all" return array else result[0]
        let finalResponse:
          | (UptoDateOrNotStateResponseMonitoring & ErrorServerJson)[]
          | (UptoDateOrNotStateResponseMonitoring & ErrorServerJson) = [
          ...finalResponseArray,
        ];
        if (req.params.controlUuid !== "all")
          finalResponse = finalResponseArray[0];
        if (!errorFound) {
          res.status(200).json(finalResponse);
        } else {
          res.status(500).json(finalResponse);
        }
      } else {
        req.app.get("LOGGER").error(
          getLogObjectError(req, UUIDNOTFOUND, {
            uuid: req.params.controlUuid,
          })
        );
        res.status(404).json({ error: UUIDNOTFOUND });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Call up the url CI/CD for control uuid provided: 'all' is not accepted
 */
routerActions.put(
  "/action/cicd/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && req.body.uuid) {
        const session = req.session as SessionExt;
        const userGroups = req.app.get("AUTH").getUserGroups(session.user.uuid);
        const record = dbGetRecord(
          req.app.get("DB"),
          req.body.uuid,
          userGroups,
          req.app.get("AUTH").isAdmin(req),
          req.app.get("LOGGER")
        );
        if (record && !Array.isArray(record) && record.urlCICD) {
          await scrapUrl(
            record.urlCICD,
            record.httpMethodCICD,
            `Authorization:${record.urlCICDAuth}`
          )
            .then((response) => {
              req.app.get("LOGGER").info(
                getLogObjectInfo(req, {
                  uuid: req.body.uuid,
                  urlCICD: record.urlCICD,
                  scrapResponse: response,
                })
              );
              res.status(200).send(response);
            })
            .catch((error: Error) => {
              next(error);
            });
        } else {
          const message = `${UUIDNOTFOUND} or no urlCICD`;
          req.app.get("LOGGER").error(
            getLogObjectError(req, message, {
              uuid: req.body.uuid,
            })
          );
          res.status(404).json({ error: message });
        }
      } else {
        req.app.get("LOGGER").error(getLogObjectError(req, UUIDNOTPROVIDED));
        res.status(500).json({ error: UUIDNOTPROVIDED });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

routerActions.put(
  "/action/setstatus/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && req.body.uuid) {
        const session = req.session as SessionExt;
        const userGroups = req.app.get("AUTH").getUserGroups(session.user.uuid);
        const record = (await dbGetRecord(
          req.app.get("DB"),
          req.body.uuid,
          userGroups,
          req.app.get("AUTH").isAdmin(req),
          req.app.get("LOGGER")
        )) as UptodateForm;
        if (record && !Array.isArray(record) && record.urlCronJobMonitoring) {
          // status : 0 if if state == true |  1 if state == false
          const payload = req.body.state ? "0" : "1";
          scrapUrl(
            `${record.urlCronJobMonitoring}/${payload}`,
            record.httpMethodCronJobMonitoring,
            `Authorization:${record.urlCronJobMonitoringAuth}`
          )
            .then((response) => {
              const finalResponse = {
                urlCronJobMonitoringWithPayload: `${record.urlCronJobMonitoring}/${payload}`,
                urlCronJobMonitoringWithPayloadResponse: response,
              };
              req.app.get("LOGGER").info(
                getLogObjectInfo(req, {
                  scrapResponse: JSON.stringify(finalResponse),
                })
              );
              res.status(200).send(response);
            })
            .catch((error: Error) => {
              next(error);
            });
        } else {
          req.app.get("LOGGER").error(getLogObjectError(req, UUIDNOTFOUND));
          res.status(404).json({ error: UUIDNOTFOUND });
        }
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * return the git release of lastcompare
 * usefull to be called by CI/CD
 */
routerActions.get(
  "/action/lastcomparegitrelease/:controlUuid/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as SessionExt;
      const userGroups = req.app.get("AUTH").getUserGroups(session.user.uuid);
      const record = (await dbGetRecord(
        req.app.get("DB"),
        req.params.controlUuid,
        userGroups,
        req.app.get("AUTH").isAdmin(req),
        req.app.get("LOGGER")
      )) as UptodateForm;
      req.app
        .get("LOGGER")
        .info(getLogObjectInfo(req, { uuid: req.params.controlUuid }));
      if (record) {
        if (record.compareResult?.githubLatestRelease) {
          res.status(200).json(record.compareResult?.githubLatestRelease);
        } else {
          const message = "githubLatestRelease is empty";
          req.app.get("LOGGER").error(getLogObjectError(req, message));
          res.status(404).json({ error: message });
        }
      } else {
        req.app.get("LOGGER").error(getLogObjectError(req, UUIDNOTFOUND));
        res.status(404).json({ error: UUIDNOTFOUND });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerActions;

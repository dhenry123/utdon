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
const routerActions = express.Router();

const updateExternalStatus = (
  control: UptodateForm,
  state: "0" | "1"
): Promise<string> => {
  return new Promise((resolv, reject) => {
    scrapUrl(
      `${control.urlCronJobMonitoring}/${state}`,
      control.httpMethodCronJobMonitoring,
      control.urlCronJobMonitoringAuth
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
 * Call compare entrypoint for control uuid, control Uuid value could be "all"
 *
 * @swagger
 * /action/compare/{controlUuid}/{setStatus}:
 *   get:
 *     summary: Call compare method
 *     description: Call compare method for one or all controls, and call url monitoring
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Actions
 *     parameters:
 *       - in: path
 *         name: controlUuid
 *         required: true
 *         description: control uuid, could be 'all'
 *         schema:
 *           type: string
 *       - in: path
 *         name: setStatus
 *         required: true
 *         description: control uuid
 *         schema:
 *           type: string
 *           enum:
 *            - 0
 *            - 1
 *     responses:
 *       200:
 *         description: The response varies according to the parameters provided
 *         content:
 *           application/text:
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: control uuid not found
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */
routerActions.get(
  "/action/compare/:controlUuid/:setStatus",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // in regards the value of controlUuid, response could be UptodateForm | UptodateForm[]
      // data will processed as UptodateForm[]
      let finalRecords: UptodateForm[] = [];
      const finalResponseArray: UptoDateOrNotStateResponseMonitoring[] &
        ErrorServerJson[] = [];
      const record = dbGetRecord(
        req.app.get("DB"),
        req.params.controlUuid,
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
        for (const item of finalRecords) {
          // get state
          await getUpToDateOrNotState(item)
            .then((compareResult) => {
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
                  updateExternalStatus(item, payload)
                    .then((response) => {
                      const finalResponse: UptoDateOrNotStateResponseMonitoring =
                        {
                          ...compareResult,
                          uuid: item.uuid,
                          isPause: item.isPause,
                          urlCronJobMonitoringWithPayload: `${item.urlCronJobMonitoring}/${payload}`,
                          urlCronJobMonitoringWithPayloadResponse: response,
                        };
                      req.app.get("LOGGER").info({
                        ...finalResponse,
                        action: "send state to external monitoring",
                      });
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
                  req.app.get("LOGGER").info({
                    ...item,
                    action: message,
                  });
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
                    req.app.get("LOGGER").error({
                      ...item,
                      action: error.toString(),
                    });
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
        req.app.get("LOGGER").error(UUIDNOTFOUND);
        res.status(404).json({ error: UUIDNOTFOUND });
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Call ci/cd for uuid provided
 *
 * @swagger
 * /action/cicd/:
 *   put:
 *     summary: Call CI/CD
 *     description: Call url CI/CD for control uuid provided
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Actions
 *     requestBody:
 *       description: uuid
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: CI/CD response body
 *         content:
 *           application/text:
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: control uuid not found
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/Error'
 */
routerActions.put(
  "/action/cicd/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && req.body.uuid) {
        const record = dbGetRecord(
          req.app.get("DB"),
          req.body.uuid,
          req.app.get("LOGGER")
        );
        if (record && !Array.isArray(record) && record.urlCICD) {
          await scrapUrl(
            record.urlCICD,
            record.httpMethodCICD,
            record.urlCICDAuth
          )
            .then((response) => {
              req.app.get("LOGGER").info({
                action: "call CI/CD",
                uuid: req.body.uuid,
                url: record.urlCICD,
                httpmethod: record.httpMethodCICD,
                response: response,
              });
              res.status(200).send(response);
            })
            .catch((error: Error) => {
              next(error);
            });
        } else {
          req.app.get("LOGGER").error(UUIDNOTFOUND);
          res.status(404).json({ error: UUIDNOTFOUND });
        }
      } else {
        req.app.get("LOGGER").error(UUIDNOTPROVIDED);
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
        const record = (await dbGetRecord(
          req.app.get("DB"),
          req.body.uuid,
          req.app.get("LOGGER")
        )) as UptodateForm;
        if (record && !Array.isArray(record) && record.urlCronJobMonitoring) {
          // status : 0 if if state == true |  1 if state == false
          const payload = req.body.state ? "0" : "1";
          scrapUrl(
            `${record.urlCronJobMonitoring}/${payload}`,
            record.httpMethodCronJobMonitoring,
            record.urlCronJobMonitoringAuth
          )
            .then((response) => {
              const finalResponse = {
                urlCronJobMonitoringWithPayload: `${record.urlCronJobMonitoring}/${payload}`,
                urlCronJobMonitoringWithPayloadResponse: response,
              };
              req.app.get("LOGGER").info({
                ...finalResponse,
                action: "send state to external monitoring",
                response: response,
              });
              res.status(200).send(response);
            })
            .catch((error: Error) => {
              next(error);
            });
        } else {
          req.app.get("LOGGER").error(UUIDNOTFOUND);
          res.status(404).json({ error: UUIDNOTFOUND });
        }
      }
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerActions;

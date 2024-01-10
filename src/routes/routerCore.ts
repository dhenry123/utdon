/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { NextFunction, Request, Response } from "express";
import { scrapUrl } from "../lib/Features";
import { APPLICATION_VERSION } from "../Constants";
const routerCore = express.Router();

/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: Access token,user/password are missing, invalid, or session is not set
 *   schemas:
 *     Error:
 *       type: string
 *       description: Catched Error as string
 *     HTTPMethods:
 *       type: string
 *       enum:
 *         - "GET"
 *         - "POST"
 *         - "PUT"
 *         - "DELETE"
 *     ChangePasswordType:
 *       type: object
 *       properties:
 *         password:
 *           type: string
 *         newPassword:
 *           type: string
 *         newConfirmPassword:
 *           type: string
 *     NewUserType:
 *       type: object
 *       properties:
 *         login:
 *           type: string
 *           description: login of the new user
 *           example: AzureDiamond
 *         password:
 *           type: string
 *           description: password of the new user
 *           example: hunter2
 *     InfoIuType:
 *       type: object
 *       properties:
 *         login:
 *           type: string
 *         bearer:
 *           type: string
 *     DeletedRecord:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *     UptoDateOrNotState:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: name of control
 *         githubLatestRelease:
 *           type: string
 *           description: latest github release after expression applied
 *         productionVersion:
 *           type: string
 *           description: production version after expression applied
 *         state:
 *           type: boolean
 *           description: is Uptodate or Not ?
 *         strictlyEqual:
 *           type: boolean
 *           description: is production strictly equal latest github release ?
 *         githubLatestReleaseIncludesProductionVersion:
 *           description: Is github latest release included in Production version?
 *           type: boolean
 *         productionVersionIncludesGithubLatestRelease:
 *           description: Is Production version included in github latest release?
 *           type: boolean
 *         urlGitHub:
 *           type: string
 *         urlProduction:
 *           type: string
 *         ts:
 *           type: number
 *           description: Execution timestamp
 *     UptodateForm:
 *       type: object
 *       description: control record
 *       properties:
 *         uuid:
 *           type: string
 *           description: control uniq id
 *         name:
 *           type: string
 *           description: name of control
 *         logo:
 *           type: string
 *           description: base64 html logo src
 *         urlProduction:
 *           type: string
 *           description: url of the production application to be verified
 *         scrapTypeProduction:
 *           type: string
 *           description: type of content
 *         exprProduction:
 *           type: string
 *           description: Expression to apply to get the version
 *         urlGitHub:
 *           type: string
 *           description: url of the github repository
 *         exprGithub:
 *           type: string
 *           description: Expression to apply to get the version
 *         urlCronJobMonitoring:
 *           type: string
 *           description: url of the cronJob monitoring
 *         httpMethodCronJobMonitoring:
 *           $ref: '#/components/schemas/HTTPMethods'
 *           description: Http method to call url of the cronJob monitoring
 *         urlCronJobMonitoringAuth:
 *           type: string
 *           description: Api Key to provide to call url of the cronJob monitoring
 *         urlCICD:
 *           type: string
 *           description: url of the CI/CD
 *         httpMethodCICD:
 *           $ref: '#/components/schemas/HTTPMethods'
 *           description: Http method to call url of the CI/CD
 *         urlCICDAuth:
 *           type: string
 *           description: Api Key to provide to call url of the CI/CD
 *         isPause:
 *           type: boolean
 *           description: When calling compare API if paused, this control will not be included in the process
 *         compareResult:
 *           description: latest compare result
 *           oneOf:
 *             - $ref: '#/components/schemas/UptoDateOrNotState'
 *             - nullable: true
 */

/**
 * @swagger
 * /scrap/{url}:
 *   get:
 *     summary: Get provided url content
 *     description: Used to retrieve url content from the production server, github API tags...
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Core
 *     parameters:
 *       - in: path
 *         name: url
 *         required: true
 *         description: url to scrap http||https supported
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: content as text
 *         content:
 *           application/text:
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error'
 */
routerCore.get(
  "/scrap/:url",
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.params.url !== undefined) {
      await scrapUrl(req.params.url, "GET")
        .then((data: string) => {
          // Warn Reduxtoolkit expect text so data will always be type = string
          res.status(200).send(data);
        })
        .catch((error: Error) => {
          res
            .status(500)
            .json({ error: `${error.toString()}-${req.params.url}` });
        });
    } else {
      next(new Error("Url is not provided"));
    }
  }
);

/**
 * @swagger
 * /version:
 *   get:
 *     summary: To get the application version
 *     description: Get the version in JSON format
 *     security: []
 *     tags:
 *       - Core
 *     responses:
 *       200:
 *         description: Version as JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: 'Major.Minor.Patch'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
routerCore.get(
  "/version",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).send({ version: APPLICATION_VERSION });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Is service Healthy ?
 *     description: Could be used to find out if the service is healthy
 *     security: []
 *     tags:
 *       - Core
 *     responses:
 *       204:
 *         description: service is healthy
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
routerCore.get(
  "/healthz",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: not implemented
 *     description: In the Roadmap
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Core
 *     responses:
 *       503:
 *         description: not implemented
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
routerCore.get(
  "/metrics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(503).json("Service is not available");
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default routerCore;

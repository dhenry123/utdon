/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { NextFunction, Request, Response } from "express";
import { scrapUrl } from "../lib/Features";
import { APPLICATION_VERSION } from "../Constants";
import {
  getGlobalGithubToken,
  getHeaderGlobalGithubToken,
} from "../lib/GlobalGithubToken";
const routerCore = express.Router();

/**
 * Used to retrieve url content from the production server, github API tags...
 */
routerCore.get(
  "/scrap/:url",
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.params.url !== undefined) {
      const header = getHeaderGlobalGithubToken(
        req.params.url,
        req.headers.scrapurlheader as string,
        getGlobalGithubToken()
      );
      await scrapUrl(req.params.url, "GET", header)
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
 * To get the application version
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
 * Could be used to find out if the service is healthy
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
 * metrics not implemented
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

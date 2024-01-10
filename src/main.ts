/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";
import * as http from "http";
import winston from "winston";
import helmet from "helmet";
import { parse } from "yaml";
import { existsSync, readFileSync } from "fs";

import {
  dbCommit,
  dbConnect,
  dbCreate,
  dbGetData,
  getDbInitJsonFileName,
} from "./lib/Database";
import { Authentification } from "./lib/Authentification";
import {
  ADMINPASSWORDDEFAULT,
  ADMINUSERLOGINDEFAULT,
  API_ENTRY_POINTS_NO_NEED_AUTHENTICATION,
  JSON_POST_MAX_SIZE,
  OPENAPIFILEYAML,
  SERVER_ERROR_IMPOSSIBLE_TO_CREATE_DB,
  SERVER_ERROR_USER_IS_NOT_AUTHENTIFIED,
} from "./Constants";
import routerControl from "./routes/routerControls";
import routerActions from "./routes/routerActions";
import routerCore from "./routes/routerCore";
import routerAuth from "./routes/routerAuth";

// Swagger Documentation
import swaggerUi from "swagger-ui-express";

// logs
const { combine, timestamp, json } = winston.format;
const logger = winston.createLogger({
  level: "info",
  defaultMeta: {
    service: "utdon",
  },
  format: combine(timestamp(), json()),
  transports: [new winston.transports.Console()],
});

// Environment vars check
if (!process.env.USER_ENCRYPT_SECRET || !process.env.DATABASE_ENCRYPT_SECRET) {
  logger.error(
    "[Httpserver - fatal] You have to set environment vars (USER_ENCRYPT_SECRET,DATABASE_ENCRYPT_SECRET) to start this process. Please read the documentation."
  );
  process.exit(1);
}
// Database
let dbfile = dbConnect(getDbInitJsonFileName());
if (!dbfile) {
  logger.info("[Httpserver] Database doesn't exist, creating...");
  dbfile = getDbInitJsonFileName();
}
dbCreate(dbfile).catch((error: Error) => {
  if (
    !error.toString().match(new RegExp(SERVER_ERROR_IMPOSSIBLE_TO_CREATE_DB))
  ) {
    logger.error(error);
    process.exit(1);
  }
});
dbGetData(dbfile)
  .then((res) => {
    app.set("DB", res);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });

// Checking user database
const userDbPathDev = `${__dirname}/../data/user.json`;
const userDbPath = `${__dirname}/data/user.json`;
const auth = new Authentification(
  process.env.environment === "development" ? userDbPathDev : userDbPath
);
const data = auth.loadUsersFromDatabase();
if (data.users && data.users.length === 0) {
  logger.info({ action: "Creating user database, with admin/admin" });
  auth.store(auth.makeUser(ADMINUSERLOGINDEFAULT, ADMINPASSWORDDEFAULT));
}

const app = express();

// shared objects
app.set("LOGGER", logger);
app.set("DBFILE", dbfile);
app.set("AUTH", auth);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

app.use(express.json({ limit: JSON_POST_MAX_SIZE }));

//====> Session
const sessionOpts = {
  secret: crypto.randomBytes(16).toString("hex"),
  resave: false,
  saveUninitialized: true, // create non initialized session
};
const serverSession = session(sessionOpts);
app.use(serverSession);

// listening port server
app.set("PORT", process.env?.PORT ? process.env.PORT : 3015);
// listening IP address server
app.set(
  "IPADDRESS",
  process.env?.IPADDRESS ? process.env.IPADDRESS : "0.0.0.0"
);
// Needed for Ip collecting
app.set("trust proxy", true);

/**
 * explainations : https://dev.to/p0oker/why-is-my-browser-sending-an-options-http-request-instead-of-post-5621
 */
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, InstantKey, Content-Length, X-Requested-With"
  );
  //intercepts OPTIONS method
  if ("OPTIONS" === req.method) {
    res.sendStatus(200);
  } else {
    //exec next
    next();
  }
});

// statics routes
const publicPath =
  process.env.environment === "development" ? "/../client/dist/" : "/public";

// route to send react app
["/", "/login", "/ui/editcontrol/*", "/ui/addcontrol"].forEach((item) => {
  app.use(
    item,
    express.static(__dirname + publicPath, {
      etag: true,
    })
  );
});

//Swagger
if (existsSync(OPENAPIFILEYAML)) {
  const swaggerDocument = parse(readFileSync(OPENAPIFILEYAML, "utf-8"));
  app.use("/api/doc/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use((req: Request, res: Response, next: NextFunction) => {
  // no need auth for this UI routes
  if (API_ENTRY_POINTS_NO_NEED_AUTHENTICATION.includes(req.path))
    return next(null);

  if (auth.isAuthenticated(req)) {
    return next(null);
  } else {
    return next(
      new Error(`${SERVER_ERROR_USER_IS_NOT_AUTHENTIFIED}-RemoteIp:[${req.ip}]`)
    );
  }
});

// Routes
app.use("/api/v1", routerAuth);
app.use("/api/v1", routerCore);
app.use("/api/v1", routerControl);
app.use("/api/v1", routerActions);

/**
 * catch 404 and stop
 */
app.use((req: Request, res: Response) => {
  const message = "Route Not found";
  res.status(404).json({ message: message });
});
// ------------------ Routes

// -- AFTER ALL app.use(....) - 2 components : logErrors - clientErrorHandler
// Implementation as defined in express() documentation http://expressjs.com/en/guide/error-handling.html
/**
 * logErrors
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error && typeof error === "object") {
    logger.error({
      srcFile: __filename,
      triggered: "app.use(err... object)",
      errorToString: error.toString(),
      stack: JSON.stringify(error.stack),
    });
  } else {
    logger.error({
      srcFile: __filename,
      triggered: "app.use(err... string)",
      errorToString: error,
      stack: "not available - error is not an Error Object",
    });
  }
  let status = 500;
  if (error.toString().match(new RegExp(SERVER_ERROR_USER_IS_NOT_AUTHENTIFIED)))
    status = 401;
  if (error.toString().match(/TypeError: fetch failed/)) {
    res.status(status).json({ error: error.toString() });
  } else {
    res.status(status).json({ error: "Something went wrong" });
  }
  // stop express error propagation
  () => next(error);
});

const httpServer = http.createServer(app);
httpServer.listen(app.get("PORT"), app.get("IPADDRESS"), function () {
  logger.info(
    `[Httpserver] listening at http://${app.get("IPADDRESS")}:${app.get(
      "PORT"
    )}`
  );
});

// Dont use in development because of nodemon which not wait for final exit
if (process.env.environment !== "development") {
  //listening process signal
  process.on("SIGTERM", () => {
    exitProcess();
  });

  process.on("SIGINT", () => {
    exitProcess();
  });

  process.on("SIGUSR2", () => {
    exitProcess();
  });

  const exitProcess = () => {
    // commit DB
    logger.info({ action: "Shutdown in progress, please wait for a while..." });
    setTimeout(() => {
      dbCommit(dbfile || "", app.get("DB"));
      logger.info({ action: "End of process" });
      process.exit(0);
    }, 500);
    return true;
  };
}

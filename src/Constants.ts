/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import {
  ChangePasswordType,
  ControlToPause,
  SelectOptionType,
  ToastType,
  UptoDateOrNotState,
  UptodateForm, NewUserType,
} from "./Global.types";

export const INPROGRESS_UPTODATEORNOTSTATE: UptoDateOrNotState = {
  name: "In progress",
  githubLatestRelease: "In progress",
  productionVersion: "In progress",
  githubLatestReleaseIncludesProductionVersion: false,
  productionVersionIncludesGithubLatestRelease: false,
  state: false,
  strictlyEqual: false,
  urlGitHub: "",
  urlProduction: "",
};

export const APPLICATION_VERSION = "1.2.0";

// routes which dont need authentication to be served
// firsts are UI routes
export const API_ENTRY_POINTS_NO_NEED_AUTHENTICATION = [
  // Served by webserver
  "/",
  "/login",
  "/ui/editcontrol/*",
  "/ui/addcontrol",
  // Pure API
  "/api/v1/healthz",
  "/api/v1/userlogin",
  "/api/v1/userlogout",
  "/api/v1/isauthenticated",
  "/api/v1/version",
  "/api/doc/",
];

export const OPENAPIFILEJSON = "./openapi.json";
export const OPENAPIFILEYAML = "./openapi.yaml";

/** Toasts */
export const TOAST_DEFAULT_LIFETIME = 10000;

export const INITIALIZED_TOAST: ToastType = {
  severity: "error",
  summary: "",
  detail: "",
  life: TOAST_DEFAULT_LIFETIME,
  timestamp: 0,
  sticky: false,
  empty: false,
};

export const ADMINUSERLOGINDEFAULT = "admin";
export const ADMINPASSWORDDEFAULT = "admin";

export const CIPHERSHAALGORITHM = "sha256";
export const CIPHERALGORITHM = "AES-256-GCM";

export const LOGIN_FAILED = "LOGIN_FAILED";
export const PASSWORD_OR_USER_UNDEFINED = "PASSWORD_OR_USER_UNDEFINED";
export const ERRORINVALIDREQUEST: [number, string] = [500, "invalid query"];

// max file size in KBits (xKB * 1024)
export const MAXFILESIZEKBITS = 100;

// Max size of post data
export const JSON_POST_MAX_SIZE = "200kb";

export const SCRAPTYPEOPTIONJSON = "Json";
export const SCRAPTYPEOPTIONTEXT = "Text / HTML / XML";

export const INITIALIZED_CHANGEPASSWORD: ChangePasswordType = {
  login: "",
  password: "",
  newPassword: "",
  newConfirmPassword: "",
};

export const INITIALIZED_NEWUSER: NewUserType = {
  login: "",
  password: "",
};

export const INITIALIZED_UPTODATEFORM: UptodateForm = {
  urlProduction: "",
  scrapTypeProduction: "json",
  exprProduction: "join('.',*)",
  urlGitHub: "",
  exprGithub: "",
  urlCronJobMonitoring: "",
  httpMethodCronJobMonitoring: "GET",
  urlCronJobMonitoringAuth: "",
  urlCICD: "",
  httpMethodCICD: "GET",
  urlCICDAuth: "",
  name: "",
  logo: "",
  uuid: "",
  isPause: false,
  compareResult: null,
};

export const HTTP_METHOD_ENUM: SelectOptionType[] = [
  { key: "GET", value: "GET", label: "GET" },
  { key: "POST", value: "POST", label: "POST" },
  { key: "PUT", value: "PUT", label: "PUT" },
];

export const UUIDNOTFOUND = "UUID not found";
export const UUIDNOTPROVIDED = "UUID not provided";

export const INTIALIZED_CONTROL_TO_PAUSE: ControlToPause = {
  uuid: "",
  state: false,
};

export const SERVER_ERROR_IMPOSSIBLE_TO_CREATE_DB =
  "Impossible to create DB already exists";

export const SERVER_ERROR_USER_IS_NOT_AUTHENTIFIED = "User is not authentified";

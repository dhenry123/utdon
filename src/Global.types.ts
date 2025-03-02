/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

export type scrapUrlHeaderType = {
  scrapUrlHeader: string;
};

export type HTTPMethods = "GET" | "POST" | "PUT" | "DELETE";

export type JSONLang = Record<string, string>;

export type GithubReleaseTagModel = {
  name: string;
  [key: string]: unknown;
};

export type GiteaReleaseTagModel = {
  tag_name: string;
  [key: string]: unknown;
};

export type TypeGitRepo = "gitea" | "github";

export type ScrapType = "json" | "text";

export type UptodateForm = {
  uuid: string;
  name: string;
  fixed?: string;
  logo?: string;
  urlProduction: string;
  headerkey: string;
  headervalue: string;
  headerkeyGit: string;
  headervalueGit: string;
  // Flag indicating that these attributes have been modified by the setControlGlobalGithubToken method.
  authGlobale?: boolean;
  scrapTypeProduction: ScrapType;
  exprProduction: string;
  urlGitHub: string;
  typeRepo: string;
  exprGithub: string;
  urlCronJobMonitoring: string;
  httpMethodCronJobMonitoring: HTTPMethods;
  urlCronJobMonitoringAuth: string;
  urlCICD: string;
  httpMethodCICD: HTTPMethods;
  urlCICDAuth: string;
  isPause: boolean;
  compareResult: UptoDateOrNotState | null;
  groups: GroupMembersType;
};

export type UptodateFormFields =
  | "uuid"
  | "name"
  | "logo"
  | "urlProduction"
  | "scrapTypeProduction"
  | "exprProduction"
  | "urlGitHub"
  | "exprGithub"
  | "urlCronJobMonitoring"
  | "httpMethodCronJobMonitoring"
  | "urlCronJobMonitoringAuth"
  | "urlCICD"
  | "httpMethodCICD"
  | "urlCICDAuth"
  | "isPause"
  | "groups"
  | "headerkey"
  | "headervalue"
  | "headerkeyGit"
  | "headervalueGit"
  | "fixed";

export type ApiResponseType = {
  data?: JSON;
  error?: { originalStatus: number };
};

export type InfoIuType = {
  login: string;
  bearer: string;
  uuid: string;
  groups: string[];
};

export type ActionStatusType = {
  uuid: string;
  state: boolean;
  productionVersion: string;
  githubLatestRelease: string;
};

export type ActionCiCdType = {
  uuid: string;
};

export type DisplayControlsType = "table" | "cards";

export type contextSliceType = {
  // French is default language
  language: { locale: string; lang: JSONLang };
  application: {
    name: string;
    applicationtitle: string;
    copyright: string;
    licence: string;
  };
  uptodateForm: UptodateForm;
  refetchuptodateForm: boolean;
  isAdmin: boolean;
  search: string;
  displayControlsType: DisplayControlsType;
  isLoaderShip: boolean;
  authToken: string;
};

export type ToastSeverityType = "info" | "error" | "warn" | "success";
export type ToastType = {
  severity?: ToastSeverityType;
  summary: string;
  detail: string;
  life: number;
  timestamp?: number;
  // need user to close the toast
  sticky: boolean;
  empty: boolean;
};

export type SelectOptionType = {
  key?: string;
  value: string;
  label: string;
};

/**
 * Informations to post to server
 */
export type PostAuthent = {
  login: string;
  password: string;
};

export interface ErrorServer extends Error {
  error: string;
}

export interface ErrorServerJson {
  error: string;
  uuid: string;
  urlCronJobMonitoringWithPayload?: string;
  urlCronJobMonitoringWithPayloadResponse?: string;
}

export type UptoDateOrNotState = {
  name: string;
  githubLatestRelease: string;
  productionVersion: string;
  state: boolean;
  strictlyEqual: boolean;
  githubLatestReleaseIncludesProductionVersion: boolean;
  productionVersionIncludesGithubLatestRelease: boolean;
  urlGitHub: string;
  urlProduction: string;
  // generated timestamp
  ts?: number;
};

export interface UptoDateOrNotStateResponseMonitoring
  extends UptoDateOrNotState {
  uuid: string;
  isPause: boolean;
  error?: string;
  urlCronJobMonitoringWithPayload?: string;
  urlCronJobMonitoringWithPayloadResponse?: string;
}

export type UsersType = {
  users: UserType[];
};

export type UserType = {
  login: string;
  uuid: string;
  password: string;
  bearer: string;
};

export type UIError = {
  message: string;
  code: number;
};

export type ChangePasswordType = {
  password: string;
  newPassword: string;
  newConfirmPassword: string;
};

export type NewUserType = {
  login: string;
  password: string;
  groups: string[];
  uuid?: string;
};

export type ControlToPause = {
  uuid: string;
  state: boolean;
};

export type GroupMembersType = string[];

/**
 * {"group name" : [ members...] }
 */
export type GroupsType = {
  [key: string]: GroupMembersType;
};

export type UsersGroupsType = {
  users: UserType[];
  groups: GroupsType;
};

export type UserDescriptionType = {
  login: string;
  uuid: string;
  groups: string[];
};

export interface OptionsLogType {
  message?: string;
  scrapResponse?: string;
  uuid?: string;
  urlCICD?: string;
  gitAuthenticationProvided?: boolean;
  productionAuthenticationProvided?: boolean;
  newUser?: string;
  userDeleted?: string;
  userUpdated?: string;
  userLogout?: string;
}
export interface logInfo extends OptionsLogType {
  userId: string;
  userLogin: string;
  apiPath: string;
  apiMethod: string;
  ipAddr: string | undefined;
}

export interface logError extends logInfo {
  error: string;
}

export type InfosScrapConnection = {
  httpProxy: boolean;
  httpsProxy: boolean;
  data: string;
};

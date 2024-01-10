/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

export type HTTPMethods = "GET" | "POST" | "PUT" | "DELETE";

export type JSONLang = Record<string, string>;

export type GithubReleaseTagModel = {
  name: string;
  [key: string]: unknown;
};

export type ScrapType = "json" | "text";

export type UptodateForm = {
  uuid: string;
  name: string;
  logo?: string;
  urlProduction: string;
  scrapTypeProduction: ScrapType;
  exprProduction: string;
  urlGitHub: string;
  exprGithub: string;
  urlCronJobMonitoring: string;
  httpMethodCronJobMonitoring: HTTPMethods;
  urlCronJobMonitoringAuth: string;
  urlCICD: string;
  httpMethodCICD: HTTPMethods;
  urlCICDAuth: string;
  isPause: boolean;
  compareResult: UptoDateOrNotState | null;
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
  | "isPause";

export type ApiResponseType = {
  data?: JSON;
  error?: { originalStatus: number };
};

export type InfoIuType = {
  login: string;
  bearer: string;
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

export type contextSliceType = {
  // French is default language
  language: { locale: string; lang: JSONLang };
  user: InfoIuType;
  application: {
    name: string;
    applicationtitle: string;
    copyrightts: string;
    licence: string;
  };
  uptodateForm: UptodateForm;
  refetchuptodateForm: boolean;
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
}

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
  login: string;
  password: string;
  newPassword: string;
  newConfirmPassword: string;
};

export type NewUserType = {
  login: string;
  password: string;
}

export type ControlToPause = {
  uuid: string;
  state: boolean;
};

import { readFileSync, writeFileSync } from "fs";
import { Authentification } from "./Authentification";
import { UptodateForm } from "../Global.types";

const getFilePath = (): string => {
  const ggtDbPathDev = `${__dirname}/../../data//globalGithubToken`;
  const ggtDbPath = `${__dirname}/../data/globalGithubToken`;

  return process.env.environment === "development" ? ggtDbPathDev : ggtDbPath;
};

export const setGlobalGithubToken = (token: string) => {
  writeFileSync(
    getFilePath(),
    Authentification.dataEncrypt(token, process.env.DATABASE_ENCRYPT_SECRET),
    "utf-8"
  );
  return;
};

export const getGlobalGithubToken = (): string => {
  const tokenEncrypted: string = readFileSync(getFilePath(), "utf-8");
  if (tokenEncrypted && tokenEncrypted.trim() !== "") {
    return Authentification.dataDecrypt(
      tokenEncrypted,
      process.env.DATABASE_ENCRYPT_SECRET
    );
  }
  return "";
};

// raw authorization header [key]:[value]
export const setControlGlobalGithubToken = (
  record: UptodateForm,
  globalGithubToken: string
): UptodateForm => {
  // header already set on control
  if (record.headerkeyGit && record.headervalueGit) return record;
  if (globalGithubToken && /github\.com/.test(record.urlGitHub)) {
    // global github token is provided, set header attributes values
    return {
      ...record,
      headerkeyGit: "Authorization",
      headervalueGit: `Bearer ${globalGithubToken}`, // see github document authentication
    };
  }
  return record;
};

export const getHeaderGlobalGithubToken = (
  url: string,
  header: string,
  globalGithubToken: string
): string => {
  // header already set no change
  if (header) return header;
  // github url & globalGithubToken set using global authentication
  if (globalGithubToken && /github\.com/.test(url))
    return `Authorization:Bearer ${globalGithubToken}`; // see github document authentication
  // no header
  return "";
};

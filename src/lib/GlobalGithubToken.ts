import { readFileSync, writeFileSync } from "fs";
import { Authentification } from "./Authentification";

const getFilePath = (): string => {
  const ggtDbPathDev = `${__dirname}/../../data//globalGithubToken`;
  const ggtDbPath = `${__dirname}/../data//globalGithubToken`;

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

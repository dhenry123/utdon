import { existsSync, readFileSync } from "fs";

const environment = "./.envTest";

if (!existsSync(environment)) {
  throw new Error(`${environment} file must exist before running tests`);
}
const envFile = readFileSync(environment).toString();

for (const line of envFile.split("\n")) {
  if (/^ *#/.test(line) || !line.trim()) continue;
  const [key, value] = line.split("=");
  process.env[key] = value.replace(/^['"]|['"]$/g, "");
}

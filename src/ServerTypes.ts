/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { Session } from "express-session";
import { InfoIuType } from "./Global.types.js";

/**
 * No need for UI
 */
export interface SessionExt extends Session {
  user: InfoIuType;
}

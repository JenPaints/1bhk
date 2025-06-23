/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as calendar from "../calendar.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as platformConnections from "../platformConnections.js";
import type * as properties from "../properties.js";
import type * as propertyManagement from "../propertyManagement.js";
import type * as router from "../router.js";
import type * as sync from "../sync.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  bookings: typeof bookings;
  calendar: typeof calendar;
  crons: typeof crons;
  http: typeof http;
  platformConnections: typeof platformConnections;
  properties: typeof properties;
  propertyManagement: typeof propertyManagement;
  router: typeof router;
  sync: typeof sync;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

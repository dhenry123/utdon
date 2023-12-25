/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  ActionCiCdType,
  ActionStatusType,
  ChangePasswordType,
  UptodateForm,
} from "../../../src/Global.types";

export const mytinydcUPDONApi = createApi({
  // Query service name
  reducerPath: "api",
  // Url Base API
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  endpoints: (builder) => ({
    postUserLogin: builder.mutation({
      query: (body) => ({
        method: "POST",
        url: `/userlogin`,
        body,
      }),
    }),
    getUserIsAuthenticated: builder.query({
      query: () => ({
        url: `/isauthenticated/`,
      }),
    }),
    getUserLogout: builder.query({
      query: () => ({
        url: `/userlogout`,
      }),
    }),
    getScrapUrl: builder.query({
      query: (url: string) => ({
        url: `/scrap/${encodeURIComponent(url)}`,
        // scrap result is always text
        responseHandler: (response) => response.text(),
      }),
    }),
    postCheck: builder.mutation({
      query: (checkData: UptodateForm) => ({
        method: "POST",
        url: `/control`,
        body: checkData,
      }),
    }),
    getCompare: builder.query({
      query: (uuid: string) => ({
        url: `/action/compare/${encodeURIComponent(uuid)}/0`,
      }),
    }),
    getCheck: builder.query({
      query: (uuidOrAll: string) => ({
        url: `/control/${uuidOrAll}`,
      }),
    }),
    deleteCheck: builder.mutation({
      query: (uuid: string) => ({
        method: "DELETE",
        url: `/control/${uuid}`,
      }),
    }),
    sendStateExternalMonitoring: builder.mutation({
      query: (data: ActionStatusType) => ({
        method: "PUT",
        url: `/action/setstatus/`,
        body: data,
        responseHandler: (response) => response.text(),
      }),
    }),
    callCiCd: builder.mutation({
      query: (data: ActionCiCdType) => ({
        method: "PUT",
        url: `/action/cicd/`,
        body: data,
        responseHandler: (response) => response.text(),
      }),
    }),
    postChangePassword: builder.mutation({
      query: (data: ChangePasswordType) => ({
        method: "POST",
        url: `/changepassword/`,
        body: data,
      }),
    }),
    getBearer: builder.mutation({
      query: () => ({
        method: "GET",
        url: `/bearer/`,
      }),
    }),
    putBearer: builder.mutation({
      query: () => ({
        method: "PUT",
        url: `/bearer/`,
      }),
    }),
  }),
});

export const {
  usePostUserLoginMutation,
  useGetCheckQuery,
  useDeleteCheckMutation,
} = mytinydcUPDONApi;

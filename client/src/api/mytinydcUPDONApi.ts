/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  ActionCiCdType,
  ActionStatusType,
  ChangePasswordType,
  NewUserType,
  UptodateForm,
} from "../../../src/Global.types";
import { buildHeader } from "../helpers/rtk";

export const mytinydcUPDONApi = createApi({
  // Query service name
  reducerPath: "api",
  // tag types
  tagTypes: ["User", "Users", "Groups", "Controls"],
  // Url Base API
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  endpoints: (builder) => ({
    postUserLogin: builder.mutation({
      query: (body) => ({
        method: "POST",
        url: `/userlogin`,
        body,
      }),
      invalidatesTags: ["User"],
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
      query: (data: {
        url: string;
        headerkey?: string;
        headervalue?: string;
      }) =>
        data.headerkey && data.headervalue
          ? {
              url: `/scrap/${encodeURIComponent(data.url)}`,
              headers: buildHeader(`${data.headerkey}:${data.headervalue}`),
              // scrap result is always text
              responseHandler: (response) => response.text(),
            }
          : {
              url: `/scrap/${encodeURIComponent(data.url)}`,
              // scrap result is always text
              responseHandler: (response) => response.text(),
            },
    }),
    postUptodateForm: builder.mutation({
      query: (uptodateFormData: UptodateForm) => ({
        method: "POST",
        url: `/control`,
        body: uptodateFormData,
      }),
      invalidatesTags: ["Controls"],
    }),
    getCompare: builder.query({
      query: (uuid: string) => ({
        url: `/action/compare/${encodeURIComponent(uuid)}/0`,
      }),
    }),
    getControl: builder.query({
      query: (uuidOrAll: string) => ({
        url: `/control/${uuidOrAll}`,
      }),
      providesTags: ["Controls"],
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
    putChangePassword: builder.mutation({
      query: (data: ChangePasswordType) => ({
        method: "PUT",
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
    getUsers: builder.query({
      query: () => ({
        url: `/users/`,
      }),
      providesTags: ["Users"],
    }),
    // needed to keep context when use press F5
    // login method return info needed but if user press F5 once connected
    // login method is not recalled
    getUserLogin: builder.query({
      query: () => ({
        url: `/userlogin/`,
      }),
      providesTags: ["User"],
    }),
    postUser: builder.mutation({
      query: (data: NewUserType) => ({
        method: "POST",
        url: `/users/`,
        body: data,
      }),
      invalidatesTags: ["Users", "Groups"],
    }),
    putUser: builder.mutation({
      query: (data: NewUserType) => ({
        method: "PUT",
        url: `/users/`,
        body: data,
      }),
      invalidatesTags: ["Users", "Groups"],
    }),
    deleteUser: builder.mutation({
      query: (login: string) => ({
        method: "DELETE",
        url: `/users/${login}`,
        type: "mutation",
      }),
      invalidatesTags: ["Users"],
    }),
    getGroups: builder.query({
      query: () => ({
        url: `/groups/`,
      }),
      providesTags: ["Groups"],
    }),
    isAdmin: builder.query({
      query: () => ({
        url: `/isadmin/`,
      }),
    }),
    getUserGroups: builder.query({
      query: () => ({
        url: `/userGroups/`,
      }),
    }),
  }),
});

export const {
  usePostUserLoginMutation,
  useGetControlQuery,
  useGetUsersQuery,
  useGetUserLoginQuery,
  useGetGroupsQuery,
} = mytinydcUPDONApi;

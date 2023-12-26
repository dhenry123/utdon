/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { configureStore } from "@reduxjs/toolkit";
import context from "./contextSlice";
import { mytinydcUPDONApi } from "../api/mytinydcUPDONApi";
import servicemessage from "./serviceMessageSlice";

export const store = configureStore({
  reducer: {
    context: context,
    servicemessage: servicemessage,
    // Services
    [mytinydcUPDONApi.reducerPath]: mytinydcUPDONApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mytinydcUPDONApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

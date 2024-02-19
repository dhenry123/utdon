/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createBrowserRouter } from "react-router-dom";
import { ErrorInRouter } from "../features/errors/ErrorInRouter";
import { PageLogin } from "../features/login/PageLogin";
import { useAppDispatch } from "../app/hook";
import { mytinydcUPDONApi } from "../api/mytinydcUPDONApi";
import { showServiceMessage } from "./serviceMessageSlice";
import { PageHome } from "../features/homepage/PageHome";
import { DisplayControls } from "../features/displaycontrols/DisplayControls";
import { ControlManager } from "../features/controlmanagement/ControlManager";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Logic :
 * user ask route
 * @returns
 */
export const Router = () => {
  const dispatch = useAppDispatch();

  return createBrowserRouter([
    {
      path: "/",
      element: <PageHome />,
      errorElement: <ErrorInRouter />,
      loader: async () => {
        return await dispatch(
          mytinydcUPDONApi.endpoints.getUserIsAuthenticated.initiate(null)
        )
          .unwrap()
          .catch((error: FetchBaseQueryError) => {
            if (error.status === 401) {
              return <PageLogin></PageLogin>;
            } else {
              dispatch(
                showServiceMessage({
                  detail:
                    error && error.data
                      ? error.data.toString()
                      : "Unknown check server logs",
                })
              );
            }
          });
      },
      children: [
        {
          path: "/ui/addcontrol",
          element: <ControlManager />,
          errorElement: <ErrorInRouter />,
        },
        {
          path: "/ui/editcontrol/:uuid",
          element: <ControlManager />,
          errorElement: <ErrorInRouter />,
        },

        {
          path: "/",
          element: <DisplayControls />,
          errorElement: <ErrorInRouter />,
        },
      ],
    },

    {
      path: "/login",
      element: <PageLogin />,
      errorElement: <ErrorInRouter />,
    },
  ]);
};

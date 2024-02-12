/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createBrowserRouter, redirect } from "react-router-dom";
import { ErrorInRouter } from "../features/errors/ErrorInRouter";
import { PageLogin } from "../features/login/PageLogin";
import { useAppDispatch } from "../app/hook";
import { mytinydcUPDONApi } from "../api/mytinydcUPDONApi";
import { showServiceMessage } from "./serviceMessageSlice";
import { PageHome } from "../features/homepage/PageHome";
import { ApiResponseType } from "../../../src/Global.types";
import { DisplayControls } from "../features/displaycontrols/DisplayControls";
import { ControlManager } from "../features/controlmanagement/ControlManager";

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
          .catch((error: unknown) => {
            dispatch(
              showServiceMessage({
                detail: error,
              })
            );
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

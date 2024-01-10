/**
 * @author Lucie Delestre
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch } from "../../app/hook";
import { useNavigate } from "react-router-dom";

import "./UserManager.scss";
import InputGeneric from "../../components/InputGeneric";
import { useEffect, useState } from "react";
import {
    INITIALIZED_NEWUSER,
    INITIALIZED_TOAST,
} from "../../../../src/Constants";
import { ErrorServer, NewUserType } from "../../../../src/Global.types";
import { FieldSet } from "../../components/FieldSet";
import ButtonGeneric from "../../components/ButtonGeneric";
import { Block } from "../../components/Block";
import { mytinydcUPDONApi, useGetUsersQuery } from "../../api/mytinydcUPDONApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { showServiceMessage } from "../../app/serviceMessageSlice";

export const UserManager = () => {
    const intl = useIntl();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<NewUserType>(
        INITIALIZED_NEWUSER
    );

    const {
        data: users,
        isSuccess
    } = useGetUsersQuery(null, {
        skip: false,
    });

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    /**
     * Used for server errors (api entrypoint call)
     * @param error
     * @returns
     */
    const dispatchServerError = (error: FetchBaseQueryError) => {
        if (error) {
            const servererror = error.data as ErrorServer;
            if (servererror.error) {
                dispatch(
                    showServiceMessage({
                        ...INITIALIZED_TOAST,
                        severity: "error",
                        sticky: true,
                        detail: intl.formatMessage({id: servererror.error}),
                    })
                );
            }
            if (error.status === 401) return navigate("/login");
        }
    };

    const handleOnPost = async (e: React.FormEvent | null) => {
        e?.preventDefault();
        if (
            formData.login &&
            formData.password) {
            dispatch(mytinydcUPDONApi.endpoints.postUser.initiate(
                formData
            ))
                .unwrap()
                .then(() => {
                    // onHide();
                    dispatch(
                        showServiceMessage({
                            ...INITIALIZED_TOAST,
                            severity: "info",
                            sticky: false,
                            detail: intl.formatMessage({
                                id: `User ${formData.login} created`,
                            }),
                        })
                    );
                })
                .catch((error) => {
                    dispatchServerError(error);
                });
        }
    };

    const handleOnDelete = async (login: string) => {
        if (login) {
            dispatch(mytinydcUPDONApi.endpoints.deleteUser.initiate(login))
                .unwrap()
                .then(() => {
                    dispatch(
                        showServiceMessage({
                            ...INITIALIZED_TOAST,
                            severity: "info",
                            sticky: false,
                            detail: intl.formatMessage({
                                id: `User ${login} deleted`,
                            }),
                        })
                    );
                })
                .catch((error) => {
                    dispatchServerError(error);
                });
        }

    }


    const handleOnChange = (key: string, value: string) => {
        setFormData({...formData, [key]: value});
    };

    useEffect(() => {
        if (
            formData.password &&
            formData.login
        ) {
            setIsButtonDisabled(false);
        } else {
            setIsButtonDisabled(true);
        }
    }, [formData]);

    return (
        <div className="UserManager">
            <h2 className={"new-user-label"}>{intl.formatMessage({id: "Add a new user"})}</h2>
            <Block>
                <form onSubmit={handleOnPost} className={"form"}>
                    <FieldSet
                        legend={intl.formatMessage({id: "Username"})}
                        className="expression"
                    >
                        <InputGeneric
                            value={formData.login}
                            onChange={(value) => handleOnChange("login", value)}
                        />
                    </FieldSet>
                    <FieldSet
                        legend={intl.formatMessage({id: "Password"})}
                        className="password"
                    >
                        <InputGeneric
                            value={formData.password}
                            type={"password"}
                            onChange={(value) => handleOnChange("password", value)}
                        />
                    </FieldSet>
                    <FieldSet legend={intl.formatMessage({id: "Submit"})} className={"submit-button"}>
                        <ButtonGeneric
                            className="success submit-button"
                            onClick={handleOnPost}
                            // icon={"device-floppy"}
                            label={intl.formatMessage({id: "Submit"})}
                            disabled={isButtonDisabled}
                        />
                    </FieldSet>
                </form>
            </Block>

            <table>
                <thead>
                <tr>
                    <th>{intl.formatMessage({id: "Username"})}</th>
                    <th>{intl.formatMessage({id: "Actions"})}</th>
                </tr>
                </thead>
                <tbody>
                {isSuccess && (users as string[]).map((user) => {
                    return (
                        <tr key={user}>
                            <td>{user}</td>
                            <td>
                                <ButtonGeneric onClick={() => handleOnDelete(user)}
                                               label={intl.formatMessage({id: "Delete"})} icon={"trash"}/>
                                <ButtonGeneric onClick={(e) => console.log(e)} label={intl.formatMessage({id: "Edit"})}
                                               icon={"edit"}/>
                            </td>
                        </tr>
                    )
                })}

                </tbody>
            </table>
        </div>
    );
};

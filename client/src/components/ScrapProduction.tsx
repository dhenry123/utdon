/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import ButtonGeneric from "./ButtonGeneric";
import "./ScrapProduction.scss";
import InputGeneric from "./InputGeneric";
import { useEffect, useState } from "react";
import {
  filterJson,
  filterText,
  isJsonParsable,
} from "../../../src/lib/helperProdVersionReader";
import SelectGeneric from "./SelectGeneric";
import {
  regExprProductionSamples,
  jmespathProductionSamples,
} from "../helpers/ExprSamples";
import {
  ScrapType,
  SelectOptionType,
  UptodateForm,
  UptodateFormFields,
} from "../../../src/Global.types";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";
import { ImageUploader } from "./ImageUploader";
import {
  INITIALIZED_TOAST,
  SCRAPTYPEOPTIONJSON,
  SCRAPTYPEOPTIONTEXT,
} from "../../../src/Constants";
import { mytinydcUPDONApi, useGetGroupsQuery } from "../api/mytinydcUPDONApi";
import { MultiSelect, Option } from "react-multi-select-component";
import { buidMultiSelectGroups } from "../helpers/UiMiscHelper";
import { useAppDispatch, useAppSelector } from "../app/hook";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { HttpHeader } from "./HttpHeader";

export interface ScrapProductionProps {
  activeUptodateForm: UptodateForm;
  handleOnChange: (key: UptodateFormFields, value: string | string[]) => void;
  scrapUrl: (
    url: string,
    headerkey: string,
    headervalue: string
  ) => Promise<string>;
  onDone: (changeDoneState: boolean) => void;
  displayError: (message: string) => void;
}

export const ScrapProduction = ({
  activeUptodateForm,
  handleOnChange,
  scrapUrl,
  onDone,
  displayError,
}: ScrapProductionProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const [scrapContent, setScrapContent] = useState<string | null>("");
  useState<ScrapType>("json");
  const [productionVersion, setProductionVersion] = useState("");
  const [disableGetVersionWithUrl, setDisableGetVersionWithUrl] =
    useState(false);
  const scrapTypeOptions: SelectOptionType[] = [
    { value: "json", label: SCRAPTYPEOPTIONJSON },
    { value: "text", label: SCRAPTYPEOPTIONTEXT },
  ];

  const isAdmin = useAppSelector((state) => state.context.isAdmin);

  const {
    data: groupsFromServer,
    isError,
    error,
    isUninitialized,
    refetch,
  } = useGetGroupsQuery(null, {
    skip: false,
  });

  /**
   * server return ALWAYS string
   */
  const handleGetProductionContent = async () => {
    await scrapUrl(
      activeUptodateForm.urlProduction,
      activeUptodateForm.headerkey,
      activeUptodateForm.headervalue
    )
      .then((content: string) => {
        setScrapContent(content || "");
      })
      .catch((error) => {
        setScrapContent(`[SERVERERROR]: ${error.toString()}`);
      });
  };

  const handleOnChangeExpressionSample = (value: string) => {
    handleOnChange("exprProduction", value);
  };

  const handleApplyProductionContentRegExp = () => {
    if (!scrapContent || scrapContent.trim() === "") return;
    setProductionVersion("");
    let finalProductionVersion: string | null = "";
    if (activeUptodateForm.scrapTypeProduction === "text") {
      finalProductionVersion = filterText(
        scrapContent,
        activeUptodateForm.exprProduction
      );
    } else if (activeUptodateForm.scrapTypeProduction === "json") {
      if (isJsonParsable(scrapContent)) {
        finalProductionVersion = filterJson(
          scrapContent,
          activeUptodateForm.exprProduction
        );
      } else {
        if (!scrapContent.match(/SERVERERROR/))
          displayError(
            `${intl.formatMessage({
              id: "Try with type",
            })}: ${SCRAPTYPEOPTIONTEXT}`
          );
      }
    } else {
      console.error("not supported");
    }
    if (finalProductionVersion) setProductionVersion(finalProductionVersion);
  };

  const handleOnChangeExpr = (value: string) => {
    handleApplyProductionContentRegExp();
    handleOnChange("exprProduction", value);
  };

  const handleOnChangeGroups = (value: Option[]) => {
    const controlGroups: string[] = [];
    for (const item of value) {
      controlGroups.push(item.value);
    }
    handleOnChange("groups", controlGroups);
  };

  useEffect(() => {
    setProductionVersion("");
    handleApplyProductionContentRegExp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrapContent]);

  useEffect(() => {
    setScrapContent("");
    if (
      !activeUptodateForm.urlProduction ||
      !activeUptodateForm.urlProduction.trim()
    )
      setDisableGetVersionWithUrl(false);
  }, [activeUptodateForm.urlProduction]);

  useEffect(() => {
    if (activeUptodateForm.fixed && activeUptodateForm.fixed.trim()) {
      setDisableGetVersionWithUrl(true);
    } else {
      setDisableGetVersionWithUrl(false);
    }
  }, [activeUptodateForm.fixed]);

  useEffect(() => {
    if (!isUninitialized) refetch();
    // only normal users set own groups
    if (!isAdmin)
      dispatch(mytinydcUPDONApi.endpoints.getUserGroups.initiate(null))
        .unwrap()
        .then((response) => {
          if (response.groups) {
            handleOnChange("groups", response.groups);
          }
        })
        .catch((error: FetchBaseQueryError) => {
          dispatch(
            showServiceMessage({
              ...INITIALIZED_TOAST,
              severity: "error",
              sticky: true,
              detail: error.data ? error.data : "unknown error",
            })
          );
        });
  }, []);

  return (
    <div className={`ScrapProduction`}>
      <Block>
        <FieldSet className="flogo" legend={intl.formatMessage({ id: "Logo" })}>
          <ImageUploader
            image={activeUptodateForm.logo || ""}
            onError={displayError}
            onChange={(value: string) => handleOnChange("logo", value)}
          />
        </FieldSet>
        <div className="nameandfixed">
          <FieldSet
            className="name"
            legend={intl.formatMessage({ id: "Give the control name" })}
          >
            <InputGeneric
              value={activeUptodateForm.name}
              onChange={(value: string) => handleOnChange("name", value)}
            />
          </FieldSet>
          <FieldSet
            className="name"
            legend={intl.formatMessage({
              id: "Fixed version",
            })}
            toolTipContent={`${intl.formatMessage({
              id: "If you specify a fixed value, the comparison will be based on this value",
            })}
                    ${intl.formatMessage({ id: "Use cases" })}:
                    - ${intl.formatMessage({
                      id: "Allows comparison with the Git repository of an application that does not provide an API entry point",
                    })}.
                    - ${intl.formatMessage({
                      id: "You just want to track the progress of a project hosted on a Git repository",
                    })}.
                    `}
          >
            <InputGeneric
              value={activeUptodateForm.fixed || ""}
              onChange={(value: string) => handleOnChange("fixed", value)}
              disabled={
                !(
                  !activeUptodateForm.urlProduction ||
                  !activeUptodateForm.urlProduction.trim()
                )
              }
              title={
                !disableGetVersionWithUrl
                  ? `${intl.formatMessage({
                      id: "This component is deactivated because a production url has been entered",
                    })}.`
                  : ""
              }
            />
          </FieldSet>
        </div>
        <FieldSet
          legend={intl.formatMessage({ id: "Url of the application to check" })}
          className="url"
        >
          <InputGeneric
            className=""
            value={activeUptodateForm.urlProduction}
            onChange={(value: string) => handleOnChange("urlProduction", value)}
            disabled={disableGetVersionWithUrl}
            title={
              disableGetVersionWithUrl
                ? `${intl.formatMessage({
                    id: "This component is deactivated because a fixed version has been specified",
                  })}.`
                : ""
            }
          />
          <HttpHeader
            headerkeyField="headerkey"
            headervalueField="headervalue"
            handleOnChange={handleOnChange}
            headerkey={activeUptodateForm.headerkey}
            headervalue={activeUptodateForm.headervalue}
            disabled={disableGetVersionWithUrl}
          />
        </FieldSet>
        <ButtonGeneric
          className="getcontent"
          label={intl.formatMessage({ id: "Get Content" })}
          onClick={handleGetProductionContent}
          icon="download"
          disabled={
            activeUptodateForm.urlProduction === "" || disableGetVersionWithUrl
          }
        />
      </Block>
      <Block>
        <FieldSet
          className="content"
          legend={intl.formatMessage({ id: "Content" })}
        >
          <div className="scrapContent">{scrapContent}</div>
        </FieldSet>
      </Block>
      <Block className={"filter"}>
        <FieldSet
          legend={intl.formatMessage({
            id: "Type of content",
          })}
        >
          <SelectGeneric
            options={scrapTypeOptions}
            disableDefaultOption
            value={activeUptodateForm.scrapTypeProduction}
            onChange={(value) => {
              handleOnChange("exprProduction", "");
              setScrapContent("");
              handleOnChange("scrapTypeProduction", value as ScrapType);
            }}
            disabled={disableGetVersionWithUrl}
          />
        </FieldSet>
        {activeUptodateForm.scrapTypeProduction === "text" ? (
          <div className="explain">
            {intl.formatMessage({ id: "Regular expression to apply" })}{" "}
            (**Capture):
            <a href="https://regex101.com/" target="_regex101">
              {intl.formatMessage({
                id: "See here for more informations about regexp",
              })}
            </a>
            <SelectGeneric
              options={regExprProductionSamples}
              onChange={handleOnChangeExpressionSample}
              value={activeUptodateForm.exprProduction}
              defaultOptionLabel={intl.formatMessage({
                id: "Choose a proposal",
              })}
              disabled={disableGetVersionWithUrl}
            />
          </div>
        ) : (
          <FieldSet
            legend={intl.formatMessage({ id: "Jmespath filter to apply" })}
          >
            <SelectGeneric
              options={jmespathProductionSamples}
              onChange={handleOnChangeExpressionSample}
              value={activeUptodateForm.exprProduction}
              defaultOptionLabel={intl.formatMessage({
                id: "Choose a proposal",
              })}
              disabled={disableGetVersionWithUrl}
            />
            <div>
              <a href="https://jmespath.org/tutorial.html" target="_jmespath">
                {intl.formatMessage({
                  id: "See here for more informations about Jmespath filters",
                })}
              </a>
            </div>
          </FieldSet>
        )}
        <FieldSet
          legend={intl.formatMessage({ id: "Expression (adapt if necessary)" })}
          className="expression"
        >
          <InputGeneric
            value={activeUptodateForm.exprProduction}
            onChange={(value) => handleOnChangeExpr(value)}
            disabled={disableGetVersionWithUrl}
          />
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({ id: "Extracted content version" })}
          className="version"
        >
          <div className={`${productionVersion ? "success" : "error"}`}>
            {productionVersion ||
              (scrapContent
                ? intl.formatMessage({ id: "No result" })
                : intl.formatMessage({
                    id: "Content to analyse is empty",
                  }))}
          </div>
        </FieldSet>
      </Block>
      <Block className={"filter"}>
        <FieldSet
          legend={intl.formatMessage({ id: "Authorized for group(s)" })}
          className="groups"
        >
          {!isError ? (
            <MultiSelect
              options={
                groupsFromServer ? buidMultiSelectGroups(groupsFromServer) : []
              }
              value={
                activeUptodateForm.groups &&
                activeUptodateForm.groups.length > 0
                  ? buidMultiSelectGroups(activeUptodateForm.groups)
                  : []
              }
              onChange={(values: Option[]) => handleOnChangeGroups(values)}
              labelledBy={intl.formatMessage({ id: "Includes in group(s)" })}
            />
          ) : (
            <div>{error.toString()}</div>
          )}
        </FieldSet>
        <div className="nextstep">
          <ButtonGeneric
            icon="arrow-right"
            className="success"
            onClick={() => onDone(true)}
            label={`${intl.formatMessage({ id: "Next step" })}`}
            disabled={
              activeUptodateForm.groups.length === 0 ||
              !activeUptodateForm.name ||
              (!disableGetVersionWithUrl &&
                (!productionVersion ||
                  !activeUptodateForm.urlProduction ||
                  !activeUptodateForm.exprProduction)) ||
              (disableGetVersionWithUrl &&
                !activeUptodateForm.fixed &&
                !activeUptodateForm.fixed?.trim())
            }
          />
        </div>
      </Block>
    </div>
  );
};

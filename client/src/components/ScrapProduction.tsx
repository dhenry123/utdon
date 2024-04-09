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
import { IconWithTooltip } from "./IconWithTooltip";

export interface ScrapProductionProps {
  activeUptodateForm: UptodateForm;
  handleOnChange: (key: UptodateFormFields, value: string | string[]) => void;
  scrapUrl: (url: string) => Promise<string>;
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
    await scrapUrl(activeUptodateForm.urlProduction)
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
  }, [activeUptodateForm.urlProduction]);

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
        <FieldSet legend={intl.formatMessage({ id: "Logo" })}>
          <ImageUploader
            image={activeUptodateForm.logo || ""}
            onError={displayError}
            onChange={(value: string) => handleOnChange("logo", value)}
          />
        </FieldSet>
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
          legend={intl.formatMessage({ id: "Url of the application to check" })}
          className="url"
        >
          <InputGeneric
            className=""
            value={activeUptodateForm.urlProduction}
            onChange={(value: string) => handleOnChange("urlProduction", value)}
          />
          <FieldSet
            legend={intl.formatMessage({
              id: "HTTP Header",
            })}
            className="headershttp"
            toolTipContent={
              "Optional HTTP Header (When authentication is needed)"
            }
          >
            <InputGeneric
              className="headerhttpkey"
              value={activeUptodateForm.headerkey}
              placeholder={intl.formatMessage({
                id: "Http header key",
              })}
              onChange={(value: string) => handleOnChange("headerkey", value)}
            />
            <InputGeneric
              className="headerhttpvalue"
              placeholder={intl.formatMessage({
                id: "Http header value",
              })}
              value={activeUptodateForm.headervalue}
              onChange={(value: string) => handleOnChange("headervalue", value)}
            />
          </FieldSet>
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({ id: "Get Content" })}
          className="getcontent"
        >
          <ButtonGeneric
            label={intl.formatMessage({ id: "Start" })}
            onClick={handleGetProductionContent}
            icon="download"
            disabled={activeUptodateForm.urlProduction === ""}
          />
        </FieldSet>
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
        <FieldSet legend={intl.formatMessage({ id: "Next step" })}>
          <ButtonGeneric
            className="success"
            onClick={() => onDone(true)}
            label={intl.formatMessage({ id: "Next" })}
            disabled={
              !productionVersion ||
              !activeUptodateForm.name ||
              !activeUptodateForm.urlProduction ||
              !activeUptodateForm.exprProduction ||
              activeUptodateForm.groups.length === 0
            }
          />
        </FieldSet>
      </Block>
    </div>
  );
};

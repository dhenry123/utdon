/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import ButtonGeneric from "./ButtonGeneric";
import "./ScrapGitHubReleaseTags.scss";
import InputGeneric from "./InputGeneric";
import { useEffect, useState } from "react";
import SelectGeneric from "./SelectGeneric";
import {
  GithubReleaseTagModel,
  UIError,
  UptodateForm,
  UptodateFormFields,
} from "../../../src/Global.types";
import {
  filterAndReplace,
  getGithubTagsurl,
} from "../../../src/lib/helperGithub";
import { regExprGithubSamples } from "../helpers/ExprSamples";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";

export interface ScrapGitHubReleaseTagsProps {
  activeUptodateForm: UptodateForm;
  handleOnChange: (key: UptodateFormFields, value: string) => void;
  scrapUrl: (url: string) => Promise<unknown>;
  displayError: (message: string) => void;
  onDone: (changeDoneState: boolean) => void;
}

export const ScrapGitHubReleaseTags = ({
  activeUptodateForm,
  handleOnChange,
  scrapUrl,
  displayError,
  onDone,
}: ScrapGitHubReleaseTagsProps) => {
  const intl = useIntl();

  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagsListToDisplay, setTagsListMatchExpr] = useState<string[]>([]);

  const [lastRelease, setLatestRelease] = useState("");

  const [disableFilterGithubRegExpSelect, setDisableFilterGithubRegExpSelect] =
    useState(true);

  const [excludedFromTags, setExcludedFromTags] = useState<string[]>([]);

  const handleGetReleaseTags = async () => {
    if (activeUptodateForm.urlGitHub.match(/^https:\/\/github.com/)) {
      // reset all lists
      setTagsListMatchExpr([]);
      setExcludedFromTags([]);
      setDisableFilterGithubRegExpSelect(true);
      await scrapUrl(getGithubTagsurl(activeUptodateForm.urlGitHub)).then(
        (content) => {
          if (content) {
            const castData = (
              JSON.parse(content as string) as GithubReleaseTagModel[]
            ).map((item) => item.name);
            if (castData.length > 0) {
              setTagsList(castData);
              // add all to
              setTagsListMatchExpr(castData);
              setDisableFilterGithubRegExpSelect(false);
              return;
            }
          }
        }
      );
    } else {
      displayError(
        intl.formatMessage({ id: "Currently only Github is supported" })
      );
    }
  };

  /**
   * url was scraped
   * building lists trying to apply filter
   */
  useEffect(() => {
    try {
      if (activeUptodateForm.exprGithub) {
        const regExp = new RegExp(activeUptodateForm.exprGithub);
        const listmatch: string[] = [];
        const listexcluded: string[] = [];
        tagsList.forEach((item) => {
          if (item && item.match(regExp)) {
            listmatch.push(item);
          } else {
            listexcluded.push(item);
          }
        });
        if (listmatch.length > 0) {
          setLatestRelease(
            filterAndReplace(activeUptodateForm.exprGithub, listmatch)
          );
        } else {
          setLatestRelease("");
        }
        setTagsListMatchExpr(listmatch);
        setExcludedFromTags(listexcluded);
      }
    } catch (error: unknown) {
      const finalError = error as UIError;
      displayError(finalError.message);
      setLatestRelease("");
      setTagsListMatchExpr([]);
      setExcludedFromTags([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUptodateForm.exprGithub, tagsList]);

  return (
    <div className={`ScrapGitHubReleaseTags`}>
      <Block>
        <FieldSet
          legend={intl.formatMessage({ id: "Project repository GitHub" })}
          className="urlGithub"
        >
          <InputGeneric
            value={activeUptodateForm.urlGitHub}
            onChange={(value) => {
              setLatestRelease("");
              handleOnChange("urlGitHub", value);
              //reset list
              setTagsList([]);
            }}
            placeholder={`${intl.formatMessage({
              id: "Currently only Github is supported",
            })}: https://github.com/xxxxxx/yyyyyyyy`}
            title={intl.formatMessage({
              id: "Currently only Github is supported",
            })}
          />
        </FieldSet>
        <ButtonGeneric
          label={intl.formatMessage({ id: "Get release tag names list" })}
          onClick={handleGetReleaseTags}
        />
      </Block>
      <Block>
        <FieldSet
          className="content"
          legend={intl.formatMessage({ id: "Content" })}
        >
          <div className="scrapContent">
            {tagsList.map((item) => {
              return (
                <div className="tagitem" key={item}>
                  {item}
                </div>
              );
            })}
          </div>
        </FieldSet>
      </Block>
      <Block>
        <FieldSet
          legend={intl.formatMessage({
            id: "Keep only releases which match this pattern (eg: to execlude rc,pre-release, etc..)",
          })}
        >
          <SelectGeneric
            options={regExprGithubSamples}
            defaultOptionLabel={intl.formatMessage({ id: "Your regexp" })}
            value={activeUptodateForm.exprGithub}
            onChange={(value) => handleOnChange("exprGithub", value)}
            disabled={disableFilterGithubRegExpSelect}
          />

          <a href="https://regex101.com/" target="_regex101">
            {intl.formatMessage({
              id: "See here for more informations about regexp",
            })}
          </a>
        </FieldSet>
        <FieldSet
          legend={intl.formatMessage({
            id: "Expression (adapt if necessary)",
          })}
          className="expression"
        >
          <InputGeneric
            value={activeUptodateForm.exprGithub}
            onChange={(value) => handleOnChange("exprGithub", value)}
          />
        </FieldSet>
      </Block>
      <Block className={"filter"}>
        <FieldSet
          legend={`${tagsListToDisplay.length} ${intl.formatMessage({
            id: "releases",
          })} / ${tagsList.length}
            ${intl.formatMessage({ id: "match this RegExp" })}`}
        >
          <div className="list">
            {tagsListToDisplay.map((item) => {
              return (
                <div className="tagitem" key={item}>
                  {item}
                </div>
              );
            })}
          </div>
        </FieldSet>

        <FieldSet legend={intl.formatMessage({ id: "Excluded versions" })}>
          <div className="list excluded">
            {excludedFromTags.map((item) => {
              return <div key={item}>{item}</div>;
            })}
          </div>
        </FieldSet>

        <FieldSet
          legend={intl.formatMessage({
            id: "Latest available version detected",
          })}
          className="version"
        >
          <div className={`${lastRelease ? "success" : "error"}`}>
            {lastRelease
              ? lastRelease
              : `${intl.formatMessage({
                  id: "With this regular expression, it's impossible to detect the latest available release",
                })}`}
          </div>
        </FieldSet>
        <FieldSet legend={intl.formatMessage({ id: "Next step" })}>
          <ButtonGeneric
            className="success"
            onClick={() => onDone(true)}
            label={intl.formatMessage({ id: "Next" })}
            disabled={!lastRelease || !activeUptodateForm.exprGithub}
          />
        </FieldSet>
      </Block>
    </div>
  );
};

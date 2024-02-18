/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch } from "../app/hook";

import "./Search.scss";
import InputGeneric from "./InputGeneric";
import { setSearch } from "../app/contextSlice";
import ButtonGeneric from "./ButtonGeneric";

interface SearchProps {
  searchString: string;
}
export const Search = ({ searchString }: SearchProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  return (
    <div className={`Search`}>
      <InputGeneric
        value={searchString}
        placeholder={`${intl.formatMessage({ id: "Search" })}...`}
        onChange={(value) => {
          dispatch(setSearch(value));
        }}
        autoComplete="off"
        className="inputsearch"
        autoFocus
      />
      {searchString ? (
        <ButtonGeneric
          icon={"x"}
          onClick={() => {
            dispatch(setSearch(""));
          }}
          title={intl.formatMessage({ id: "Reset" })}
        />
      ) : null}
    </div>
  );
};

/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./DisplayVersions.scss";

interface DisplayVersionsProps {
  data: any;
}
export const DisplayVersions = ({ data }: DisplayVersionsProps) => {
  const intl = useIntl();

  return (
    <div className={`DisplayVersions`}>
      {data.compareResult && data.compareResult.productionVersion ? (
        <>
          <div
            className="productionVersion"
            title={`${intl.formatMessage({
              id: "Your production version",
            })}: ${data.compareResult.productionVersion}`}
          >
            {data.compareResult.productionVersion}
          </div>
          <div className="separator">/</div>
          <div
            className="githubLatestRelease"
            title={`${intl.formatMessage({
              id: "Latest available version detected",
            })}: ${data.compareResult.githubLatestRelease}`}
          >
            {data.compareResult.githubLatestRelease}
          </div>
        </>
      ) : (
        <div className="compareVersions">"No version detected"</div>
      )}
    </div>
  );
};

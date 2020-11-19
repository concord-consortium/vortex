import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { IDataset } from "@concord-consortium/lara-interactive-api";
import { handleSpecialValue, IDataTableData, IDataTableRow } from "../../shared/utils/handle-special-value";

export const generateDataset = (data: IExperimentData, experiment: IExperiment): IDataset | null => {
  const dataProps = experiment.schema.dataSchema.properties.experimentData?.items?.properties || {};
  const propNames = Object.keys(dataProps);
  if (propNames.length === 0) {
    return null;
  }
  const propTitles = propNames.map(n => dataProps[n].title);
  const experimentData = data.experimentData as IDataTableData;
  const rows = experimentData.map((row: IDataTableRow) =>
    propNames.map(name =>
      // Handle values like <AVG>, <STDDEV>, <SUM>, etc.
      handleSpecialValue(row[name], name, experimentData) || null
    )
  );
  return {
    type: "dataset",
    version: 1,
    properties: propTitles,
    // Always use first property as X axis. It might be necessary to customize that in the future, but it doesn't
    // seem useful now.
    xAxisProp: propTitles[0],
    rows
  };
};

import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { IDataset } from "@concord-consortium/lara-interactive-api";
import { handleSpecialValue } from "../../shared/utils/handle-special-value";
import { IDataTableData, IDataTableRow } from "../../shared/components/data-table-field";

// Note that when new experiment is added, this hash should be updated.
export const xAxisPropertyForExperiment: {[uuid: string]: string | undefined} = {
  "e431af00-5ef9-44f8-a887-c76caa6ddde1": "Location", // "Location" column will be used as X axis labels
  "aefb5299-c127-4d84-b7f0-78da389ebecd": "Label", // "Label" column will be used as X axis labels
  "d27df06a-0997-4c53-8afd-d5dcc627d44f": undefined, // row indices will be used
  "df02396f-a3d6-4dc5-bc10-fac4007fb6de": undefined, // row indices will be used
};

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
    xAxisProp: experiment.metadata?.uuid ? xAxisPropertyForExperiment[experiment.metadata.uuid] : undefined,
    rows: rows as any // TBD: need to update LARA API to allow arrays of data
  };
};

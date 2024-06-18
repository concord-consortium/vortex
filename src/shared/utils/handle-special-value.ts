import { IDataTableData, IDataTableRowData } from "../components/data-table-field";

const defPrecision = 2;

const getSumAndCount = (name: string, formData: IDataTableData) => {
  let sum = 0;
  let count = 0;
  formData.forEach(row => {
    const value = Number(row[name]);
    if (!isNaN(value)) {
      sum += value;
      count += 1;
    }
  });
  return {sum, count};
};

const getSquareDiffAndCount = (name: string, formData: IDataTableData) => {
  let squareDiff = 0;
  const {sum, count} = getSumAndCount(name, formData);
  if (count > 0) {
    const mean = sum / count;
    formData.forEach(row => {
      const value = Number(row[name]);
      if (!isNaN(value)) {
        squareDiff += Math.pow((value - mean), 2);
      }
    });
  }
  return {squareDiff, count};
};

// Authors can provide special values in the initial form data. They will be dynamically evaluated.
export const fieldFunction: {[key: string]: (name: string, formData: IDataTableData) => number | undefined} = {
  // average: sum(cells)/#cells
  "<AVG>": (name: string, formData: IDataTableData) => {
    const {sum, count} = getSumAndCount(name, formData);
    if (count === 0) {
      return undefined;
    }
    return Number((sum / count).toFixed(defPrecision));
  },
  // sum: sum(cells)
  "<SUM>": (name: string, formData: IDataTableData) => {
    const {sum, count} = getSumAndCount(name, formData);
    if (count === 0) {
      return undefined;
    }
    return Number((sum).toFixed(defPrecision));
  },
  // variance: (sum(cells-mean)^2/#cells-1)
  "<VAR>": (name: string, formData: IDataTableData) => {
    const {squareDiff, count} = getSquareDiffAndCount(name, formData);
    if (count < 2) {
      return undefined;
    }
    return Number((squareDiff / (count - 1)).toFixed(defPrecision));
  },
  // stdev: sqrt((sum(cells-mean)^2/#cells-1))
  "<STDDEV>": (name: string, formData: IDataTableData) => {
    const {squareDiff, count} = getSquareDiffAndCount(name, formData);
    if (count < 2) {
      return undefined;
    }
    return Number((Math.sqrt(squareDiff / (count - 1))).toFixed(defPrecision));
  },
  // median: (n+1)/2 th item in an ordered list
  "<MEDIAN>": (name: string, formData: IDataTableData) => {
    const values: number[] = [];
    formData.forEach(row => {
      const value = Number(row[name]);
      if (!isNaN(value)) {
        values.push(value);
      }
    });
    const numValues = values.length;
    if (numValues === 0) {
      return undefined;
    }
    values.sort((a, b) => a - b);
    let result: number;
    const midPoint = Math.floor(numValues / 2);
    if (numValues % 2 === 0) {
      // even numbered list, use average of two around center
      result = (values[midPoint - 1] + values[midPoint]) / 2;
    } else {
      // odd numbered list, use center
      result = values[midPoint];
    }
    return Number(result.toFixed(defPrecision));
  }
};

export const isFunctionSymbol = (value: string) => {
  return Object.keys(fieldFunction).indexOf(value) !== -1;
};

export const handleSpecialValue = (value: IDataTableRowData, name: string, data: IDataTableData) => {
  if (typeof value === "string" && isFunctionSymbol(value)) {
    return fieldFunction[value](name, data);
  } else {
    // Regular value or we don't know how to handle it.
    return value;
  }
};

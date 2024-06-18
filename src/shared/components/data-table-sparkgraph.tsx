import React, { useMemo, useRef } from "react";
import { IDataTableTimeData } from "./data-table-field";

import css from "./data-table-sparkgraph.module.scss";

const leaderRadius = 3;
const leaderStokeWidth = 1.5;
const leaderMargin = leaderRadius + leaderStokeWidth;

const outerWidth = 200;
const outerHeight = 30;
const innerWidth = outerWidth - (leaderMargin * 2);
const innerHeight = outerHeight - (leaderMargin * 2);

interface ISparkGraphPoint {
  x: number;
  y: number;
}

interface IProps {
  values: IDataTableTimeData[];
  maxNumTimeSeriesValues: number;
}

export default function DataTableSparkGraph({values, maxNumTimeSeriesValues}: IProps) {
  const polyLinePointsRef = useRef<string[]>([]);
  const polygonPointsRef = useRef<string[]>([]);
  const leaderPointRef = useRef<ISparkGraphPoint|undefined>(undefined);
  const lastMaxNumTimeSeriesValuesRef = useRef(maxNumTimeSeriesValues);
  const titleRef = useRef("");

  let polyLinePoints = polyLinePointsRef.current;
  let polygonPoints = polygonPointsRef.current;
  let leaderPoint = leaderPointRef.current;

  // instead of relying on the values changing just compare the last number of points displayed (the +2 is for the closing polygon points)
  const graphChanged = (polyLinePoints.length !== values.length) || (maxNumTimeSeriesValues !== lastMaxNumTimeSeriesValuesRef.current);
  if (graphChanged) {
    const capabilities = values[0]?.capabilities;

    if (capabilities) {
      const duration = Math.round((capabilities.measurementPeriod / 1000) * values.length);
      titleRef.current = `${duration} sec`;
    } else {
      titleRef.current = "";
    }

    const minValue = capabilities?.minValue ?? values.reduce((acc, cur) => Math.min(cur.value, acc), Infinity);
    const maxValue = capabilities?.maxValue ?? values.reduce((acc, cur) => Math.max(cur.value, acc), -Infinity);
    const maxNumValues = Math.max(maxNumTimeSeriesValues, 100);

    let x: number = 0;
    let y: number = 0;

    polyLinePoints = values.map(({value}, index) => {
      value = Math.max(minValue, Math.min(value, maxValue));
      x = leaderMargin + (innerWidth * (index / maxNumValues));
      y = leaderMargin + (innerHeight - (((value - minValue) / (maxValue - minValue)) * innerHeight));
      return `${x},${y}`;
    });

    leaderPoint = values.length > 0 ? {x, y} : undefined;
    leaderPointRef.current = leaderPoint;

    // add closing polygon points
    polygonPoints = values.length > 0 ? [...polyLinePoints, `${x}, ${innerHeight + leaderMargin}`, `${leaderMargin}, ${innerHeight + leaderMargin}`] : [];

    polyLinePointsRef.current = polyLinePoints;
    polygonPointsRef.current = polygonPoints;
    lastMaxNumTimeSeriesValuesRef.current = maxNumTimeSeriesValues;
  }

  return (
    <div className={css.dataTableSparkgraph}>
      <div>{titleRef.current}</div>
      <svg width="100%" height={outerHeight} viewBox={`0 0 ${outerWidth} ${outerHeight}`}>
        {polygonPoints.length > 0 && <polygon points={polygonPoints.join(" ")} />}
        {polyLinePoints.length > 0 && <polyline points={polyLinePoints.join(" ")} />}
        {leaderPoint && <circle cx={leaderPoint.x} cy={leaderPoint.y} r={leaderRadius} strokeWidth={leaderStokeWidth} />}
      </svg>
    </div>
  );
}
import React, { useRef } from "react";
import { IDataTableTimeData } from "./data-table-field";

import css from "./data-table-sparkgraph.module.scss";

const leaderRadius = 3;
const leaderStokeWidth = 1.5;
const leaderMargin = leaderRadius + leaderStokeWidth;

interface ISparkGraphPoint {
  x: number;
  y: number;
}

interface IProps {
  width: number;
  height: number;
  values: IDataTableTimeData[];
  maxNumTimeSeriesValues: number;
  minNumTimeSeriesValues?: number;
  showAxes?: boolean;
  redrawSignal?: number;
}

export default function DataTableSparkGraph({width, height, values, maxNumTimeSeriesValues, minNumTimeSeriesValues, showAxes, redrawSignal}: IProps) {
  const innerWidth = width - (leaderMargin * 2);
  const innerHeight = height - (leaderMargin * 2);
  const innerLeft = leaderMargin;
  const innerRight = innerLeft + innerWidth;
  const innerTop = leaderMargin;
  const innerBottom = innerTop + innerHeight;

  const polyLinePointsRef = useRef<string[]>([]);
  const polygonPointsRef = useRef<string[]>([]);
  const leaderPointRef = useRef<ISparkGraphPoint|undefined>(undefined);
  const lastMaxNumTimeSeriesValuesRef = useRef(maxNumTimeSeriesValues);
  const lastRedrawSignalRef = useRef(redrawSignal);

  let polyLinePoints = polyLinePointsRef.current;
  let polygonPoints = polygonPointsRef.current;
  let leaderPoint = leaderPointRef.current;

  // instead of relying on the values changing just compare the last number of points displayed or if we are signaled to redraw
  const graphChanged = (polyLinePoints.length !== values.length)
    || (maxNumTimeSeriesValues !== lastMaxNumTimeSeriesValuesRef.current)
    || (redrawSignal !== lastRedrawSignalRef.current);
  if (graphChanged) {
    const capabilities = values[0]?.capabilities;

    const minValue = capabilities?.minValue ?? values.reduce((acc, cur) => Math.min(cur.value, acc), Infinity);
    const maxValue = capabilities?.maxValue ?? values.reduce((acc, cur) => Math.max(cur.value, acc), -Infinity);
    const maxNumValues = Math.max(maxNumTimeSeriesValues, (minNumTimeSeriesValues ?? 100));

    let x: number = 0;
    let y: number = 0;

    polyLinePoints = values.map(({value}, index) => {
      value = Math.max(minValue, Math.min(value, maxValue));
      x = innerLeft + (innerWidth * (index / maxNumValues));
      y = innerLeft + (innerHeight - (((value - minValue) / (maxValue - minValue)) * innerHeight));
      return `${x},${y}`;
    });

    leaderPoint = values.length > 0 ? {x, y} : undefined;
    leaderPointRef.current = leaderPoint;

    // add closing polygon points
    polygonPoints = values.length > 0 ? [...polyLinePoints, `${x}, ${innerBottom}`, `${innerLeft}, ${innerBottom}`] : [];

    polyLinePointsRef.current = polyLinePoints;
    polygonPointsRef.current = polygonPoints;
    lastMaxNumTimeSeriesValuesRef.current = maxNumTimeSeriesValues;
    lastRedrawSignalRef.current = redrawSignal;
  }

  return (
    <svg className={css.dataTableSparkgraph} width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {polygonPoints.length > 0 && <polygon points={polygonPoints.join(" ")} />}
      {polyLinePoints.length > 0 && <polyline points={polyLinePoints.join(" ")} />}
      {showAxes && <line x1={innerLeft} y1={innerTop} x2={innerLeft} y2={innerBottom} stroke="#008a09" strokeWidth={2} />}
      {showAxes && <line x1={innerLeft} y1={innerBottom} x2={innerRight} y2={innerBottom} stroke="#008a09" strokeWidth={2} />}
      {leaderPoint && <circle cx={leaderPoint.x} cy={leaderPoint.y} r={leaderRadius} strokeWidth={leaderStokeWidth} />}
    </svg>
  );
}
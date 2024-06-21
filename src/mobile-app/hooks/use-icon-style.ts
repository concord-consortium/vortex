import { useState, useMemo } from "react";
import { IExperimentMetadata } from "../../shared/experiment-types";

// to support older saved experiments before the icon colors were added to the json
const defaults: Record<string, {color: string, hoverColor: string}|undefined> = {
  "SI": {color: "#e0007f", hoverColor: "#e8409f"},
  "PS": {color: "#d04a06", hoverColor: "#dc7744"},
  "SS": {color: "#0f73b8", hoverColor: "#4b96ca"},
  "DT": {color: "#008a09", hoverColor: "#40a847"},
};

export const useIconStyle = ({iconColor, iconHoverColor, initials}: IExperimentMetadata) => {
  const color = iconColor ?? defaults[initials]?.color ?? "#00a80a";
  const hoverColor = iconHoverColor ?? defaults[initials]?.hoverColor ?? "#40be48";

  const [hovering, setHovering] = useState(false);
  const style: React.CSSProperties = useMemo(() => {
    return {backgroundColor: hovering ? hoverColor : color};
  }, [hovering]);

  const handleMouseOver = () => setHovering(true);
  const handleMouseOut = () => setHovering(false);

  return {style, handleMouseOver, handleMouseOut};
};

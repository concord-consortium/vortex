import React from "react";

interface IProps {
  text: string;
}

export const Text = (props: IProps) => {
  const { text } = props;
  return (
    <div>
      {text}
    </div>
  );
};

import React from "react";

// This handler can be used to handle keyboard navigation in standard HTML table that has following structure:
// <table>
//   <tr>
//     <td><input></td> (...) <td><input></td>
//   </tr>
//   (...)
// It will move focus around when arrow keys are pressed. It'll look for the first non-disabled input and trigger focus.
// Client code should just attach it to onKeyDown handler (or pass event to it if there are more handlers necessary).
export const tableKeyboardNav = (event: React.KeyboardEvent) => {
  const input = event.target as HTMLInputElement;
  const td = input.parentElement as HTMLTableDataCellElement;
  const cellIdx = td.cellIndex;
  const tr = td.parentElement as HTMLTableRowElement;
  let newInput: HTMLInputElement | null | undefined;
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    let newTr: HTMLTableRowElement | undefined = tr;
    while (newInput === undefined) {
      newTr = (event.key === "ArrowUp" ? newTr.previousElementSibling : newTr.nextElementSibling) as HTMLTableRowElement;
      if (!newTr) {
        newInput = null; // nowhere to go, we're in the top or bottom row
      } else {
        const child = newTr.cells[cellIdx]?.children[0];
        if (child && child.tagName === "INPUT" && !(child as HTMLInputElement).disabled) {
          newInput = child as HTMLInputElement;
        }
      }
    }
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    let newCellIdx = cellIdx;
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    while (newInput === undefined) {
      newCellIdx += direction;
      const child = tr.cells[newCellIdx]?.children[0];
      if (!child) {
        newInput = null; // nowhere to go, we're in the first or last cell
      } else if (child.tagName === "INPUT" && !(child as HTMLInputElement).disabled) {
        newInput = child as HTMLInputElement;
      }
    }
  }
  if (newInput) {
    newInput.focus();
  }
};

import { types } from "mobx-state-tree";

export const UIModel = types
  .model("UI", {
    sampleText: "Mobile App"
  })
  .actions((self) => {
    return {
      setSampleText(text: string) {
        self.sampleText = text;
      }
    };
  });

export type UIModelType = typeof UIModel.Type;
import { withTheme } from 'react-jsonschema-form';
import { FieldTemplate } from "./field-template";
// React JSON Schema uses Bootstrap semantics, so provide a bootstrap CSS and custom theme.
import "./boostrap-3.3.7.scss";
import "./bootstrap-vortex-theme.scss";

import React from "react";

const VortexFormTheme = {
  FieldTemplate,
  // Note that `hideLabels` is a custom context that is handled by `FieldTemplate`. We might need to make this
  // option dynamic and e.g. hide them in mobile app but show in LARA. Client code can still overwrite context
  // and provide custom values.
  formContext: {
    hideLabels: true
  }
};

export const Form = withTheme(VortexFormTheme);

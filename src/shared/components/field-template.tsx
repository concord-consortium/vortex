import React from "react";
import { FieldTemplateProps } from "react-jsonschema-form";
import { Icon } from "./icon";
import css from "./field-template.module.scss";
import { IVortexFormContext } from "./form";

export const FieldTemplate: React.FC<FieldTemplateProps> = props => {
  const { id, classNames, label, help, required, description, children, displayLabel, schema, uiSchema } = props;
  const icon = uiSchema["ui:icon"];
  const placeholder = uiSchema["ui:placeholder"];
  // Don't add padding to array or wrapper objects. Add it only to the final fields (string, number, etc.).
  const addPadding = schema.type !== "object" && schema.type !== "array";
  const formContext: IVortexFormContext = props.formContext;
  // Hide label when special option is enabled in form context and there's placeholder provided
  // (otherwise, user would have no chances to identify form field).
  const hideLabel = formContext?.experimentConfig?.hideLabels && placeholder;
  return (
    <div className={classNames + ` ${addPadding ? css.padding : ""}`}>
      { !hideLabel && <label htmlFor={id}>{label}</label> }
      <div className={css.iconAndField}>
        {
          icon &&
          <div className={css.icon}>
            <Icon name={icon} />
          </div>
        }
        <div className={css.field}>
          {children}
        </div>
      </div>
      {
        // `displayLabel` is false for array items. In this case we also don't want to show this label.
        required && displayLabel &&
        <div className={css.required + (icon ? ` ${css.withIcon}` : "")} data-test="required">Required</div>
      }
      {/* This fields will require some styling probably. Render them so they're visible */}
      {/* if someone is testing these features. They can be provided via uiSchema. */}
      {description}
      {help}
    </div>
  );
};

import React from "react";
import { FieldTemplateProps } from "react-jsonschema-form";
import { Icon } from "./icon";
import css from "./field-template.module.scss";

export const FieldTemplate: React.FC<FieldTemplateProps> = props => {
  const { id, classNames, label, help, required, description, children, uiSchema, formContext } = props;
  const icon = uiSchema["ui:icon"];
  return (
    <div className={classNames}>
      { !formContext.hideLabels && <label htmlFor={id}>{label}</label> }
      <div className={css.iconAndField}>
        {
          icon &&
          <div className={css.icon}>
            <Icon name={icon} size="medium" fill="#646464"/>
          </div>
        }
        <div className={css.field}>
          {children}
        </div>
      </div>
      {
        // Check first if required is defined at all, as otherwise we'll render "Optional" for the root group.
        required !== undefined &&
        <div className={css.required + (icon ? ` ${css.withIcon}` : "")}>{required ? "Required" : "Optional"}</div>
      }
      {/* This fields will require some styling probably. Render them so they're visible */}
      {/* if someone is testing these features. They can be provided via uiSchema. */}
      {description}
      {help}
    </div>
  );
};

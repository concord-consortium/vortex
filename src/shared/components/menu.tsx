import React, { useState } from "react";
import { Icon } from "./icon";
import css from "./menu.module.scss";

interface IMenuItemProps {
  onClick: () => void;
  icon?: string;
}

export const MenuItemComponent: React.FC<IMenuItemProps> = ({onClick, icon, children}) => {
  return (
    <div className={css.menuItem} onClick={onClick}>
      {icon ? <Icon name={icon}/> : <div className={css.iconPlaceholder}/>}
      {children}
    </div>
  );
};

export const MenuComponent: React.FC = (props) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuIcon = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const renderMenu = () => {
    return (
      <div className={css.menu}>
        {props.children}
      </div>
    );
  };

  return (
    <div className={css.menuIcon} onClick={handleMenuIcon}>
      <Icon name="menu"/>
      {showMenu ? renderMenu() : undefined}
    </div>
  );
};

import React, { useState } from "react";

import css from "./menu.module.scss";

interface IMenuItemProps {
  onClick: () => void;
  // LATER: add icon
}

export const MenuItemComponent: React.FC<IMenuItemProps> = ({onClick, children}) => {
  return (
    <div className={css.menuItem} onClick={onClick}>
      {children}
    </div>
  );
}

export const MenuComponent: React.FC<{}> = (props) => {
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
    )
  }

  return (
    <div className={css.menuIcon} onClick={handleMenuIcon}>
      ...
      {showMenu ? renderMenu() : undefined}
    </div>
  );
};

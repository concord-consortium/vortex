import React, { useState, useEffect, useRef } from "react";
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
  // need to use both a state variable and a ref variable to hold showing status
  // the state variable change triggers the re-render and the ref variable
  // is available in the global handleClick() handler (the state variable would
  // be captured in the handler's closure and always be the initial value of false)
  const [showMenu, setShowMenu] = useState(false);
  const showingMenu = useRef(false);

  const updateMenu = (showing: boolean) => {
    setShowMenu(showing);
    showingMenu.current = showing;
  };

  // hide the menu if a click is made outside the menu while it is showing
  // this is not called if handleMenuIcon() is called as it stops
  // propagation of the mouse event up to the window element
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showingMenu.current) {
        updateMenu(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleMenuIcon = (e: React.MouseEvent<HTMLDivElement>) => {
    // stop handleClick() handler above from running
    e.stopPropagation();
    updateMenu(!showMenu);
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

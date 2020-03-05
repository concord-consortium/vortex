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
  // this is called *before* handleMenuIcon() toggles the menu in a timeout
  // so that the user can click on a different menu while an existing menu
  // is open and cause the existing menu to close
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
    // wait until after window click handler hides any existing open
    // menu before toggling our menu
    const newShowMenu = !showMenu;
    setTimeout(() => updateMenu(newShowMenu), 1);
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

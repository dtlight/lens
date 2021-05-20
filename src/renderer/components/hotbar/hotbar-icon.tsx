/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import "./hotbar-icon.scss";

import React, { DOMAttributes, useState } from "react";

import { cssNames, IClassName } from "../../utils";
import { Menu, MenuItem } from "../menu";
import { MaterialTooltip } from "../material-tooltip/material-tooltip";
import { observer } from "mobx-react";
import { Avatar } from "../avatar/avatar";
import type { TransformedMenuItem } from "../../catalog";

interface Props extends DOMAttributes<HTMLElement> {
  uid: string;
  title: string;
  source: string;
  onMenuOpen?: () => void;
  className?: IClassName;
  active?: boolean;
  menuItems?: TransformedMenuItem[];
  disabled?: boolean;
}

export const HotbarIcon = observer(({menuItems = [], ...props}: Props) => {
  const { uid, title, active, className, source, disabled, onMenuOpen, children, ...rest } = props;
  const id = `hotbarIcon-${uid}`;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={cssNames("HotbarIcon flex inline", className, { disabled })}>
      <MaterialTooltip title={`${title || "unknown"} (${source || "unknown"})`} placement="right">
        <div id={id}>
          <Avatar
            {...rest}
            title={title}
            colorHash={`${title}-${source}`}
            className={active ? "active" : "default"}
            width={40}
            height={40}
          />
          {children}
        </div>
      </MaterialTooltip>
      <Menu
        usePortal
        htmlFor={id}
        className="HotbarIconMenu"
        isOpen={menuOpen}
        toggleEvent="contextmenu"
        position={{right: true, bottom: true }} // FIXME: position does not work
        open={() => {
          onMenuOpen?.();
          toggleMenu();
        }}
        close={() => toggleMenu()}>
        {menuItems.map((menuItem) => (
          <MenuItem key={menuItem.title} onClick={menuItem.onClick}>
            {menuItem.title}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
});

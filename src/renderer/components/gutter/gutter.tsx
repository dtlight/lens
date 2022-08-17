/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import React from "react";
import { cssNames } from "../../utils";
import styles from "./gutter.module.scss";

interface GutterProps {
  size?: "sm" | "md";
}

const Gutter = ({ size = "md" }: GutterProps) => {
  const classNames = cssNames(styles[`size-${size}`]);

  return <div className={classNames} />;
};


export default Gutter;

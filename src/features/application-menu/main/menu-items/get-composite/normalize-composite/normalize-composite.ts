/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { Composite } from "../get-composite";

export const normalizeComposite = <T>(
  composite: Composite<T>,
  previousPath: string[] = [],
): (readonly [path: string, composite: Composite<T>])[] => {
  const currentPath = [...previousPath, composite.id];

  const pathAndCompositeTuple = [currentPath.join("."), composite] as const;

  return [
    pathAndCompositeTuple,

    ...composite.children.flatMap((x) => normalizeComposite(x, currentPath)),
  ];
};
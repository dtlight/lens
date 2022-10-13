/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { preferenceItemInjectionToken } from "../preference-item-injection-token";

const editorPreferenceTabInjectable = getInjectable({
  id: "editor-preference-tab",

  instantiate: () => ({
    kind: "tab" as const,
    id: "editor-tab",
    parentId: "preference-tabs" as const,
    pathId: "editor",
    testId: "editor-preferences-page",
    label: "Editor",
    orderNumber: 30,
  }),

  injectionToken: preferenceItemInjectionToken,
});

export default editorPreferenceTabInjectable;
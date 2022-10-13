/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { preferenceItemInjectionToken } from "../preference-item-injection-token";

const applicationPreferenceTabInjectable = getInjectable({
  id: "application-preference-tab",

  instantiate: () => ({
    kind: "tab" as const,
    id: "application-tab",
    parentId: "preference-tabs" as const,
    pathId: "app",
    testId: "application-preferences-page",
    label: "Application",
    orderNumber: 10,
  }),

  injectionToken: preferenceItemInjectionToken,
});

export default applicationPreferenceTabInjectable;
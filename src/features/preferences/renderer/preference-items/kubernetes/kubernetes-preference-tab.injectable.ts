/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { preferenceItemInjectionToken } from "../preference-item-injection-token";

const kubernetesPreferenceTabInjectable = getInjectable({
  id: "kubernetes-preference-tab",

  instantiate: () => ({
    kind: "tab" as const,
    id: "kubernetes-tab",
    parentId: "preference-tabs" as const,
    pathId: "kubernetes",
    testId: "kubernetes-preferences-page",
    label: "Kubernetes",
    orderNumber: 10,
  }),

  injectionToken: preferenceItemInjectionToken,
});

export default kubernetesPreferenceTabInjectable;
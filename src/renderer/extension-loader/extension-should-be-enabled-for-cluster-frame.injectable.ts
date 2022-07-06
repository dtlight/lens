/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { asyncComputed } from "@ogre-tools/injectable-react";
import type { LensRendererExtension } from "../../extensions/lens-renderer-extension";
import type { KubernetesCluster } from "../../common/catalog-entities";
import extensionIsEnabledForClusterInjectable from "../../extensions/extension-loader/extension-is-enabled-for-cluster.injectable";
import activeKubernetesClusterInjectable from "../cluster-frame-context/active-kubernetes-cluster.injectable";

const extensionShouldBeEnabledForClusterFrameInjectable = getInjectable({
  id: "extension-should-be-enabled-for-cluster-frame",

  instantiate: (di, extension: LensRendererExtension) => {
    const activeKubernetesCluster = di.inject(activeKubernetesClusterInjectable);

    const getExtensionIsEnabledForCluster = (
      extension: LensRendererExtension,
      cluster: KubernetesCluster,
    ) =>
      di.inject(extensionIsEnabledForClusterInjectable, { extension, cluster });

    return asyncComputed(
      async () => {
        const cluster = activeKubernetesCluster.get();

        if (!cluster) {
          return false;
        }

        return getExtensionIsEnabledForCluster(
          extension,
          cluster,
        );
      },

      false,
    );
  },

  lifecycle: lifecycleEnum.keyedSingleton({
    getInstanceKey: (di, extension: LensRendererExtension) =>
      extension.sanitizedExtensionId,
  }),
});

export default extensionShouldBeEnabledForClusterFrameInjectable;
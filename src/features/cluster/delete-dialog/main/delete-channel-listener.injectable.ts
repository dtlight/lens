/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import appEventBusInjectable from "../../../../common/app-event-bus/app-event-bus.injectable";
import clusterFramesInjectable from "../../../../common/cluster-frames.injectable";
import clusterStoreInjectable from "../../../../common/cluster-store/cluster-store.injectable";
import directoryForLensLocalStorageInjectable from "../../../../common/directory-for-lens-local-storage/directory-for-lens-local-storage.injectable";
import deleteFileInjectable from "../../../../common/fs/delete-file.injectable";
import joinPathsInjectable from "../../../../common/path/join-paths.injectable";
import { getRequestChannelListenerInjectable } from "../../../../main/utils/channel/channel-listeners/listener-tokens";
import { deleteClusterChannel } from "../common/delete-channel";

const deleteClusterChannelListenerInjectable = getRequestChannelListenerInjectable({
  channel: deleteClusterChannel,
  handler: (di) => {
    const appEventBus = di.inject(appEventBusInjectable);
    const clusterStore = di.inject(clusterStoreInjectable);
    const clusterFrames = di.inject(clusterFramesInjectable);
    const joinPaths = di.inject(joinPathsInjectable);
    const directoryForLensLocalStorage = di.inject(directoryForLensLocalStorageInjectable);
    const deleteFile = di.inject(deleteFileInjectable);

    return async (clusterId) => {
      appEventBus.emit({ name: "cluster", action: "remove" });

      const cluster = clusterStore.getById(clusterId);

      if (!cluster) {
        return;
      }

      cluster.disconnect();
      clusterFrames.delete(cluster.id);

      // Remove from the cluster store as well, this should clear any old settings
      clusterStore.clusters.delete(cluster.id);

      try {
        // remove the local storage file
        const localStorageFilePath = joinPaths(directoryForLensLocalStorage, `${cluster.id}.json`);

        await deleteFile(localStorageFilePath);
      } catch {
        // ignore error
      }
    };
  },
});

export default deleteClusterChannelListenerInjectable;

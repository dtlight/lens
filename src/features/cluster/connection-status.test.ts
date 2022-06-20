/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { RenderResult } from "@testing-library/react";
import type { ObservableMap } from "mobx";
import { observable } from "mobx";
import type { ClusterStore } from "../../common/cluster-store/cluster-store";
import clusterStoreInjectable from "../../common/cluster-store/cluster-store.injectable";
import type { ClusterId } from "../../common/cluster-types";
import type { Cluster } from "../../common/cluster/cluster";
import type { NavigateToClusterView } from "../../common/front-end-routing/routes/cluster-view/navigate-to-cluster-view.injectable";
import navigateToClusterViewInjectable from "../../common/front-end-routing/routes/cluster-view/navigate-to-cluster-view.injectable";
import type { ReadFileSync } from "../../common/fs/read-file-sync.injectable";
import readFileSyncInjectable from "../../common/fs/read-file-sync.injectable";
import clusterManagerInjectable from "../../main/cluster-manager.injectable";
import type { ApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import { getApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import createClusterInjectable from "../../main/create-cluster/create-cluster.injectable";
import createContextHandlerInjectable from "../../main/context-handler/create-context-handler.injectable";
import createKubeconfigManagerInjectable from "../../main/kubeconfig-manager/create-kubeconfig-manager.injectable";
import createKubectlInjectable from "../../main/kubectl/create-kubectl.injectable";
import type { KubeconfigManager } from "../../main/kubeconfig-manager/kubeconfig-manager";
import type { Kubectl } from "../../main/kubectl/kubectl";
import type { ContextHandler } from "../../main/context-handler/context-handler";

describe("cluster connection status", () => {
  let clusterStore: ClusterStore;
  let clusters: ObservableMap<ClusterId, Cluster>;
  let cluster: Cluster;
  let cluster2: Cluster;
  let applicationBuilder: ApplicationBuilder;
  let result: RenderResult;
  let navigateToClusterView: NavigateToClusterView;

  beforeEach(async () => {
    applicationBuilder = getApplicationBuilder();

    const readFileSyncMock: ReadFileSync = (filePath) => {
      expect(filePath).toBe("/some/file/path");

      return JSON.stringify({
        apiVersion: "v1",
        clusters: [{
          name: "minikube",
          cluster: {
            server: "https://192.168.64.3:8443",
          },
        }],
        contexts: [
          {
            context: {
              cluster: "minikube",
              user: "minikube",
            },
            name: "minikube",
          },
          {
            context: {
              cluster: "minikube",
              user: "minikube",
            },
            name: "minikube-2",
          },
        ],
        users: [{
          name: "minikube",
        }],
        kind: "Config",
        preferences: {},
      });
    };

    applicationBuilder.dis.rendererDi.override(readFileSyncInjectable, () => readFileSyncMock);
    applicationBuilder.dis.mainDi.override(readFileSyncInjectable, () => readFileSyncMock);
    applicationBuilder.dis.mainDi.override(clusterManagerInjectable, () => ({}));
    applicationBuilder.dis.mainDi.override(createKubeconfigManagerInjectable, () => () => ({} as KubeconfigManager));
    applicationBuilder.dis.mainDi.override(createKubectlInjectable, () => () => ({} as Kubectl));
    applicationBuilder.dis.mainDi.override(createContextHandlerInjectable, () => () => ({} as ContextHandler));

    applicationBuilder.beforeApplicationStart(() => {
      clusters = observable.map();
      clusterStore = ({
        clusters,
        get clustersList() {
          return [...clusters.values()];
        },
        getById: (id) => clusters.get(id),
      }) as ClusterStore;

      applicationBuilder.dis.mainDi.override(clusterStoreInjectable, () => clusterStore);
      applicationBuilder.dis.rendererDi.override(clusterStoreInjectable, () => clusterStore);
    });

    applicationBuilder.beforeRender(() => {
      navigateToClusterView = applicationBuilder.dis.rendererDi.inject(navigateToClusterViewInjectable);

      const createCluster = applicationBuilder.dis.mainDi.inject(createClusterInjectable);

      cluster = createCluster({
        contextName: "minikube",
        id: "some-cluster-id",
        kubeConfigPath: "/some/file/path",
      }, {
        clusterServerUrl: "https://localhost:1234",
      });
      cluster.activate = jest.fn(); // override for test

      cluster2 = createCluster({
        contextName: "minikube-2",
        id: "some-cluster-id-2",
        kubeConfigPath: "/some/file/path",
      }, {
        clusterServerUrl: "https://localhost:1234",
      });
      cluster2.activate = jest.fn(); // override for test

      clusters.replace([
        [cluster.id, cluster],
        [cluster2.id, cluster2],
      ]);
    });

    result = await applicationBuilder.render();
  });

  it("renders", () => {
    expect(result.baseElement).toMatchSnapshot();
  });

  describe("when navigating to cluster connection", () => {
    beforeEach(() => {
      navigateToClusterView(cluster.id);
    });

    it("renders", () => {
      expect(result.baseElement).toMatchSnapshot();
    });

    it("shows cluster status screen", () => {
      expect(result.queryByTestId("cluster-status")).not.toBeNull();
    });

    describe("when a connection update has been broadcast for first cluster", () => {
      beforeEach(() => {
        cluster.broadcastConnectUpdate("some-connection-update");
      });

      it("shows connection update", async () => {
        await result.findByText("some-connection-update");
      });

      describe("when navigating to a different cluster", () => {
        beforeEach(() => {
          navigateToClusterView(cluster2.id);
        });

        it("renders", () => {
          expect(result.baseElement).toMatchSnapshot();
        });

        it("shows cluster status screen", () => {
          expect(result.queryByTestId("cluster-status")).not.toBeNull();
        });

        it("does not show connection update for first cluster", () => {
          expect(result.queryByText("some-connection-update")).toBeNull();
        });

        describe("when connection update has been broadcast for second cluster", () => {
          beforeEach(() => {
            cluster2.broadcastConnectUpdate("some-different-connection-update");
          });

          it("shows connection update", async () => {
            await result.findByText("some-different-connection-update");
          });

          describe("when navigating back to first cluster", () => {
            beforeEach(() => {
              navigateToClusterView(cluster.id);
            });

            it("shows conncection update for first cluster", async () => {
              await result.findByText("some-connection-update");
            });

            describe("when second cluster connects", () => {
              beforeEach(() => {
                cluster2.disconnected = false;
              });

              it("shows conncection update for first cluster", async () => {
                await result.findByText("some-connection-update");
              });

              describe("when second cluster disconnects", () => {
                beforeEach(() => {
                  cluster2.disconnected = false;
                });

                it("shows conncection update for first cluster", async () => {
                  await result.findByText("some-connection-update");
                });
              });
            });
          });
        });
      });
    });
  });
});
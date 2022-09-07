/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { RenderResult } from "@testing-library/react";
import { act, waitFor } from "@testing-library/react";
import getPodByIdInjectable from "../../renderer/components/+workloads-pods/get-pod-by-id.injectable";
import getPodsByOwnerIdInjectable from "../../renderer/components/+workloads-pods/get-pods-by-owner-id.injectable";
import openSaveFileDialogInjectable from "../../renderer/utils/save-file.injectable";
import type { ApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import { getApplicationBuilder } from "../../renderer/components/test-utils/get-application-builder";
import dockStoreInjectable from "../../renderer/components/dock/dock/store.injectable";
import areLogsPresentInjectable from "../../renderer/components/dock/logs/are-logs-present.injectable";
import type { CallForLogs } from "../../renderer/components/dock/logs/call-for-logs.injectable";
import callForLogsInjectable from "../../renderer/components/dock/logs/call-for-logs.injectable";
import createPodLogsTabInjectable from "../../renderer/components/dock/logs/create-pod-logs-tab.injectable";
import getLogTabDataInjectable from "../../renderer/components/dock/logs/get-log-tab-data.injectable";
import getLogsWithoutTimestampsInjectable from "../../renderer/components/dock/logs/get-logs-without-timestamps.injectable";
import getLogsInjectable from "../../renderer/components/dock/logs/get-logs.injectable";
import getRandomIdForPodLogsTabInjectable from "../../renderer/components/dock/logs/get-random-id-for-pod-logs-tab.injectable";
import getTimestampSplitLogsInjectable from "../../renderer/components/dock/logs/get-timestamp-split-logs.injectable";
import loadLogsInjectable from "../../renderer/components/dock/logs/load-logs.injectable";
import reloadLogsInjectable from "../../renderer/components/dock/logs/reload-logs.injectable";
import setLogTabDataInjectable from "../../renderer/components/dock/logs/set-log-tab-data.injectable";
import stopLoadingLogsInjectable from "../../renderer/components/dock/logs/stop-loading-logs.injectable";
import { dockerPod } from "../../renderer/components/dock/logs/__test__/pod.mock";

describe("download logs options in pod logs dock tab", () => {
  let rendered: RenderResult;
  let builder: ApplicationBuilder;
  let openSaveFileDialogMock: jest.MockedFunction<() => void>;
  let callForLogsMock: jest.MockedFunction<CallForLogs>;
  const logs = new Map([["timestamp", "some-logs"]]);

  beforeEach(() => {
    const selectedPod = dockerPod;

    builder = getApplicationBuilder();

    builder.setEnvironmentToClusterFrame();

    callForLogsMock = jest.fn();

    builder.beforeWindowStart((windowDi) => {
      windowDi.override(callForLogsInjectable, () => callForLogsMock);

      // Overriding internals of logsViewModelInjectable
      windowDi.override(getLogsInjectable, () => () => ["some-logs"]);
      windowDi.override(getLogsWithoutTimestampsInjectable, () => () => ["some-logs"]);
      windowDi.override(getTimestampSplitLogsInjectable, () => () => [...logs]);
      windowDi.override(reloadLogsInjectable, () => jest.fn());
      windowDi.override(getLogTabDataInjectable, () => () => ({
        selectedPodId: selectedPod.getId(),
        selectedContainer: selectedPod.getContainers()[0].name,
        namespace: "default",
        showPrevious: true,
        showTimestamps: false,
        wrap: false,
      }));
      windowDi.override(setLogTabDataInjectable, () => jest.fn());
      windowDi.override(loadLogsInjectable, () => jest.fn());
      windowDi.override(stopLoadingLogsInjectable, () => jest.fn());
      windowDi.override(areLogsPresentInjectable, () => jest.fn());
      windowDi.override(getPodByIdInjectable, () => (id) => {
        if (id === selectedPod.getId()) {
          return selectedPod;
        }

        return undefined;
      });
      windowDi.override(getPodsByOwnerIdInjectable, () => jest.fn());

      windowDi.override(getRandomIdForPodLogsTabInjectable, () => jest.fn(() => "some-irrelevant-random-id"));

      openSaveFileDialogMock = jest.fn();
      windowDi.override(openSaveFileDialogInjectable, () => openSaveFileDialogMock);
    });
  });

  describe("when opening pod logs", () => {
    beforeEach(async () => {
      rendered = await builder.render();

      const windowDi = builder.applicationWindow.only.di;
      const pod = dockerPod;
      const createLogsTab = windowDi.inject(createPodLogsTabInjectable);
      const container = {
        name: "docker-exporter",
        image: "docker.io/prom/node-exporter:v1.0.0-rc.0",
        imagePullPolicy: "pull",
      };

      const dockStore = windowDi.inject(dockStoreInjectable);

      dockStore.closeTab("terminal");

      createLogsTab({
        selectedPod: pod,
        selectedContainer: container,
      });
    });

    it("renders", () => {
      expect(rendered.baseElement).toMatchSnapshot();
    });

    it("contains download dropdown button", () =>  {
      expect(rendered.getByTestId("download-logs-dropdown")).toBeInTheDocument();
    });

    describe("when clicking on button", () => {
      beforeEach(() => {
        const button = rendered.getByTestId("download-logs-dropdown");

        act(() => button.click());
      });

      it("shows download visible logs menu item", () => {
        expect(rendered.getByTestId("download-visible-logs")).toBeInTheDocument();
      });

      it("shows download all logs menu item", () => {
        expect(rendered.getByTestId("download-all-logs")).toBeInTheDocument();
      });

      describe("when call for logs resolves with logs", () => {
        beforeEach(() => {
          callForLogsMock.mockResolvedValue("all-logs");
        });

        describe("when selected 'download visible logs'", () => {
          beforeEach(() => {
            const button = rendered.getByTestId("download-visible-logs");

            button.click();
          });

          it("shows save dialog with proper attributes", () => {
            expect(openSaveFileDialogMock).toHaveBeenCalledWith("dockerExporter.log", "some-logs", "text/plain");
          });
        });

        describe("when selected 'download all logs'", () => {
          beforeEach(async () => {
            await act(async () => {
              const button = rendered.getByTestId("download-all-logs");

              button.click();
            });
          });

          it("logs have been called with query", () => {
            expect(callForLogsMock).toHaveBeenCalledWith(
              { name: "dockerExporter", namespace: "default" },
              { "previous": true, "timestamps": false },
            );
          });

          it("shows save dialog with proper attributes", async () => {
            expect(openSaveFileDialogMock).toHaveBeenCalledWith("dockerExporter.log", "all-logs", "text/plain");
          });

          it("doesn't block download dropdown for interaction after click", async () => {
            expect(rendered.getByTestId("download-logs-dropdown")).not.toHaveAttribute("disabled");
          });
        });

        describe("blocking user interaction after menu item click", () => {
          it("block download dropdown for interaction when selected 'download all logs'", async () => {
            const downloadMenuItem = rendered.getByTestId("download-all-logs");

            act(() => downloadMenuItem.click());

            await waitFor(() => {
              expect(rendered.getByTestId("download-logs-dropdown")).toHaveAttribute("disabled");
            });
          });

          it("doesn't block dropdown for interaction when selected 'download visible logs'", () => {
            const downloadMenuItem = rendered.getByTestId("download-visible-logs");

            act(() => downloadMenuItem.click());

            expect(rendered.getByTestId("download-logs-dropdown")).not.toHaveAttribute("disabled");
          });
        });
      });

      describe("when call for logs resolves with no logs", () => {
        beforeEach(() => {
          callForLogsMock.mockResolvedValue("");
        });

        describe("when selected 'download visible logs'", () => {
          beforeEach(() => {
            const button = rendered.getByTestId("download-visible-logs");

            button.click();
          });

          it("shows save dialog with proper attributes", () => {
            expect(openSaveFileDialogMock).toHaveBeenCalledWith("dockerExporter.log", "some-logs", "text/plain");
          });
        });

        describe("when selected 'download all logs'", () => {
          beforeEach(async () => {
            await act(async () => {
              const button = rendered.getByTestId("download-all-logs");

              button.click();
            });
          });

          it("doesn't show save dialog", async () => {
            expect(openSaveFileDialogMock).not.toHaveBeenCalled();
          });
        });
      });

      describe("when call for logs rejects", () => {
        beforeEach(() => {
          callForLogsMock.mockRejectedValue("error");
        });

        describe("when selected 'download visible logs'", () => {
          beforeEach(async () => {
            await act(async () => {
              const button = rendered.getByTestId("download-visible-logs");

              button.click();
            });
          });

          it("shows save dialog with proper attributes", () => {
            expect(openSaveFileDialogMock).toHaveBeenCalledWith("dockerExporter.log", "some-logs", "text/plain");
          });
        });

        describe("when selected 'download all logs'", () => {
          beforeEach(async () => {
            await act(async () => {
              const button = rendered.getByTestId("download-all-logs");

              button.click();
            });
          });

          it("logs have been called", () => {
            expect(callForLogsMock).toHaveBeenCalledWith(
              { name: "dockerExporter", namespace: "default" },
              { "previous": true, "timestamps": false },
            );
          });

          it("doesn't show save dialog", async () => {
            expect(openSaveFileDialogMock).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
});
/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { Tabs } from "../../../../renderer/components/tabs";
import React from "react";
import type { Composite } from "../../../application-menu/main/menu-items/get-composite/get-composite";
import type { PreferenceTypes } from "../preference-items/preference-item-injection-token";
import { Map } from "../../../../renderer/components/map/map";
import { withInjectables } from "@ogre-tools/injectable-react";
import type { IComputedValue } from "mobx";
import preferencesCompositeInjectable from "../preference-items/preferences-composite.injectable";
import { observer } from "mobx-react";
import { PreferencesNavigationTab } from "./preferences-navigation-tab";
import { compositeHasDescendant } from "../../../application-menu/main/menu-items/get-composite/composite-has-descendant/composite-has-descendant";

interface Dependencies {
  composite: IComputedValue<Composite<PreferenceTypes>>;
}

const NonInjectedPreferencesNavigation = observer(({ composite }: Dependencies) => (
  <Tabs className="flex column" scrollable={false}>
    <Map items={composite.get().children}>{toNavigationHierarchy}</Map>
  </Tabs>
));

export const PreferencesNavigation = withInjectables<Dependencies>(
  NonInjectedPreferencesNavigation,

  {
    getProps: (di) => ({
      composite: di.inject(preferencesCompositeInjectable),
    }),
  },
);


const toNavigationHierarchy = (composite: Composite<PreferenceTypes>) => {
  // Note: This makes tab groups and tabs without content not render anything in navigation.
  if (!hasContent(composite)) {
    return emptyRender;
  }

  const value = composite.value;

  switch (value.kind) {
    // Note: These preference item types are not rendered in navigation,
    // yet they are interesting for deciding if eg. a tab group or a tab has content
    // somewhere in structure, and therefore not be hidden.
    case "page": {
      return emptyRender;
    }

    case "item": {
      return emptyRender;
    }

    case "group": {
      return emptyRender;
    }

    case "tab-group": {

      return (
        <>
          <div data-testid={value.testId} className="header">{value.label}</div>

          <Map items={composite.children}>{toNavigationHierarchy}</Map>
        </>
      );
    }

    case "tab": {
      return (
        <PreferencesNavigationTab tab={value} />
      );
    }

    default: {
      // Note: this will fail at transpilation time, if all kinds
      // are not handled in switch/case.
      const _exhaustiveCheck: never = value;

      // Note: this code is unreachable, it is here to make ts not complain about
      // _exhaustiveCheck not being used.
      // See: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      throw new Error(
        `Tried to create preference navigation, but foreign item was encountered: ${_exhaustiveCheck} ${composite.value}`,
      );
    }
  }
};

const hasContent = compositeHasDescendant<PreferenceTypes>(
  (composite) => composite.value.kind === "item",
);

const emptyRender = <></>;


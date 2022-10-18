/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { RenderResult } from "@testing-library/react";

type DiscoverySourceTypes = RenderResult | Element;

export const querySingleElement =
  (attributeName: string, attributeValue?: string) =>
    (source: DiscoverySourceTypes) => {
      const dataAttribute = `data-${attributeName}-test`;

      const selector =  attributeValue ? `[${dataAttribute}="${attributeValue}"]` : `[${dataAttribute}]` ;

      return getBaseElement(source).querySelector(selector);
    };

export const queryAllElements =
  (attributeName: string) => (source: DiscoverySourceTypes) => {
    const dataAttribute = `data-${attributeName}-test`;

    const results = [
      ...getBaseElement(source).querySelectorAll(`[${dataAttribute}]`),
    ];

    return {
      elements: results,

      attributeValues: results.map((result) =>
        result.getAttribute(dataAttribute),
      ),
    };
  };

export const getSingleElement =
  (attributeName: string, attributeValue?: string) =>
    (source: DiscoverySourceTypes) => {
      const dataAttribute = `data-${attributeName}-test`;

      const element = querySingleElement(attributeName, attributeValue)(source);

      if (!element) {
        const validValues =
        queryAllElements(attributeName)(source).attributeValues;

        if(attributeValue) {
          throw new Error(
            `Couldn't find HTML-element with attribute "${dataAttribute}" with value "${attributeValue}". Present values are:\n\n"${validValues.join(
              '",\n"',
            )}"`,
          );
        }

        throw new Error(`Couldn't find HTML-element with attribute "${dataAttribute}"`);
      }

      return element;
    };

const getBaseElement = (source: DiscoverySourceTypes) =>
  "baseElement" in source ? source.baseElement : source;

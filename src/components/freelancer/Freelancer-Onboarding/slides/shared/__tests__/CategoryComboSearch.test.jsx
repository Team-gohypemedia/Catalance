import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import CategoryMultiSelect from "../CategoryComboSearch";

const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock the CSS file import in Lucide
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
  };
});

describe("CategoryComboSearch Component", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("should pre-fetch skills and display them in the search dropdown when typing", async () => {
    // 1. Mock fetch responses
    fetchMock.mockImplementation((url) => {
      if (url.includes("/marketplace/filters/tools?subCategoryId=9")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                { id: 26, name: "Shopify" },
                { id: 27, name: "Webflow" },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    });

    const options = [
      {
        value: "catalog:9",
        label: "CMS Development",
        subCategoryId: 9,
      },
    ];

    const onChange = vi.fn();
    const onActiveCategoryChange = vi.fn();
    const onSubcategorySkillChange = vi.fn();

    // 2. Render Component
    render(
      <CategoryMultiSelect
        options={options}
        selected={[]}
        onChange={onChange}
        onActiveCategoryChange={onActiveCategoryChange}
        onSubcategorySkillChange={onSubcategorySkillChange}
      />
    );

    // 3. Wait for the pre-fetch API call to be made
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/marketplace/filters/tools?subCategoryId=9"),
        expect.any(Object)
      );
    });

    // 4. Type "shopify" into the search input
    const input = screen.getByPlaceholderText("Search categories & skills...");
    fireEvent.change(input, { target: { value: "shopify" } });

    // 5. Check if Shopify is visible in the dropdown
    await waitFor(() => {
      expect(screen.getByText("Shopify")).toBeTruthy();
    });
  });
});

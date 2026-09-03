import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
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

  it("shows selected skills in their Website Development category path", () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    render(
      <CategoryMultiSelect
        options={[
          {
            value: "catalog:9",
            label: "CMS Development",
            subCategoryId: 9,
          },
        ]}
        selected={["catalog:9"]}
        serviceLabel="Website Development"
        selectedSubcategories={[
          {
            subCategoryId: 9,
            subCategoryKey: "catalog:9",
            selectedToolIds: [26],
          },
        ]}
        toolOptionsByCategory={{
          9: [{ id: 26, label: "Shopify" }],
        }}
        onChange={vi.fn()}
        onSubcategorySkillChange={vi.fn()}
      />,
    );

    const selectedSummary = screen.getByLabelText("Selected service categories and skills");
    expect(selectedSummary).toBeTruthy();
    expect(within(selectedSummary).getByText("Website Development")).toBeTruthy();
    expect(within(selectedSummary).getByText("CMS Development")).toBeTruthy();
    expect(within(selectedSummary).getByText("Shopify")).toBeTruthy();
  });

  it("keeps the category picker closed when the empty search input is focused", () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    render(
      <CategoryMultiSelect
        options={[
          {
            value: "catalog:9",
            label: "CMS Development",
            subCategoryId: 9,
          },
        ]}
        onChange={vi.fn()}
        onSubcategorySkillChange={vi.fn()}
      />,
    );

    fireEvent.focus(screen.getByPlaceholderText("Search categories & skills..."));

    expect(
      screen.queryByRole("dialog", { name: "Choose categories and skills" }),
    ).toBeNull();
  });

  it("automatically selects all skills when category checkbox is clicked", () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const onChange = vi.fn();
    const onSubcategorySkillChange = vi.fn();

    render(
      <CategoryMultiSelect
        options={[
          {
            value: "catalog:9",
            label: "CMS Development",
            subCategoryId: 9,
          },
        ]}
        toolOptionsByCategory={{
          9: [
            { id: 26, label: "Shopify" },
            { id: 27, label: "Webflow" },
          ],
        }}
        skillSuggestionsByCategory={{
          "catalog:9": ["WordPress", "Wix"],
        }}
        selected={[]}
        onChange={onChange}
        onSubcategorySkillChange={onSubcategorySkillChange}
      />,
    );

    // Open browse accordion
    const browseButton = screen.getByTitle("Browse all categories & skills");
    fireEvent.click(browseButton);

    // Click the category select checkbox for CMS Development
    const categorySelectBtn = screen.getByLabelText("Select category CMS Development");
    fireEvent.click(categorySelectBtn);

    // Should call onChange with category
    expect(onChange).toHaveBeenCalledWith(["catalog:9"]);

    // Should call onSubcategorySkillChange with all tool IDs [26, 27] and all suggested skills ["WordPress", "Wix"]
    expect(onSubcategorySkillChange).toHaveBeenCalledWith("catalog:9", {
      selectedToolIds: [26, 27],
      customSkillNames: ["WordPress", "Wix"],
    });
  });

  it("clears all skills when an already fully-selected category checkbox is clicked", () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const onChange = vi.fn();
    const onSubcategorySkillChange = vi.fn();

    render(
      <CategoryMultiSelect
        options={[
          {
            value: "catalog:9",
            label: "CMS Development",
            subCategoryId: 9,
          },
        ]}
        toolOptionsByCategory={{
          9: [
            { id: 26, label: "Shopify" },
            { id: 27, label: "Webflow" },
          ],
        }}
        skillSuggestionsByCategory={{
          "catalog:9": ["WordPress"],
        }}
        selected={["catalog:9"]}
        selectedSubcategories={[
          {
            subCategoryId: 9,
            subCategoryKey: "catalog:9",
            selectedToolIds: [26, 27],
            customSkillNames: ["WordPress"],
          },
        ]}
        onChange={onChange}
        onSubcategorySkillChange={onSubcategorySkillChange}
      />,
    );

    // Open browse accordion
    const browseButton = screen.getByTitle("Browse all categories & skills");
    fireEvent.click(browseButton);

    // Click the category select checkbox for CMS Development to deselect
    const categorySelectBtn = screen.getByLabelText("Select category CMS Development");
    fireEvent.click(categorySelectBtn);

    // Should remove category from selected
    expect(onChange).toHaveBeenCalledWith([]);

    // Should clear all skills
    expect(onSubcategorySkillChange).toHaveBeenCalledWith("catalog:9", {
      selectedToolIds: [],
      customSkillNames: [],
    });
  });
});


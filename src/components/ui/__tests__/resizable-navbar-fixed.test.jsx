import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { NavItems } from "@/components/ui/resizable-navbar-fixed";

const items = [
  { name: "Home", link: "/" },
  { name: "Marketplace", link: "/marketplace" },
  { name: "Service", link: "/service" },
  { name: "Contact", link: "/contact" },
];

const renderNavItems = (currentPath) =>
  render(
    <MemoryRouter>
      <NavItems items={items} currentPath={currentPath} />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe("NavItems", () => {
  it("highlights the home tab on the home route", () => {
    renderNavItems("/");

    const homeLink = screen.getByRole("link", { name: "Home" });
    const marketplaceLink = screen.getByRole("link", { name: "Marketplace" });
    const homeClasses = homeLink.className.split(/\s+/);

    expect(homeLink.getAttribute("aria-current")).toBe("page");
    expect(homeLink.getAttribute("data-active")).toBe("true");
    expect(homeClasses).toContain("bg-primary");
    expect(homeClasses).toContain("text-background");
    expect(screen.getByText("Home").style.color).toBe("var(--background)");
    expect(marketplaceLink.getAttribute("data-active")).toBe("false");
  });

  it("keeps marketplace active on nested marketplace routes", () => {
    renderNavItems("/marketplace/service/123");

    const marketplaceLink = screen.getByRole("link", { name: "Marketplace" });
    const homeLink = screen.getByRole("link", { name: "Home" });

    expect(marketplaceLink.getAttribute("aria-current")).toBe("page");
    expect(marketplaceLink.getAttribute("data-active")).toBe("true");
    expect(homeLink.getAttribute("data-active")).toBe("false");
  });
});

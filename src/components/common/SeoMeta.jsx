import { useEffect } from "react";

const ensureMetaTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    tag.setAttribute(key, value);
  });

  return tag;
};

const ensureLinkTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("link");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    tag.setAttribute(key, value);
  });

  return tag;
};

const ensureScriptTag = (selector, content) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.setAttribute("data-seo-ld", "blog");
    document.head.appendChild(tag);
  }
  tag.textContent = content;
  return tag;
};

const resolveAbsoluteUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw || typeof window === "undefined") return raw;
  try {
    return new URL(raw, window.location.origin).toString();
  } catch {
    return raw;
  }
};

const SeoMeta = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  image,
  type = "website",
  jsonLd = null
}) => {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousTitle = document.title;
    const trackedSelectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[property="og:type"]',
      'meta[name="twitter:card"]',
      'meta[name="keywords"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'link[rel="canonical"]',
      'script[data-seo-ld="blog"]'
    ];

    const previousValues = trackedSelectors.map((selector) => {
      const node = document.head.querySelector(selector);
      return {
        selector,
        exists: Boolean(node),
        attributes: node
          ? Array.from(node.attributes).reduce((acc, attribute) => {
              acc[attribute.name] = attribute.value;
              return acc;
            }, {})
          : {},
        textContent: node?.textContent || ""
      };
    });

    if (title) {
      document.title = title;
    }

    if (description) {
      ensureMetaTag('meta[name="description"]', {
        name: "description",
        content: description
      });
      ensureMetaTag('meta[property="og:description"]', {
        property: "og:description",
        content: description
      });
      ensureMetaTag('meta[name="twitter:description"]', {
        name: "twitter:description",
        content: description
      });
    }

    if (title) {
      ensureMetaTag('meta[property="og:title"]', {
        property: "og:title",
        content: title
      });
      ensureMetaTag('meta[name="twitter:title"]', {
        name: "twitter:title",
        content: title
      });
    }

    ensureMetaTag('meta[property="og:type"]', {
      property: "og:type",
      content: type
    });

    ensureMetaTag('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary"
    });

    if (keywords.length) {
      ensureMetaTag('meta[name="keywords"]', {
        name: "keywords",
        content: keywords.join(", ")
      });
    }

    if (image) {
      const absoluteImage = resolveAbsoluteUrl(image);
      ensureMetaTag('meta[property="og:image"]', {
        property: "og:image",
        content: absoluteImage
      });
      ensureMetaTag('meta[name="twitter:image"]', {
        name: "twitter:image",
        content: absoluteImage
      });
    }

    if (canonicalUrl) {
      ensureLinkTag('link[rel="canonical"]', {
        rel: "canonical",
        href: resolveAbsoluteUrl(canonicalUrl)
      });
    }

    if (jsonLd) {
      ensureScriptTag('script[data-seo-ld="blog"]', JSON.stringify(jsonLd));
    }

    return () => {
      document.title = previousTitle;

      previousValues.forEach(({ selector, exists, attributes, textContent }) => {
        const node = document.head.querySelector(selector);
        if (!exists) {
          node?.remove();
          return;
        }
        if (!node) return;
        Array.from(node.attributes).forEach((attribute) => {
          node.removeAttribute(attribute.name);
        });
        Object.entries(attributes).forEach(([key, value]) => {
          node.setAttribute(key, value);
        });
        if ("textContent" in node) {
          node.textContent = textContent;
        }
      });
    };
  }, [canonicalUrl, description, image, jsonLd, keywords, title, type]);

  return null;
};

export default SeoMeta;

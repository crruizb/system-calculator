import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  jsonLd?: object | object[];
}

export function useSeo({
  title,
  description,
  canonical,
  noindex = false,
  ogImage,
  jsonLd,
}: SeoOptions) {
  useEffect(() => {
    document.title = title;

    setMeta("name", "description", description);
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:150, max-image-preview:large",
    );

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:locale", "es_ES");
    if (ogImage) setMeta("property", "og:image", ogImage);
    if (canonical) setMeta("property", "og:url", canonical);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    if (canonical) setLink("canonical", canonical);

    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    schemas.forEach((schema, i) => {
      const id = `json-ld-${i}`;
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    });

    return () => {
      schemas.forEach((_, i) => document.getElementById(`json-ld-${i}`)?.remove());
    };
  }, [title, description, canonical, noindex, ogImage, jsonLd]);
}

function setMeta(attr: "name" | "property", value: string, content: string) {
  let el = document.querySelector(
    `meta[${attr}="${value}"]`,
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  (el as HTMLLinkElement).href = href;
}

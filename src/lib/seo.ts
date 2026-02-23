type MetaInput = {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
};

const DEFAULT_IMAGE = "https://celeonetv.com/logo.jpeg";
const DEFAULT_SITE_NAME = "Celeone TV";

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (selector.includes('property="')) {
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      if (prop) el.setAttribute("property", prop);
    }
    if (selector.includes('name="')) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

export function setPageMeta({
  title,
  description = "Watch live channels, posts, and community content on Celeone TV.",
  image = DEFAULT_IMAGE,
  url = window.location.href,
  type = "website",
}: MetaInput) {
  document.title = title;

  upsertMeta('meta[name="description"]', { content: description });
  upsertMeta('meta[property="og:type"]', { content: type });
  upsertMeta('meta[property="og:site_name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[property="og:title"]', { content: title });
  upsertMeta('meta[property="og:description"]', { content: description });
  upsertMeta('meta[property="og:image"]', { content: image });
  upsertMeta('meta[property="og:url"]', { content: url });
  upsertMeta('meta[name="twitter:card"]', { content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { content: title });
  upsertMeta('meta[name="twitter:description"]', { content: description });
  upsertMeta('meta[name="twitter:image"]', { content: image });
}

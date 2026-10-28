import Parser from "rss-parser";
import { FEEDS } from "./feeds";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "RadarNoticias/1.0 (+leitor RSS)" },
  customFields: {
    item: [["media:content", "mediaContent", { keepArray: false }], ["media:thumbnail", "mediaThumb"]],
  },
});

function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickImage(item) {
  const fromMedia = item.mediaContent?.$?.url || item.mediaThumb?.$?.url;
  if (fromMedia) return fromMedia;
  if (item.enclosure?.url && /image/.test(item.enclosure.type || "image")) return item.enclosure.url;
  const match = (item["content:encoded"] || item.content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

async function readFeed(feed) {
  const data = await parser.parseURL(feed.url);
  return (data.items || []).slice(0, 25).map((item) => {
    const date = item.isoDate || item.pubDate;
    const time = date ? new Date(date).getTime() : NaN;
    return {
      id: `${feed.id}:${item.guid || item.link}`,
      title: stripHtml(item.title),
      summary: stripHtml(item.contentSnippet || item.summary || item.content || "").slice(0, 220),
      link: item.link,
      image: pickImage(item),
      source: feed.name,
      sourceId: feed.id,
      region: feed.region,
      publishedAt: Number.isNaN(time) ? null : new Date(time).toISOString(),
    };
  });
}

/**
 * Busca todas as fontes em paralelo. Uma fonte fora do ar não derruba as demais.
 * Retorna as notícias ordenadas da mais recente para a mais antiga.
 */
export async function getNews() {
  const results = await Promise.allSettled(FEEDS.map(readFeed));

  const items = [];
  const status = [];
  results.forEach((res, i) => {
    const feed = FEEDS[i];
    if (res.status === "fulfilled") {
      items.push(...res.value);
      status.push({ id: feed.id, name: feed.name, ok: true, count: res.value.length });
    } else {
      status.push({ id: feed.id, name: feed.name, ok: false, error: String(res.reason?.message || res.reason) });
    }
  });

  // remove duplicatas por link e itens sem título/link
  const seen = new Set();
  const unique = items.filter((n) => {
    if (!n.title || !n.link || seen.has(n.link)) return false;
    seen.add(n.link);
    return true;
  });

  unique.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  return { items: unique.slice(0, 120), status, updatedAt: new Date().toISOString() };
}

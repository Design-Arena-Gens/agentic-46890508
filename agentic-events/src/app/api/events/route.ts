import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { EVENT_SOURCES, type EventSource } from "@/lib/eventSources";

export type WorldEvent = {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  sourceId: string;
  sourceHomepage: string;
  publishedAt: string;
  regions: string[];
  image?: string;
};

const parser = new Parser({
  headers: {
    "user-agent":
      "Mozilla/5.0 (compatible; WorldEventsAgent/1.0; +https://agentic-46890508.vercel.app)",
  },
  timeout: 15000,
});

function sanitizeSummary(value?: string | null): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeEvent(
  source: EventSource,
  item: Parser.Item,
): WorldEvent | null {
  const url = item.link ?? "";
  const title = item.title?.trim();
  const publishedAt =
    item.isoDate ??
    (item.pubDate ? new Date(item.pubDate).toISOString() : undefined);

  if (!title || !url || !publishedAt) {
    return null;
  }

  const description =
    sanitizeSummary(item.contentSnippet) || sanitizeSummary(item.content);

  let image: string | undefined;
  const enclosure = item.enclosure as { url?: string } | undefined;
  if (enclosure?.url && /^https?:\/\//.test(enclosure.url)) {
    image = enclosure.url;
  }

  const mediaContent: unknown = (item as never)["media:content"];
  if (!image && Array.isArray(mediaContent)) {
    const mediaItem = mediaContent.find(
      (m) => typeof m === "object" && m && "url" in m,
    ) as { url?: string } | undefined;
    if (mediaItem?.url && /^https?:\/\//.test(mediaItem.url)) {
      image = mediaItem.url;
    }
  }

  return {
    id: `${source.id}:${Buffer.from(url).toString("base64url")}`,
    title,
    summary: description,
    url,
    sourceId: source.id,
    sourceName: source.name,
    sourceHomepage: source.homepage,
    publishedAt,
    regions: source.regions,
    image,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim().toLowerCase();
  const regionParam = searchParams.get("region")?.toLowerCase();
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) ? Math.max(limitParam, 10) : 60;

  const region =
    regionParam && regionParam !== "global" ? regionParam : "global";

  const sources =
    region === "global"
      ? EVENT_SOURCES
      : EVENT_SOURCES.filter((source) => source.regions.includes(region));

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.feed);
        return (feed.items ?? [])
          .map((item) => normalizeEvent(source, item))
          .filter((event): event is WorldEvent => Boolean(event));
      } catch (error) {
        console.error(`Failed to fetch ${source.id}:`, error);
        return [] as WorldEvent[];
      }
    }),
  );

  const flattened = results.flat();
  const unique = new Map<string, WorldEvent>();

  for (const event of flattened) {
    if (!unique.has(event.url)) {
      unique.set(event.url, event);
    }
  }

  let events = Array.from(unique.values());

  if (query) {
    events = events.filter((event) => {
      const haystack = `${event.title} ${event.summary}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  events.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return NextResponse.json(
    {
      fetchedAt: new Date().toISOString(),
      events: events.slice(0, limit),
      sources: sources.map(({ id, name, homepage }) => ({
        id,
        name,
        homepage,
      })),
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}

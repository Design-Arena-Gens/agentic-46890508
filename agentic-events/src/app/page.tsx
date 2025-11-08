/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type RegionOption = {
  id: string;
  label: string;
  description: string;
};

type EventRecord = {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  sourceHomepage: string;
  publishedAt: string;
  regions: string[];
  image?: string;
};

const REGION_OPTIONS: RegionOption[] = [
  {
    id: "global",
    label: "Global Pulse",
    description: "Signals from every newsroom we track.",
  },
  {
    id: "americas",
    label: "Americas",
    description: "North & South America focus.",
  },
  {
    id: "europe",
    label: "Europe",
    description: "Continental updates & European affairs.",
  },
  {
    id: "asia",
    label: "Asia-Pacific",
    description: "Asia-Pacific geopolitical & economic moves.",
  },
  {
    id: "middle-east",
    label: "Middle East",
    description: "Regional diplomacy, security, and energy.",
  },
  {
    id: "africa",
    label: "Africa",
    description: "Across the continent, politics to progress.",
  },
];

const TRENDING_QUERIES = [
  "elections",
  "ceasefire",
  "climate",
  "technology",
  "economy",
  "security",
];

const REFRESH_INTERVAL = 1000 * 60 * 5;

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: "seconds" },
    { amount: 60, unit: "minutes" },
    { amount: 24, unit: "hours" },
    { amount: 7, unit: "days" },
  ];

  let duration = diff / 1000;

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), "weeks");
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionOption>(REGION_OPTIONS[0]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [activeSources, setActiveSources] = useState<
    { id: string; name: string; homepage: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const isFiltered = useMemo(
    () => region.id !== "global" || query.trim().length > 0,
    [region.id, query],
  );

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (region.id !== "global") params.set("region", region.id);
    params.set("limit", "60");

    try {
      const response = await fetch(`/api/events?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        events: EventRecord[];
        fetchedAt: string;
        sources: { id: string; name: string; homepage: string }[];
      };

      setEvents(payload.events);
      setActiveSources(payload.sources);
      setLastUpdated(payload.fetchedAt);
    } catch (err) {
      console.error(err);
      setError(
        "The event network is momentarily unreachable. Please try again shortly.",
      );
    } finally {
      setLoading(false);
    }
  }, [query, region.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshIndex((current) => current + 1);
    }, REFRESH_INTERVAL);

    return () => window.clearInterval(interval);
  }, []);

  const handleApplyTrending = (value: string) => {
    setQuery(value);
    setRefreshIndex((current) => current + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(192,132,252,0.1),transparent_40%)]" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-14 sm:pt-20">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <span className="inline-flex max-w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              Real-time world intelligence
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Atlas Agent
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Streamline your global situational awareness. Atlas reaches
              across verified international desks, normalizes signals, and
              surfaces the developments shaping the world right now.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 shadow-[inset_0_1px_0_rgba(148,163,184,0.04)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div>
                <label
                  htmlFor="query"
                  className="block text-sm font-medium text-slate-300"
                >
                  Which developments are you tracking?
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 shadow-sm focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/40">
                  <span className="text-slate-500">🔍</span>
                  <input
                    id="query"
                    className="w-full bg-transparent text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    placeholder="e.g. humanitarian corridors, global markets, peace talks…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        fetchEvents();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {REGION_OPTIONS.map((option) => {
                  const isActive = option.id === region.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRegion(option)}
                      className={[
                        "group rounded-full border px-4 py-1.5 text-sm transition hover:scale-[1.01]",
                        isActive
                          ? "border-cyan-400 bg-cyan-400/10 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-100",
                      ].join(" ")}
                    >
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-slate-400">
                {region.description}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setRefreshIndex((current) => current + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-300/60 border-t-transparent" />
                    Updating…
                  </span>
                ) : (
                  <>
                    <span role="img" aria-label="refresh">
                      ♻️
                    </span>
                    Refresh feed
                  </>
                )}
              </button>
              {lastUpdated && (
                <p className="text-xs text-slate-500">
                  Synced {formatRelativeTime(lastUpdated)}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRENDING_QUERIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleApplyTrending(item)}
                className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-100"
              >
                #{item}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">
                {isFiltered ? "Curated event stream" : "Live global event feed"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {activeSources.map((source) => (
                  <Link
                    key={source.id}
                    href={source.homepage}
                    target="_blank"
                    className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-100"
                  >
                    {source.name}
                  </Link>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-400">
              {events.length
                ? `Tracking ${events.length.toString()} live signals`
                : loading
                  ? "Listening for verified signals…"
                  : "No events matched your filters. Expand the search scope to see more."}
            </p>
          </header>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {loading && events.length === 0
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl bg-slate-900/40"
                  />
                ))
              : events.map((event) => (
                  <article
                    key={event.id}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-[0_10px_40px_rgba(15,23,42,0.35)] transition hover:border-cyan-500/40 hover:shadow-[0_14px_45px_rgba(34,211,238,0.18)]"
                  >
                    {event.image && (
                      <div className="relative h-40 overflow-hidden bg-slate-800/60">
                        <img
                          src={event.image}
                          alt=""
                          className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="rounded-full border border-slate-800 bg-slate-950/70 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-cyan-200">
                          {event.sourceName}
                        </span>
                        <span>{formatRelativeTime(event.publishedAt)}</span>
                      </div>
                      <h3 className="text-lg font-semibold leading-snug text-white">
                        <Link
                          href={event.url}
                          target="_blank"
                          className="transition hover:text-cyan-200"
                        >
                          {event.title}
                        </Link>
                      </h3>
                      {event.summary ? (
                        <p className="line-clamp-3 text-sm text-slate-300">
                          {event.summary}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No summary available for this event.
                        </p>
                      )}
                      <div className="mt-auto flex flex-wrap gap-2 text-xs text-slate-400">
                        {event.regions.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-800 bg-slate-950/70 px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
          </div>
        </section>
      </main>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import { Skeleton } from "@/components/ui/skeleton";
import { countryNameToIso3 } from "@/lib/countryMapping";
import { cn, formatCompactNumber } from "@/lib/utils";

// Public TopoJSON: ISO_A3 country boundaries at 110m resolution.
// Hosted on jsDelivr CDN (cached, no auth, ~250KB gzipped).
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export type WorldMapItem = {
  name: string; // raw country name from API (RU/EN)
  value: number;
};

interface Props {
  data: WorldMapItem[];
  loading?: boolean;
  height?: number;
  title?: string;
  /** Override mapping function if your data uses ISO-3 directly. */
  resolveIso3?: (name: string) => string | null;
}

const colorScale = (value: number, max: number): string => {
  if (!value || max === 0) return "var(--muted)";
  const ratio = Math.min(1, value / max);
  // Emerald scale, low → light, high → saturated
  if (ratio < 0.1) return "rgba(16, 185, 129, 0.18)";
  if (ratio < 0.25) return "rgba(16, 185, 129, 0.32)";
  if (ratio < 0.45) return "rgba(16, 185, 129, 0.5)";
  if (ratio < 0.65) return "rgba(16, 185, 129, 0.68)";
  if (ratio < 0.85) return "rgba(16, 185, 129, 0.85)";
  return "rgba(5, 150, 105, 1)";
};

export const WorldMap = ({ data, loading, height = 380, title, resolveIso3 }: Props) => {
  const [hovered, setHovered] = useState<{ name: string; value: number } | null>(null);

  const { byIso, max } = useMemo(() => {
    const map: Record<string, number> = {};
    let m = 0;
    const resolver = resolveIso3 ?? countryNameToIso3;
    for (const it of data ?? []) {
      const iso = resolver(it.name);
      if (!iso) continue;
      map[iso] = (map[iso] ?? 0) + it.value;
      if (map[iso] > m) m = map[iso];
    }
    return { byIso: map, max: m };
  }, [data, resolveIso3]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-4">
        {title && <p className="mb-3 text-sm font-semibold">{title}</p>}
        <Skeleton className="h-[380px] w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      {title && <p className="mb-3 text-sm font-semibold">{title}</p>}
      <div className="bg-muted/30 relative w-full overflow-hidden rounded-xl" style={{ height }}>
        <ComposableMap
          projectionConfig={{ scale: 145 }}
          projection="geoMercator"
          width={900}
          height={height + 80}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo: any) => {
                // world-atlas TopoJSON exposes only `name` (English) and numeric `id`.
                // We resolve the geography's English name to ISO-3 and look it up
                // in our pre-built `byIso` map (which was built from API names).
                const geoName = geo.properties?.name ?? geo.properties?.NAME ?? "";
                const iso = countryNameToIso3(geoName);
                const value = iso ? (byIso[iso] ?? 0) : 0;
                const fill = colorScale(value, max);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHovered({ name: geoName, value })}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: { fill, stroke: "var(--border)", strokeWidth: 0.4, outline: "none" },
                      hover: {
                        fill: value > 0 ? "rgba(5, 150, 105, 0.95)" : "var(--accent)",
                        stroke: "var(--ring)",
                        strokeWidth: 0.6,
                        outline: "none",
                        cursor: value > 0 ? "pointer" : "default",
                      },
                      pressed: { fill, outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {hovered && (
          <div className="bg-card/95 pointer-events-none absolute top-3 right-3 rounded-lg border px-3 py-1.5 text-xs shadow-md backdrop-blur">
            <p className="font-medium">{hovered.name}</p>
            <p className="text-muted-foreground tabular-nums">
              {hovered.value > 0 ? formatCompactNumber(hovered.value) : "нет данных"}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {max > 0 && (
        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span>Меньше</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((step) => (
            <span
              key={step}
              className={cn("inline-block h-3 w-7 rounded-sm")}
              style={{ background: colorScale(step * max, max) }}
            />
          ))}
          <span>Больше</span>
          <span className="ml-auto tabular-nums">Макс: {formatCompactNumber(max)}</span>
        </div>
      )}
    </div>
  );
};

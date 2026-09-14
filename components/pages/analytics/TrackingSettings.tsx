"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Plus, Save, Settings2, TriangleAlert, X } from "lucide-react";

import { AnalyticsPageShell } from "@/components/shared/analytics/AnalyticsPageShell";
import { StatsSection } from "@/components/shared/stats/StatsSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAnalyticsConfig,
  useAnalyticsRegistry,
  useAnalyticsUnknownEvents,
  useUpdateAnalyticsConfig,
} from "@/hooks/analyticsHooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import { usePermission } from "@/hooks/usePermission";
import { humanizeEventName } from "@/lib/analytics";
import { formatDate, formatNumber } from "@/lib/utils";
import type { AnalyticsConfig, AnalyticsConfigPatch } from "@/types";

// ============================================================
// Настройки трекинга — remote-config клиента, реестр и события
// мимо реестра.
//
// Читать конфиг может любой админ, менять — только супер-админ
// (PUT /super-admin/analytics/config). Каждая правка инкрементит
// version: клиент видит его в ответе на батч и перечитывает конфиг.
// ============================================================

type FormState = {
  enabled: boolean;
  batch_size: string;
  flush_interval_sec: string;
  max_queue_days: string;
  samplingMode: "global" | "per_event";
  samplingGlobal: string;
  samplingPerEvent: { name: string; rate: string }[];
  disabled_events: string[];
};

const toFormState = (cfg: AnalyticsConfig): FormState => {
  const perEvent = typeof cfg.sampling === "object" && cfg.sampling !== null;
  return {
    enabled: !!cfg.enabled,
    batch_size: String(cfg.batch_size ?? ""),
    flush_interval_sec: String(cfg.flush_interval_sec ?? ""),
    max_queue_days: String(cfg.max_queue_days ?? ""),
    samplingMode: perEvent ? "per_event" : "global",
    samplingGlobal: perEvent ? "1" : String(cfg.sampling ?? 1),
    samplingPerEvent: perEvent
      ? Object.entries(cfg.sampling as Record<string, number>).map(([name, rate]) => ({ name, rate: String(rate) }))
      : [],
    disabled_events: cfg.disabled_events ?? [],
  };
};

export const AnalyticsSettingsPage = () => {
  const { filters, setFilters } = useAnalyticsFilters();
  const { isSuperAdmin } = usePermission();

  const configQ = useAnalyticsConfig();
  const registryQ = useAnalyticsRegistry();
  const unknownQ = useAnalyticsUnknownEvents();
  const { mutate: save, isPending } = useUpdateAnalyticsConfig();

  const cfg = configQ.data?.data;
  const [form, setForm] = useState<FormState | null>(null);
  const [newDisabled, setNewDisabled] = useState("");

  useEffect(() => {
    if (cfg) setForm(toFormState(cfg));
  }, [cfg]);

  const unknown = unknownQ.data?.data ?? [];
  const registry = registryQ.data?.data;

  const submit = () => {
    if (!form) return;
    const patch: AnalyticsConfigPatch = {
      enabled: form.enabled,
      batch_size: Number(form.batch_size),
      flush_interval_sec: Number(form.flush_interval_sec),
      max_queue_days: Number(form.max_queue_days),
      sampling:
        form.samplingMode === "global"
          ? Number(form.samplingGlobal)
          : Object.fromEntries(
              form.samplingPerEvent.filter((r) => r.name.trim()).map((r) => [r.name.trim(), Number(r.rate)])
            ),
      disabled_events: form.disabled_events,
    };
    save(patch);
  };

  const update = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <AnalyticsPageShell
      title="Аналитика · Настройки трекинга"
      subtitle="Remote-config клиента, реестр событий и имена мимо реестра"
      icon={Settings2}
      filters={filters}
      onFiltersChange={setFilters}
      withFilters={false}
    >
      <Tabs defaultValue="config">
        <TabsList className="flex-wrap">
          <TabsTrigger value="config">Конфиг</TabsTrigger>
          <TabsTrigger value="unknown" className="gap-1.5">
            Неизвестные события
            {!!unknown.length && (
              <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white tabular-nums">
                {unknown.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="registry">Реестр</TabsTrigger>
        </TabsList>

        {/* ===================== Remote-config ===================== */}
        <TabsContent value="config" className="mt-4 flex flex-col gap-4 sm:gap-6">
          {!isSuperAdmin && (
            <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              <span>Менять конфиг трекинга может только супер-админ. Ниже — текущее состояние в режиме чтения.</span>
            </div>
          )}

          <StatsSection
            title="Remote-config клиента"
            description={cfg ? `Текущая версия конфига: ${cfg.version}` : undefined}
          >
            {configQ.isLoading || !form ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Аналитика включена</p>
                    <p className="text-muted-foreground text-xs">
                      Рубильник трекинга: при выключении клиенты перестают слать события.
                    </p>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => update({ enabled: v })}
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="batch_size">Размер батча</Label>
                    <Input
                      id="batch_size"
                      type="number"
                      min={1}
                      value={form.batch_size}
                      onChange={(e) => update({ batch_size: e.target.value })}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="flush">Интервал отправки, сек</Label>
                    <Input
                      id="flush"
                      type="number"
                      min={1}
                      value={form.flush_interval_sec}
                      onChange={(e) => update({ flush_interval_sec: e.target.value })}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="queue">Очередь, дней</Label>
                    <Input
                      id="queue"
                      type="number"
                      min={1}
                      value={form.max_queue_days}
                      onChange={(e) => update({ max_queue_days: e.target.value })}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Sampling шумных событий</Label>
                    <div className="bg-card flex items-center gap-1 rounded-lg border p-1">
                      {(["global", "per_event"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          disabled={!isSuperAdmin}
                          onClick={() => update({ samplingMode: mode })}
                          className={
                            form.samplingMode === mode
                              ? "rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white"
                              : "text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1 text-xs"
                          }
                        >
                          {mode === "global" ? "Общий" : "По событиям"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.samplingMode === "global" ? (
                    <div className="space-y-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={form.samplingGlobal}
                        onChange={(e) => update({ samplingGlobal: e.target.value })}
                        disabled={!isSuperAdmin}
                        className="max-w-[180px]"
                      />
                      <p className="text-muted-foreground text-xs">
                        Доля отправляемых событий: 1 — всё, 0.1 — каждое десятое.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.samplingPerEvent.map((row, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={row.name}
                            placeholder="Имя события"
                            disabled={!isSuperAdmin}
                            onChange={(e) => {
                              const next = [...form.samplingPerEvent];
                              next[i] = { ...next[i], name: e.target.value };
                              update({ samplingPerEvent: next });
                            }}
                            className="max-w-[280px] font-mono text-xs"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            value={row.rate}
                            disabled={!isSuperAdmin}
                            onChange={(e) => {
                              const next = [...form.samplingPerEvent];
                              next[i] = { ...next[i], rate: e.target.value };
                              update({ samplingPerEvent: next });
                            }}
                            className="max-w-[110px]"
                          />
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                update({ samplingPerEvent: form.samplingPerEvent.filter((_, idx) => idx !== i) })
                              }
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {isSuperAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() =>
                            update({ samplingPerEvent: [...form.samplingPerEvent, { name: "", rate: "1" }] })
                          }
                        >
                          <Plus className="size-3.5" /> Добавить событие
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Отключённые события</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {form.disabled_events.length === 0 && (
                      <p className="text-muted-foreground text-xs">Все события реестра включены</p>
                    )}
                    {form.disabled_events.map((name) => (
                      <span
                        key={name}
                        className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px]"
                      >
                        {name}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => update({ disabled_events: form.disabled_events.filter((n) => n !== name) })}
                            aria-label={`Включить ${name}`}
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newDisabled}
                        onChange={(e) => setNewDisabled(e.target.value)}
                        placeholder="Имя события"
                        className="max-w-[280px] font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!newDisabled.trim() || form.disabled_events.includes(newDisabled.trim())}
                        onClick={() => {
                          update({ disabled_events: [...form.disabled_events, newDisabled.trim()] });
                          setNewDisabled("");
                        }}
                      >
                        <Plus className="size-3.5" /> Отключить
                      </Button>
                    </div>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-3 border-t pt-4">
                    <Button onClick={submit} disabled={isPending} className="btn-primary gap-2">
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Сохранить конфиг
                    </Button>
                    <p className="text-muted-foreground text-xs">
                      Правка инкрементит version — клиенты перечитают конфиг после ближайшего батча.
                    </p>
                  </div>
                )}
              </div>
            )}
          </StatsSection>
        </TabsContent>

        {/* ===================== Неизвестные события ===================== */}
        <TabsContent value="unknown" className="mt-4">
          <StatsSection
            title="Имена мимо реестра"
            description="Индикатор рассинхрона мобильного релиза и реестра событий на бэке"
          >
            {unknownQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : !unknown.length ? (
              <p className="text-muted-foreground text-sm">Все приходящие события есть в реестре</p>
            ) : (
              <>
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Эти события приложение шлёт, но бэк их не знает — в витрины они не попадают. Либо мобильный релиз
                    ушёл вперёд реестра, либо в имени опечатка.
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Событие</TableHead>
                        <TableHead className="text-right">Раз</TableHead>
                        <TableHead>Версия</TableHead>
                        <TableHead>Впервые</TableHead>
                        <TableHead>Последний раз</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unknown.map((e) => (
                        <TableRow key={`${e.name}-${e.app_version ?? ""}`}>
                          <TableCell className="font-mono text-xs font-medium">{e.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(e.cnt)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{e.app_version ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {e.first_seen ? formatDate(e.first_seen) : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {e.last_seen ? formatDate(e.last_seen) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </StatsSection>
        </TabsContent>

        {/* ===================== Реестр ===================== */}
        <TabsContent value="registry" className="mt-4 flex flex-col gap-4 sm:gap-6">
          <StatsSection title="События" description="Что бэк умеет принимать и класть в витрины">
            {registryQ.isLoading ? (
              <Skeleton className="h-40 rounded-lg" />
            ) : !registry?.events?.length ? (
              <p className="text-muted-foreground text-sm">Реестр пуст</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Событие</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Props</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registry.events.map((e) => (
                      <TableRow key={e.name}>
                        <TableCell className="font-mono text-xs font-medium">{e.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {e.description ?? humanizeEventName(e.name)}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-[11px]">
                          {e.props?.join(", ") || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </StatsSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <StatsSection title="Воронки" description="Произвольные воронки на лету не поддерживаются намеренно">
              {registryQ.isLoading ? (
                <Skeleton className="h-24 rounded-lg" />
              ) : !registry?.funnels?.length ? (
                <p className="text-muted-foreground text-sm">Нет воронок</p>
              ) : (
                <ul className="space-y-2">
                  {registry.funnels.map((f) => (
                    <li key={f.code} className="rounded-lg border p-2.5">
                      <p className="font-mono text-xs font-semibold">{f.code}</p>
                      <p className="text-muted-foreground mt-1 font-mono text-[11px]">{f.steps.join(" → ")}</p>
                      {f.window_minutes != null && (
                        <p className="text-muted-foreground mt-1 text-[11px]">Окно: {f.window_minutes} мин</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </StatsSection>

            <StatsSection title="Формы" description="Поля, по которым считается drop-off">
              {registryQ.isLoading ? (
                <Skeleton className="h-24 rounded-lg" />
              ) : !registry?.forms?.length ? (
                <p className="text-muted-foreground text-sm">Нет форм</p>
              ) : (
                <ul className="space-y-2">
                  {registry.forms.map((f) => (
                    <li key={f.form} className="rounded-lg border p-2.5">
                      <p className="font-mono text-xs font-semibold">{f.form}</p>
                      <p className="text-muted-foreground mt-1 font-mono text-[11px]">{f.fields.join(", ")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </StatsSection>
          </div>
        </TabsContent>
      </Tabs>
    </AnalyticsPageShell>
  );
};

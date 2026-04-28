"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Filter, Search, X } from "lucide-react";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";

import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { DateRangePicker, DateRangeValue } from "@/components/shared/DateRangePicker";
import { EmptyState } from "@/components/shared/EmptyState";
import { EntityLink } from "@/components/shared/EntityLink";
import { LogDetailsDrawer } from "@/components/shared/LogDetailsDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAllAdmins, useGetGlobalLogs } from "@/hooks/superAdminHooks";
import { adminLogCategoryMeta, cn, formatRelativeTime, shortUserAgent } from "@/lib/utils";
import { AdminLog } from "@/types";

const CATEGORIES = Object.keys(adminLogCategoryMeta);

const Toggle = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition",
      active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "hover:bg-muted"
    )}
  >
    <span>{children}</span>
    {active && <Check className="size-4" />}
  </button>
);

export const Logs = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 350);
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const [categories, setCategories] = useState<string[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [activeLog, setActiveLog] = useState<AdminLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: adminsData } = useGetAllAdmins({});
  const allAdmins = adminsData?.pages.flatMap((p: any) => p.rows) ?? [];

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      startDate: range.from,
      endDate: range.to,
      category: categories.length ? categories : undefined,
      adminIds: adminIds.length ? adminIds : undefined,
    }),
    [debouncedSearch, range, categories, adminIds]
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useGetGlobalLogs(filters);

  const allLogs: AdminLog[] = data?.pages.flatMap((p: any) => p.logs) ?? [];

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleCategory = (cat: string) =>
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  const toggleAdmin = (id: string) =>
    setAdminIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="title-text">Журнал действий</h2>
          <p className="subtitle-text">Все действия администраторов в одном месте</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по action / details / id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Категории
              {categories.length > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">
                  {categories.length}
                </span>
              )}
              <ChevronDown className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            {CATEGORIES.map((cat) => {
              const meta = adminLogCategoryMeta[cat];
              return (
                <Toggle key={cat} active={categories.includes(cat)} onClick={() => toggleCategory(cat)}>
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                </Toggle>
              );
            })}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Админы
              {adminIds.length > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">
                  {adminIds.length}
                </span>
              )}
              <ChevronDown className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-1 max-h-80 overflow-auto">
            {allAdmins.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">Список пуст</p>
            ) : (
              allAdmins.map((a: any) => (
                <Toggle key={a.id} active={adminIds.includes(a.id)} onClick={() => toggleAdmin(a.id)}>
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">
                      {a.firstName} {a.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.email}</span>
                  </span>
                </Toggle>
              ))
            )}
          </PopoverContent>
        </Popover>

        {(categories.length || adminIds.length) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategories([]);
              setAdminIds([]);
            }}
            className="gap-1 text-muted-foreground"
          >
            <X className="size-3.5" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {(categories.length > 0 || adminIds.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={cn(adminLogCategoryMeta[c].pill, "cursor-pointer")}
            >
              <span className={cn("size-1.5 rounded-full", adminLogCategoryMeta[c].dot)} />
              {adminLogCategoryMeta[c].label}
              <X className="size-3" />
            </button>
          ))}
          {adminIds.map((id) => {
            const a = allAdmins.find((x: any) => x.id === id);
            if (!a) return null;
            return (
              <button key={id} onClick={() => toggleAdmin(id)} className="pill-violet cursor-pointer">
                {a.firstName} {a.lastName}
                <X className="size-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Когда</TableHead>
              <TableHead className="w-[180px]">Админ</TableHead>
              <TableHead className="w-[140px]">Категория</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead className="w-[120px]">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-muted-foreground">Не удалось загрузить логи.</span>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Повторить
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : allLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="Логи не найдены"
                    description="Попробуйте ослабить фильтры или сменить диапазон дат."
                    action={{
                      label: "Сбросить фильтры",
                      onClick: () => {
                        setCategories([]);
                        setAdminIds([]);
                        setSearch("");
                        setRange({ preset: "month" });
                      },
                    }}
                    className="border-0 bg-transparent"
                  />
                </TableCell>
              </TableRow>
            ) : (
              allLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setActiveLog(log);
                    setDrawerOpen(true);
                  }}
                >
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(log.timestamp)}</span>
                  </TableCell>
                  <TableCell className="font-medium truncate">{log.adminName}</TableCell>
                  <TableCell>
                    <CategoryBadge category={log.category} />
                  </TableCell>
                  <TableCell className="truncate" title={log.action}>
                    {log.action}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {log.relatedEntityType ? (
                      <EntityLink type={log.relatedEntityType} id={log.relatedEntityId} snapshot={log.entitySnapshot} />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress ?? "—"}</TableCell>
                </TableRow>
              ))
            )}

            {hasNextPage && (
              <TableRow>
                <TableCell colSpan={6} ref={ref} className="text-center text-xs text-muted-foreground py-3">
                  {isFetchingNextPage ? "Загрузка..." : "Прокрутите для загрузки"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <LogDetailsDrawer log={activeLog} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

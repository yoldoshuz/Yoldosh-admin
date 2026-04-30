"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ExternalLink, Search, Ticket, X } from "lucide-react";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";

import { DateRangePicker, DateRangeValue, rangeToQuery } from "@/components/shared/DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChangeBookingStatus, useGetBookings } from "@/hooks/adminHooks";
import { useGetSuperAdminBookings } from "@/hooks/superAdminHooks";
import {
  BookingStatus,
  BookingStatusKey,
  bookingStatusLabels,
  cn,
  formatDate,
  formatMoney,
  getStatusColor,
} from "@/lib/utils";
import { Booking } from "@/types";

type StatusFilter = BookingStatusKey | "ALL";
type DateField = "createdAt" | "departure_ts";

const SORTABLE: { value: string; label: string }[] = [
  { value: "createdAt", label: "Создано" },
  { value: "departure_ts", label: "Отправление" },
  { value: "totalPrice", label: "Сумма" },
  { value: "seatsBooked", label: "Места" },
  { value: "status", label: "Статус" },
];

interface Props {
  basePath: "admin" | "super-admin";
  /** Show "Bookings" header? Default true; set false when embedded inside another page. */
  withHeader?: boolean;
}

export const BookingsList = ({ basePath, withHeader = true }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounceValue(searchTerm, 400);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<{ sortBy: string; sortOrder: "ASC" | "DESC" }>({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const [dateField, setDateField] = useState<DateField>("createdAt");

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: activeStatus === "ALL" ? undefined : activeStatus,
      sortBy: sort.sortBy as any,
      sortOrder: sort.sortOrder,
      dateField,
      ...rangeToQuery(range),
    }),
    [debouncedSearch, activeStatus, sort.sortBy, sort.sortOrder, dateField, range]
  );

  const useBookings = basePath === "super-admin" ? useGetSuperAdminBookings : useGetBookings;
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBookings(filters);

  const { mutate: changeStatus, isPending: isChanging } = useChangeBookingStatus();

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allBookings: Booking[] = data?.pages.flatMap((p: any) => p.bookings) ?? [];
  const totalCount: number | undefined = data?.pages?.[0]?.total;

  const handleCancel = (b: Booking) => {
    if (!window.confirm(`Отменить бронирование ${b.id.slice(0, 8)}…?`)) return;
    changeStatus({ bookingId: b.id, status: "CANCELLED" });
  };

  return (
    <div className="flex flex-col gap-4">
      {withHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="title-text flex items-center gap-2">
              <Ticket className="size-6 text-emerald-500" />
              Бронирования
            </h2>
            <p className="subtitle-text">
              {totalCount != null ? <span className="font-medium">{totalCount}</span> : "—"} всего
            </p>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      )}

      {/* Status tabs */}
      <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as StatusFilter)}>
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="ALL" className="text-xs sm:text-sm">
            Все
          </TabsTrigger>
          {(Object.values(BookingStatus) as BookingStatusKey[]).map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs sm:text-sm">
              {bookingStatusLabels[s]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder="Поиск по ID, имени, телефону, городу…"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Select value={dateField} onValueChange={(v) => setDateField(v as DateField)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">По дате создания</SelectItem>
            <SelectItem value="departure_ts">По дате отправления</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort.sortBy} onValueChange={(v) => setSort((s) => ({ ...s, sortBy: v }))}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTABLE.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSort((s) => ({ ...s, sortOrder: s.sortOrder === "ASC" ? "DESC" : "ASC" }))}
          title={sort.sortOrder === "ASC" ? "По возрастанию" : "По убыванию"}
        >
          <ArrowUpDown className={cn("size-4 transition", sort.sortOrder === "DESC" ? "rotate-180" : "")} />
        </Button>
      </div>

      {/* Table — desktop */}
      <div className="bg-card hidden overflow-hidden rounded-2xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Пассажир</th>
              <th className="px-4 py-3 text-left">Маршрут</th>
              <th className="px-4 py-3 text-left">Водитель</th>
              <th className="px-4 py-3 text-right">Места</th>
              <th className="px-4 py-3 text-right">Сумма</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left">Отправление</th>
              <th className="px-4 py-3 text-left">Создано</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td colSpan={9} className="p-3">
                    <Skeleton className="h-9 w-full" />
                  </td>
                </tr>
              ))
            ) : allBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted-foreground p-8 text-center">
                  Бронирования не найдены
                </td>
              </tr>
            ) : (
              allBookings.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 border-t transition">
                  <td className="px-4 py-3">
                    {b.passenger ? (
                      <Link
                        href={`/${basePath}/users-search/${b.passenger.id}`}
                        className="text-foreground font-medium hover:underline"
                      >
                        {b.passenger.firstName} {b.passenger.lastName}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <p className="text-muted-foreground text-xs">{b.passenger?.phoneNumber ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {b.from_city} → {b.to_city}
                    </p>
                    {(b.from_address || b.to_address) && (
                      <p className="text-muted-foreground line-clamp-1 max-w-[260px] text-xs">
                        {b.from_address} – {b.to_address}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.trip?.driver ? (
                      <Link
                        href={`/${basePath}/users-search/${b.trip.driver.id}`}
                        className="font-medium hover:underline"
                      >
                        {b.trip.driver.firstName} {b.trip.driver.lastName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.seatsBooked}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(b.totalPrice))}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("border-0", getStatusColor(b.status))}>
                      {bookingStatusLabels[b.status as BookingStatusKey] ?? b.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {b.trip?.departure_ts ? formatDate(b.trip.departure_ts) : "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {formatDate(b.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${basePath}/bookings/${b.id}`} className="gap-1">
                          <ExternalLink className="size-3.5" />
                          <span className="hidden lg:inline">Открыть</span>
                        </Link>
                      </Button>
                      {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                          onClick={() => handleCancel(b)}
                          disabled={isChanging}
                        >
                          Отменить
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-2 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : allBookings.length === 0 ? (
          <p className="bg-card text-muted-foreground rounded-2xl border p-6 text-center text-sm">
            Бронирования не найдены
          </p>
        ) : (
          allBookings.map((b) => (
            <Link
              key={b.id}
              href={`/${basePath}/bookings/${b.id}`}
              className="group bg-card hover:bg-muted/30 rounded-2xl border p-3 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {b.from_city} → {b.to_city}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {b.passenger?.firstName} {b.passenger?.lastName} · {b.passenger?.phoneNumber}
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 border-0", getStatusColor(b.status))}>
                  {bookingStatusLabels[b.status as BookingStatusKey] ?? b.status}
                </Badge>
              </div>
              <div className="text-muted-foreground mt-2 grid grid-cols-3 gap-2 text-xs">
                <span>
                  <span className="block text-[10px] tracking-wider uppercase">Места</span>
                  <span className="text-foreground tabular-nums">{b.seatsBooked}</span>
                </span>
                <span>
                  <span className="block text-[10px] tracking-wider uppercase">Сумма</span>
                  <span className="text-foreground tabular-nums">{formatMoney(Number(b.totalPrice))}</span>
                </span>
                <span>
                  <span className="block text-[10px] tracking-wider uppercase">Создано</span>
                  <span className="text-foreground">{formatDate(b.createdAt)}</span>
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Infinite-scroll trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex h-12 items-center justify-center">
          {isFetchingNextPage && <Skeleton className="h-8 w-32" />}
        </div>
      )}
    </div>
  );
};

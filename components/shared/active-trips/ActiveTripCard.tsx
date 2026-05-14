"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Car as CarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  MapPin,
  Phone,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBasePath } from "@/hooks/useBasePath";
import { formatDate, formatNumber, getStatusColor } from "@/lib/utils";
import { ActiveTripCard as ActiveTripCardType } from "@/types";

const StatusPill = ({ status }: { status: ActiveTripCardType["status"] }) => (
  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(status)}`}>{status}</span>
);

const BookingTypePill = ({ value }: { value: ActiveTripCardType["bookingType"] }) => (
  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
    {value === "INSTANT" ? "Мгновенное" : "По запросу"}
  </span>
);

export const ActiveTripCard = ({ trip }: { trip: ActiveTripCardType }) => {
  const base = useBasePath();
  const [open, setOpen] = useState(false);
  const fill = Math.max(0, Math.min(100, Number(trip.seats?.fillRatePercent ?? 0)));

  const fromLabel = trip.route?.from?.city || trip.route?.from?.address || "—";
  const toLabel = trip.route?.to?.city || trip.route?.to?.address || "—";

  return (
    <Card className="component shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${base}/trips/${trip.id}`}
            className="link-text inline-flex items-center gap-1.5 font-mono text-sm"
          >
            <CarIcon className="size-3.5" />#{trip.id.substring(0, 6)}
          </Link>
          <StatusPill status={trip.status} />
          <BookingTypePill value={trip.bookingType} />
          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
            <Calendar className="size-3" /> Отправление: {formatDate(trip.schedule.departureTs)}
          </span>
          {trip.status === "IN_PROGRESS" && trip.schedule.tripStartTs && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
              <Clock className="size-3" /> Старт: {formatDate(trip.schedule.tripStartTs)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="inline-flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px]">Откуда</p>
              <p className="truncate font-medium">{fromLabel}</p>
              {trip.route?.from?.address && trip.route.from.address !== fromLabel && (
                <p className="text-muted-foreground truncate text-[11px]">{trip.route.from.address}</p>
              )}
            </div>
          </div>
          <div className="inline-flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 text-red-500" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px]">Куда</p>
              <p className="truncate font-medium">{toLabel}</p>
              {trip.route?.to?.address && trip.route.to.address !== toLabel && (
                <p className="text-muted-foreground truncate text-[11px]">{trip.route.to.address}</p>
              )}
            </div>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-muted-foreground text-[10px]">Цена / место</p>
            <p className="text-base font-bold tabular-nums">
              {formatNumber(Number(trip.pricing?.pricePerPerson ?? 0))} UZS
            </p>
            <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-[11px]">
              <Coins className="size-3" /> В обороте:{" "}
              <span className="text-foreground tabular-nums">
                {formatNumber(Number(trip.pricing?.bookingsRevenue ?? 0))}
              </span>
            </p>
          </div>
        </div>

        {/* Seats */}
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Users className="size-3.5" /> Загрузка мест
            </span>
            <span className="tabular-nums">
              {trip.seats?.booked ?? 0} из {trip.seats?.total ?? 0} · {fill.toFixed(0)}%
            </span>
          </div>
          <Progress value={fill} />
        </div>

        {/* Driver + Car */}
        <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2">
          {trip.driver ? (
            <Link
              href={`/${base}/users-search/${trip.driver.id}`}
              className="link-text flex min-w-0 items-center gap-3"
            >
              <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {(trip.driver.firstName?.[0] ?? "?") + (trip.driver.lastName?.[0] ?? "")}
              </span>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px]">Водитель</p>
                <p className="truncate text-sm font-semibold">
                  {trip.driver.firstName} {trip.driver.lastName}
                </p>
                <p className="text-muted-foreground inline-flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" /> {trip.driver.phoneNumber}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 text-amber-500" /> {Number(trip.driver.rating ?? 0).toFixed(1)}
                  </span>
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-muted-foreground text-xs">Водитель не указан</p>
          )}

          {trip.car ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                <CarIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px]">Автомобиль</p>
                <p className="truncate text-sm font-semibold">
                  {trip.car.make} {trip.car.model}
                  {trip.car.color ? `, ${trip.car.color}` : ""}
                </p>
                {trip.car.govNumber && (
                  <p className="text-muted-foreground font-mono text-[11px]">{trip.car.govNumber}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Машина не привязана</p>
          )}
        </div>

        {/* Bookings */}
        <div className="border-t pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Бронирования</span>
              <span className="pill-emerald">CONFIRMED · {trip.bookings?.confirmed ?? 0}</span>
              {(trip.bookings?.pending ?? 0) > 0 && (
                <span className="pill-amber">PENDING · {trip.bookings.pending}</span>
              )}
              <span className="text-muted-foreground text-[11px] tabular-nums">всего {trip.bookings?.total ?? 0}</span>
            </div>
            {trip.bookings?.list?.length > 0 && (
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen((v) => !v)}>
                {open ? (
                  <>
                    Свернуть <ChevronUp className="ml-1 size-3" />
                  </>
                ) : (
                  <>
                    Показать пассажиров <ChevronDown className="ml-1 size-3" />
                  </>
                )}
              </Button>
            )}
          </div>

          {open && (
            <ul className="mt-3 space-y-2">
              {trip.bookings.list.map((b) => (
                <li
                  key={b.id}
                  className="bg-card flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  {b.passenger ? (
                    <Link
                      href={`/${base}/users-search/${b.passenger.id}`}
                      className="link-text flex min-w-0 items-center gap-2"
                    >
                      <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                        {(b.passenger.firstName?.[0] ?? "?") + (b.passenger.lastName?.[0] ?? "")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {b.passenger.firstName} {b.passenger.lastName}
                        </p>
                        <p className="text-muted-foreground text-[11px]">{b.passenger.phoneNumber}</p>
                      </div>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-xs">Пассажир неизвестен</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                    <Users className="size-3" /> {b.seatsBooked} мест
                  </span>
                  <span className="ml-auto text-sm font-semibold tabular-nums">
                    {formatNumber(Number(b.totalPrice))} UZS
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {trip.comment && <p className="text-muted-foreground border-t pt-3 text-xs italic">«{trip.comment}»</p>}
      </CardContent>
    </Card>
  );
};

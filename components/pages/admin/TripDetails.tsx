"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  AirVent,
  ArrowRight,
  Banknote,
  Calendar,
  Car as CarIcon,
  ChevronLeft,
  Cigarette,
  Clock,
  DoorOpen,
  ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Route as RouteIcon,
  Star,
  User as UserIcon,
  Users,
  Utensils,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useChangeBookingStatus, useChangeTripStatus, useGetTripDetails } from "@/hooks/adminHooks";
import { useBasePath } from "@/hooks/useBasePath";
import { formatDocUrl, getStatusColor, isRealImagePath } from "@/lib/utils";

const formatDateSafe = (date?: string | null) => {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd.MM.yyyy HH:mm");
  } catch {
    return "—";
  }
};

const formatMoney = (n: number | string | null | undefined) => {
  if (n == null) return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return `${v.toLocaleString("ru-RU")} UZS`;
};

/* ---------------------------- KV row helper --------------------------- */
const KV = ({
  icon,
  label,
  value,
  className = "",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex items-start justify-between gap-3 py-1.5 text-sm ${className}`}>
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {icon}
      {label}
    </span>
    <span className="text-right break-all">{value || "—"}</span>
  </div>
);

const FeaturePill = ({ on, icon, label }: { on?: boolean; icon: React.ReactNode; label: string }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
      on
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        : "bg-muted text-muted-foreground"
    }`}
  >
    {icon}
    {label}
  </span>
);

const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const MapPreview = ({
  lat,
  lon,
  label,
}: {
  lat: number | string | null | undefined;
  lon: number | string | null | undefined;
  label: string;
}) => {
  const lt = toNum(lat);
  const ln = toNum(lon);
  if (lt == null || ln == null) {
    return (
      <div className="bg-muted/40 text-muted-foreground flex h-32 w-full items-center justify-center rounded-lg border border-dashed text-[11px]">
        Координаты не заданы
      </div>
    );
  }
  // Yandex Maps embeds use `ll=lon,lat`. `pt=lon,lat,pm2rdm` places a red placemark.
  const embedUrl = `https://yandex.com/map-widget/v1/?ll=${ln}%2C${lt}&z=14&pt=${ln}%2C${lt}%2Cpm2rdm&l=map`;
  const externalUrl = `https://yandex.com/maps/?ll=${ln}%2C${lt}&z=15&pt=${ln}%2C${lt}%2Cpm2rdm`;
  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Открыть «${label}» в Яндекс.Картах`}
      className="group relative block h-40 w-full overflow-hidden rounded-lg border transition hover:border-emerald-500"
    >
      <iframe
        src={embedUrl}
        title={label}
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-800 shadow-sm transition group-hover:bg-white dark:bg-slate-900/90 dark:text-slate-100">
        <MapPin className="size-3" /> Открыть в Яндекс.Картах
      </span>
    </a>
  );
};

const TechPassportThumb = ({ src, label }: { src?: string | null; label: string }) => {
  if (!isRealImagePath(src)) {
    return (
      <div className="bg-muted/40 text-muted-foreground flex h-28 flex-col items-center justify-center rounded-lg border border-dashed text-[11px]">
        <ImageIcon className="mb-1 h-4 w-4" />
        {label} — нет фото
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative h-28 w-full overflow-hidden rounded-lg border transition hover:border-emerald-500"
          aria-label={label}
        >
          <Image
            src={formatDocUrl(src)}
            alt={label}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-cover transition group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-left text-[10px] font-medium tracking-wide text-white uppercase">
            {label}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <Image
          src={formatDocUrl(src)}
          alt={label}
          className="max-h-[85vh] w-full rounded-lg object-contain"
          width={2048}
          height={2048}
        />
      </DialogContent>
    </Dialog>
  );
};

export const TripDetails = ({ tripId }: { tripId: string }) => {
  const base = useBasePath();
  const { data, isLoading, isError } = useGetTripDetails(tripId);
  const changeBookingStatus = useChangeBookingStatus();
  const changeTripStatus = useChangeTripStatus();
  const [showAllBookings, setShowAllBookings] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !data?.trip) {
    return <div className="text-muted-foreground py-12 text-center">Не удалось загрузить данные о поездке</div>;
  }

  const trip = data.trip;
  const { driver, car } = trip;
  const bookings: any[] = trip.bookings ?? [];
  const visibleBookings = showAllBookings ? bookings : bookings.slice(0, 4);
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-2 sm:p-6">
      {/* Back link + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/${base}/trips`} className="flex items-center gap-2 text-sm text-emerald-500 hover:underline">
          <ChevronLeft className="size-4" />
          <span>Назад к поездкам</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusColor(trip.status)}`}>
            {trip.status}
          </span>
          {trip.status !== "CANCELED" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!confirm("Отменить поездку?")) return;
                changeTripStatus.mutate({ tripId: trip.id, status: "CANCELED" });
              }}
              disabled={changeTripStatus.isPending}
            >
              Отменить поездку
            </Button>
          ) : (
            <Button variant="destructive" size="sm" disabled>
              Отменено
            </Button>
          )}
        </div>
      </div>

      {/* ============================ HEADER CARD ============================ */}
      <Card className="component shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground font-mono text-[10px] uppercase">Поездка</p>
              <h1 className="font-mono text-base font-semibold break-all">{trip.id}</h1>
              <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
                <Calendar className="size-3" /> {formatDateSafe(trip.departure_ts)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-muted-foreground text-[10px] uppercase">Цена за место</p>
              <p className="text-2xl font-bold">{formatMoney(trip.price_per_person)}</p>
            </div>
          </div>

          {/* Route timeline */}
          <div className="bg-muted/30 grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[10px] uppercase">Откуда</p>
                  <p className="text-sm font-medium break-words">{trip.from_address || trip.from_city || "—"}</p>
                  {(trip.from_latitude != null || trip.from_longitude != null) && (
                    <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                      {trip.from_latitude ?? "—"}, {trip.from_longitude ?? "—"}
                    </p>
                  )}
                </div>
              </div>
              <MapPreview lat={trip.from_latitude} lon={trip.from_longitude} label="Откуда" />
            </div>
            <ArrowRight className="text-muted-foreground hidden self-center md:block" />
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[10px] uppercase">Куда</p>
                  <p className="text-sm font-medium break-words">{trip.to_address || trip.to_city || "—"}</p>
                  {(trip.to_latitude != null || trip.to_longitude != null) && (
                    <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                      {trip.to_latitude ?? "—"}, {trip.to_longitude ?? "—"}
                    </p>
                  )}
                </div>
              </div>
              <MapPreview lat={trip.to_latitude} lon={trip.to_longitude} label="Куда" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat icon={<Users className="size-3.5" />} label="Свободно мест" value={trip.seats_available} />
            <Stat icon={<Clock className="size-3.5" />} label="Длительность" value={trip.duration ?? "—"} />
            <Stat icon={<RouteIcon className="size-3.5" />} label="Расстояние" value={trip.distance ?? "—"} />
            <Stat
              icon={<Banknote className="size-3.5" />}
              label="Всего бронирований"
              value={`${bookings.length} (${confirmedCount} ок · ${cancelledCount} отм.)`}
            />
          </div>

          {/* Features */}
          <div className="flex flex-wrap items-center gap-1.5">
            <FeaturePill on={trip.max_two_back} icon={<UserIcon className="size-3" />} label="Макс. 2 сзади" />
            <FeaturePill on={trip.conditioner} icon={<AirVent className="size-3" />} label="Кондиц." />
            <FeaturePill on={trip.smoking_allowed} icon={<Cigarette className="size-3" />} label="Курение" />
            <FeaturePill on={trip.door_pickup} icon={<DoorOpen className="size-3" />} label="Посадка у двери" />
            <FeaturePill on={trip.food_stop} icon={<Utensils className="size-3" />} label="Останов. на еду" />
            {trip.garage && <FeaturePill on icon={<Warehouse className="size-3" />} label={`Гараж: ${trip.garage}`} />}
          </div>

          {trip.comment && (
            <div className="bg-muted/40 flex items-start gap-2 rounded-lg p-3 text-sm">
              <MessageSquare className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <p>{trip.comment}</p>
            </div>
          )}

          <div className="text-muted-foreground grid grid-cols-2 gap-2 border-t pt-2 text-[11px] sm:grid-cols-4">
            <span>Создано: {formatDateSafe(trip.createdAt)}</span>
            <span>Начало маршр.: {formatDateSafe(trip.trip_start_ts)}</span>
            <span>Конец маршр.: {formatDateSafe(trip.trip_end_ts)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ============================ DRIVER + CAR ============================ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Driver */}
        <Card className="component shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Водитель</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/${base}/users-search/${trip.driver?.id}`} className="group flex items-center gap-3">
              {isRealImagePath(driver?.avatar) ? (
                <Image
                  src={formatDocUrl(driver.avatar)}
                  alt={`${driver.firstName ?? ""}`}
                  width={56}
                  height={56}
                  className="size-14 rounded-full border object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full border">
                  <UserIcon className="size-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="link-text truncate font-semibold group-hover:underline">
                  {driver?.lastName} {driver?.firstName}
                </p>
                {driver?.phoneNumber && (
                  <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Phone className="size-3" /> {driver.phoneNumber}
                  </p>
                )}
                <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <Star className="size-3 text-amber-500" /> {driver?.rating ?? "—"}
                </p>
              </div>
            </Link>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <FeaturePill on={driver?.smoking_allowed} icon={<Cigarette className="size-3" />} label="Курение" />
              <FeaturePill on={driver?.pets_allowed} icon={<UserIcon className="size-3" />} label="Питомцы" />
              <FeaturePill on={driver?.music_allowed} icon={<UserIcon className="size-3" />} label="Музыка" />
              <FeaturePill on={driver?.talkative} icon={<MessageSquare className="size-3" />} label="Общит." />
            </div>
          </CardContent>
        </Card>

        {/* Car */}
        {car ? (
          <Card className="component shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-1.5">
                  <CarIcon className="size-4" /> Автомобиль
                </span>
                {car.govNumber && (
                  <span className="bg-background rounded-md border px-2 py-0.5 font-mono text-xs">{car.govNumber}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
                <KV label="Марка" value={car.make} />
                <KV label="Модель" value={car.model} />
                <KV label="Цвет" value={car.color} />
                <KV label="Мест" value={car.seats} />
                <KV label="Серия т.п." value={car.techPassportSerial} />
                <KV label="Выдан" value={car.issueDate} />
                <KV label="PINFL вод." value={car.licensePinfl} />
                <KV label="Категория" value={car.typeOfLicence} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <TechPassportThumb src={car.licenseFrontPath} label="Вод. удост." />
                <TechPassportThumb src={car.techPassportFrontPath} label="Тех. паспорт — лицо" />
                <TechPassportThumb src={car.techPassportBackPath} label="Тех. паспорт — оборот" />
              </div>
              {car.rejectionReason && (
                <p className="rounded-md bg-red-100/40 p-2 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  Отказ: {car.rejectionReason}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="component shadow-none">
            <CardContent className="text-muted-foreground p-6 text-center text-sm">
              Автомобиль не привязан к поездке
            </CardContent>
          </Card>
        )}
      </div>

      {/* ============================ BOOKINGS ============================ */}
      <Card className="component shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Бронирования</CardTitle>
          <span className="text-muted-foreground text-xs">{bookings.length}</span>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Нет бронирований</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {visibleBookings.map((b) => (
                  <div key={b.id} className="component-dark space-y-2 rounded-xl border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/${base}/users-search/${b.passenger?.id}`}
                        className="group inline-flex min-w-0 items-center gap-2"
                      >
                        {isRealImagePath(b.passenger?.avatar) ? (
                          <Image
                            src={formatDocUrl(b.passenger.avatar)}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 shrink-0 rounded-full border object-cover"
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border">
                            <UserIcon className="size-4" />
                          </div>
                        )}
                        <span className="link-text truncate font-medium group-hover:underline">
                          {b.passenger?.lastName} {b.passenger?.firstName}
                        </span>
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground grid grid-cols-3 gap-1 text-[11px]">
                      <span>⭐ {b.passenger?.rating ?? "—"}</span>
                      <span>Мест: {b.seatsBooked}</span>
                      <span className="text-right">{formatMoney(trip.price_per_person)}</span>
                    </div>
                    {b.status !== "CANCELLED" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (!confirm("Отменить бронирование?")) return;
                          changeBookingStatus.mutate({ bookingId: b.id, status: "CANCELLED" });
                        }}
                        disabled={changeBookingStatus.isPending}
                      >
                        Отменить
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {bookings.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllBookings((v) => !v)}
                  className="text-muted-foreground mt-3 w-full text-center text-xs hover:underline"
                >
                  {showAllBookings ? "Скрыть" : `Показать все (${bookings.length})`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="bg-muted/30 rounded-lg border p-2">
    <p className="text-muted-foreground inline-flex items-center gap-1 text-[10px] uppercase">
      {icon}
      {label}
    </p>
    <p className="mt-0.5 text-sm font-semibold">{value ?? "—"}</p>
  </div>
);

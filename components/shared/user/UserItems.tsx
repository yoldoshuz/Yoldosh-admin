"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Car as CarIcon, IdCard, ImageIcon, MapPin, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBasePath } from "@/hooks/useBasePath";
import { formatDate, formatDocUrl, getStatusColor, isRealImagePath } from "@/lib/utils";

export const InfoItem = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode | null | undefined;
  valueClassName?: string;
}) => {
  const renderValue = () => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Да" : "Нет";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return value;
  };

  return (
    <div className="flex items-start gap-3">
      {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className={`text-sm font-medium break-all ${valueClassName || ""}`}>{renderValue()}</p>
      </div>
    </div>
  );
};

/* ----------------------- Photo thumb (clickable) ---------------------- */
export const PhotoThumb = ({
  src,
  label,
  ratio = "aspect-[4/3]",
  empty,
}: {
  src?: string | null;
  label: string;
  ratio?: string;
  empty?: string;
}) => {
  if (!isRealImagePath(src)) {
    return (
      <div
        className={`bg-muted/40 text-muted-foreground flex w-full flex-col items-center justify-center rounded-lg border border-dashed text-[10px] ${ratio}`}
      >
        <ImageIcon className="mb-1 h-4 w-4" />
        <span className="px-2 text-center">{empty || "Нет фото"}</span>
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`group relative w-full overflow-hidden rounded-lg border transition hover:border-emerald-500 ${ratio}`}
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

const KV = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-2 text-[11.5px]">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-foreground text-right ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
  </div>
);

/* ============================ DriverLicenseCard ============================ */
export const DriverLicenseCard = ({
  licenseFrontPath,
  licensePinfl,
  typeOfLicence,
  applicationStatus,
}: {
  licenseFrontPath?: string | null;
  licensePinfl?: string | null;
  typeOfLicence?: string | null;
  applicationStatus?: string | null;
}) => (
  <Card className="component shadow-none">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5">
          <IdCard className="size-4" /> Водительское удостоверение
        </span>
        {applicationStatus && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${getStatusColor(applicationStatus)}`}>
            {applicationStatus}
          </span>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
      <PhotoThumb src={licenseFrontPath} label="Вод. удостоверение" empty="Нет фото прав" />
      <div className="grid grid-cols-1 gap-y-1 self-start text-sm">
        <KV label="PINFL" value={licensePinfl} mono />
        <KV label="Категория" value={typeOfLicence} />
      </div>
    </CardContent>
  </Card>
);

/* =============================== TripCard =============================== */
export const TripCard = ({ trip }: { trip: any }) => {
  const base = useBasePath();
  const bookings: any[] = Array.isArray(trip?.bookings) ? trip.bookings : [];
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const revenue = bookings.filter((b) => b.status === "CONFIRMED").reduce((s, b) => s + Number(b.totalPrice ?? 0), 0);

  return (
    <Card className="component shadow-none">
      <CardHeader className="pb-2">
        <Link href={`/${base}/trips/${trip.id}`} className="link-text flex items-center justify-between">
          <CardTitle className="inline-flex items-center gap-1.5 font-mono text-sm">
            <CarIcon className="size-3.5" /> #{trip.id.substring(0, 6)}
          </CardTitle>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(trip.status)}`}>
            {trip.status}
          </span>
        </Link>
        <p className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
          <Calendar className="size-3" /> {formatDate(trip.departure_ts)}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="inline-flex items-start gap-1.5 text-xs">
          <MapPin className="mt-0.5 size-3 text-emerald-500" />
          <div>
            <p className="text-muted-foreground text-[10px]">Откуда</p>
            <p>{trip.from_address || trip.from_city || "—"}</p>
          </div>
        </div>
        <div className="inline-flex items-start gap-1.5 text-xs">
          <MapPin className="mt-0.5 size-3 text-red-500" />
          <div>
            <p className="text-muted-foreground text-[10px]">Куда</p>
            <p>{trip.to_address || trip.to_city || "—"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[10px]">Цена</p>
          <p className="text-sm font-bold">{parseFloat(trip.price_per_person).toLocaleString("ru-RU")} UZS</p>
        </div>
      </CardContent>
      {bookings.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t px-6 pt-3 text-[11px]">
          <Users className="text-muted-foreground size-3" />
          <span className="pill-emerald">CONFIRMED · {confirmedCount}</span>
          {pendingCount > 0 && <span className="pill-amber">PENDING · {pendingCount}</span>}
          {revenue > 0 && (
            <span className="text-muted-foreground ml-auto tabular-nums">
              В обороте: <span className="text-foreground">{revenue.toLocaleString("ru-RU")} UZS</span>
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

/* ============================= BookingCard ============================= */
export const BookingCard = ({ booking }: { booking: any }) => {
  const base = useBasePath();
  const tripId = booking.tripId ?? booking.trip?.id;
  return (
    <Card className="component shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {tripId ? (
            <Link href={`/${base}/trips/${tripId}`} className="link-text inline-flex items-center gap-1.5">
              <CardTitle className="font-mono text-sm">Бронь #{booking.id.substring(0, 6)}</CardTitle>
            </Link>
          ) : (
            <CardTitle className="font-mono text-sm">Бронь #{booking.id.substring(0, 6)}</CardTitle>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>
        <p className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
          <Calendar className="size-3" /> {formatDate(booking.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <InfoItem label="Цена" value={`${parseFloat(booking.totalPrice).toLocaleString("ru-RU")} UZS`} />
        <InfoItem icon={<Users className="size-3.5" />} label="Мест" value={booking.seatsBooked} />
        {booking.cancellationReason && <InfoItem label="Причина отмены" value={booking.cancellationReason} />}
      </CardContent>
    </Card>
  );
};

/* ================================ CarCard ============================== */
export const CarCard = ({ car }: { car: any }) => (
  <Card className="component shadow-none">
    <CardHeader className="pb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <CarIcon className="size-4" />
          <span>
            {car.make || "—"} {car.model || ""}
          </span>
          {car.govNumber && (
            <span className="bg-background rounded-md border px-2 py-0.5 font-mono text-xs">{car.govNumber}</span>
          )}
        </CardTitle>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(car.status)}`}>
          {car.status}
        </span>
      </div>
      <p className="text-muted-foreground font-mono text-[10px]">{car.id}</p>
    </CardHeader>

    <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
      {/* Photos: license + tech passport (front/back) */}
      <div className="grid grid-cols-3 gap-2">
        <PhotoThumb src={car.licenseFrontPath} label="Вод. удост." empty="Нет прав" />
        <PhotoThumb src={car.techPassportFrontPath} label="Тех. паспорт — лицо" />
        <PhotoThumb src={car.techPassportBackPath} label="Тех. паспорт — оборот" />
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 self-start text-sm">
        <KV label="Цвет" value={car.color} />
        <KV label="Мест" value={car.seats} />
        <KV label="Серия т.п." value={car.techPassportSerial} mono />
        <KV label="Выдан" value={car.issueDate} />
        <KV label="PINFL вод." value={car.licensePinfl} mono />
        <KV label="Категория" value={car.typeOfLicence} />
        <KV label="Создан" value={formatDate(car.createdAt)} />
        {car.rejectionReason && <KV label="Отказ" value={car.rejectionReason} />}
      </div>
    </CardContent>
  </Card>
);

/* =============================== ReportCard ============================= */
export const ReportCard = ({ report }: { report: any }) => (
  <Card className="component shadow-none">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="font-mono text-sm">
          Жалоба <span className="text-muted-foreground">#{report.id?.substring?.(0, 8) ?? report.id}</span>
        </CardTitle>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(report.status)}`}>
          {report.status}
        </span>
      </div>
      <p className="text-muted-foreground text-[11px]">
        От: {report.reportingUser?.firstName || "N/A"} · {formatDate(report.createdAt)}
      </p>
    </CardHeader>
    <CardContent className="grid gap-1 text-sm">
      <InfoItem label="Причина" value={report.reason} />
      {report.tripId && <InfoItem label="ID поездки" value={report.tripId} />}
    </CardContent>
  </Card>
);

/* =========================== UserDetailsSkeleton ========================= */
export const UserDetailsSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-1 h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <Skeleton className="h-24 w-full" />
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

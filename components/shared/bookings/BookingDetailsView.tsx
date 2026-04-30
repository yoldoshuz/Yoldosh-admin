"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CarFront,
  CircleDollarSign,
  Hash,
  MapPin,
  PhoneCall,
  Ticket,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeBookingStatus, useGetBookingDetails } from "@/hooks/adminHooks";
import { useGetSuperAdminBookingDetails } from "@/hooks/superAdminHooks";
import {
  BookingStatusKey,
  bookingStatusLabels,
  cn,
  formatDate,
  formatMoney,
  getStatusColor,
  RegistrationSourceKey,
  registrationSourceShortLabels,
} from "@/lib/utils";

interface Props {
  bookingId: string;
  basePath: "admin" | "super-admin";
}

const InfoRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-2.5">
    <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground text-[11px] tracking-wider uppercase">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  </div>
);

const SourceBadge = ({ source }: { source?: string | null }) => {
  if (!source) return null;
  const label = registrationSourceShortLabels[source as RegistrationSourceKey] ?? source;
  return (
    <span className="bg-muted text-muted-foreground ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] tracking-wider uppercase">
      {label}
    </span>
  );
};

export const BookingDetailsView = ({ bookingId, basePath }: Props) => {
  const useDetails = basePath === "super-admin" ? useGetSuperAdminBookingDetails : useGetBookingDetails;
  const { data, isLoading, isError } = useDetails(bookingId);
  const { mutate: changeStatus, isPending: isChanging } = useChangeBookingStatus();

  const booking = data?.booking ?? data;

  const handleCancel = () => {
    if (!booking) return;
    if (!window.confirm("Отменить бронирование?")) return;
    changeStatus({ bookingId: booking.id, status: "CANCELLED" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href={`/${basePath}/bookings`}>
            <ArrowLeft className="size-4" />
            Назад к списку
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : isError || !booking ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          Не удалось загрузить бронирование
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main details */}
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="title-text flex items-center gap-2">
                    <Ticket className="size-6 text-emerald-500" />
                    Бронирование
                  </h2>
                  <p className="text-muted-foreground mt-1 font-mono text-xs">{booking.id}</p>
                </div>
                <Badge variant="outline" className={cn("border-0 text-sm", getStatusColor(booking.status))}>
                  {bookingStatusLabels[booking.status as BookingStatusKey] ?? booking.status}
                </Badge>
              </div>

              <div className="grid gap-1 pt-2 sm:grid-cols-2">
                <InfoRow icon={MapPin} label="Маршрут">
                  <p className="font-medium">
                    {booking.from_city} → {booking.to_city}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {booking.from_address} → {booking.to_address}
                  </p>
                </InfoRow>
                <InfoRow icon={UsersIcon} label="Места">
                  <p className="tabular-nums">{booking.seatsBooked}</p>
                </InfoRow>
                <InfoRow icon={CircleDollarSign} label="Сумма">
                  <p className="tabular-nums">{formatMoney(Number(booking.totalPrice))}</p>
                </InfoRow>
                <InfoRow icon={Calendar} label="Создано">
                  {formatDate(booking.createdAt)}
                </InfoRow>
                {booking.trip?.departure_ts && (
                  <InfoRow icon={Calendar} label="Отправление">
                    {formatDate(booking.trip.departure_ts)}
                  </InfoRow>
                )}
                {booking.trip?.arrival_ts && (
                  <InfoRow icon={Calendar} label="Прибытие">
                    {formatDate(booking.trip.arrival_ts)}
                  </InfoRow>
                )}
              </div>

              {booking.cancellationReason && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                  <p className="text-[11px] font-semibold tracking-wider uppercase">Причина отмены</p>
                  <p className="mt-1">{booking.cancellationReason}</p>
                </div>
              )}

              {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                <div className="mt-4 flex justify-end">
                  <Button variant="destructive" onClick={handleCancel} disabled={isChanging} className="gap-1.5">
                    <XCircle className="size-4" />
                    Отменить бронирование
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* People + trip side card */}
          <div className="flex flex-col gap-4">
            {booking.passenger && (
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Пассажир</p>
                  <Link
                    href={`/${basePath}/users-search/${booking.passenger.id}`}
                    className="mt-1 block font-medium hover:underline"
                  >
                    {booking.passenger.firstName} {booking.passenger.lastName}
                    <SourceBadge source={booking.passenger.registration_source} />
                  </Link>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                    <PhoneCall className="size-3" /> {booking.passenger.phoneNumber}
                  </p>
                </CardContent>
              </Card>
            )}

            {booking.trip && (
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Поездка</p>
                  <Link
                    href={`/${basePath}/trips/${booking.trip.id ?? booking.tripId}`}
                    className="mt-1 inline-flex items-center gap-1.5 font-medium hover:underline"
                  >
                    <Hash className="size-3" />
                    <span className="font-mono text-xs">{(booking.trip.id ?? booking.tripId)?.slice(0, 8)}…</span>
                  </Link>
                  {booking.trip.status && (
                    <Badge variant="outline" className={cn("mt-2 border-0", getStatusColor(booking.trip.status))}>
                      {booking.trip.status}
                    </Badge>
                  )}

                  {booking.trip.driver && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                        Водитель
                      </p>
                      <Link
                        href={`/${basePath}/users-search/${booking.trip.driver.id}`}
                        className="mt-1 flex items-center gap-1.5 font-medium hover:underline"
                      >
                        <CarFront className="size-3.5" />
                        {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                        <SourceBadge source={booking.trip.driver.registration_source} />
                      </Link>
                      <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                        <PhoneCall className="size-3" /> {booking.trip.driver.phoneNumber}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

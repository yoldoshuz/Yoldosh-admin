"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ImageIcon, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGetTripDetails } from "@/hooks/adminHooks";
import { formatDocUrl, getStatusColor } from "@/lib/utils";

export const TripDetails = ({ tripId }: { tripId: string }) => {
  const { data, isLoading, isError } = useGetTripDetails(tripId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.trip) {
    return <div className="text-center text-muted-foreground py-12">Не удалось загрузить данные о поездке</div>;
  }

  const trip = data.trip;
  const { driver, car, fromVillage, toVillage } = trip;

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd.MM.yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4 p-6">
      <Link href="/admin/trips" className="flex items-center gap-2 w-full text-emerald-500 hover:underline">
        <ChevronLeft className="size-5" />
        <span>Назад к поездкам</span>
      </Link>
      {/* --- Основная информация --- */}
      <Card className="component shadow-none">
        <CardHeader>
          <CardTitle className="title-text">Информация о поездке</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">ID:</span> {trip.id}
          </p>
          <p>
            <span className="text-muted-foreground">Статус:</span>{" "}
            <span className={`${getStatusColor(trip.status)} py-1 px-1.5  rounded-full`}>{trip.status}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Дата отправления:</span> {formatDate(trip.departure_ts)}
          </p>
          <p>
            <span className="text-muted-foreground">Свободных мест:</span> {trip.seats_available}
          </p>
          <p>
            <span className="text-muted-foreground">Цена за место:</span>{" "}
            {parseFloat(trip.price_per_person).toLocaleString("ru-RU")} UZS
          </p>
          <p>
            <span className="text-muted-foreground">Два сзади максимум:</span> {trip.max_two_back ? "Да" : "Нет"}
          </p>
          <p>
            <span className="text-muted-foreground">Комментарий:</span> {trip.comment ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Дата создания:</span> {formatDate(trip.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Начало маршрута:</span> {formatDate(trip.trip_start_ts) ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Конец маршрута:</span> {formatDate(trip.trip_end_ts) ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Дистанция маршрута:</span> {trip.distance ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Длительность маршрута:</span> {trip.duration ?? "—"}
          </p>
        </CardContent>
      </Card>

      {/* --- Водитель --- */}
      <Card className="component shadow-none">
        <CardHeader>
          <CardTitle className="title-text link-text">
            <Link href={`/admin/users-search/${trip.driver.id}`}>Водитель</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Имя:</span> {driver?.firstName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Фамилия:</span> {driver?.lastName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Рейтинг:</span> {driver?.rating ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Курение:</span>{" "}
            {driver?.smoking_allowed ? "Разрешено" : "Запрещено"}
          </p>
          <p>
            <span className="text-muted-foreground">Животные:</span> {driver?.pets_allowed ? "Да" : "Нет"}
          </p>
          <p>
            <span className="text-muted-foreground">Музыка:</span> {driver?.music_allowed ? "Да" : "Нет"}
          </p>
          <p>
            <span className="text-muted-foreground">Разговорчивость:</span> {driver?.talkative ? "Да" : "Нет"}
          </p>
        </CardContent>
      </Card>

      {/* --- Автомобиль --- */}
      {car && (
        <Card className="component shadow-none">
          <CardHeader>
            <CardTitle className="title-text">Автомобиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Производитель:</span> {car.make}
            </p>
            <p>
              <span className="text-muted-foreground">Модель:</span> {car.model}
            </p>
            <p>
              <span className="text-muted-foreground">Цвет:</span> {car.color}
            </p>
            <p>
              <span className="text-muted-foreground">Гос. номер:</span> {car.govNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Места:</span> {car.seats}
            </p>
            <p>
              <span className="text-muted-foreground">Тех. пасспорт:</span> {car.techPassportSerial}
            </p>
            <p>
              <span className="text-muted-foreground">Дата выдачи:</span> {car.issueDate}
            </p>
            <p>
              <span className="text-muted-foreground">Причина отказа:</span> {car.rejectionReason ?? "—"}
            </p>
            {/* Tech passport */}
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ImageIcon className="mr-1 h-3 w-3" />
                    Тех пасспорт Спереди
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-0">
                  <DialogTitle className="sr-only">Тех пасспорт Спереди</DialogTitle>
                  <Image
                    src={formatDocUrl(car.techPassportBackPath)}
                    alt="Document Front"
                    className="rounded-lg w-full max-h-[80vh] object-contain"
                    width={2048}
                    height={2048}
                  />
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ImageIcon className="mr-1 h-3 w-3" />
                    Тех пасспорт Сзади
                  </Button>
                </DialogTrigger>
                <DialogTitle className="sr-only">Тех пасспорт Сзади</DialogTitle>
                <DialogContent className="max-w-md p-0">
                  <Image
                    src={formatDocUrl(car.techPassportFrontPath)}
                    alt="Document Back"
                    className="rounded-lg w-full max-h-[80vh] object-contain"
                    width={2048}
                    height={2048}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Маршрут --- */}
      <Card className="component">
        <CardHeader>
          <CardTitle className="title-text">Маршрут</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-8 text-sm">
          <div className="flex flex-row gap-2">
            <MapPin className="size-4 text-green-500" />
            <div className="flex flex-col gap-0">
              <span className="text-muted-foreground text-sm">Откуда:</span>
              <p>{trip.from_address ?? "—"}</p>
              <p className="text-muted-foreground">Долгота: {trip.from_latitude ?? "—"}</p>
              <p className="text-muted-foreground">Широта: {trip.from_longitude ?? "—"}</p>
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <MapPin className="size-4 text-red-500" />
            <div className="flex flex-col gap-0">
              <span className="text-muted-foreground text-sm">Куда:</span>
              <p>{trip.to_address ?? "—"}</p>
              <p className="text-muted-foreground">Долгота: {trip.to_latitude ?? "—"}</p>
              <p className="text-muted-foreground">Широта: {trip.to_longitude ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Бронирования --- */}
      <Card className="component shadow-none">
        <CardHeader>
          <CardTitle className="title-text">Бронирования</CardTitle>
        </CardHeader>
        <CardContent className="grid-2 text-sm">
          {trip.bookings?.length ? (
            trip.bookings.map((b: any, i: number) => (
              <div key={i} className="component-dark border rounded-2xl p-6 space-y-1">
                <p>
                  <span className="text-muted-foreground">ID:</span> {b.passenger.id}
                </p>
                <p>
                  <span className="text-muted-foreground">Полное имя:</span> {b.passenger.lastName}{" "}
                  {b.passenger.firstName}
                </p>
                <p>
                  <span className="text-muted-foreground">Рейтинг:</span> {b.passenger.rating}
                </p>
                <p>
                  <span className="text-muted-foreground">Мест забронировано:</span> {b.seatsBooked}
                </p>
                <p>
                  <span className="text-muted-foreground">Цена:</span> {trip.price_per_person} UZS
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Статус:</span>
                  <div className={`${getStatusColor(b.status)} py-1 px-1.5  rounded-full`}>{b.status}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Нет бронирований</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

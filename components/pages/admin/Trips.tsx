"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, MapPin, Pencil, Search, Trash2 } from "lucide-react";
import { Control, FieldPath, FieldValues, useForm } from "react-hook-form";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";
import z from "zod";

import { DateRangePicker, DateRangeValue, rangeToQuery } from "@/components/shared/DateRangePicker";
import { PageHeader, PageShell } from "@/components/shared/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteTrip, useEditTrip, useGetTrips } from "@/hooks/adminHooks";
import { editTripSchema } from "@/lib/schemas";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Trip } from "@/types";

/* -------------------- FIX ТИПОВ -------------------- */
type FormValues = z.input<typeof editTripSchema>; // 👈 ключ
type ApiValues = z.output<typeof editTripSchema>;

enum TripStatus {
  Created = "CREATED",
  InProgress = "IN_PROGRESS",
  Completed = "COMPLETED",
  Canceled = "CANCELED",
}

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  step?: string;
  min?: number;
  placeholder?: string;
};

export function NumberField<T extends FieldValues>({ control, name, label, step = "1", min, placeholder }: Props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min={min}
              placeholder={placeholder}
              value={field.value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? undefined : Number(val));
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export const Trips = () => {
  const [activeTab, setActiveTab] = useState<TripStatus | "ALL">("ALL");

  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({
    sortBy: "departure_ts",
    sortOrder: "DESC",
  });

  const [range, setRange] = useState<DateRangeValue>({ preset: "month" });
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const filters = {
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    status: activeTab === "ALL" ? undefined : activeTab,
    ...rangeToQuery(range),
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetTrips(filters);

  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();
  const { mutate: editTrip, isPending: isEditing } = useEditTrip();

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage]);

  /* -------------------- FORM -------------------- */
  const form = useForm<FormValues>({
    resolver: zodResolver(editTripSchema),
  });

  const handleEditClick = (trip: any) => {
    setSelectedTrip(trip);

    form.reset({
      tripId: trip.id,

      departure_ts: trip.departure_ts ? new Date(trip.departure_ts).toISOString().slice(0, 16) : undefined,

      seats_available: trip.seats_available ?? undefined,
      price_per_person: trip.price_per_person ?? undefined,

      duration: trip.duration ?? undefined,
      distance: trip.distance ?? undefined,

      booking_type: trip.booking_type ?? undefined,

      from_latitude: trip.from_latitude ?? undefined,
      from_longitude: trip.from_longitude ?? undefined,
      to_latitude: trip.to_latitude ?? undefined,
      to_longitude: trip.to_longitude ?? undefined,

      max_two_back: trip.max_two_back ?? undefined,
      conditioner: trip.conditioner ?? undefined,
      smoking_allowed: trip.smoking_allowed ?? undefined,
      door_pickup: trip.door_pickup ?? undefined,
      food_stop: trip.food_stop ?? undefined,

      garage: trip.garage ?? undefined,
      comment: trip.comment ?? undefined,
    });
  };

  const onEditSubmit = (values: FormValues) => {
    if (!selectedTrip) return;

    /* 🔥 ПАРСИМ → ПОЛУЧАЕМ НОРМ ТИПЫ */
    const parsed: ApiValues = editTripSchema.parse(values);

    const { tripId, departure_ts, ...rest } = parsed;

    const payload = {
      ...rest,
      departure_ts: departure_ts ? new Date(departure_ts).toISOString() : undefined,
    };

    editTrip(
      { tripId, ...payload },
      {
        onSuccess: () => setSelectedTrip(null),
      }
    );
  };

  const handleDelete = (tripId: string) => {
    if (window.confirm("Удалить поездку?")) {
      deleteTrip(tripId);
    }
  };

  const allTrips = data?.pages.flatMap((p) => p.trips) ?? [];

  return (
    <PageShell>
      <Toaster richColors />
      <PageHeader title="Поездки" subtitle="Мониторинг всех поездок в системе" range={range} onRangeChange={setRange} />

      {/* Tabs Selector */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TripStatus | "ALL")} className="w-full">
        <TabsList className="w-full overflow-x-auto px-1 sm:w-auto">
          <TabsTrigger value="ALL" className="text-xs sm:text-sm">
            Все
          </TabsTrigger>
          <TabsTrigger value={TripStatus.Created} className="text-xs sm:text-sm">
            Созданные
          </TabsTrigger>
          <TabsTrigger value={TripStatus.InProgress} className="text-xs sm:text-sm">
            В пути
          </TabsTrigger>
          <TabsTrigger value={TripStatus.Completed} className="text-xs sm:text-sm">
            Завершенные
          </TabsTrigger>
          <TabsTrigger value={TripStatus.Canceled} className="text-xs sm:text-sm">
            Отмененные
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="component flex flex-col rounded-2xl border px-4 py-3 sm:px-6 sm:py-4">
        {/* Filters */}
        <div className="my-2 flex flex-col gap-2 sm:my-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Поиск по маршруту, ID, имени водителя..."
              className="component-dark w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="component-dark">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort({ sortBy: "departure_ts", sortOrder: "DESC" })}>
                Сначала новые
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort({ sortBy: "departure_ts", sortOrder: "ASC" })}>
                Сначала старые
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedTrip(null)}>
          {isLoading ? (
            <div className="grid-default">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton className="h-8 w-full" key={i} />
              ))}
            </div>
          ) : allTrips.length > 0 ? (
            <div className="grid-default">
              {allTrips.map((trip: any) => (
                <div
                  className="component flex flex-col gap-4 rounded-xl border p-6 transition hover:border-emerald-500 dark:hover:border-emerald-600"
                  key={trip.id}
                >
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <Link href={`/admin/trips/${trip.id}`} className="link-text text-lg font-bold">
                      #{trip.id.substring(0, 6)}
                    </Link>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                    <time className="text-muted-foreground text-sm">{formatDate(trip.departure_ts)}</time>
                  </div>
                  <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-col space-y-4 text-sm">
                      <Link href={`/admin/users-search/${trip.driver.id}`} className="flex flex-col gap-1">
                        <span className="text-muted-foreground link-text">Водитель:</span>
                        <span className="link-text font-semibold">
                          {trip.driver.firstName} {trip.driver.lastName}
                        </span>
                      </Link>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Номер:</span>
                        <span>{trip.driver.phoneNumber}</span>
                      </div>
                      <div className="flex flex-col gap-2 text-base">
                        <div className="flex flex-row gap-2">
                          <MapPin className="size-4 text-green-500" />
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-sm">Откуда:</span>
                            <span className="font-thin">
                              {trip.fromRegion?.nameRu || trip.from_address || trip.from_city || "Неизвестно"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <MapPin className="size-4 text-red-500" />
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-sm">Куда:</span>
                            <span className="font-thin">
                              {trip.toRegion?.nameRu || trip.to_address || trip.to_city || "Неизвестно"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex h-full flex-col items-center justify-between gap-4">
                      <div className="h-full w-full text-xl font-bold">
                        <h1 className="text-center sm:text-right">
                          {Intl.NumberFormat("fr-FR").format(trip.price_per_person)} UZS
                        </h1>
                      </div>
                      <div className="flex flex-col gap-2 space-x-2 sm:flex-row">
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => handleEditClick(trip)}>
                            Редактировать
                            <Pencil className="size" />
                          </Button>
                        </DialogTrigger>
                        <Button variant="destructive" onClick={() => handleDelete(trip.id)} disabled={isDeleting}>
                          Удалить
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex w-full items-center justify-center">
              <span className="subtitle-text">Поездки не найдены.</span>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div className="mt-4 flex w-full justify-center" ref={ref}>
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-primary shadow-glow">
                {isFetchingNextPage ? "Загрузка..." : "Загрузить еще"}
              </Button>
            </div>
          )}

          {selectedTrip && (
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Редактировать поездку #{selectedTrip.id.substring(0, 8)}</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Дата и время */}
                    <FormField
                      control={form.control}
                      name="departure_ts"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Дата и время отправления</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <NumberField control={form.control} name="seats_available" label="Свободные места" min={1} />

                    <NumberField control={form.control} name="price_per_person" label="Цена за место (UZS)" />

                    <NumberField control={form.control} name="duration" label="Длительность (минуты)" />

                    <NumberField control={form.control} name="distance" label="Расстояние (км)" step="0.1" />
                    {/* Тип бронирования */}
                    <FormField
                      control={form.control}
                      name="booking_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип бронирования</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите тип" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INSTANT">Мгновенное</SelectItem>
                              <SelectItem value="REQUEST">По запросу</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Гараж */}
                    <FormField
                      control={form.control}
                      name="garage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Гараж / Статус авто</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Не выбран" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EMPTY">Пустой</SelectItem>
                              <SelectItem value="HALF_EMPTY">Полупустой</SelectItem>
                              <SelectItem value="FULL">Полный</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Фичи (чекбоксы) */}
                  <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="max_two_back"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Максимум двое сзади</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="conditioner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Кондиционер</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="smoking_allowed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Курение разрешено</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="door_pickup"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Посадка у двери</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="food_stop"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Остановка на еду</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Комментарий */}
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Комментарий к поездке</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            value={field.value || ""}
                            className="min-h-[100px] w-full resize-y rounded-md border p-3"
                            placeholder="Дополнительная информация..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setSelectedTrip(null)}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={isEditing}>
                      {isEditing ? "Сохранение..." : "Сохранить изменения"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </PageShell>
  );
};

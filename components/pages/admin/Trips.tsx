"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, MapPin, Pencil, Search, Trash2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteTrip, useEditTrip, useGetTrips } from "@/hooks/adminHooks";
import { editTripSchema } from "@/lib/schemas";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Trip } from "@/types";

// Enum как в запросе
enum TripStatus {
  Created = "CREATED",
  InProgress = "IN_PROGRESS",
  Completed = "COMPLETED",
  Canceled = "CANCELED",
}

export const Trips = () => {
  // State для табов
  const [activeTab, setActiveTab] = useState<TripStatus | "ALL">("ALL");

  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ sortBy: "departure_ts", sortOrder: "DESC" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const filters = {
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    // Передаем статус, если не выбрано "ВСЕ"
    status: activeTab === "ALL" ? undefined : activeTab,
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetTrips(filters);
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();
  const { mutate: editTrip, isPending: isEditing } = useEditTrip();

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const form = useForm<z.infer<typeof editTripSchema>>({
    resolver: zodResolver(editTripSchema),
  });

  const handleEditClick = (trip: Trip) => {
    setSelectedTrip(trip);
    form.reset({
      tripId: trip.id,
      departure_ts: trip.departure_ts ? new Date(trip.departure_ts).toISOString().slice(0, 16) : undefined,
      seats_available: trip.seats_available,
      price_per_person: trip.price_per_person,
    });
  };

  const onEditSubmit = (values: z.infer<typeof editTripSchema>) => {
    if (!selectedTrip) return;
    const submissionData = {
      ...values,
      departure_ts: values.departure_ts ? new Date(values.departure_ts).toISOString() : undefined,
    };
    editTrip(submissionData, {
      onSuccess: () => setSelectedTrip(null),
    });
  };

  const handleDelete = (tripId: string) => {
    if (window.confirm("Вы уверены удалять данную поездку?")) {
      deleteTrip(tripId);
    }
  };

  const allTrips = data?.pages.flatMap((page) => page.trips) ?? [];

  return (
    <div>
      <Toaster richColors />
      <h1 className="title-text">Поездки</h1>
      <p className="subtitle-text mb-4">Мониторинг всех поездок в системе</p>

      {/* Tabs Selector */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TripStatus | "ALL")} className="w-full mb-4">
        <TabsList className="w-64 sm:w-96 px-1">
          <TabsTrigger value="ALL" className="w-4 text-xs sm:text-md">
            Все
          </TabsTrigger>
          <TabsTrigger value={TripStatus.Created} className="text-xs sm:text-md">
            Созданные
          </TabsTrigger>
          <TabsTrigger value={TripStatus.InProgress} className="text-xs sm:text-md">
            В пути
          </TabsTrigger>
          <TabsTrigger value={TripStatus.Completed} className="text-xs sm:text-md">
            Завершенные
          </TabsTrigger>
          <TabsTrigger value={TripStatus.Canceled} className="text-xs sm:text-md">
            Отмененные
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col component border rounded-2xl px-6 py-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 my-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по маршруту, ID, имени водителя..."
              className="pl-8 w-full component-dark"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="component-dark">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd.MM.yyyy")} - ${format(dateRange.to, "dd.MM.yyyy")}`
                    ) : (
                      format(dateRange.from, "dd.MM.yyyy")
                    )
                  ) : (
                    <span>Выбрать дату</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  autoFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
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
                  className="flex flex-col gap-4 component border hover:border-emerald-500 dark:hover:border-emerald-600 transition rounded-xl p-6"
                  key={trip.id}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link href={`/admin/trips/${trip.id}`} className="font-bold text-lg link-text">
                      #{trip.id.substring(0, 6)}
                    </Link>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                    <time className="text-sm text-muted-foreground">{formatDate(trip.departure_ts)}</time>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                    <div className="flex flex-col space-y-4 text-sm">
                      <Link href={`/admin/users-search/${trip.driver.id}`} className="flex flex-col gap-1">
                        <span className="text-muted-foreground link-text">Водитель:</span>
                        <span className="font-semibold link-text">
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
                              {trip.fromRegion?.nameRu || trip.from_address || "Неизвестно"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <MapPin className="size-4 text-red-500" />
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-sm">Куда:</span>
                            <span className="font-thin">
                              {trip.toRegion?.nameRu || trip.to_address || "Неизвестно"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-between gap-4 h-full">
                      <div className="w-full h-full text-xl font-bold">
                        <h1 className="text-center sm:text-right">
                          {Intl.NumberFormat("fr-FR").format(trip.price_per_person)} UZS
                        </h1>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 space-x-2">
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
            <div className="flex items-center justify-center w-full mt-8">
              <span className="subtitle-text">Поездки не найдены.</span>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div className="mt-4 flex justify-center w-full" ref={ref}>
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-primary shadow-glow">
                {isFetchingNextPage ? "Загрузка..." : "Загрузить еще"}
              </Button>
            </div>
          )}

          {selectedTrip && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Редактировать поездку</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="departure_ts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата и время отправления</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seats_available"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Свободные места</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_per_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цена за место</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isEditing}>
                    {isEditing ? "Сохранение..." : "Сохранить"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </div>
  );
};

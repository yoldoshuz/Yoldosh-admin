"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Bell, Calendar as CalendarIcon, Filter, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGlobalNotification, useGetNotifications } from "@/hooks/adminHooks";
import { globalNotificationSchema } from "@/lib/schemas";
import { formatDate, getStatusColor } from "@/lib/utils";

export const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ sortBy: "createdAt", sortOrder: "DESC" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);

  const filters = {
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };

  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetNotifications(filters);
  const { mutate: sendNotification, isPending } = useCreateGlobalNotification();

  const form = useForm<z.infer<typeof globalNotificationSchema>>({
    resolver: zodResolver(globalNotificationSchema),
    defaultValues: {
      title: "", // ✅ Added title default
      content: "",
      type: "general",
      targetAudience: "ALL",
    },
  });

  const onSubmit = (values: z.infer<typeof globalNotificationSchema>) => {
    sendNotification(values, { onSuccess: () => form.reset() });
  };

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allNotifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  return (
    <div>
      <Toaster richColors />
      <h1 className="title-text mb-2">Уведомления</h1>
      <p className="text-sm text-gray-500">Отправка push-уведомлений пользователям.</p>
      <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-2 sm:gap-8 mt-4">
        <div className="w-full h-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="component space-y-6 p-6 rounded-lg border">
              <h1 className="text-xl font-bold">Создать уведомление</h1>

              {/* ✅ Added Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заголовок</FormLabel>
                    <FormControl>
                      <Input placeholder="Заголовок уведомления..." className="component-dark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Содержание</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Текст уведомления..." className="min-h-[60px] component-dark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип уведомления</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="component-dark w-full">
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">Общее</SelectItem>
                        <SelectItem value="trips">Поездки</SelectItem>
                        <SelectItem value="promotionAndDiscounts">Акции и скидки</SelectItem>
                        <SelectItem value="newsAndAgreement">Новости и соглашения</SelectItem>
                        <SelectItem value="messages">Сообщения</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Аудитория</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="component-dark w-full">
                          <SelectValue placeholder="Выберите аудиторию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">Все</SelectItem>
                        <SelectItem value="DRIVERS">Водители</SelectItem>
                        <SelectItem value="PASSENGERS">Пассажиры</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full btn-primary shadow-glow" disabled={isPending}>
                {isPending ? "Отправка..." : "Отправить"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Notification History Section */}
        <div className="w-full component border rounded-lg p-6">
          <h1 className="text-xl font-bold">История уведомлений</h1>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 my-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по заголовку или содержанию..."
                className="pl-8 component-dark"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="component-dark ">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Выберите дату</span>
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
                  <DropdownMenuItem onClick={() => setSort({ sortBy: "createdAt", sortOrder: "DESC" })}>
                    Сначала новые
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort({ sortBy: "createdAt", sortOrder: "ASC" })}>
                    Сначала старые
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <ScrollArea className="flex-1 h-[62vh] w-full">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton className="h-8 w-full" key={i} />
                ))}
              </div>
            ) : allNotifications.length > 0 ? (
              <div className="flex flex-col gap-4">
                {allNotifications.map((notif: any) => (
                  <div
                    className="flex flex-col gap-4 component border hover:border-emerald-500 dark:hover:border-emerald-600 transition rounded-xl p-6"
                    key={notif.createdAt}
                  >
                    <div className="flex flex-row items-start justify-start gap-4">
                      <div className="bg-linear-to-br from-emerald-400 to-teal-700 text-white rounded-xl p-2">
                        <Bell className="size-6" />
                      </div>
                      <div className="flex flex-col items-start justify-start gap-2">
                        {/* ✅ Display Title */}
                        <span className="font-bold text-lg">{notif.title}</span>
                        <span className="text-sm text-muted-foreground">{notif.message}</span>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notif.type)}`}>
                          {notif.type}
                        </span>
                        <div className="mt-1 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs mr-2 ${getStatusColor(notif.targetAudience)}`}
                          >
                            {notif.targetAudience}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Intl.NumberFormat().format(notif.receivedAmount)} получател
                            {notif.receivedAmount === 1
                              ? "ь"
                              : notif.receivedAmount > 1 && notif.receivedAmount < 5
                                ? "я"
                                : "ей"}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">{formatDate(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full mt-8">
                <span className="subtitle-text">Уведомлений пока нет.</span>
              </div>
            )}
            {hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Загрузка..." : "Загрузить еще"}
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

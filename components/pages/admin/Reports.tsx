"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBanUser, useGetReports, useUpdateReportStatus } from "@/hooks/adminHooks";
import { banUserSchema } from "@/lib/schemas";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Report } from "@/types";

const ReportsTable = ({ status }: { status: "PENDING" | "RESOLVED" | "REJECTED" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ sortBy: "createdAt", sortOrder: "DESC" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [debouncedSearch] = useDebounceValue(searchTerm, 500);

  const filters = {
    status,
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetReports(filters);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateReportStatus();
  const { mutate: banUser, isPending: isBanning } = useBanUser();

  const form = useForm<z.infer<typeof banUserSchema>>({
    resolver: zodResolver(banUserSchema),
    defaultValues: { reason: "", durationInDays: undefined, userId: "" },
  });

  useEffect(() => {
    if (selectedReport) {
      form.setValue("userId", selectedReport.reportedUser.id);
    }
  }, [selectedReport, form]);

  const onBanSubmit = (values: z.infer<typeof banUserSchema>) => {
    if (!selectedReport) return;
    banUser(values, {
      onSuccess: () => setSelectedReport(null),
    });
  };

  const allReports = data?.pages.flatMap((page) => page.reports) ?? [];

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}>
      <div className="component mt-1 flex flex-col rounded-2xl border px-6 py-4">
        <div className="my-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="relative flex w-full">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Поиск по ID, причине, имени..."
              className="component-dark w-full pl-8"
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
        {isLoading ? (
          <div className="grid-default">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton className="h-8 w-full" key={i} />
            ))}
          </div>
        ) : allReports.length > 0 ? (
          <div className="grid-default">
            {data!.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.reports.map((report: Report, j: number) => (
                  <div
                    className="component flex flex-col gap-4 rounded-xl border p-6 transition hover:border-emerald-500 dark:hover:border-emerald-600"
                    key={report.id}
                  >
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <span className="text-lg font-bold">#{report.id.substring(0, 6)}</span>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <time className="text-muted-foreground text-sm">{formatDate(report.createdAt)}</time>
                    </div>
                    <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                      <div className="flex flex-col space-y-4 text-sm">
                        <Link
                          href={`/admin/users-search/`} //${report.reportingUser.id}
                          className="link-text flex flex-col"
                        >
                          <span className="text-muted-foreground">От:</span>
                          <span className="font-semibold">{report.reportingUser?.firstName || "N/A"}</span>
                        </Link>
                        <Link
                          href={`/admin/users-search/`} // ${report.reportedUser.id}
                          className="link-text flex flex-col"
                        >
                          <span className="text-muted-foreground">На:</span>
                          <span className="font-semibold">{report.reportedUser?.firstName || "N/A"}</span>
                        </Link>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground max-w-xs truncate">Причина:</span>
                          <span className="font-semibold">{report.reason}</span>
                        </div>
                      </div>
                      <div className="flex h-full items-end text-right">
                        {report.status === "PENDING" && (
                          <div className="flex flex-col items-center gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="destructive"
                              className="-py-1"
                              onClick={() =>
                                updateStatus(
                                  {
                                    reportId: report.id,
                                    status: "REJECTED",
                                  },
                                  {
                                    onSuccess: () => setSelectedReport(null),
                                  }
                                )
                              }
                              disabled={isUpdating || isBanning}
                            >
                              Отклонить
                            </Button>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-primary shadow-glow"
                                onClick={() => setSelectedReport(report)}
                              >
                                Рассмотреть
                              </Button>
                            </DialogTrigger>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex w-full items-center justify-center">
            <span className="subtitle-text">Жалобы не найдены.</span>
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Загрузка..." : "Загрузить еще"}
          </Button>
        </div>
      )}

      {selectedReport && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Рассмотрение жалобы #{selectedReport.id.substring(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* <p><strong>От:</strong> {selectedReport.reportingUser.firstName}</p>
                        <p><strong>На:</strong> {selectedReport.reportedUser.firstName}</p> */}
            <p>
              <strong>Причина:</strong> {selectedReport.reason}
            </p>
            {selectedReport.status === "PENDING" && (
              <div className="pt-4">
                <h3 className="mb-2 font-semibold">Действия по жалобе</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onBanSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Причина бана</FormLabel>
                          <FormControl>
                            <Input placeholder="Нарушение правил сообщества" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationInDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Срок бана (в днях, необязательно)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="submit" variant="destructive" disabled={isBanning || isUpdating}>
                        Забанить и решить
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export const Reports = () => {
  return (
    <div>
      <Toaster richColors />
      <h1 className="title-text">Жалобы</h1>
      <p className="subtitle-text">Управление жалобами пользователей</p>
      <Tabs defaultValue="PENDING" className="mt-4 w-full">
        <TabsList className="w-64 px-1 sm:w-96">
          <TabsTrigger value="PENDING" className="sm:text-md w-4 text-xs">
            В ожидании
          </TabsTrigger>
          <TabsTrigger value="RESOLVED" className="sm:text-md w-4 text-xs">
            Решенные
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="sm:text-md w-4 text-xs">
            Отклоненные
          </TabsTrigger>
        </TabsList>
        <TabsContent value="PENDING">
          <ReportsTable status="PENDING" />
        </TabsContent>
        <TabsContent value="RESOLVED">
          <ReportsTable status="RESOLVED" />
        </TabsContent>
        <TabsContent value="REJECTED">
          <ReportsTable status="REJECTED" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

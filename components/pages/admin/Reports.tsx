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
      <div className="flex flex-col component border rounded-2xl mt-1 px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 my-4">
          <div className="relative flex w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, причине, имени..."
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
                    className="flex flex-col gap-4 component border hover:border-emerald-500 dark:hover:border-emerald-600 transition rounded-xl p-6"
                    key={report.id}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <span className="font-bold text-lg">#{report.id.substring(0, 6)}</span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <time className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</time>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                      <div className="flex flex-col space-y-4 text-sm">
                        <Link
                          href={`/admin/users-search/`} //${report.reportingUser.id}
                          className="flex flex-col link-text"
                        >
                          <span className="text-muted-foreground">От:</span>
                          <span className="font-semibold">{report.reportingUser?.firstName || "N/A"}</span>
                        </Link>
                        <Link
                          href={`/admin/users-search/`} // ${report.reportedUser.id}
                          className="flex flex-col link-text"
                        >
                          <span className="text-muted-foreground">На:</span>
                          <span className="font-semibold">{report.reportedUser?.firstName || "N/A"}</span>
                        </Link>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground truncate max-w-xs">Причина:</span>
                          <span className="font-semibold">{report.reason}</span>
                        </div>
                      </div>
                      <div className="flex items-end text-right h-full">
                        {report.status === "PENDING" && (
                          <div className="flex flex-col sm:flex-row items-center gap-2">
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
          <div className="flex items-center justify-center w-full mt-8">
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
          <div className="py-4 space-y-4">
            {/* <p><strong>От:</strong> {selectedReport.reportingUser.firstName}</p>
                        <p><strong>На:</strong> {selectedReport.reportedUser.firstName}</p> */}
            <p>
              <strong>Причина:</strong> {selectedReport.reason}
            </p>
            {selectedReport.status === "PENDING" && (
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Действия по жалобе</h3>
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
      <Tabs defaultValue="PENDING" className="w-full mt-4">
        <TabsList className="w-64 sm:w-96 px-1">
          <TabsTrigger value="PENDING" className="w-4 text-xs sm:text-md">
            В ожидании
          </TabsTrigger>
          <TabsTrigger value="RESOLVED" className="w-4 text-xs sm:text-md">
            Решенные
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="w-4 text-xs sm:text-md">
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

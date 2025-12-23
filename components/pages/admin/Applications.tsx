"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useDebounceValue, useIntersectionObserver } from "usehooks-ts";

import { ApplicationCard } from "@/components/shared/applications/ApplicationCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCarApplications, useUpdateCarApplicationStatus } from "@/hooks/adminHooks";

export const Applications = () => {
  const [activeTab, setActiveTab] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ sortBy: string; sortOrder: "ASC" | "DESC" }>({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);

  const filters = {
    status: activeTab,
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error } = useGetCarApplications(filters);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateCarApplicationStatus();

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log("Загрузка следующей страницы");
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleStatusUpdate = (carId: string, newStatus: "VERIFIED" | "REJECTED", reason?: string) => {
    updateStatus({ carId, status: newStatus, rejectionReason: reason });
  };

  const allApplications = data?.pages?.flatMap((page) => page.applications ?? []) ?? [];

  return (
    <div>
      <Toaster richColors />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div>
          <h1 className="title-text">Заявки водителей</h1>
          <p className="subtitle-text">Управление заявками на регистрацию водителей.</p>
        </div>
      </div>

      <Tabs defaultValue="PENDING" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="w-64 sm:w-96 px-1">
          <TabsTrigger value="PENDING" className="w-4 text-xs sm:text-md">
            В ожидании
          </TabsTrigger>
          <TabsTrigger value="VERIFIED" className="w-4 text-xs sm:text-md">
            Подтвержденные
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="w-4 text-xs sm:text-md">
            Отклоненные
          </TabsTrigger>
        </TabsList>

        {/* Filters Section */}
        <div className="flex flex-col component border rounded-2xl mt-1 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 my-4 px-1">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, номеру телефона, номерному знаку"
                className="pl-8 component-dark w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="component-dark w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}`
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
                    Сначала новые {sort.sortBy === "createdAt" && sort.sortOrder === "DESC" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort({ sortBy: "createdAt", sortOrder: "ASC" })}>
                    Сначала старые {sort.sortBy === "createdAt" && sort.sortOrder === "ASC" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content for each tab */}
          {["PENDING", "VERIFIED", "REJECTED"].map((statusValue) => (
            <TabsContent key={statusValue} value={statusValue} className="mt-0">
              {isLoading && !data ? (
                <div className="flex flex-col items-center justify-start w-full gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-xl skeleton" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-10 text-destructive">Ошибка загрузки заявок. Попробуйте перезайти</div>
              ) : allApplications.length > 0 ? (
                <div className="flex flex-col items-center justify-start w-full gap-4">
                  {allApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onApprove={(carId) => handleStatusUpdate(carId, "VERIFIED")}
                      onReject={(carId, reason) => handleStatusUpdate(carId, "REJECTED", reason)}
                      isUpdating={isUpdatingStatus}
                    />
                  ))}
                  {/* Infinite scroll trigger */}
                  {hasNextPage && (
                    <div ref={ref} className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center py-4">
                      {isFetchingNextPage && <p>Загрузка...</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">Заявки не найдены</div>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

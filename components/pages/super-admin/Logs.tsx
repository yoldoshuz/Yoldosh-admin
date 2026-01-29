"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useDebounceValue } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAdminLogs, useGetAllAdmins } from "@/hooks/superAdminHooks";
import { cn, formatDate } from "@/lib/utils";

export const Logs = () => {
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const { data: adminsData, isLoading: isAdminLoading } = useGetAllAdmins({});

  // Filters for logs
  const [searchTerm] = useState("");
  const [sort, setSort] = useState({ sortBy: "timestamp", sortOrder: "DESC" });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [debouncedSearch] = useDebounceValue(searchTerm, 500);

  const filters = {
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };

  const {
    data: logsData,
    isLoading: isLogsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAdminLogs(selectedAdminId!, filters);

  const allLogs = logsData?.pages.flatMap((page: any) => page.logs) ?? [];
  const allAdmins = adminsData?.pages.flatMap((page: any) => page.rows) ?? [];

  return (
    <div>
      <h1 className="title-text mb-6">Логи Администраторов</h1>
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div className="w-full">
          <h2 className="font-semibold mb-3">Администраторы</h2>
          <div className="border rounded-lg component p-2 space-y-1">
            {isAdminLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : allAdmins?.length > 0 ? (
              allAdmins.map((admin: any) => (
                <button
                  key={admin.id}
                  onClick={() => setSelectedAdminId(admin.id)}
                  className={cn(
                    "w-full text-left p-2 rounded-md transition-colors",
                    selectedAdminId === admin.id ? "component-dark" : "hover:bg-gray-100 dark:hover:bg-gray-900"
                  )}
                >
                  {admin.firstName} {admin.lastName}
                </button>
              ))
            ) : (
              <p className="p-2 text-sm text-muted-foreground">Администраторы не найдены.</p>
            )}
          </div>
        </div>
        <div className="w-full overflow-auto">
          {selectedAdminId && (
            <div className="flex justify-between items-center gap-2 my-4">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"}>
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
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSort({ sortBy: "timestamp", sortOrder: "DESC" })}>
                      Сначала новые
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort({ sortBy: "timestamp", sortOrder: "ASC" })}>
                      Сначала старые
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
          <div className="component border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Действие</TableHead>
                  {/* <TableHead>Детали</TableHead> */}
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLogsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : allLogs.length > 0 ? (
                  allLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      {/* <TableCell>{log.details}</TableCell> */}
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow key="empty">
                    <TableCell colSpan={3} className="text-center h-48">
                      {selectedAdminId
                        ? "Логи не найдены."
                        : "Пожалуйста, выберите администратора для просмотра логов."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Загрузка..." : "Загрузить еще"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
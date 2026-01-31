"use client";

import { useEffect } from "react";
import { User } from "lucide-react";
import { useIntersectionObserver } from "usehooks-ts";

import { DataStateDisplay } from "@/components/shared/layout/DataStateDisplay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetSuperAdminGuests } from "@/hooks/superAdminHooks";
import { formatDate } from "@/lib/utils";

export const Guests = () => {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetSuperAdminGuests(
    {}
  );

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });

  useEffect(() => {
    if (isIntersecting && hasNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, fetchNextPage]);

  const guests = data?.pages.flatMap((page: any) => page.rows) ?? [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="title-text">Guest Аккаунты</h1>
        <p className="subtitle-text">Пользователи, которые используют приложение без регистрации.</p>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <DataStateDisplay
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && guests.length === 0}
          onRetry={() => refetch()}
          emptyMessage="Гостевые сессии не найдены"
        >
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Guest ID</TableHead>
                <TableHead>Последняя активность</TableHead>
                <TableHead className="text-right">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest: any) => (
                <TableRow key={guest.guestId}>
                  <TableCell className="font-mono flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                      <User className="h-4 w-4" />
                    </div>
                    {guest.guestId}
                  </TableCell>
                  <TableCell>{formatDate(guest.lastActive)}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                      Не зарегистрирован
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div ref={ref} className="py-6 flex justify-center w-full bg-card border-t">
              {isFetchingNextPage && (
                <div className="text-muted-foreground text-sm animate-pulse">Загрузка данных...</div>
              )}
            </div>
          )}
        </DataStateDisplay>
      </div>
    </div>
  );
};

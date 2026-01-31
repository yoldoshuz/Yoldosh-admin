"use client";

import { useEffect } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { DataStateDisplay } from "@/components/shared/layout/DataStateDisplay";
import { ReportCard } from "@/components/shared/user/UserItems";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSuperAdminReports } from "@/hooks/superAdminHooks";

export const Reports = () => {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetSuperAdminReports(
    {}
  );

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });

  useEffect(() => {
    if (isIntersecting && hasNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, fetchNextPage]);

  const reports = data?.pages.flatMap((page: any) => page.reports) ?? []; // Внимание: структура ответа должна совпадать (см. контроллер)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="title-text text-red-600 dark:text-red-500">Все Жалобы</h1>
        <p className="subtitle-text">Центр мониторинга всех жалоб (решенные и активные).</p>
      </div>

      <DataStateDisplay
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && reports.length === 0}
        onRetry={() => refetch()}
        emptyMessage="Жалоб не найдено"
        loadingComponent={
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report: any) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref} className="py-8 flex justify-center w-full">
            {isFetchingNextPage && (
              <div className="text-muted-foreground text-sm animate-pulse">Загрузка данных...</div>
            )}
          </div>
        )}
      </DataStateDisplay>
    </div>
  );
};

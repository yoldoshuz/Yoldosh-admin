"use client";

import { useEffect } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { DataStateDisplay } from "@/components/shared/layout/DataStateDisplay";
import { TripCard } from "@/components/shared/user/UserItems";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSuperAdminFinishedTrips } from "@/hooks/superAdminHooks";

export const FinishedTrips = () => {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetSuperAdminFinishedTrips({});

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });

  useEffect(() => {
    if (isIntersecting && hasNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, fetchNextPage]);

  const trips = data?.pages.flatMap((page: any) => page.trips) ?? [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="title-text">Завершенные поездки</h1>
        <p className="subtitle-text">История успешно завершенных маршрутов.</p>
      </div>

      <DataStateDisplay
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && trips.length === 0}
        onRetry={() => refetch()}
        emptyMessage="Нет завершенных поездок"
        loadingComponent={
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          {trips.map((trip: any) => (
            <TripCard key={trip.id} trip={trip} />
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

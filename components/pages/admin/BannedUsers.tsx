"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, ShieldAlert, UserRound, UserX } from "lucide-react";
import { useIntersectionObserver } from "usehooks-ts";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBannedUsers, useUnbanUser } from "@/hooks/adminHooks";
import { useBasePath } from "@/hooks/useBasePath";
import { baseUrl } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/utils";

const BannedCard = ({ user }: { user: any }) => {
  const base = useBasePath();
  const { mutate: unban, isPending } = useUnbanUser();

  return (
    <Card className="stats-card">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          {user.avatar ? (
            <Image
              src={baseUrl + user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              width={48}
              height={48}
              className="size-12 rounded-full object-cover ring-2 ring-red-200/60 dark:ring-red-900/40"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-200/60 dark:ring-red-900/40">
              <UserRound className="size-6 text-red-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-muted-foreground truncate text-xs">{user.phoneNumber}</p>
            <span className="pill-red mt-1">
              <ShieldAlert className="size-3" /> Заблокирован
            </span>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-start gap-1.5">
            <Calendar className="text-muted-foreground mt-0.5 size-3.5" />
            <span className="text-muted-foreground">До:</span>
            <span className="ml-auto font-medium">
              {user.banExpiresAt ? formatDate(user.banExpiresAt) : "Навсегда"}
            </span>
          </div>
          {user.banReason && (
            <p className="bg-muted/40 text-muted-foreground rounded-md px-2 py-1 text-xs">{user.banReason}</p>
          )}
          {user.bannedAt && (
            <p className="text-muted-foreground text-[11px]">Забанен {formatRelativeTime(user.bannedAt)}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
            <Link href={`/${base}/users-search/${user.id}`}>
              Профиль
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => unban(user.id)} className="btn-primary flex-1 gap-1">
            {isPending ? "..." : "Разбанить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const BannedUsers = () => {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useGetBannedUsers({});

  const items = data?.pages.flatMap((p: any) => p.users ?? p.rows ?? []) ?? [];

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="title-text">Забаненные пользователи</h2>
        <p className="subtitle-text">Список с возможностью разбанить</p>
      </div>

      {isLoading && (
        <div className="grid-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center justify-between">
            <span>Не удалось загрузить список забаненных.</span>
            <button onClick={() => refetch()} className="font-medium underline-offset-4 hover:underline">
              Повторить
            </button>
          </div>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState icon={UserX} title="Забаненных нет" description="Никто из пользователей сейчас не заблокирован." />
      )}

      {items.length > 0 && (
        <div className="grid-3">
          {items.map((u: any) => (
            <BannedCard key={u.id} user={u} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div ref={ref} className="text-muted-foreground py-4 text-center text-xs">
          {isFetchingNextPage ? "Загрузка..." : "Прокрутите для загрузки"}
        </div>
      )}
    </div>
  );
};

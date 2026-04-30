"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useIntersectionObserver } from "usehooks-ts";

import { DataStateDisplay } from "@/components/shared/layout/DataStateDisplay";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetSuperAdminWallets } from "@/hooks/superAdminHooks";
import { formatDate } from "@/lib/utils";

export const Wallets = () => {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetSuperAdminWallets(
    {}
  );

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });

  useEffect(() => {
    if (isIntersecting && hasNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, fetchNextPage]);

  const transactions = data?.pages.flatMap((page: any) => page.rows) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div>
        <h1 className="title-text">История транзакций</h1>
        <p className="subtitle-text">Мониторинг пополнений и списаний в системе.</p>
      </div>

      <DataStateDisplay
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && transactions.length === 0}
        onRetry={() => refetch()}
        emptyMessage="Транзакции не найдены"
      >
        {/* Desktop table */}
        <div className="bg-card hidden overflow-hidden rounded-xl border shadow-sm md:block">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead className="text-right">Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => {
                const isPositive = tx.amount > 0;
                return (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="text-muted-foreground group-hover:text-foreground font-mono text-xs transition-colors">
                      {tx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users-search/${tx.wallet?.user?.id}`} className="font-medium hover:underline">
                        {tx.wallet?.user?.firstName} {tx.wallet?.user?.lastName}
                      </Link>
                      <div className="text-muted-foreground text-xs">{tx.wallet?.user?.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(tx.amount).toLocaleString()} UZS
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-2 md:hidden">
          {transactions.map((tx: any) => {
            const isPositive = tx.amount > 0;
            return (
              <div key={tx.id} className="bg-card rounded-2xl border p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/users-search/${tx.wallet?.user?.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {tx.wallet?.user?.firstName} {tx.wallet?.user?.lastName}
                    </Link>
                    <p className="text-muted-foreground truncate text-xs">{tx.wallet?.user?.phoneNumber}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                    {tx.type}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`flex items-center font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                    {isPositive ? (
                      <ArrowDownLeft className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    )}
                    {Math.abs(tx.amount).toLocaleString()} UZS
                  </span>
                  <span className="text-muted-foreground text-xs">{formatDate(tx.createdAt)}</span>
                </div>
                <p className="text-muted-foreground mt-1 font-mono text-[10px]">{tx.id.substring(0, 8)}</p>
              </div>
            );
          })}
        </div>

        {hasNextPage && (
          <div ref={ref} className="flex w-full justify-center py-6">
            {isFetchingNextPage && (
              <div className="text-muted-foreground animate-pulse text-sm">Загрузка данных...</div>
            )}
          </div>
        )}
      </DataStateDisplay>
    </div>
  );
};

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="title-text">История транзакций</h1>
        <p className="subtitle-text">Мониторинг пополнений и списаний в системе.</p>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <DataStateDisplay
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && transactions.length === 0}
          onRetry={() => refetch()}
          emptyMessage="Транзакции не найдены"
        >
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
                    <TableCell className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {tx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users-search/${tx.wallet?.user?.id}`} className="hover:underline font-medium">
                        {tx.wallet?.user?.firstName} {tx.wallet?.user?.lastName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{tx.wallet?.user?.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px]">
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
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
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

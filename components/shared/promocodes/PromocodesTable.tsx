"use client";

import { Ticket, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletePromoCode, useGetGlobalPromoCodes, useGetUserPromoCodes } from "@/hooks/adminHooks";
import { formatDate, getStatusColor } from "@/lib/utils";

export const PromoCodesTable = ({ type }: { type: "SINGLE_USER" | "GLOBAL" }) => {
  const { mutate: deletePromoCode, isPending: isDeleting } = useDeletePromoCode();
  const userPromos = useGetUserPromoCodes();
  const globalPromos = useGetGlobalPromoCodes();
  const promoCodes = type === "SINGLE_USER" ? userPromos.data : globalPromos.data;
  const isLoading = type === "SINGLE_USER" ? userPromos.isLoading : globalPromos.isLoading;

  return (
    <div className="component mt-4 flex flex-col rounded-2xl border px-6 py-4">
      {isLoading ? (
        <div className="grid-default">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-8 w-full" key={i} />
          ))}
        </div>
      ) : promoCodes && promoCodes.length > 0 ? (
        <div className="grid-2">
          {promoCodes.map((pc: any) => (
            <div
              className="component flex flex-col gap-3 rounded-xl border p-6 transition hover:border-emerald-500 dark:hover:border-emerald-600"
              key={pc.id}
            >
              {/* Code */}
              <div className="flex flex-row items-center justify-start gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 p-3 text-white">
                  <Ticket className="size-7" />
                </div>
                <div>
                  <div className="font-mono font-semibold">{pc.code}</div>
                  {/* Status */}
                  <div>
                    {pc.isActive ? (
                      <span className={`rounded-full px-3 py-0.5 text-xs ${getStatusColor("ACTIVE")}`}>Активен</span>
                    ) : (
                      <span className={getStatusColor("INACTIVE")}>Истек</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Percentage */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Скидка:</span>
                <span className="text-lg font-bold text-emerald-500">{pc.discountPercentage}%</span>
              </div>
              {/* Owner */}
              {type === "SINGLE_USER" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Владелец:</span>
                  <span className="font-semibold">{pc.user?.firstName || pc.userId.substring(0, 8)}</span>
                </div>
              )}
              {/* Amount of usage */}
              {type === "GLOBAL" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Осталось:</span>
                  <span className="font-semibold">{pc.useAmount ?? "∞"}</span>
                </div>
              )}
              {/* Expiration date */}
              <div className="flex flex-col items-center justify-between sm:flex-row">
                <span className="text-muted-foreground">Действителен до:</span>
                <time className="font-semibold">{pc.expiresAt ? formatDate(pc.expiresAt) : "Бессрочный"}</time>
              </div>
              <Progress max={100} value={pc.discountPercentage} className="w-full" />
              {/* Delete btn */}
              <div className="text-right">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deletePromoCode(pc.id)}
                  disabled={isDeleting}
                  className="w-full"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 flex w-full items-center justify-center">
          <span className="subtitle-text">Промокоды не найдены.</span>
        </div>
      )}
    </div>
  );
};

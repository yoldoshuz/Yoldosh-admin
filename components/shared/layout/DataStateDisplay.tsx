"use client";

import { AlertCircle, FileSearch, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DataStateDisplayProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export const DataStateDisplay = ({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  loadingComponent,
  emptyMessage = "Данные не найдены",
  errorMessage = "Произошла ошибка при загрузке данных",
  children,
  className,
}: DataStateDisplayProps) => {
  // 1. Loading State
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 p-8 text-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка сервера</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Попробовать снова
          </Button>
        )}
      </div>
    );
  }

  // 3. Empty State
  if (isEmpty) {
    return (
      <div className="bg-muted/20 flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-4">
          <FileSearch className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold">{emptyMessage}</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          По вашему запросу ничего не найдено. Попробуйте изменить фильтры или зайдите позже.
        </p>
      </div>
    );
  }

  // 4. Success State
  return <div className={className}>{children}</div>;
};

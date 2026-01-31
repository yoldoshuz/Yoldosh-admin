"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Car, Phone, Search, UserRound } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllUsers } from "@/hooks/adminHooks";
import { baseUrl } from "@/lib/api";
import { User } from "@/types";

export const UsersSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500);

  const {
    data: userData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllUsers({ search: debouncedSearchTerm });

  const users = userData?.pages.flatMap((page) => page.users) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="title-text">Поиск пользователя</h1>
        <p className="subtitle-text">Найдите пользователя и просмотрите всю информацию о нем</p>
      </div>

      <div className="component border rounded-lg p-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, фамилии, номеру телефона..."
            className="component-dark pl-10 h-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-destructive">Не удалось загрузить пользователей. Попробуйте снова.</p>}

      {!isLoading && users && users.length > 0 && (
        <div>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg sm:text-xl font-semibold">Недавние пользователи</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Нажмите на карточку для просмотра</p>
          </div>
          <div className="grid-4 mt-4">
            {users.map((user: User) => (
              <Link href={`/admin/users-search/${user.id}`} key={user.id}>
                <Card className="flex flex-col gap-4 component border hover:border-emerald-500 dark:hover:border-emerald-600 transition rounded-xl p-6 shadow-lg">
                  <CardHeader className="flex flex-col justify-center items-center text-center">
                    <div className="relative">
                      {user.avatar ? (
                        <Image
                          src={baseUrl + user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          width={48}
                          height={48}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                          <UserRound className="w-8 h-8 text-white" />
                        </div>
                      )}
                      {user.isBanned && (
                        <div className="absolute bottom-0 -right-2 bg-destructive text-destructive-foreground text-white rounded-full px-2 py-1 text-xs leading-none">
                          Заб.
                        </div>
                      )}
                    </div>
                    <CardTitle className="mt-2">
                      <span className="font-bold">
                        {user.firstName} {user.lastName}
                      </span>
                    </CardTitle>
                    <p className="font-mono text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}</p>
                  </CardHeader>
                  <Separator orientation="horizontal" />
                  <CardContent className="text-center text-sm text-muted-foreground space-y-2 flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="size-3" />
                      <span>
                        {user.phoneNumber.replace(/^\+?(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5")}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Car className="w-4 h-4" />
                      <span>{user.role === "Driver" ? "Водитель" : "Пассажир"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-primary shadow-glow">
            {isFetchingNextPage ? "Загрузка..." : "Загрузить еще"}
          </Button>
        </div>
      )}

      {!isLoading && users?.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Пользователи не найдены.</p>
        </div>
      )}
    </div>
  );
};

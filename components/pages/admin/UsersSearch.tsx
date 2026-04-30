"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Car, Phone, Search, UserRound } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllUsers } from "@/hooks/adminHooks";
import { useBasePath } from "@/hooks/useBasePath";
import { baseUrl } from "@/lib/api";
import { RegistrationSourceKey, registrationSourceShortLabels } from "@/lib/utils";
import { User } from "@/types";

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Все источники" },
  { value: "user", label: "Сами" },
  { value: "from_bot", label: "Бот-импорт" },
  { value: "reg_bot", label: "Reg-бот" },
];

const VERIFIED_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Любой статус" },
  { value: "true", label: "Верифицирован" },
  { value: "false", label: "Не верифицирован" },
];

export const UsersSearch = () => {
  const base = useBasePath();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500);
  const [registrationSource, setRegistrationSource] = useState<string>("all");
  const [verified, setVerified] = useState<string>("all");

  const filters = useMemo(
    () => ({
      search: debouncedSearchTerm,
      registrationSource: registrationSource === "all" ? undefined : registrationSource,
      verified: verified === "all" ? undefined : verified,
    }),
    [debouncedSearchTerm, registrationSource, verified]
  );

  const {
    data: userData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllUsers(filters);

  const users = userData?.pages.flatMap((page) => page.users) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="title-text">Поиск пользователя</h1>
        <p className="subtitle-text">Найдите пользователя и просмотрите всю информацию о нем</p>
      </div>

      <div className="component rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Поиск по имени, фамилии, номеру телефона..."
              className="component-dark h-10 w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={registrationSource} onValueChange={setRegistrationSource}>
            <SelectTrigger className="component-dark h-10 w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={verified} onValueChange={setVerified}>
            <SelectTrigger className="component-dark h-10 w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERIFIED_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {isError && <p className="text-destructive">Не удалось загрузить пользователей. Попробуйте снова.</p>}

      {!isLoading && users && users.length > 0 && (
        <div>
          <div className="flex w-full items-center justify-between">
            <h1 className="text-lg font-semibold sm:text-xl">Недавние пользователи</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Нажмите на карточку для просмотра</p>
          </div>
          <div className="grid-4 mt-4">
            {users.map((user: User) => (
              <Link href={`/${base}/users-search/${user.id}`} key={user.id}>
                <Card className="component flex flex-col gap-4 rounded-xl border p-6 shadow-lg transition hover:border-emerald-500 dark:hover:border-emerald-600">
                  <CardHeader className="flex flex-col items-center justify-center text-center">
                    <div className="relative">
                      {user.avatar ? (
                        <Image
                          src={baseUrl + user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          width={48}
                          height={48}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                          <UserRound className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {user.isBanned && (
                        <div className="bg-destructive text-destructive-foreground absolute -right-2 bottom-0 rounded-full px-2 py-1 text-xs leading-none text-white">
                          Заб.
                        </div>
                      )}
                    </div>
                    <CardTitle className="mt-2">
                      <span className="font-bold">
                        {user.firstName} {user.lastName}
                      </span>
                    </CardTitle>
                    <p className="text-muted-foreground font-mono text-xs">ID: {user?.id.substring(0, 8)}</p>
                  </CardHeader>
                  <Separator orientation="horizontal" />
                  <CardContent className="text-muted-foreground flex grow flex-col justify-center space-y-2 text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="size-3" />
                      <span>
                        {user.phoneNumber?.replace(/^\+?(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5")}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Car className="h-4 w-4" />
                      <span>{user.role === "Driver" ? "Водитель" : "Пассажир"}</span>
                    </div>
                    {user.registration_source && (
                      <span className="bg-muted inline-flex items-center gap-1 self-center rounded-md px-2 py-0.5 text-[10px] tracking-wider uppercase">
                        {registrationSourceShortLabels[user.registration_source as RegistrationSourceKey] ??
                          user.registration_source}
                      </span>
                    )}
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
        <div className="py-10 text-center">
          <p className="text-muted-foreground">Пользователи не найдены.</p>
        </div>
      )}
    </div>
  );
};

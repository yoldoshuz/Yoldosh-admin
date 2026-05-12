"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AirVent,
  BadgeCheck,
  Ban,
  Cake,
  Calendar,
  Car,
  ChevronLeft,
  Cigarette,
  Compass,
  Dog,
  IdCard,
  Languages,
  Mail,
  Megaphone,
  Music,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Star,
  Ticket,
  User,
  Wallet,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { BookingCard, CarCard, ReportCard, TripCard, UserDetailsSkeleton } from "@/components/shared/user/UserItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBanUser, useGetUserDetails, useUnbanUser } from "@/hooks/adminHooks";
import { useBasePath } from "@/hooks/useBasePath";
import { banUserSchema } from "@/lib/schemas";
import { formatDate, formatDocUrl, isRealImagePath, registrationSourceLabels } from "@/lib/utils";

/* --------------------------- helpers --------------------------- */
const formatPhone = (phone?: string | null) =>
  phone ? phone.replace(/^\+?(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5") : "—";

type StatTone = "neutral" | "good" | "bad" | "warn";
const toneClass: Record<StatTone, string> = {
  neutral: "",
  good: "text-emerald-600 dark:text-emerald-400",
  bad: "text-red-600 dark:text-red-400",
  warn: "text-amber-600 dark:text-amber-400",
};

const StatChip = ({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
}) => (
  <div className="component-dark flex items-center gap-2 rounded-lg border p-2">
    <span className="text-muted-foreground shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">{label}</p>
      <p className={`truncate text-sm font-semibold ${toneClass[tone]}`}>{value || "—"}</p>
    </div>
  </div>
);

const FullKV = ({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Да"
          : "Нет"
        : value;
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed py-0.5 text-xs">
      <span className="text-muted-foreground inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-right break-all ${mono ? "font-mono" : ""}`}>{display}</span>
    </div>
  );
};

const ToggleChip = ({ icon, label, on }: { icon: React.ReactNode; label: string; on?: boolean | null }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
      on
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        : "bg-muted text-muted-foreground"
    }`}
  >
    {icon}
    {label}
  </span>
);

/* ============================== Page ============================== */
export const UserDetail = ({ userId }: { userId: string }) => {
  const base = useBasePath();
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const { data: user, isLoading, isError } = useGetUserDetails(userId);
  const { mutate: banUser, isPending: isBanning } = useBanUser();
  const { mutate: unbanUser, isPending: isUnbanning } = useUnbanUser();

  const form = useForm<z.infer<typeof banUserSchema>>({
    resolver: zodResolver(banUserSchema),
    defaultValues: { userId, reason: "", durationInDays: undefined },
  });

  const onBanSubmit = (values: z.infer<typeof banUserSchema>) => {
    banUser(values, {
      onSuccess: () => {
        setIsBanDialogOpen(false);
        form.reset();
      },
    });
  };

  if (isLoading) return <UserDetailsSkeleton />;
  if (isError || !user) return <div className="text-destructive">Не удалось загрузить данные пользователя.</div>;

  const totalSpent =
    user.bookingsAsPassenger?.reduce((acc: any, booking: any) => {
      if (booking.status === "COMPLETED") return acc + parseFloat(booking.totalPrice);
      return acc;
    }, 0) || 0;

  const tripsCount = user.role === "Driver" ? user.drivenTrips?.length || 0 : user.bookingsAsPassenger?.length || 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <Toaster richColors />

      <Link href={`/${base}/users-search`} className="flex items-center gap-2 text-sm text-emerald-500 hover:underline">
        <ChevronLeft className="size-4" />
        <span>Назад к пользователям</span>
      </Link>

      {/* ============================ HERO ============================ */}
      <Card className="component shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {isRealImagePath(user.avatar) ? (
                <Image
                  src={formatDocUrl(user.avatar)}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={80}
                  height={80}
                  className="size-20 rounded-full border object-cover"
                />
              ) : (
                <div className="bg-muted flex size-20 items-center justify-center rounded-full border">
                  <User className="text-muted-foreground size-9" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="title-text truncate">
                  {user.firstName} {user.lastName || ""}
                </h1>
                <p className="text-muted-foreground font-mono text-xs break-all">{user.id}</p>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" /> {formatPhone(user.phoneNumber)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3" /> {formatDate(user.createdAt)}
                  </span>
                  {user.preferredLanguage && (
                    <span className="inline-flex items-center gap-1">
                      <Languages className="size-3" /> {user.preferredLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      user.isBanned
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {user.isBanned ? "Заблокирован" : "Активен"}
                  </span>
                  <span className="bg-muted rounded-full px-2 py-0.5 text-[10px] font-medium">{user.role || "—"}</span>
                  {user.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                      <BadgeCheck className="size-3" /> Телефон
                    </span>
                  )}
                  {user.passport_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                      <BadgeCheck className="size-3" /> Паспорт
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user.isBanned ? (
                <Button
                  variant="outline"
                  disabled={isUnbanning}
                  onClick={() => {
                    if (window.confirm("Снять блокировку с этого пользователя?")) unbanUser(userId);
                  }}
                  className="gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isUnbanning ? "Разбан..." : "Разбанить"}
                </Button>
              ) : (
                <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Заблокировать
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Заблокировать {user.firstName}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onBanSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Причина</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Причина блокировки..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="durationInDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Срок (в днях, необязательно)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Например, 7"
                                  {...field}
                                  value={field.value === undefined || field.value === null ? "" : field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" variant="destructive" disabled={isBanning}>
                          {isBanning ? "Блокировка..." : "Заблокировать"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && <p className="text-muted-foreground bg-muted/40 rounded-md p-3 text-sm italic">«{user.bio}»</p>}

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <StatChip
              icon={<Star className="size-4" />}
              label="Рейтинг"
              value={user.rating ? user.rating.toFixed(1) : "—"}
              tone="warn"
            />
            <StatChip
              icon={<Wallet className="size-4" />}
              label="Баланс"
              value={`${Number(user.wallet?.balance || 0).toLocaleString("ru-RU")} ${user.wallet?.currency || "UZS"}`}
            />
            <StatChip
              icon={<Car className="size-4" />}
              label={user.role === "Driver" ? "Поездок" : "Бронирований"}
              value={tripsCount}
            />
            <StatChip
              icon={<Wallet className="size-4" />}
              label="Потрачено"
              value={`${totalSpent.toLocaleString("ru-RU")} UZS`}
            />
            <StatChip
              icon={<Ticket className="size-4" />}
              label="Промокод"
              value={user.isHavePromocode ? "Есть" : "Нет"}
              tone={user.isHavePromocode ? "good" : "neutral"}
            />
            <StatChip
              icon={<IdCard className="size-4" />}
              label="Вод. удостоверение"
              value={user.passport_verified ? "OK" : "Нет"}
              tone={user.passport_verified ? "good" : "bad"}
            />
          </div>

          {/* Preferences */}
          <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
            <span className="text-muted-foreground text-[10px] uppercase">Предпочтения:</span>
            <ToggleChip icon={<Music className="size-3" />} label="Музыка" on={user.music_allowed} />
            <ToggleChip icon={<AirVent className="size-3" />} label="Кондиц." on={user.conditioner} />
            <ToggleChip icon={<Dog className="size-3" />} label="Питомцы" on={user.pets_allowed} />
            <ToggleChip icon={<Megaphone className="size-3" />} label="Общит." on={user.talkative} />
            <ToggleChip icon={<Cigarette className="size-3" />} label="Курение" on={user.smoking_allowed} />
          </div>

          {/* Ban info */}
          {user.isBanned && (
            <div className="flex items-start gap-2 rounded-lg bg-red-100/40 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <Ban className="mt-0.5 size-4 shrink-0" />
              <div className="text-xs">
                <p>
                  <span className="font-semibold">Причина:</span> {user.banReason || "—"}
                </p>
                <p>
                  <span className="font-semibold">До:</span>{" "}
                  {user.banExpiresAt ? formatDate(user.banExpiresAt) : "бессрочно"}
                </p>
              </div>
            </div>
          )}

          {/* Полная информация — all remaining API fields */}
          <details className="border-t pt-2 text-xs" open>
            <summary className="text-muted-foreground cursor-pointer text-[10px] tracking-wide uppercase">
              Полная информация
            </summary>
            <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
              <FullKV
                icon={<User className="size-3" />}
                label="Имя"
                value={`${user.firstName ?? "—"} ${user.lastName ?? ""}`}
              />
              <FullKV icon={<Phone className="size-3" />} label="Телефон" value={user.phoneNumber} />
              <FullKV icon={<Sprout className="size-3" />} label="Пол" value={user.gender} />
              <FullKV icon={<Cake className="size-3" />} label="Дата рождения" value={user.date_of__birthday} />
              <FullKV icon={<Star className="size-3" />} label="Рейтинг" value={user.rating} />
              <FullKV icon={<User className="size-3" />} label="Роль" value={user.role} />
              <FullKV icon={<Languages className="size-3" />} label="Язык" value={user.preferredLanguage} />
              <FullKV icon={<Compass className="size-3" />} label="Навигатор" value={user.preferred_navigator} />
              <FullKV
                icon={<User className="size-3" />}
                label="Источник рег."
                value={
                  user.registration_source
                    ? (registrationSourceLabels as any)[user.registration_source] || user.registration_source
                    : "—"
                }
              />
              <FullKV
                icon={<BadgeCheck className="size-3" />}
                label="Тел. верифиц."
                value={user.verified ? "Да" : "Нет"}
              />
              <FullKV
                icon={<IdCard className="size-3" />}
                label="Паспорт верифиц."
                value={user.passport_verified ? "Да" : "Нет"}
              />
              <FullKV icon={<Ban className="size-3" />} label="Заблокирован" value={user.isBanned ? "Да" : "Нет"} />
              <FullKV
                icon={<Ticket className="size-3" />}
                label="Промокод"
                value={user.isHavePromocode ? "Да" : "Нет"}
              />
              <FullKV
                icon={<Wallet className="size-3" />}
                label="Кошелёк (ID)"
                value={user.wallet?.id?.slice(0, 8) || "—"}
                mono
              />
              <FullKV
                icon={<Wallet className="size-3" />}
                label="Кошелёк баланс"
                value={`${Number(user.wallet?.balance || 0).toLocaleString("ru-RU")} ${user.wallet?.currency || ""}`}
              />
              <FullKV
                icon={<Calendar className="size-3" />}
                label="Кошелёк создан"
                value={formatDate(user.wallet?.createdAt)}
              />
              <FullKV icon={<Calendar className="size-3" />} label="Создан" value={formatDate(user.createdAt)} />
              <FullKV icon={<Calendar className="size-3" />} label="Обновлён" value={formatDate(user.updatedAt)} />
              {user.deletedAt && (
                <FullKV
                  icon={<Calendar className="size-3" />}
                  label="Удалён (soft)"
                  value={formatDate(user.deletedAt)}
                />
              )}
              <FullKV
                icon={<User className="size-3" />}
                label="ID"
                value={<span className="font-mono">{user.id}</span>}
              />
            </div>
          </details>

          {/* Notification preferences */}
          {user.notificationPreferences && (
            <details className="text-muted-foreground border-t pt-2 text-xs">
              <summary className="cursor-pointer text-[10px] tracking-wide uppercase">Настройки уведомлений</summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(user.notificationPreferences).map(([key, value]) => (
                  <ToggleChip key={key} icon={<Mail className="size-3" />} label={key} on={!!value} />
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* ============================ TABS ============================ */}
      <Tabs defaultValue="trips">
        <TabsList className="grid w-full grid-cols-3 sm:max-w-md">
          <TabsTrigger value="trips">{user.role === "Driver" ? "Поездки" : "Бронирования"}</TabsTrigger>
          <TabsTrigger value="cars">Машины</TabsTrigger>
          <TabsTrigger value="reports">Жалобы</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-3 space-y-2">
          {user.role === "Driver" ? (
            user.drivenTrips?.length ? (
              user.drivenTrips.map((trip: any) => <TripCard key={trip.id} trip={trip} />)
            ) : (
              <p className="text-muted-foreground p-4 text-center text-sm">У водителя нет поездок.</p>
            )
          ) : user.bookingsAsPassenger?.length ? (
            user.bookingsAsPassenger.map((booking: any) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <p className="text-muted-foreground p-4 text-center text-sm">У пассажира нет поездок.</p>
          )}
        </TabsContent>

        <TabsContent value="cars" className="mt-3 space-y-2">
          {user.cars?.length ? (
            user.cars.map((car: any) => <CarCard key={car.id} car={car} />)
          ) : (
            <p className="text-muted-foreground p-4 text-center text-sm">У пользователя нет машин.</p>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-3 space-y-3">
          {user.receivedReports?.length ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-[10px] uppercase">Полученные жалобы</p>
              {user.receivedReports.map((report: any) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground p-4 text-center text-sm">На пользователя нет жалоб.</p>
          )}
          {user.submittedReports?.length ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-[10px] uppercase">Отправленные жалобы</p>
              {user.submittedReports.map((report: any) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};

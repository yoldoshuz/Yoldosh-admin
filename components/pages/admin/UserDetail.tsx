"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AirVent,
  Ban,
  Calendar,
  Car,
  ChevronLeft,
  Cigarette,
  Dog,
  IdCard,
  Info,
  Mail,
  Megaphone,
  MessageSquare,
  Music,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  BookingCard,
  CarCard,
  InfoItem,
  ReportCard,
  TripCard,
  UserDetailsSkeleton,
} from "@/components/shared/user/UserItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBanUser, useGetUserDetails } from "@/hooks/adminHooks";
import { baseUrl } from "@/lib/api";
import { banUserSchema } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

export const UserDetail = ({ userId }: { userId: string }) => {
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const { data: user, isLoading, isError } = useGetUserDetails(userId);
  const { mutate: banUser, isPending: isBanning } = useBanUser();

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
      if (booking.status === "COMPLETED") {
        return acc + parseFloat(booking.totalPrice);
      }
      return acc;
    }, 0) || 0;

  return (
    <div className="flex flex-col gap-6">
      <Toaster richColors />
      <Link href="/admin/users-search" className="flex items-center gap-2 w-full text-emerald-500 hover:underline">
        <ChevronLeft className="size-5" />
        <span>Назад к пользователям</span>
      </Link>

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <Image
              src={baseUrl + user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              width={64}
              height={64}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="title-text">
              {user.firstName} {user.lastName || ""}
            </h1>
            <p className="subtitle-text font-mono">ID: {user.id}</p>
            <p className="text-sm text-muted-foreground">Регистрация: {formatDate(user.createdAt)}</p>
            <p className="text-sm text-muted-foreground">Роль: {user.role || "—"}</p>
          </div>
        </div>

        {/* BAN BUTTON */}
        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={user.isBanned}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              {user.isBanned ? "Заблокирован" : "Заблокировать"}
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
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
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
      </div>

      {/* USER INFO */}
      <Card className="component shadow-none">
        <CardTitle className="px-6">Общая информация</CardTitle>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoItem
            icon={<ShieldAlert />}
            label="Статус"
            value={user.isBanned ? "Заблокирован" : "Активен"}
            valueClassName={user.isBanned ? "text-red-500" : "text-green-500"}
          />
          <InfoItem icon={<Phone />} label="Телефон" value={user.phoneNumber} />
          <InfoItem
            icon={<Wallet />}
            label="Баланс"
            value={`${Number(user.wallet?.balance || 0).toLocaleString("ru-RU", {
              style: "currency",
              currency: user.wallet?.currency || "UZS",
            })}`}
          />
          <InfoItem
            icon={<Car />}
            label="Поездок"
            value={user.role === "Driver" ? user.drivenTrips?.length || 0 : user.bookingsAsPassenger?.length || 0}
          />
          <InfoItem icon={<Info />} label="Рейтинг" value={user.rating ? user.rating.toFixed(1) : "—"} />
          <InfoItem icon={<MessageSquare />} label="Биография" value={user.bio || "—"} />
          <InfoItem
            icon={<Ticket />}
            label="Промокод"
            value={user.isHavePromocode ? "Есть" : "Нет"}
            valueClassName={user.isHavePromocode ? "text-green-500" : "text-red-500"}
          />
          <InfoItem
            icon={<ShieldCheck />}
            label="Верифицирован"
            value={user.verified ? "Верифицирован" : "Не верифицирован"}
            valueClassName={user.verified ? "text-green-500" : "text-red-500"}
          />
          <InfoItem
            icon={<IdCard />}
            label="Водительское удовостоверние"
            value={user.passport_verified ? "Верифицирован" : "Не верифицирован"}
            valueClassName={user.passport_verified ? "text-green-500" : "text-red-500"}
          />
        </CardContent>
      </Card>

      {user.isBanned ? (
        <Card className="component shadow-none">
          <CardTitle className="px-6">Информация о блокировке</CardTitle>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <InfoItem
              icon={<Calendar />}
              label="Блокировка до"
              value={user.banExpiresAt ? formatDate(user.banExpiresAt) : "Не установлено"}
            />
            <InfoItem icon={<Ban />} label="Причина блокировки" value={user.banReason || "—"} />
          </CardContent>
        </Card>
      ) : null}

      {/* NOTIFICATION SETTINGS */}
      {user.notificationPreferences && (
        <Card className="component shadow-none">
          <CardTitle className="px-6">Настройки уведомлений</CardTitle>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(user.notificationPreferences).map(([key, value]) => (
              <InfoItem
                key={key}
                icon={<Mail />}
                label={key}
                value={value ? "Вкл." : "Выкл."}
                valueClassName={value ? "text-green-500" : "text-red-500"}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* PREFERENSES */}
      <Card className="component shadow-none">
        <CardTitle className="px-6">Предпочтения</CardTitle>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <InfoItem
            icon={<Music />}
            label="Музыка"
            value={user.music_allowed ? "Можно" : "Нельзя"}
            valueClassName={user.music_allowed ? "text-green-500" : "text-red-500"}
          />
          <InfoItem
            icon={<AirVent />}
            label="Кондиционер"
            value={user.conditioner ? "Можно" : "Нельзя"}
            valueClassName={user.conditioner ? "text-green-500" : "text-red-500"}
          />
          <InfoItem
            icon={<Dog />}
            label="Питомцы"
            value={user.pets_allowed ? "Можно" : "Нельзя"}
            valueClassName={user.pets_allowed ? "text-green-500" : "text-red-500"}
          />
          <InfoItem
            icon={<Megaphone />}
            label="Общительность"
            value={user.talkative ? "Общительный" : "Не общительный"}
            valueClassName={user.talkative ? "text-green-500" : "text-red-500"}
          />
          <InfoItem
            icon={<Cigarette />}
            label="Курение"
            value={user.smoking_allowed ? "Можно" : "Нельзя"}
            valueClassName={user.smoking_allowed ? "text-green-500" : "text-red-500"}
          />
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs defaultValue="trips">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trips">{user.role === "Driver" ? "Поездки водителя" : "Поездки пассажира"}</TabsTrigger>
          <TabsTrigger value="cars">Машины</TabsTrigger>
          <TabsTrigger value="reports">Жалобы</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4 mt-4">
          {user.role === "Driver" ? (
            user.drivenTrips?.length ? (
              user.drivenTrips.map((trip: any) => <TripCard key={trip.id} trip={trip} />)
            ) : (
              <p className="text-muted-foreground p-4 text-center">У водителя нет поездок.</p>
            )
          ) : user.bookingsAsPassenger?.length ? (
            user.bookingsAsPassenger.map((booking: any) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <p className="text-muted-foreground p-4 text-center">У пассажира нет поездок.</p>
          )}
        </TabsContent>

        <TabsContent value="cars" className="space-y-4 mt-4">
          {user.cars?.length ? (
            user.cars.map((car: any) => <CarCard key={car.id} car={car} />)
          ) : (
            <p className="text-muted-foreground p-4 text-center">У пользователя нет машин.</p>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          {user.receivedReports?.length ? (
            user.receivedReports.map((report: any) => <ReportCard key={report.id} report={report} />)
          ) : (
            <p className="text-muted-foreground p-4 text-center">На пользователя нет жалоб.</p>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Separator />
          {user.submittedReports?.length ? (
            user.submittedReports.map((report: any) => <ReportCard key={report.id} report={report} />)
          ) : (
            <p className="text-muted-foreground p-4 text-center">У пользователя нет жалоб.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

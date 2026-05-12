"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Ban,
  Cake,
  Calendar,
  Car as CarIcon,
  Check,
  Image as ImageIcon,
  Info,
  Languages,
  Phone,
  Send,
  Star,
  User as UserIcon,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useBasePath } from "@/hooks/useBasePath";
import { rejectionSchema } from "@/lib/schemas";
import { formatDate, formatDocUrl, getStatusColor, isRealImagePath } from "@/lib/utils";
import { ApplicationCar, CarApplication } from "@/types";

const formatPhone = (phone?: string | null) =>
  phone ? phone.replace(/^\+?(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5") : "—";

const fullName = (app: CarApplication) => {
  const fromApp = [app.last_name, app.first_name, app.middle_name].filter(Boolean).join(" ");
  if (fromApp.trim()) return fromApp;
  const fromUser = [app.user?.lastName, app.user?.firstName].filter(Boolean).join(" ");
  return fromUser.trim() || "Без имени";
};

const genderShort: Record<string, string> = { MALE: "М", FEMALE: "Ж", OTHER: "—" };

/* ----------------------------- Photo viewer ---------------------------- */
const Photo = ({
  src,
  label,
  ratio = "aspect-[4/3]",
  empty,
}: {
  src?: string | null;
  label: string;
  ratio?: string;
  empty?: string;
}) => {
  if (!isRealImagePath(src)) {
    return (
      <div
        className={`bg-muted/40 text-muted-foreground flex w-full flex-col items-center justify-center rounded-lg border border-dashed text-[10px] ${ratio}`}
      >
        <ImageIcon className="mb-1 h-4 w-4" />
        <span className="px-2 text-center">{empty || "Нет фото"}</span>
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`group relative w-full overflow-hidden rounded-lg border transition hover:border-emerald-500 hover:shadow-md ${ratio}`}
          aria-label={label}
        >
          <Image
            src={formatDocUrl(src)}
            alt={label}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover transition group-hover:scale-[1.03]"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-1 text-left text-[10px] font-medium tracking-wide text-white uppercase">
            {label}
          </span>
          <span className="absolute top-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] text-white">
            Открыть
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <Image
          src={formatDocUrl(src)}
          alt={label}
          className="max-h-[85vh] w-full rounded-lg object-contain"
          width={2048}
          height={2048}
        />
      </DialogContent>
    </Dialog>
  );
};

/* ----------------------------- KV row helper --------------------------- */
const KV = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-2 text-[11.5px] leading-tight">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-foreground text-right ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
  </div>
);

/* ------------------------------ Chip badges --------------------------- */
type ChipTone = "emerald" | "red" | "amber" | "slate" | "sky" | "violet";
const Chip = ({ tone = "slate", children }: { tone?: ChipTone; children: React.ReactNode }) => {
  const map: Record<ChipTone, string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    slate: "bg-muted text-muted-foreground",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${map[tone]}`}
    >
      {children}
    </span>
  );
};

/* ============================== Application Card ====================== */
export const ApplicationCard = ({
  application,
  onApprove,
  onReject,
  isUpdating,
}: {
  application: CarApplication;
  onApprove: (carId: string) => void;
  onReject: (carId: string, reason: string) => void;
  isUpdating: boolean;
}) => {
  const base = useBasePath();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [activeCarIndex, setActiveCarIndex] = useState(0);

  const form = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { reason: "" },
  });

  const handleRejectSubmit = (values: z.infer<typeof rejectionSchema>) => {
    onReject(application.id, values.reason);
    setIsRejectDialogOpen(false);
    form.reset();
  };

  const user = application.user;
  const cars: ApplicationCar[] = user?.cars ?? [];
  const activeCar = cars[activeCarIndex];

  return (
    <article className="component w-full overflow-hidden rounded-2xl border shadow-sm transition hover:border-emerald-500 dark:hover:border-emerald-600">
      {/* ============================== TOP STRIPE ============================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <Link href={`/${base}/users-search/${application.user_id}`} className="group flex min-w-0 items-center gap-3">
          {isRealImagePath(user?.avatar) ? (
            <Image
              src={formatDocUrl(user!.avatar)}
              alt={fullName(application)}
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full border object-cover"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-full border">
              <UserIcon className="size-5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="link-text truncate text-[15px] leading-tight font-semibold group-hover:underline">
              {fullName(application)}
            </h2>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" /> {formatPhone(application.phone)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" /> {formatDate(application.createdAt)}
              </span>
              <span className="font-mono text-[10px] opacity-70">#{application.id.slice(0, 8)}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* chips */}
          <div className="hidden flex-wrap items-center gap-1 md:flex">
            {user?.rating != null && (
              <Chip tone="amber">
                <Star className="size-3" /> {user.rating.toFixed(1)}
              </Chip>
            )}
            {user?.role && <Chip tone={user.role === "Driver" ? "sky" : "slate"}>{user.role}</Chip>}
            <Chip tone={user?.verified ? "emerald" : "slate"}>
              <BadgeCheck className="size-3" /> Phone {user?.verified ? "✓" : "✗"}
            </Chip>
            <Chip tone={user?.passport_verified ? "emerald" : "slate"}>
              <BadgeCheck className="size-3" /> Pass {user?.passport_verified ? "✓" : "✗"}
            </Chip>
            {user?.isBanned && (
              <Chip tone="red">
                <Ban className="size-3" /> BAN
              </Chip>
            )}
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${getStatusColor(application.status)}`}
          >
            {application.status}
          </span>

          {application.status === "PENDING" && (
            <div className="flex items-center gap-1.5">
              <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="destructive" disabled={isUpdating} aria-label="Отклонить">
                    <X />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Отказ заявки</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleRejectSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Причина отказа</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Объясните почему заявка отказывается..."
                                {...field}
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="ghost">
                            Отмена
                          </Button>
                        </DialogClose>
                        <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                          <Send className="mr-1 h-4 w-4" /> Отправить отказ
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button
                size="icon"
                variant="outline"
                className="btn-primary shadow-glow"
                onClick={() => onApprove(application.id)}
                disabled={isUpdating}
                aria-label="Подтвердить"
              >
                <Check />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* chips on mobile */}
      {user && (
        <div className="flex flex-wrap items-center gap-1 border-b px-4 py-2 md:hidden">
          {user.rating != null && (
            <Chip tone="amber">
              <Star className="size-3" /> {user.rating.toFixed(1)}
            </Chip>
          )}
          {user.role && <Chip tone={user.role === "Driver" ? "sky" : "slate"}>{user.role}</Chip>}
          <Chip tone={user.verified ? "emerald" : "slate"}>Phone {user.verified ? "✓" : "✗"}</Chip>
          <Chip tone={user.passport_verified ? "emerald" : "slate"}>Pass {user.passport_verified ? "✓" : "✗"}</Chip>
          {user.isBanned && (
            <Chip tone="red">
              <Ban className="size-3" /> BAN
            </Chip>
          )}
        </div>
      )}

      {/* ============================== BODY ================================ */}
      <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
        {/* ---------------- LEFT: photos strip + key tech specs ------------- */}
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {/* Car selector pills */}
          {cars.length > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-muted-foreground text-[10px] uppercase">Авто:</span>
              {cars.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCarIndex(i)}
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition ${
                    i === activeCarIndex ? "border-emerald-500 bg-emerald-500 text-white" : "hover:border-emerald-500"
                  }`}
                >
                  {c.govNumber || `#${i + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* 3-up photo strip (license now lives on Car too — prefer per-car copy, fall back to app) */}
          <div className="grid grid-cols-3 gap-2">
            <Photo
              src={activeCar?.licenseFrontPath || application.licenseFrontPath}
              label="Вод. удостов."
              empty="Нет прав"
            />
            <Photo src={activeCar?.techPassportFrontPath} label="Тех. паспорт — лицо" empty="Нет тех.пасп." />
            <Photo src={activeCar?.techPassportBackPath} label="Тех. паспорт — оборот" empty="Нет тех.пасп." />
          </div>

          {/* Active car specs */}
          {activeCar ? (
            <div className="component-dark rounded-xl border p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CarIcon className="text-muted-foreground size-4" />
                  <span className="text-sm font-semibold">
                    {activeCar.make || "—"} {activeCar.model || ""}
                  </span>
                  {activeCar.govNumber && (
                    <span className="bg-background rounded-md border px-2 py-0.5 font-mono text-[11px]">
                      {activeCar.govNumber}
                    </span>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(activeCar.status)}`}
                >
                  {activeCar.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                <KV label="Цвет" value={activeCar.color} />
                <KV label="Мест" value={activeCar.seats ?? "—"} />
                <KV label="Серия т.п." value={activeCar.techPassportSerial} mono />
                <KV label="Выдан" value={activeCar.issueDate} />
                <KV label="ID авто" value={activeCar.id.slice(0, 8)} mono />
                <KV label="Создан" value={formatDate(activeCar.createdAt)} />
                <KV label="PINFL (вод.)" value={activeCar.licensePinfl || application.licensePinfl} mono />
                <KV label="Категория" value={activeCar.typeOfLicence || application.typeOfLicence} />
              </div>

              {activeCar.rejectionReason && (
                <div className="mt-2 flex items-start gap-1 rounded-md bg-red-100/40 p-2 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>Отказ: {activeCar.rejectionReason}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground bg-muted/20 flex items-center justify-center rounded-lg border border-dashed py-6 text-xs">
              Водитель ещё не добавил авто
            </div>
          )}
        </div>

        {/* ---------------- RIGHT: driver passport panel ------------------- */}
        <div className="flex flex-col gap-3 border-t bg-[var(--muted)]/30 p-4 sm:p-5 lg:border-t-0 lg:border-l">
          {/* License block — top-level (заявка). Per-car copy shown inside car block. */}
          <section>
            <header className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-wider uppercase">
              Водительское удостоверение (заявка)
            </header>
            <div className="grid grid-cols-1 gap-y-1">
              <KV label="PINFL" value={application.licensePinfl} mono />
              <KV label="Категория" value={application.typeOfLicence} />
            </div>
          </section>

          {/* Driver block */}
          {user ? (
            <section>
              <header className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-wider uppercase">
                Водитель
              </header>
              <div className="grid grid-cols-1 gap-y-1">
                <KV
                  label="Пол / ДР"
                  value={
                    <span className="inline-flex items-center gap-1">
                      {user.gender ? genderShort[user.gender] || user.gender : "—"}
                      {user.date_of__birthday && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <Cake className="size-3" />
                          {user.date_of__birthday}
                        </>
                      )}
                    </span>
                  }
                />
                <KV
                  label="Язык / Навигатор"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Languages className="size-3" />
                      {(user.preferredLanguage || "—").toUpperCase()}
                      <span className="text-muted-foreground">·</span>
                      {user.preferred_navigator || "—"}
                    </span>
                  }
                />
                <KV label="Источник рег." value={user.registration_source} />
                <KV label="Регистрация" value={formatDate(user.createdAt)} />
                <KV label="Промокод" value={user.isHavePromocode ? "Есть" : "Нет"} />
                <KV
                  label="Предпочтения"
                  value={
                    <span className="inline-flex items-center gap-1.5 text-[10.5px]">
                      <span title="Музыка">{user.music_allowed ? "🎵" : "🔇"}</span>
                      <span title="Питомцы">{user.pets_allowed ? "🐾" : "🚫"}</span>
                      <span title="Общительный">{user.talkative ? "💬" : "🤫"}</span>
                    </span>
                  }
                />
              </div>
              {user.bio && (
                <p className="text-muted-foreground bg-muted/40 mt-2 rounded-md p-2 text-[11px] italic">«{user.bio}»</p>
              )}
              {user.isBanned && user.banReason && (
                <div className="mt-2 flex items-start gap-1 rounded-md bg-red-100/40 p-2 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <Ban className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    Бан: {user.banReason}
                    {user.banExpiresAt && ` (до ${formatDate(user.banExpiresAt)})`}
                  </span>
                </div>
              )}
            </section>
          ) : (
            <div className="flex items-start gap-2 rounded-md bg-amber-100/40 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Связанный пользователь не найден (возможно, удалён).</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

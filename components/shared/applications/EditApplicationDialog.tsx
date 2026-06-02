"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateApplicationFull } from "@/hooks/adminHooks";
import { ApplicationCar, CarApplication } from "@/types";

/* ---------- Zod schema ---------- */
const editSchema = z.object({
  // DriverApplication
  app_first_name: z.string().min(1, "Обязательное поле").max(32),
  app_last_name: z.string().max(32).optional().or(z.literal("")),
  app_middle_name: z.string().max(32).optional().or(z.literal("")),
  app_phone: z
    .string()
    .regex(/^\+998[0-9]{9}$/, "Формат: +998XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  app_licensePinfl: z.string().max(14).optional().or(z.literal("")),
  app_typeOfLicence: z.string().max(1).optional().or(z.literal("")),

  // Car
  car_govNumber: z.string().max(15).optional().or(z.literal("")),
  car_make: z.string().max(64).optional().or(z.literal("")),
  car_model: z.string().max(64).optional().or(z.literal("")),
  car_color: z.string().max(64).optional().or(z.literal("")),
  car_seats: z.number().int().min(1).max(20).optional(),
  car_techPassportSerial: z.string().max(10).optional().or(z.literal("")),
  car_issueDate: z.string().optional().or(z.literal("")),
  car_licensePinfl: z.string().max(14).optional().or(z.literal("")),
  car_typeOfLicence: z.string().max(1).optional().or(z.literal("")),

  // User
  user_firstName: z.string().min(1, "Обязательное поле").max(32),
  user_lastName: z.string().max(32).optional().or(z.literal("")),
  user_bio: z.string().max(128).optional().or(z.literal("")),
  user_gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  user_date_of__birthday: z.string().optional().or(z.literal("")),
  user_preferredLanguage: z.enum(["ru", "uz", "en"]).optional(),
  user_preferred_navigator: z.enum(["YANDEX_NAVI", "GOOGLE_MAPS", "NONE"]).optional(),
  user_talkative: z.boolean().optional(),
  user_music_allowed: z.boolean().optional(),
  user_pets_allowed: z.boolean().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

/* ---------- helpers ---------- */
const strip = (v: string | undefined) => (v === "" ? undefined : v);

interface Props {
  application: CarApplication;
  activeCar?: ApplicationCar;
}

export const EditApplicationDialog = ({ application, activeCar }: Props) => {
  const [open, setOpen] = useState(false);
  const { mutate: updateFull, isPending } = useUpdateApplicationFull();
  const user = application.user;

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      // Application
      app_first_name: application.first_name ?? "",
      app_last_name: application.last_name ?? "",
      app_middle_name: application.middle_name ?? "",
      app_phone: application.phone ?? "",
      app_licensePinfl: application.licensePinfl ?? "",
      app_typeOfLicence: application.typeOfLicence ?? "",

      // Car
      car_govNumber: activeCar?.govNumber ?? "",
      car_make: activeCar?.make ?? "",
      car_model: activeCar?.model ?? "",
      car_color: activeCar?.color ?? "",
      car_seats: activeCar?.seats ?? undefined,
      car_techPassportSerial: activeCar?.techPassportSerial ?? "",
      car_issueDate: activeCar?.issueDate ?? "",
      car_licensePinfl: activeCar?.licensePinfl ?? "",
      car_typeOfLicence: activeCar?.typeOfLicence ?? "",

      // User
      user_firstName: user?.firstName ?? "",
      user_lastName: user?.lastName ?? "",
      user_bio: user?.bio ?? "",
      user_gender: (user?.gender as any) ?? undefined,
      user_date_of__birthday: user?.date_of__birthday ?? "",
      user_preferredLanguage: (user?.preferredLanguage as any) ?? undefined,
      user_preferred_navigator: (user?.preferred_navigator as any) ?? undefined,
      user_talkative: user?.talkative ?? false,
      user_music_allowed: user?.music_allowed ?? false,
      user_pets_allowed: user?.pets_allowed ?? false,
    },
  });

  const onSubmit = (values: EditFormValues) => {
    updateFull(
      {
        applicationId: application.id,

        application: {
          first_name: strip(values.app_first_name),
          last_name: strip(values.app_last_name),
          middle_name: strip(values.app_middle_name),
          phone: strip(values.app_phone),
          licensePinfl: strip(values.app_licensePinfl),
          typeOfLicence: strip(values.app_typeOfLicence),
        },

        ...(activeCar && {
          car: {
            carId: activeCar.id,
            govNumber: strip(values.car_govNumber),
            make: strip(values.car_make),
            model: strip(values.car_model),
            color: strip(values.car_color),
            seats: values.car_seats,
            techPassportSerial: strip(values.car_techPassportSerial),
            issueDate: strip(values.car_issueDate),
            licensePinfl: strip(values.car_licensePinfl),
            typeOfLicence: strip(values.car_typeOfLicence),
          },
        }),

        user: {
          firstName: values.user_firstName,
          lastName: strip(values.user_lastName),
          bio: strip(values.user_bio),
          gender: values.user_gender,
          date_of__birthday: strip(values.user_date_of__birthday),
          preferredLanguage: values.user_preferredLanguage,
          preferred_navigator: values.user_preferred_navigator,
          talkative: values.user_talkative,
          music_allowed: values.user_music_allowed,
          pets_allowed: values.user_pets_allowed,
        },
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  /* ---------- small reusable field wrappers ---------- */
  const TextField = ({
    name,
    label,
    placeholder,
    maxLength,
    mono,
  }: {
    name: keyof EditFormValues;
    label: string;
    placeholder?: string;
    maxLength?: number;
    mono?: boolean;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              maxLength={maxLength}
              className={mono ? "font-mono" : ""}
              {...field}
              value={field.value as string}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const SwitchField = ({ name, label }: { name: keyof EditFormValues; label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
          <FormLabel className="mb-0 cursor-pointer">{label}</FormLabel>
          <FormControl>
            <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" aria-label="Редактировать заявку">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>
            Редактировать заявку <span className="font-mono text-sm opacity-60">#{application.id.slice(0, 8)}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="application">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="application" className="flex-1">
                    Заявка
                  </TabsTrigger>
                  <TabsTrigger value="car" className="flex-1" disabled={!activeCar}>
                    Авто {!activeCar && "(нет)"}
                  </TabsTrigger>
                  <TabsTrigger value="user" className="flex-1" disabled={!user}>
                    Водитель {!user && "(нет)"}
                  </TabsTrigger>
                </TabsList>

                {/* ===== TAB: APPLICATION ===== */}
                <TabsContent value="application" className="mt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TextField name="app_first_name" label="Имя" placeholder="Имя" />
                    <TextField name="app_last_name" label="Фамилия" placeholder="Фамилия" />
                  </div>
                  <TextField name="app_middle_name" label="Отчество" placeholder="Отчество" />
                  <TextField name="app_phone" label="Телефон" placeholder="+998901234567" />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField name="app_licensePinfl" label="PINFL" placeholder="14 символов" maxLength={14} mono />
                    <TextField name="app_typeOfLicence" label="Категория" placeholder="B" maxLength={1} />
                  </div>
                </TabsContent>

                {/* ===== TAB: CAR ===== */}
                <TabsContent value="car" className="mt-0 space-y-3">
                  {activeCar && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <TextField name="car_make" label="Марка" placeholder="Toyota" />
                        <TextField name="car_model" label="Модель" placeholder="Camry" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TextField name="car_color" label="Цвет" placeholder="Белый" />
                        <TextField name="car_govNumber" label="Гос. номер" placeholder="01H050WA" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="car_seats"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Мест</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={20}
                                  placeholder="4"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <TextField
                          name="car_techPassportSerial"
                          label="Серия т.п."
                          placeholder="AA0000000"
                          maxLength={10}
                          mono
                        />
                        <TextField name="car_issueDate" label="Дата выдачи" placeholder="2024-01-01" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TextField
                          name="car_licensePinfl"
                          label="PINFL (вод.)"
                          placeholder="14 символов"
                          maxLength={14}
                          mono
                        />
                        <TextField name="car_typeOfLicence" label="Категория прав" placeholder="B" maxLength={1} />
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* ===== TAB: USER ===== */}
                <TabsContent value="user" className="mt-0 space-y-3">
                  {user && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <TextField name="user_firstName" label="Имя" placeholder="Имя" />
                        <TextField name="user_lastName" label="Фамилия" placeholder="Фамилия" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Gender */}
                        <FormField
                          control={form.control}
                          name="user_gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Пол</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="MALE">Мужской</SelectItem>
                                  <SelectItem value="FEMALE">Женский</SelectItem>
                                  <SelectItem value="OTHER">Другой</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <TextField name="user_date_of__birthday" label="Дата рождения" placeholder="2000-01-01" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Preferred Language */}
                        <FormField
                          control={form.control}
                          name="user_preferredLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Язык</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ru">Русский</SelectItem>
                                  <SelectItem value="uz">Узбекский</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Navigator */}
                        <FormField
                          control={form.control}
                          name="user_preferred_navigator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Навигатор</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="YANDEX_NAVI">Яндекс Навигатор</SelectItem>
                                  <SelectItem value="GOOGLE_MAPS">Google Maps</SelectItem>
                                  <SelectItem value="NONE">Нет</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Bio */}
                      <FormField
                        control={form.control}
                        name="user_bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Немного о себе..."
                                maxLength={128}
                                className="resize-none"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Preference toggles */}
                      <div className="grid grid-cols-3 gap-2">
                        <SwitchField name="user_music_allowed" label="🎵 Музыка" />
                        <SwitchField name="user_pets_allowed" label="🐾 Питомцы" />
                        <SwitchField name="user_talkative" label="💬 Общительный" />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky footer */}
            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Отмена
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

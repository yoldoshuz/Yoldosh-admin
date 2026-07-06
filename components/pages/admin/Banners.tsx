"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Film, Image as ImageIcon, Loader2, Pencil, Plus, Power, Trash2, UploadCloud } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateBanner,
  useDeleteBanner,
  useGetBannersAdmin,
  useUpdateBanner,
  useUploadBannerMedia,
} from "@/hooks/adminHooks";
import { BannerFormValues, bannerSchema } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

const defaultLangState = { ru: "", uz: "", en: "" };
const languages = ["ru", "uz", "en"] as const;
type Lang = (typeof languages)[number];

const bannerTypeLabels: Record<string, string> = {
  popup: "Popup",
  inline_banner: "Inline",
  carousel: "Carousel",
  fullscreen: "Fullscreen",
};

// Разрешённые типы файлов (см. §3 документации).
const ACCEPT_MEDIA = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";
const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50 МБ

// datetime-local <-> ISO helpers
const isoToLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Убираем таймзонное смещение, чтобы <input type="datetime-local"> показал локальное время
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

const localInputToIso = (local: string) => {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const emptyForm: BannerFormValues = {
  type: "fullscreen",
  placement: "home",
  title: defaultLangState,
  body: defaultLangState,
  media: null,
  action_url: "",
  priority: 0,
  start_at: "",
  end_at: "",
  is_active: true,
};

export const Banners = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [activeLang, setActiveLang] = useState<Lang>("ru");

  const { data, isLoading } = useGetBannersAdmin({ limit: 50 });

  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();
  const uploadMutation = useUploadBannerMedia();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const banners = data?.banners || [];

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: emptyForm,
  });

  const media = form.watch("media");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isDialogOpen) return;

    if (selectedBanner) {
      form.reset({
        type: selectedBanner.type || "fullscreen",
        placement: selectedBanner.placement || "home",
        title: selectedBanner.title || defaultLangState,
        body: selectedBanner.body || defaultLangState,
        media: selectedBanner.media?.url ? selectedBanner.media : null,
        action_url: selectedBanner.action_url || "",
        priority: selectedBanner.priority ?? 0,
        start_at: isoToLocalInput(selectedBanner.start_at),
        end_at: isoToLocalInput(selectedBanner.end_at),
        is_active: selectedBanner.is_active ?? true,
      });
    } else {
      form.reset(emptyForm);
    }
  }, [isDialogOpen, selectedBanner, form]);

  const openEdit = (banner: any) => {
    setSelectedBanner(banner);
    setActiveLang("ru");
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedBanner(null);
    setActiveLang("ru");
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: BannerFormValues) => {
    if (isSubmitting) return;

    const payload = {
      ...values,
      media: values.media?.url ? values.media : null,
      start_at: localInputToIso(values.start_at),
      end_at: localInputToIso(values.end_at),
    };

    if (selectedBanner) {
      await updateMutation.mutateAsync({ id: selectedBanner.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setIsDialogOpen(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Лимит 50 МБ (совпадает с client_max_body_size nginx на api-домене).
    if (file.size > MAX_MEDIA_SIZE) {
      toast.error("Файл слишком большой. Максимум 50 МБ.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const result = await uploadMutation.mutateAsync(file);
    form.setValue("media", result, { shouldDirty: true });

    // сбрасываем input, чтобы повторный выбор того же файла сработал
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <Toaster richColors />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="title-text">Баннеры</h1>
          <p className="text-muted-foreground">Рекламные баннеры и промо-акции в приложении.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary shadow-glow" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Создать баннер
            </Button>
          </DialogTrigger>

          <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-1 p-0">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">{selectedBanner ? "Редактировать баннер" : "Новый баннер"}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-8">
                  {/* МЕДИА */}
                  <FormField
                    control={form.control}
                    name="media"
                    render={() => (
                      <FormItem>
                        <FormLabel>Медиа (фото или видео)</FormLabel>
                        <div className="flex flex-col gap-3">
                          {media?.url ? (
                            <div className="bg-muted relative h-56 w-full overflow-hidden rounded-xl border">
                              {media.type === "video" ? (
                                <video src={media.url} className="h-full w-full object-contain" controls playsInline />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={media.url} alt="media" className="h-full w-full object-contain" />
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={() => form.setValue("media", null, { shouldDirty: true })}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-muted/20 flex h-56 w-full items-center justify-center rounded-xl border-2 border-dashed">
                              {uploadMutation.isPending ? (
                                <Loader2 className="text-muted-foreground animate-spin" />
                              ) : (
                                <div className="text-muted-foreground flex flex-col items-center gap-2 opacity-50">
                                  <div className="flex gap-2">
                                    <ImageIcon size={36} />
                                    <Film size={36} />
                                  </div>
                                  <span className="text-xs">Фото или видео</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept={ACCEPT_MEDIA}
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleMediaUpload}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadMutation.isPending}
                            >
                              <UploadCloud className="mr-2 h-4 w-4" /> Загрузить медиа
                            </Button>
                            <span className="text-muted-foreground text-xs">jpeg, png, webp, gif, mp4, mov, webm</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* НАСТРОЙКИ ПОКАЗА */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Тип <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Выберите тип" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="popup">Popup</SelectItem>
                              <SelectItem value="inline_banner">Inline banner</SelectItem>
                              <SelectItem value="carousel">Carousel</SelectItem>
                              <SelectItem value="fullscreen">Fullscreen</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="placement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Placement <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="home, catalog..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="action_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action URL (диплинк)</FormLabel>
                          <FormControl>
                            <Input placeholder="myapp://catalog/sale" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Приоритет</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="start_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Начало показа</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Конец показа</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="bg-background flex items-center justify-between rounded-xl border p-4 shadow-sm">
                        <div>
                          <FormLabel className="text-base font-semibold">Активен?</FormLabel>
                          <p className="text-muted-foreground text-xs">Баннер будет показан в приложении</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* ЯЗЫКОВЫЕ ТАБЫ */}
                  <div className="bg-muted/10 rounded-xl border p-2">
                    <Tabs value={activeLang} onValueChange={(val) => setActiveLang(val as any)} className="w-full">
                      <TabsList className="mb-6 grid w-full grid-cols-3">
                        <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
                        <TabsTrigger value="uz">🇺🇿 O'zbekcha</TabsTrigger>
                        <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                      </TabsList>

                      {languages.map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`title.${lang}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Заголовок ({lang.toUpperCase()})</FormLabel>
                                <FormControl>
                                  <Input placeholder="Введите заголовок..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`body.${lang}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Текст ({lang.toUpperCase()})</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Текст баннера..." rows={4} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  <Button type="submit" className="shadow-glow btn-primary w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                    {selectedBanner ? "Сохранить изменения" : "Создать баннер"}
                  </Button>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* GRID VIEW */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {banners.map((banner: any) => (
            <Card
              key={banner.id}
              className="component group flex flex-col overflow-hidden transition-all hover:border-emerald-500"
            >
              <div className="bg-muted relative flex h-48 items-center justify-center overflow-hidden border-b">
                {banner.media?.url ? (
                  banner.media.type === "video" ? (
                    <video src={banner.media.url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.media.url} alt="media" className="h-full w-full object-cover" />
                  )
                ) : (
                  <ImageIcon className="text-muted-foreground opacity-30" size={40} />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="rounded-md bg-slate-900/70 px-2 py-1 text-[10px] font-bold text-white uppercase shadow-sm backdrop-blur">
                    {bannerTypeLabels[banner.type] || banner.type}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase shadow-sm ${banner.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}
                  >
                    {banner.is_active ? "Активен" : "Выключен"}
                  </span>
                </div>
                <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                  <Power size={11} /> {banner.priority ?? 0}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                    {banner.placement}
                  </span>
                </div>
                <CardTitle className="line-clamp-2 text-lg leading-tight">
                  {banner.title?.ru || "Без заголовка"}
                </CardTitle>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{banner.body?.ru}</p>
                {(banner.start_at || banner.end_at) && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {formatDate(banner.start_at)} — {banner.end_at ? formatDate(banner.end_at) : "∞"}
                  </p>
                )}
              </CardHeader>
              <CardContent className="mt-auto flex justify-end gap-2 p-4 pt-0 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="secondary" size="icon" onClick={() => openEdit(banner)}>
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("Удалить баннер?")) deleteMutation.mutate(banner.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
          {banners.length === 0 && (
            <div className="text-muted-foreground col-span-full py-20 text-center">
              Баннеров пока нет. Создайте первый!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

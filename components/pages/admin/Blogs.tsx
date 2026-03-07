"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { Eye, Image as ImageIcon, Loader2, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBlog, useDeleteBlog, useGetBlogsAdmin, useUpdateBlog, useUploadBlogImage } from "@/hooks/adminHooks";
import { BlogFormValues, blogSchema } from "@/lib/schemas";
import { formatDate, formatDocUrl } from "@/lib/utils";
import { useTheme } from "next-themes";

const defaultLangState = { ru: "", uz: "", en: "" };
const languages = ["ru", "uz", "en"] as const;
type Lang = (typeof languages)[number];

export const Blogs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [activeLang, setActiveLang] = useState<Lang>("ru");
  
  const { theme } = useTheme();
  const { data, isLoading } = useGetBlogsAdmin({ limit: 50 });

  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog();
  const deleteMutation = useDeleteBlog();
  const uploadMutation = useUploadBlogImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blogs = data?.blogs || [];

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: defaultLangState,
      subtitle: defaultLangState,
      content: defaultLangState,
      coverImage: "",
      isPublished: false,
      seoTitle: defaultLangState,
      seoDescription: defaultLangState,
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isDialogOpen) return;

    if (selectedBlog) {
      form.reset({
        title: selectedBlog.title || defaultLangState,
        subtitle: selectedBlog.subtitle || defaultLangState,
        content: selectedBlog.content || defaultLangState,
        coverImage: selectedBlog.coverImage || "",
        isPublished: selectedBlog.isPublished ?? false,
        seoTitle: selectedBlog.seoTitle || defaultLangState,
        seoDescription: selectedBlog.seoDescription || defaultLangState,
      });
    } else {
      form.reset({
        title: defaultLangState,
        subtitle: defaultLangState,
        content: defaultLangState,
        coverImage: "",
        isPublished: false,
        seoTitle: defaultLangState,
        seoDescription: defaultLangState,
      });
    }
  }, [isDialogOpen, selectedBlog, form]);

  const openEdit = (blog: any) => {
    setSelectedBlog(blog);
    setActiveLang("ru");
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedBlog(null);
    setActiveLang("ru");
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: BlogFormValues) => {
    if (isSubmitting) return;

    if (selectedBlog) {
      await updateMutation.mutateAsync({
        id: selectedBlog.id,
        data: values,
      });
    } else {
      await createMutation.mutateAsync(values);
    }

    setIsDialogOpen(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadMutation.mutateAsync(file);

    form.setValue("coverImage", url, { shouldDirty: true });
  };

  const handleMarkdownImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadMutation.mutateAsync(file);
    const formattedUrl = formatDocUrl(url);

    const current = form.getValues(`content.${activeLang}`);
    form.setValue(`content.${activeLang}`, `${current}\n![Изображение](${formattedUrl})\n`);
  };

  return (
    <div className="w-full">
      <Toaster richColors />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="title-text">Блог</h1>
          <p className="text-muted-foreground">Управление статьями и публикациями.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary shadow-glow" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Создать пост
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-1 p-0">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">{selectedBlog ? "Редактировать статью" : "Новая статья"}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
                  {/* ГЛОБАЛЬНЫЕ НАСТРОЙКИ (Общие для всех языков) */}
                  <div className="flex flex-col flex-1 gap-6">
                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Обложка (Preview Photo)</FormLabel>
                          <div className="flex flex-col gap-3">
                            {field.value ? (
                              <div className="relative w-full h-40 rounded-xl overflow-hidden border">
                                <Image src={formatDocUrl(field.value)} alt="Cover" fill className="object-cover" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8"
                                  onClick={() => form.setValue("coverImage", "")}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-xl bg-muted/20">
                                {uploadMutation.isPending ? (
                                  <Loader2 className="animate-spin text-muted-foreground" />
                                ) : (
                                  <ImageIcon className="text-muted-foreground opacity-50" size={40} />
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleCoverUpload}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadMutation.isPending}
                              >
                                <UploadCloud className="mr-2 h-4 w-4" /> Загрузить обложку
                              </Button>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 border rounded-xl shadow-sm bg-background">
                            <div>
                              <FormLabel className="text-base font-semibold">Опубликовать?</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Статья будет видна в приложении и на сайте
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* ЯЗЫКОВЫЕ ТАБЫ */}
                  <div className="border rounded-xl p-2 bg-muted/10">
                    <Tabs value={activeLang} onValueChange={(val) => setActiveLang(val as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="ru">🇷🇺 Русский (Основной)</TabsTrigger>
                        <TabsTrigger value="uz">🇺🇿 O'zbekcha</TabsTrigger>
                        <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                      </TabsList>

                      {languages.map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-4">
                          <FormField control={form.control} name={`title.${lang}`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Заголовок ({lang.toUpperCase()}) <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="Введите заголовок..." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name={`subtitle.${lang}`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Краткое описание / Подзаголовок</FormLabel>
                              <FormControl><Textarea placeholder="О чем эта статья..." rows={3} {...field} /></FormControl>
                            </FormItem>
                          )} />

                          <FormField
                            control={form.control}
                            name={`content.${lang}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div data-color-mode={theme === "dark" ? "dark" : "light"}>
                                    <MDEditor
                                      value={field.value}
                                      onChange={(val) => field.onChange(val ?? "")}
                                      height={500}
                                    />
                                  </div>
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
                    {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                    {selectedBlog ? "Сохранить изменения" : "Опубликовать статью"}
                  </Button>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* GRID VIEW */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blogs.map((blog: any) => (
            <Card
              key={blog.id}
              className="component hover:border-emerald-500 transition-all flex flex-col group overflow-hidden"
            >
              <div className="h-48 bg-muted relative overflow-hidden flex items-center justify-center border-b">
                {blog.coverImage ? (
                  <Image
                    src={formatDocUrl(blog.coverImage)}
                    alt="Cover"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground opacity-30" size={40} />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm ${blog.isPublished ? "bg-emerald-500 text-white" : "bg-yellow-500 text-white"}`}
                  >
                    {blog.isPublished ? "Опубликовано" : "Черновик"}
                  </span>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-muted-foreground">{formatDate(blog.createdAt)}</p>
                  <div className="flex items-center text-xs text-muted-foreground gap-1 bg-muted px-2 py-1 rounded-full">
                    <Eye size={12} /> {blog.views || 0}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2 leading-tight">
                  {blog.title?.ru || "Без заголовка"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{blog.subtitle?.ru}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0 mt-auto flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" onClick={() => openEdit(blog)}>
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("Удалить статью?")) deleteMutation.mutate(blog.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              Статей пока нет. Создайте первую!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

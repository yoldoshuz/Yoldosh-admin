"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { useIntersectionObserver } from "usehooks-ts";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateAdmin, useDeleteAdmin, useGetAllAdmins, useUpdateAdminPermissions } from "@/hooks/superAdminHooks";
import { createAdminSchema } from "@/lib/schemas";
import { AdminPermission, adminPermissionLabels } from "@/lib/utils";
import { Admin } from "@/types";

export const Admins = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAllAdmins({});
  const { mutate: createAdmin, isPending: isCreating } = useCreateAdmin();
  const { mutate: deleteAdmin, isPending: isDeleting } = useDeleteAdmin();
  const { mutate: updatePermissions, isPending: isUpdatingPermissions } = useUpdateAdminPermissions();

  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
  });

  const form = useForm<z.infer<typeof createAdminSchema>>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { email: "", firstName: "", lastName: "" },
  });

  const onSubmit = (values: z.infer<typeof createAdminSchema>) => {
    createAdmin(values, {
      onSuccess: () => {
        form.reset();
        setIsCreateDialogOpen(false);
      },
    });
  };

  const handleDelete = (adminId: string) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      deleteAdmin(adminId);
    }
  };

  const handlePermissionsChange = (permission: keyof typeof AdminPermission, checked: boolean) => {
    if (selectedAdmin) {
      setSelectedAdmin({
        ...selectedAdmin,
        permissions: {
          ...selectedAdmin.permissions,
          [permission]: checked,
        },
      });
    }
  };

  const handleSavePermissions = () => {
    if (selectedAdmin) {
      updatePermissions(
        { adminId: selectedAdmin.id, permissions: selectedAdmin.permissions },
        {
          onSuccess: () => {
            setIsPermissionsDialogOpen(false);
            setSelectedAdmin(null);
          },
        }
      );
    }
  };

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allAdmins = data?.pages.flatMap((page: any) => page.rows) ?? [];

  return (
    <div>
      <Toaster richColors />
      <div className="flex gap-2 justify-between items-center mb-6">
        <h1 className="title-text">Управление админами</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary shadow-glow">Создать админа</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать нового админа</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Почта</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@yoldosh.uz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="btn-primary shadow-glow" disabled={isCreating}>
                  {isCreating ? "Создание..." : "Создать"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Почта</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : allAdmins.length > 0 ? (
              allAdmins.map((admin: Admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    {admin.firstName} {admin.lastName}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.role}</TableCell>
                  <TableCell className="space-x-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/super-admin/admins/${admin.id}`} className="gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Профиль
                      </Link>
                    </Button>
                    {admin.role === "Admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setIsPermissionsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Права
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isDeleting || admin.role === "SuperAdmin"}
                      onClick={() => handleDelete(admin.id)}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Администраторы не найдены.
                </TableCell>
              </TableRow>
            )}
            {hasNextPage && (
              <TableRow>
                <TableCell colSpan={4} ref={ref}>
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center p-4">
                      <p>Загрузка...</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить права доступа для {selectedAdmin?.firstName}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {Object.values(AdminPermission).map((permission) => (
              <div key={permission} className="flex items-center justify-between">
                <Label htmlFor={permission} className="flex-1">
                  {adminPermissionLabels[permission]}
                </Label>
                <Switch
                  id={permission}
                  checked={selectedAdmin?.permissions?.[permission] ?? false}
                  onCheckedChange={(checked) =>
                    handlePermissionsChange(permission as keyof typeof AdminPermission, checked)
                  }
                />
              </div>
            ))}
          </div>
          <Button
            onClick={handleSavePermissions}
            disabled={isUpdatingPermissions}
            className="btn-primary shadow-glow w-full"
          >
            {isUpdatingPermissions ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

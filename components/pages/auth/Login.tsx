"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Toaster } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAdminLogin } from "@/hooks/adminHooks";
import { loginSchema } from "@/lib/schemas";

export const Login = () => {
  const router = useRouter();
  const { mutate: login, isPending, isSuccess, data: loginData } = useAdminLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isSuccess && loginData) {
      const token = loginData.data.accessToken;
      const userRole = loginData.data.admin.role;
      const tokenKey = userRole === "SuperAdmin" ? "super-admin-token" : "admin-token";

      localStorage.setItem(tokenKey, token);
      if (userRole === "SuperAdmin") {
        router.push("/super-admin");
      } else {
        router.push("/admin");
      }
    }
  }, [isSuccess, loginData, router]);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login(values);
  };

  return (
    <>
      <Toaster richColors />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="component-dark-2 mx-2 flex w-96 flex-col space-y-4 rounded-xl border p-6 shadow-2xl"
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Yoldosh Admin</h1>
          </div>

          <Separator orientation="horizontal" />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Почта</FormLabel>
                <FormControl>
                  <Input placeholder="admin@yoldosh.uz" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Введите пароль" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="btn-primary shadow-glow w-full text-white" disabled={isPending}>
            {isPending ? "Вход..." : "Войти"}
          </Button>

          <div className="text-muted-foreground pt-2 text-center text-xs">
            Доступ разрешен только авторизованным пользователям.
          </div>
        </form>
      </Form>
    </>
  );
};

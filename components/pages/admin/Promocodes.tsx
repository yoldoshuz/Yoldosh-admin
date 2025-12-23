"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PromoCodesTable } from "@/components/shared/promocodes/PromocodesTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGrantPromoCode } from "@/hooks/adminHooks";
import { globalPromoCodeSchema, personalPromoCodeSchema } from "@/lib/schemas";

export const Promocodes = () => {
  const [isPersonalDialogOpen, setIsPersonalDialogOpen] = useState(false);
  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);

  const personalForm = useForm<z.infer<typeof personalPromoCodeSchema>>({
    resolver: zodResolver(personalPromoCodeSchema),
    defaultValues: { userId: "", discountPercentage: 10 },
  });

  const globalForm = useForm<z.infer<typeof globalPromoCodeSchema>>({
    resolver: zodResolver(globalPromoCodeSchema),
    defaultValues: { discountPercentage: 10, useAmount: 100 },
  });

  const { mutate: grantPromoCode, isPending: isGranting } = useGrantPromoCode();

  const onPersonalSubmit = (values: z.infer<typeof personalPromoCodeSchema>) => {
    grantPromoCode(
      { ...values, type: "SINGLE_USER" },
      {
        onSuccess: () => {
          personalForm.reset();
          setIsPersonalDialogOpen(false);
        },
      }
    );
  };

  const onGlobalSubmit = (values: z.infer<typeof globalPromoCodeSchema>) => {
    grantPromoCode(
      { ...values, type: "GLOBAL" },
      {
        onSuccess: () => {
          globalForm.reset();
          setIsGlobalDialogOpen(false);
        },
      }
    );
  };

  return (
    <div>
      <Toaster richColors />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="title-text">Промокоды</h1>
          <p className="subtitle-text">Управление промокодами и скидками</p>
        </div>
        <div className="flex flex-col sm:flex-row  gap-2">
          <Dialog open={isPersonalDialogOpen} onOpenChange={setIsPersonalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-200 dark:bg-gray-800 text-black dark:text-white cursor-pointer">
                <UserCheck />
                Персональный промокод
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Выдать персональный промокод</DialogTitle>
              </DialogHeader>
              <Form {...personalForm}>
                <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4">
                  <FormField
                    control={personalForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Пользователя</FormLabel>
                        <FormControl>
                          <Input placeholder="User ID..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Процент скидки</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Срок действия (необязательно)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className="justify-start text-left font-normal">
                                {field.value ? format(field.value, "PPP") : <span>Выберите дату</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isGranting} className="btn-primary shadow-glow">
                    {isGranting ? "Выдача..." : "Выдать"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isGlobalDialogOpen} onOpenChange={setIsGlobalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="btn-primary shadow-glow">
                <PlusCircle className="mr-2 h-4 w-4" />
                Создать промокод
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать глобальный промокод</DialogTitle>
              </DialogHeader>
              <Form {...globalForm}>
                <form onSubmit={globalForm.handleSubmit(onGlobalSubmit)} className="space-y-4">
                  <FormField
                    control={globalForm.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Процент скидки</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={globalForm.control}
                    name="useAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество использований</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={globalForm.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Срок действия (необязательно)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className="justify-start text-left font-normal">
                                {field.value ? format(field.value, "PPP") : <span>Выберите дату</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isGranting} className="btn-primary shadow-glow">
                    {isGranting ? "Создание..." : "Создать"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="flex items-center justify-center w-64 sm:w-96 px-1">
          <TabsTrigger value="global">Глобальные</TabsTrigger>
          <TabsTrigger value="personal">Персональные</TabsTrigger>
        </TabsList>
        <TabsContent value="global">
          <PromoCodesTable type="GLOBAL" />
        </TabsContent>
        <TabsContent value="personal">
          <PromoCodesTable type="SINGLE_USER" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

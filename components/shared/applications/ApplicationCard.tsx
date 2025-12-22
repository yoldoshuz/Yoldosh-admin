"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Copyright,
  File,
  Image as ImageIcon,
  Info,
  PaintbrushVertical,
  Phone,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { rejectionSchema } from "@/lib/schemas";
import { formatDate, formatDocUrl, getStatusColor } from "@/lib/utils";
import { CarApplication } from "@/types";

// Component for displaying a single application card
export const ApplicationCard = ({
  application,
  onApprove,
  onReject,
  isUpdating,
}: {
  application: CarApplication;
  onApprove: (carId: string) => void;
  onReject: (carId: string, reason: string) => void;
  isUpdating: boolean; // To disable buttons during update
}) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { reason: "" },
  });

  const handleRejectSubmit = (values: z.infer<typeof rejectionSchema>) => {
    onReject(application.id, values.reason);
    setIsRejectDialogOpen(false);
    form.reset();
  };

  return (
    <Card className="component border hover:border-emerald-500 dark:hover:border-emerald-600 transition rounded-xl shadow-md overflow-hidden w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Link
          href={`/admin/users-search/${application.user_id}`}
          className="flex flex-row items-center justify-start space-y-0 pb-2 gap-4 link-text"
        >
          <div className="flex flex-col items-start justify-center">
            <h1 className="font-bold text-lg md:text-xl">
              {application.first_name} {application.last_name} {application.middle_name}
            </h1>
            <time className="text-xs text-muted-foreground">{formatDate(application.createdAt)}</time>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(application.status)}`}
          >
            {application.status}
          </span>
        </Link>
        <div>
          {/* Actions only for PENDING status */}
          {application.status === "PENDING" && (
            <CardFooter className="flex justify-between items-center gap-2">
              <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogTrigger asChild>
                  <div className="w-full">
                    <Button size="icon" variant="destructive" disabled={isUpdating}>
                      <X />
                    </Button>
                  </div>
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

              <div className="w-full">
                <Button
                  size="icon"
                  variant="outline"
                  className="btn-primary shadow-glow"
                  onClick={() => onApprove(application.id)}
                  disabled={isUpdating}
                >
                  <Check />
                </Button>
              </div>
            </CardFooter>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid-2">
        <div className="flex flex-col items-start space-y-4">
          {/* Driver Info */}
          <div className="flex items-center justify-start gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Номер телефона:</span>
            <span className="text-sm">
              {application.phone.replace(/^\+?(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5")}
            </span>
          </div>

          {/* Licence plate */}
          <div className="flex items-center justify-start gap-2">
            <span className="text-sm text-muted-foreground">PINFL:</span>
            <span className="text-sm">{application.licensePinfl || "N/A"}</span>
          </div>
          {/* Licence plate */}
          <div className="flex items-center justify-start gap-2">
            <span className="text-sm text-muted-foreground">Тип водительского удостоверения:</span>
            <span className="text-sm">{application.typeOfLicence || "N/A"}</span>
          </div>

          {/* Documents */}
          <div className="flex gap-2 items-center justify-start flex-wrap mt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <ImageIcon className="mr-1 h-3 w-3" /> Водительские права
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0">
                <DialogTitle className="sr-only">Водительские права</DialogTitle>
                <Image
                  src={formatDocUrl(application.licenseFrontPath)}
                  alt="Document Front"
                  className="rounded-lg w-full max-h-[80vh] object-contain"
                  width={2048}
                  height={2048}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Rejection Reason */}
        {application.status === "REJECTED" && application.licenseFrontPath && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20 p-2 rounded-md flex items-start gap-2">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Причина: {application.licenseFrontPath}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Globe,
  KeySquare,
  LogIn,
  LogOut,
  Mail,
  Monitor,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useIntersectionObserver } from "usehooks-ts";

import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { EntityLink } from "@/components/shared/EntityLink";
import { LogDetailsDrawer } from "@/components/shared/LogDetailsDrawer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeleteAdmin,
  useGetAdminLogs,
  useGetAdminProfileById,
  useUpdateAdminPermissions,
} from "@/hooks/superAdminHooks";
import {
  adminLogCategoryMeta,
  AdminPermission,
  AdminPermissionKey,
  adminPermissionLabels,
  cn,
  formatDate,
  formatDuration,
  formatRelativeTime,
  shortUserAgent,
} from "@/lib/utils";
import { AdminLog, AdminProfileById, AdminSession } from "@/types";

// ===== Sessions timeline =====
const SessionCard = ({ session }: { session: AdminSession }) => {
  const isOpen = !session.logoutAt;
  return (
    <div className="relative flex gap-4 pb-5 last:pb-0">
      {/* dot */}
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "size-3 shrink-0 rounded-full ring-4",
            isOpen ? "bg-emerald-500 ring-emerald-500/20 animate-pulse" : "bg-slate-400 ring-slate-300/30"
          )}
        />
        <span className="mt-1 h-full w-px bg-border" />
      </div>
      <div className="-mt-1 min-w-0 flex-1 rounded-xl border bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              <LogIn className="size-3.5 text-emerald-500" />
              {formatDate(session.loginAt)}
              {session.logoutAt ? (
                <>
                  <span className="text-muted-foreground mx-1">→</span>
                  <LogOut className="size-3.5 text-slate-400" />
                  {formatDate(session.logoutAt)}
                </>
              ) : (
                <span className="pill-emerald ml-1">активна или прервана</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Длительность: {formatDuration(session.durationMinutes)}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="size-3.5 shrink-0" />
            <span className="font-mono truncate">{session.ipAddress ?? "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground" title={session.userAgent ?? ""}>
            <Monitor className="size-3.5 shrink-0" />
            <span className="truncate">{shortUserAgent(session.userAgent)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Donut chart =====
const DonutChart = ({ data }: { data: { category: string; count: number }[] }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const palette = [
    "#10b981",
    "#0ea5e9",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#64748b",
    "#ec4899",
    "#14b8a6",
    "#a855f7",
    "#22d3ee",
  ];
  const total = data.reduce((s, x) => s + x.count, 0);
  if (!data.length || !total) {
    return <p className="text-sm text-muted-foreground">Нет данных</p>;
  }
  const enriched = data.map((d, i) => ({ ...d, fill: palette[i % palette.length] }));
  return (
    <div className="grid gap-3 sm:grid-cols-[180px_1fr] items-center">
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={enriched} dataKey="count" nameKey="category" innerRadius={50} outerRadius={75} paddingAngle={2}>
              {enriched.map((d, i) => (
                <Cell key={i} fill={d.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)",
                borderRadius: 12,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">Всего</span>
          <span className="text-xl font-semibold tabular-nums">{total}</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {enriched.map((d) => {
          const meta = adminLogCategoryMeta[d.category] ?? adminLogCategoryMeta.OTHER;
          const pct = ((d.count / total) * 100).toFixed(1);
          return (
            <li key={d.category} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 truncate">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                <span className="truncate">{meta.label}</span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {d.count} <span className="opacity-60">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ===== Top actions bar list =====
const TopActions = ({ data }: { data: { action: string; count: number }[] }) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">Нет данных</p>;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <ul className="space-y-2">
      {data.slice(0, 10).map((d, i) => (
        <li key={i} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="truncate">{d.action}</span>
            <span className="tabular-nums text-muted-foreground">{d.count}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

const initials = (first?: string, last?: string) =>
  `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "??";

// ===== Permissions dialog =====
const PermissionsDialog = ({
  admin,
  open,
  onOpenChange,
}: {
  admin: AdminProfileById["admin"] | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const { mutate, isPending } = useUpdateAdminPermissions();

  useEffect(() => {
    if (admin) setPerms({ ...(admin.permissions ?? {}) });
  }, [admin]);

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Права доступа</DialogTitle>
          <DialogDescription>
            {admin.firstName} {admin.lastName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {Object.values(AdminPermission).map((p) => (
            <div key={p} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
              <Label htmlFor={p} className="cursor-pointer flex-1">
                {adminPermissionLabels[p as AdminPermissionKey]}
              </Label>
              <Switch
                id={p}
                checked={perms[p] === true}
                onCheckedChange={(v) => setPerms((prev) => ({ ...prev, [p]: v }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            disabled={isPending}
            className="btn-primary"
            onClick={() => mutate({ adminId: admin.id, permissions: perms }, { onSuccess: () => onOpenChange(false) })}
          >
            {isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== Confirm delete dialog =====
const ConfirmDeleteDialog = ({
  admin,
  open,
  onOpenChange,
  onDeleted,
}: {
  admin: AdminProfileById["admin"] | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
}) => {
  const { mutate, isPending } = useDeleteAdmin();
  if (!admin) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить администратора?</DialogTitle>
          <DialogDescription>Действие необратимо. Все логи этого админа будут также удалены.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          {admin.firstName} {admin.lastName} · <span className="text-muted-foreground">{admin.email}</span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={() => mutate(admin.id, { onSuccess: onDeleted })}>
            {isPending ? "Удаляем..." : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== Actions tab (per-admin logs) =====
const AdminActionsTab = ({ adminId }: { adminId: string }) => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAdminLogs(adminId, {
    sortBy: "timestamp",
    sortOrder: "DESC",
  });
  const logs: AdminLog[] = data?.pages.flatMap((p: any) => p.logs) ?? [];
  const [active, setActive] = useState<AdminLog | null>(null);
  const [open, setOpen] = useState(false);

  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (!logs.length) {
    return <EmptyState title="Действий нет" description="Этот админ пока не выполнял операций." />;
  }
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <button
          key={log.id}
          onClick={() => {
            setActive(log);
            setOpen(true);
          }}
          className="flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left hover:border-emerald-500/40 hover:bg-muted/40 transition"
        >
          <CategoryBadge category={log.category} />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-medium truncate">{log.action}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(log.timestamp)}
              {log.relatedEntityType && (
                <>
                  <span className="mx-1.5">·</span>
                  <span className="truncate">{log.entitySnapshot?.label ?? log.relatedEntityType}</span>
                </>
              )}
            </p>
          </div>
        </button>
      ))}
      {hasNextPage && (
        <div ref={ref} className="py-3 text-center text-xs text-muted-foreground">
          {isFetchingNextPage ? "Загрузка..." : "Прокрутите для загрузки"}
        </div>
      )}
      <LogDetailsDrawer log={active} open={open} onOpenChange={setOpen} />
    </div>
  );
};

// ===== Main component =====
export const AdminProfile = ({ adminId }: { adminId: string }) => {
  const router = useRouter();
  const { data, isLoading, isError } = useGetAdminProfileById(adminId);
  const profile = data as AdminProfileById | undefined;
  const [permsOpen, setPermsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const sessions = profile?.sessions?.tracked ?? [];
  const lastLoginAt = useMemo(() => {
    if (!sessions.length) return null;
    return sessions.reduce<string | null>((acc, s) => (acc && acc > s.loginAt ? acc : s.loginAt), null);
  }, [sessions]);

  const thisMonthCount = useMemo(() => {
    if (!profile?.recentActions) return 0;
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return profile.recentActions.filter((l) => (l.timestamp || "").startsWith(cur)).length;
  }, [profile]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (isError || !profile) {
    return <EmptyState title="Не удалось загрузить профиль" description="Попробуйте обновить страницу." />;
  }

  const a = profile.admin;
  const isSuper = a.role === "SuperAdmin";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/super-admin/admins"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />К списку админов
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-2xl font-semibold text-white shadow-md">
            {initials(a.firstName, a.lastName)}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="title-text">
                {a.firstName} {a.lastName}
              </h2>
              <span className={cn("pill", isSuper ? "pill-violet" : "pill-emerald")}>{a.role}</span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {a.email}
            </p>
            {a.createdAt && <p className="text-xs text-muted-foreground">Создан: {formatDate(a.createdAt)}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSuper && (
            <Button variant="outline" onClick={() => setPermsOpen(true)} className="gap-2">
              <KeySquare className="size-4" />
              Управление правами
            </Button>
          )}
          {!isSuper && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
              <Trash2 className="size-4" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Всего действий" value={profile.stats.total} icon={UserIcon} tone="emerald" />
        <StatCard title="В этом месяце" value={thisMonthCount} icon={Clock} tone="sky" />
        <StatCard
          title="Последний вход"
          value={lastLoginAt ? formatRelativeTime(lastLoginAt) : "—"}
          icon={LogIn}
          tone="violet"
        />
        <StatCard title="Сессий всего" value={sessions.length} icon={Monitor} tone="amber" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Распределение действий</h3>
          <DonutChart data={profile.stats.byCategory} />
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Топ действий</h3>
          <TopActions data={profile.stats.byAction} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Сессии ({sessions.length})</TabsTrigger>
          <TabsTrigger value="actions">Действия</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4 pt-2">
          {sessions.length === 0 ? (
            <EmptyState title="Сессий нет" description="Этот админ ещё не входил в систему." />
          ) : (
            <div className="rounded-2xl border bg-card p-5 sm:p-6">
              {sessions.map((s) => (
                <SessionCard key={s.sessionId} session={s} />
              ))}
            </div>
          )}
          {(profile.sessions?.legacyLogins?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-dashed bg-muted/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Старые сессии (без session-id)
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {profile.sessions.legacyLogins.map((l, i) => (
                  <li key={l.id ?? `legacy-login-${l.timestamp ?? i}-${i}`}>
                    LOGIN · {formatDate(l.timestamp)} · <span className="font-mono">{l.ipAddress ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="pt-2">
          <AdminActionsTab adminId={a.id} />
        </TabsContent>
      </Tabs>

      <PermissionsDialog admin={a} open={permsOpen} onOpenChange={setPermsOpen} />
      <ConfirmDeleteDialog
        admin={a}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/super-admin/admins")}
      />
    </div>
  );
};

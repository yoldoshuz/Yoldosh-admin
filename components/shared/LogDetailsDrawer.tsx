"use client";

import { Activity, Clock, Globe, Monitor, User } from "lucide-react";

import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { EntityLink } from "@/components/shared/EntityLink";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatRelativeTime, shortUserAgent } from "@/lib/utils";
import { AdminLog } from "@/types";

interface Props {
  log: AdminLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoRow = ({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[20px_110px_1fr] items-start gap-3 border-b py-2.5 text-sm last:border-b-0">
    <Icon className="text-muted-foreground mt-0.5 size-4" />
    <span className="text-muted-foreground">{label}</span>
    <div className="min-w-0 break-words">{children}</div>
  </div>
);

const Json = ({ value }: { value: any }) => (
  <pre className="bg-muted/50 max-h-64 overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed">
    {JSON.stringify(value, null, 2)}
  </pre>
);

const renderChanges = (log: AdminLog) => {
  const meta = log.metadata as any;
  if (!meta) return null;
  const before = meta.before;
  const changes = meta.changes;

  if (before && changes) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(changes)]));
    return (
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Изменения</p>
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-muted/40 text-muted-foreground grid grid-cols-3 border-b px-3 py-2 text-xs font-medium tracking-wider uppercase">
            <span>Поле</span>
            <span>Было</span>
            <span>Стало</span>
          </div>
          <div className="divide-y">
            {keys.map((k) => (
              <div key={k} className="grid grid-cols-3 px-3 py-2 text-xs">
                <span className="font-medium">{k}</span>
                <span className="break-words text-red-600 line-through opacity-80 dark:text-red-400">
                  {before[k] != null ? String(before[k]) : "—"}
                </span>
                <span className="break-words text-emerald-600 dark:text-emerald-400">
                  {changes[k] != null ? String(changes[k]) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Metadata</p>
      <Json value={meta} />
    </div>
  );
};

export const LogDetailsDrawer = ({ log, open, onOpenChange }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {!log ? null : (
          <>
            <SheetHeader className="space-y-2 border-b px-6 py-5">
              <div className="flex items-center gap-2">
                <CategoryBadge category={log.category} />
                <span className="text-muted-foreground text-xs">{formatRelativeTime(log.timestamp)}</span>
              </div>
              <SheetTitle className="pr-8 text-lg">{log.action}</SheetTitle>
              {log.details && <p className="text-muted-foreground text-sm">{log.details}</p>}
            </SheetHeader>

            <div className="space-y-5 px-6 py-5">
              <div className="bg-card rounded-xl border px-4 py-2">
                <InfoRow icon={Clock} label="Время">
                  <div className="flex flex-col">
                    <span>{formatDate(log.timestamp)}</span>
                    <span className="text-muted-foreground text-xs">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                </InfoRow>
                <InfoRow icon={User} label="Админ">
                  <span className="font-medium">{log.adminName}</span>
                </InfoRow>
                <InfoRow icon={Activity} label="Объект">
                  {log.relatedEntityType ? (
                    <EntityLink
                      type={log.relatedEntityType}
                      id={log.relatedEntityId}
                      snapshot={log.entitySnapshot}
                      showSubLabel
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </InfoRow>
                <InfoRow icon={Globe} label="IP">
                  <span className="font-mono text-xs">{log.ipAddress ?? "—"}</span>
                </InfoRow>
                <InfoRow icon={Monitor} label="User-Agent">
                  <span title={log.userAgent ?? ""} className="text-xs">
                    {shortUserAgent(log.userAgent)}
                  </span>
                </InfoRow>
              </div>

              {log.entitySnapshot?.meta && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Снапшот сущности
                  </p>
                  <Json value={log.entitySnapshot.meta} />
                </div>
              )}

              {renderChanges(log)}

              {log.sessionId && (
                <p className="text-muted-foreground text-[11px]">
                  Session: <span className="font-mono">{log.sessionId.slice(0, 8)}…</span>
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

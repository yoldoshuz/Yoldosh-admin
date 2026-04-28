import { useQuery } from "@tanstack/react-query";

import { appmetricaApi, isAppmetricaConfigured } from "@/lib/appmetrica";

export const appmetricaKeys = {
  all: ["appmetrica"] as const,
  applications: () => [...appmetricaKeys.all, "applications"] as const,
  application: (id: number) => [...appmetricaKeys.all, "application", id] as const,
  stat: (params: any) => [...appmetricaKeys.all, "stat", params] as const,
  byTime: (params: any) => [...appmetricaKeys.all, "byTime", params] as const,
};

export const useAppmetricaApplications = () => {
  return useQuery({
    queryKey: appmetricaKeys.applications(),
    queryFn: async () => (await appmetricaApi.listApplications()).applications ?? [],
    enabled: isAppmetricaConfigured(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

type StatParams = Parameters<typeof appmetricaApi.getStat>[0];
type ByTimeParams = Parameters<typeof appmetricaApi.getStatByTime>[0];

export const useAppmetricaStat = (params: StatParams | null) => {
  return useQuery({
    queryKey: appmetricaKeys.stat(params),
    queryFn: () => appmetricaApi.getStat(params!),
    enabled: !!params && isAppmetricaConfigured(),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};

export const useAppmetricaByTime = (params: ByTimeParams | null) => {
  return useQuery({
    queryKey: appmetricaKeys.byTime(params),
    queryFn: () => appmetricaApi.getStatByTime(params!),
    enabled: !!params && isAppmetricaConfigured(),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};

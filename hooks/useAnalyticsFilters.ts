"use client";

import { useEffect, useState } from "react";

import {
  AnalyticsFilterValue,
  clampRange,
  DEFAULT_ANALYTICS_FILTERS,
  filtersToQuery,
  presetToRange,
} from "@/lib/analytics";
import type { AnalyticsQuery } from "@/types";

const STORAGE_KEY = "yoldosh-analytics-filters";

/**
 * Состояние фильтров раздела аналитики.
 *
 * Фильтры общие для всех экранов: перейдя из «Обзора» в «Воронки»,
 * аналитик ожидает тот же период и ту же версию приложения. Поэтому
 * значение переживает навигацию через localStorage.
 *
 * Относительные пресеты (7 дней и т.п.) при загрузке пересчитываются
 * заново — иначе вкладка, открытая вчера, показала бы вчерашний период.
 */
export const useAnalyticsFilters = (): {
  filters: AnalyticsFilterValue;
  setFilters: (v: AnalyticsFilterValue) => void;
  query: AnalyticsQuery;
} => {
  const [filters, setFiltersState] = useState<AnalyticsFilterValue>(DEFAULT_ANALYTICS_FILTERS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as AnalyticsFilterValue;
      if (!saved?.preset) return;
      if (saved.preset === "custom") {
        if (!saved.from || !saved.to) return;
        const { from, to } = clampRange(saved.from, saved.to);
        setFiltersState({ ...saved, from, to });
      } else {
        setFiltersState({ ...saved, ...presetToRange(saved.preset) });
      }
    } catch {
      // Повреждённый ключ — просто работаем с дефолтом.
    }
  }, []);

  const setFilters = (value: AnalyticsFilterValue) => {
    setFiltersState(value);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Приватный режим / переполненное хранилище — не повод падать.
    }
  };

  return { filters, setFilters, query: filtersToQuery(filters) };
};

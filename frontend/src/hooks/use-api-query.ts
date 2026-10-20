"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface QueryResult<T> {
  /** Latest successful data. Kept while a new request for a different key is loading. */
  data: T | undefined;
  /** Error of the current request, if it failed. */
  error: unknown;
  /** True while the current key's request has not settled yet. */
  loading: boolean;
  /** Re-runs the request for the current key. */
  reload: () => void;
}

/**
 * Minimal data-fetching hook. `key` identifies the request (pass null to skip); whenever it
 * changes, the previous request is aborted and a new one starts. Loading is derived from
 * whether the stored result belongs to the current key, so state is only set from async
 * callbacks.
 */
export function useApiQuery<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
): QueryResult<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: T; error?: unknown } | null>(null);
  const [lastData, setLastData] = useState<T | undefined>(undefined);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const requestKey = key === null ? null : `${key}#${reloadCount}`;

  useEffect(() => {
    if (requestKey === null) return;
    const controller = new AbortController();
    fetcherRef.current(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, data });
        setLastData(data);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, error });
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const settled = result !== null && result.key === requestKey;
  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  return {
    data: lastData,
    error: settled ? result.error : undefined,
    loading: requestKey !== null && !settled,
    reload,
  };
}

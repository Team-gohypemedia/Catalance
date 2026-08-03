import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useAsyncResource = (loader, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const loaderRef = useRef(loader);
  const dataRef = useRef(data);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (options = {}) => {
      const isSilent = Boolean(options?.isSilent);

      if (isFetchingRef.current && isSilent) {
        return dataRef.current;
      }

      isFetchingRef.current = true;
      if (!isSilent && mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await loaderRef.current();
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
        return result;
      } catch (err) {
        if (!isSilent && mountedRef.current) {
          setError(err);
        }
        throw err;
      } finally {
        if (!isSilent && mountedRef.current) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    },
    deps // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!mountedRef.current) return;
    run().catch(() => null);
  }, [run]);

  const silentRefresh = useCallback(() => run({ isSilent: true }), [run]);

  return useMemo(
    () => ({
      data,
      setData,
      loading,
      error,
      refresh: run,
      silentRefresh,
    }),
    [data, loading, error, run, silentRefresh]
  );
};


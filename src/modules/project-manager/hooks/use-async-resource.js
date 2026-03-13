import { useCallback, useEffect, useMemo, useState } from "react";

export const useAsyncResource = (loader, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run().catch(() => null);
  }, [run]);

  return useMemo(
    () => ({
      data,
      setData,
      loading,
      error,
      refresh: run,
    }),
    [data, loading, error, run]
  );
};


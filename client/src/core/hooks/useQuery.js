import { useEffect, useCallback, useState } from "react";
import useQueryStore from "../stores/queryStore";
import OfflineDebugger from "../../shared/utils/debugger";

export const useQuery = (queryKey, fetcher, options = {}) => {
  const queryStore = useQueryStore();
  const [state, setState] = useState(() => queryStore.getQueryState(queryKey));

  // Ejecutar query
  const executeQuery = useCallback(async () => {
    try {
      await queryStore.query(queryKey, fetcher, {
        ...options,
        onSuccess: (data) => {
          setState((prev) => ({
            ...prev,
            data,
            status: "success",
            error: null,
          }));
          options.onSuccess?.(data);
        },
        onError: (error) => {
          setState((prev) => ({
            ...prev,
            error: error.message,
            status: "error",
          }));
          options.onError?.(error);
        },
      });
    } catch (error) {
      OfflineDebugger.error("QUERY_HOOK_ERROR", error, { queryKey });
    }
  }, [queryKey, fetcher, options, queryStore]);

  // Refetch manual
  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading" }));
    return executeQuery();
  }, [executeQuery]);

  // Suscribirse a cambios
  useEffect(() => {
    const unsubscribe = queryStore.subscribe(queryKey, (newState) => {
      setState(newState);
    });

    // Ejecutar query inicial si no hay datos en caché
    const currentState = queryStore.getQueryState(queryKey);
    if (currentState.status === "idle") {
      executeQuery();
    }

    return () => {
      unsubscribe();
    };
  }, [queryKey, queryStore, executeQuery]);

  return {
    ...state,
    refetch,
    // Helpers adicionales
    isLoading: state.status === "loading",
    isError: state.status === "error",
    isSuccess: state.status === "success",
    isIdle: state.status === "idle",
  };
};

// Hook para mutaciones
export const useMutation = (mutationFn, options = {}) => {
  const [state, setState] = useState({
    status: "idle",
    data: undefined,
    error: null,
  });

  const mutate = async (variables) => {
    try {
      setState({ status: "loading", data: undefined, error: null });

      const data = await mutationFn(variables);

      setState({ status: "success", data, error: null });
      options.onSuccess?.(data, variables);

      return data;
    } catch (error) {
      setState({ status: "error", data: undefined, error: error.message });
      options.onError?.(error, variables);
      throw error;
    } finally {
      options.onSettled?.();
    }
  };

  return {
    ...state,
    mutate,
    // Helpers
    isLoading: state.status === "loading",
    isError: state.status === "error",
    isSuccess: state.status === "success",
    isIdle: state.status === "idle",
    // Reset
    reset: () => setState({ status: "idle", data: undefined, error: null }),
  };
};

// Hook para infinite queries
export const useInfiniteQuery = (
  queryKey,
  fetcher,
  { getNextPageParam, ...options } = {}
) => {
  const [pages, setPages] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);

  const { status, error, refetch } = useQuery(
    queryKey,
    async () => {
      const data = await fetcher();
      setPages([data]);

      const nextPage = getNextPageParam?.(data);
      setHasNextPage(!!nextPage);

      return data;
    },
    options
  );

  const fetchNextPage = async () => {
    if (!hasNextPage) return;

    const lastPage = pages[pages.length - 1];
    const nextPageParam = getNextPageParam(lastPage);

    if (!nextPageParam) {
      setHasNextPage(false);
      return;
    }

    try {
      const nextPage = await fetcher(nextPageParam);
      setPages((prev) => [...prev, nextPage]);

      const hasMore = !!getNextPageParam(nextPage);
      setHasNextPage(hasMore);
    } catch (error) {
      OfflineDebugger.error("INFINITE_QUERY_ERROR", error, { queryKey });
    }
  };

  return {
    status,
    error,
    data: pages,
    hasNextPage,
    fetchNextPage,
    refetch,
    // Helpers
    isLoading: status === "loading",
    isError: status === "error",
    isSuccess: status === "success",
  };
};

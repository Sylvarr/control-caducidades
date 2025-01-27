export type QueryStatus = "idle" | "loading" | "error" | "success";

export interface QueryState<TData = unknown> {
  status: QueryStatus;
  data?: TData;
  error: string | null;
  timestamp?: number;
}

export interface QueryOptions<TData = unknown> {
  cacheTime?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export interface QueryStore {
  // State
  queries: Record<string, QueryState>;
  cache: Record<string, any>;
  subscribers: Record<string, Set<(state: QueryState) => void>>;

  // Getters
  getQueryState: <TData>(queryKey: string) => QueryState<TData>;
  getCacheEntry: <TData>(queryKey: string) => TData | undefined;

  // Actions
  setQueryState: <TData>(
    queryKey: string,
    state: Partial<QueryState<TData>>
  ) => void;
  setCacheEntry: <TData>(queryKey: string, data: TData) => void;
  subscribe: (
    queryKey: string,
    callback: (state: QueryState) => void
  ) => () => void;
  notifySubscribers: (queryKey: string) => void;
  query: <TData>(
    queryKey: string,
    fetcher: () => Promise<TData>,
    options?: QueryOptions<TData>
  ) => Promise<TData>;
  invalidateQueries: (queryKey: string) => void;
  prefetchQuery: <TData>(
    queryKey: string,
    fetcher: () => Promise<TData>,
    options?: QueryOptions<TData>
  ) => Promise<void>;
  clearCache: () => void;
}

export interface MutationState<TData = unknown> {
  status: QueryStatus;
  data?: TData;
  error: string | null;
}

export interface MutationOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: () => void;
}

export interface InfiniteQueryOptions<TData = unknown>
  extends QueryOptions<TData> {
  getNextPageParam?: (lastPage: TData) => unknown;
}

export interface InfiniteQueryResult<TData = unknown> {
  status: QueryStatus;
  error: string | null;
  data: TData[];
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  return useMemo(() => ({
    push: (path: string, state?: any) => navigate(path, { state }),
    replace: (path: string, state?: any) => navigate(path, { replace: true, state }),
    back: () => navigate(-1),
    pathname: location.pathname,
    query: Object.fromEntries(searchParams.entries()),
    setQuery: (newParams: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "all") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });
      setSearchParams(nextParams);
    },
    clearQuery: () => setSearchParams(new URLSearchParams()),
    params,
    searchParams,
  }), [navigate, location, params, searchParams, setSearchParams]);
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

let refreshing: Promise<void> | null = null;

async function tryRefresh(): Promise<void> {
  if (!refreshing) {
    refreshing = fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("refresh_failed");
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  _isRetry = false,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 401 && !_isRetry && path !== "/api/auth/refresh") {
    try {
      await tryRefresh();
      return apiFetch<T>(path, options, true);
    } catch {
      throw new Error("401 Unauthorized");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      if (json.message) message = json.message;
    } catch {
      // not JSON, keep raw text as message
    }
    throw new Error(`${res.status} ${message}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function apiFetchAuth<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, options);
}

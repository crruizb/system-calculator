import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "./test-helpers";

// eslint-disable-next-line react-refresh/only-export-components
export { createTestQueryClient };

export function TestProviders({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient ?? createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
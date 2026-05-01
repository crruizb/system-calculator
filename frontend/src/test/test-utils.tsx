import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "./test-helpers";

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
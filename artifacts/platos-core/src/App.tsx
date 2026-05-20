import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { SignalCommandCenter } from "@/components/SignalCommandCenter";

if (typeof window !== "undefined" && window.location.pathname.startsWith("/platos-core")) {
  setBaseUrl("/platos-core-api");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignalCommandCenter />
    </QueryClientProvider>
  );
}

export default App;

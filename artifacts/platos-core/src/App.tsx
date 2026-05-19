import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SignalCommandCenter } from "@/components/SignalCommandCenter";

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

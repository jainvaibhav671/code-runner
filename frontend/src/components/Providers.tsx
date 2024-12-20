import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
import { NuqsAdapter } from "nuqs/adapters/react";
import useTheme from "../hooks/useTheme";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const { theme: th } = useTheme();

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm:
              th === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
          }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}

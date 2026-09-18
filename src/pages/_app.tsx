import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { useState } from "react";
import { Provider } from "react-redux";
import { createQueryClient } from "@/lib";
import { store } from "@/store";

const inter = Inter({ subsets: ["latin"] });
const App = ({ Component, pageProps }: AppProps) => {
  const [queryClient] = useState(createQueryClient);
  return <ClerkProvider {...pageProps}><Provider store={store}><QueryClientProvider client={queryClient}><div className={inter.className}><Component {...pageProps} /></div></QueryClientProvider></Provider></ClerkProvider>;
};
export default App;

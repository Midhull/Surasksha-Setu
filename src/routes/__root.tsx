import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { APIProvider } from "@vis.gl/react-google-maps";
import { AuthProvider } from "../hooks/useAuth";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error('%c[ROUTER_CRASH]%c', 'color: #dc2626; font-weight: bold', 'color: inherit', error);
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[200] bg-[#050507] flex items-center justify-center p-6 text-center">
      <div className="max-w-md glass-panel p-10 rounded-[2.5rem] border-crimson-glow/20 shadow-2xl bg-white/[0.03] backdrop-blur-2xl">
        <div className="w-16 h-16 rounded-2xl bg-crimson-glow/10 flex items-center justify-center mx-auto mb-8 border border-crimson-glow/20">
          <AlertTriangle className="w-8 h-8 text-crimson-glow" />
        </div>
        <h2 className="text-2xl font-light tracking-tight text-white mb-4">Uplink Interrupted</h2>
        <p className="text-silver/40 text-sm leading-relaxed mb-6">
          The coordination interface encountered a critical state error. Your underlying safety subsystems remain active.
        </p>
        
        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl text-left overflow-auto max-h-40 mb-8">
          <p className="text-[10px] font-mono text-crimson-glow font-bold uppercase tracking-widest mb-2">Diagnostic Data:</p>
          <p className="text-[11px] font-mono text-silver/80 leading-relaxed break-all">
            {error.message}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="w-full py-4 rounded-2xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Resume Operations
          </button>
          <a 
            href="/dashboard"
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-silver text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            Abort & Reset
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Suraksha-Setu | Emergency Orchestration" },
      { name: "description", content: "Premium Emergency Orchestration & Situational Awareness Infrastructure" },
      { name: "theme-color", content: "#dc2626" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "author", content: "Suraksha-Setu Team" },
      { property: "og:title", content: "Suraksha-Setu" },
      { property: "og:description", content: "Your safety network, always connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <APIProvider apiKey={API_KEY} libraries={['places', 'routes', 'geometry']}>
          <Outlet />
          <Toaster position="top-right" theme="dark" />
        </APIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

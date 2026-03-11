import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { LogIn, ShieldAlert, Zap } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin } from "./hooks/useQueries";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { ReportsPage } from "./pages/ReportsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppLayout() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { login, loginStatus, identity } = useInternetIdentity();

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center bg-background"
        data-ocid="app.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    );
  }

  if (!identity || loginStatus !== "success") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              ACP Billing Manager
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to access your billing and inventory dashboard
            </p>
          </div>
          <Button
            onClick={login}
            disabled={loginStatus === "logging-in"}
            className="gap-2 w-full"
            data-ocid="auth.login.button"
          >
            <LogIn className="w-4 h-4" />
            {loginStatus === "logging-in" ? "Connecting..." : "Sign In"}
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 border border-destructive/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Access Restricted
            </h1>
            <p className="text-muted-foreground mt-2">
              You don't have permission to access this application. Please
              contact your administrator.
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {identity.getPrincipal().toString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
        <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border mt-8">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </footer>
      </main>
    </div>
  );
}

// Routes
const rootRoute = createRootRoute({ component: AppLayout });

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: CustomersPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: InventoryPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices",
  component: InvoicesPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  customersRoute,
  inventoryRoute,
  invoicesRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

export { Link };

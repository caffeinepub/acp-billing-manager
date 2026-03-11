import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
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
import { KeyRound, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { ReportsPage } from "./pages/ReportsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const PIN_KEY = "acpbm_pin";
const SESSION_KEY = "acpbm_session";

function PinScreen() {
  const storedPin = localStorage.getItem(PIN_KEY);
  const isSetup = !storedPin;
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">(
    isSetup ? "confirm" : "enter",
  );
  const [error, setError] = useState("");

  function handleEnter(value: string) {
    setPin(value);
    setError("");
    if (value.length === 4) {
      if (isSetup) {
        // First step of setup: go to confirm
        setStep("confirm");
        setPin(value);
      } else {
        // Verify against stored PIN
        if (value === storedPin) {
          sessionStorage.setItem(SESSION_KEY, "1");
          window.location.reload();
        } else {
          setError("Incorrect PIN. Please try again.");
          setTimeout(() => setPin(""), 400);
        }
      }
    }
  }

  function handleConfirm(value: string) {
    setConfirmPin(value);
    setError("");
    if (value.length === 4) {
      if (value === pin) {
        localStorage.setItem(PIN_KEY, pin);
        sessionStorage.setItem(SESSION_KEY, "1");
        window.location.reload();
      } else {
        setError("PINs do not match. Please try again.");
        setTimeout(() => {
          setConfirmPin("");
          setStep("confirm");
        }, 400);
      }
    }
  }

  const isConfirmStep = isSetup && step === "confirm";

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-4 text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            ACP Billing Manager
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSetup
              ? isConfirmStep
                ? "Confirm your new 4-digit PIN"
                : "Set up a 4-digit PIN to secure access"
              : "Enter your 4-digit PIN to continue"}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isConfirmStep ? "Confirm PIN" : "Enter PIN"}</span>
          </div>
          {isConfirmStep ? (
            <InputOTP
              maxLength={4}
              value={confirmPin}
              onChange={handleConfirm}
              data-ocid="pin.confirm.input"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          ) : (
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={handleEnter}
              data-ocid="pin.enter.input"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          )}
          {error && (
            <p className="text-sm text-destructive" data-ocid="pin.error_state">
              {error}
            </p>
          )}
          {isSetup && step === "confirm" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                setStep("enter" as any);
                setPin("");
                setConfirmPin("");
                setError("");
              }}
              data-ocid="pin.back.button"
            >
              ← Change PIN
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    setAuthenticated(session === "1");
  }, []);

  if (authenticated === null) {
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

  if (!authenticated) {
    return <PinScreen />;
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

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Users,
  Zap,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-semibold text-sidebar-foreground text-sm leading-tight">
            ACP Billing
          </p>
          <p className="text-xs text-muted-foreground">Manager</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            data-ocid={`nav.${label.toLowerCase()}.link`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className: cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                "bg-sidebar-accent text-primary font-semibold",
              ),
            }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        {isLoggedIn ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-3 truncate">
              {identity.getPrincipal().toString().slice(0, 20)}...
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={clear}
              data-ocid="nav.logout.button"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={login}
            disabled={loginStatus === "logging-in"}
            data-ocid="nav.login.button"
          >
            <LogIn className="w-4 h-4" />
            {loginStatus === "logging-in" ? "Connecting..." : "Sign In"}
          </Button>
        )}
      </div>
    </aside>
  );
}

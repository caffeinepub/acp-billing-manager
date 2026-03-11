import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, DollarSign, Package, Users } from "lucide-react";
import { useMemo } from "react";
import { InvoiceStatus } from "../backend.d";
import { useCustomers, useInvoices, useProducts } from "../hooks/useQueries";

function formatDate(date: bigint) {
  return new Date(Number(date / 1_000_000n)).toLocaleDateString();
}

function invoiceTotal(items: { quantity: bigint; unitPrice: number }[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.quantity) * item.unitPrice,
    0,
  );
}

function shortId(id: { toString(): string }) {
  const s = id.toString();
  return s.length > 10 ? `${s.slice(0, 10)}...` : s;
}

export function DashboardPage() {
  const { data: customers = [], isLoading: lc } = useCustomers();
  const { data: products = [], isLoading: lp } = useProducts();
  const { data: invoices = [], isLoading: li } = useInvoices();

  const stats = useMemo(() => {
    const revenue = invoices
      .filter((inv) => inv.status === InvoiceStatus.paid)
      .reduce((sum, inv) => sum + invoiceTotal(inv.items), 0);
    const lowStock = products.filter((p) => p.stock < 10n).length;
    return { revenue, lowStock };
  }, [invoices, products]);

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => Number(b.date - a.date)).slice(0, 8),
    [invoices],
  );

  const isLoading = lc || lp || li;

  const statCards = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Products",
      value: products.length,
      icon: Package,
      color: "text-purple-400",
    },
    {
      label: "Revenue (Paid)",
      value: `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Low Stock Items",
      value: stats.lowStock,
      icon: AlertTriangle,
      color: "text-amber-400",
    },
  ];

  const customerMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of customers) m.set(c.id.toString(), c.name);
    return m;
  }, [customers]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Business overview and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton
                  className="h-7 w-24"
                  data-ocid="dashboard.loading_state"
                />
              ) : (
                <p className={`text-2xl font-display font-bold ${card.color}`}>
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base font-semibold">
            Recent Invoices
          </CardTitle>
          <Link
            to="/invoices"
            className="text-xs text-primary hover:underline"
            data-ocid="dashboard.invoices.link"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-6 space-y-3"
              data-ocid="dashboard.invoices.loading_state"
            >
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : recentInvoices.length === 0 ? (
            <div
              className="p-12 text-center"
              data-ocid="dashboard.invoices.empty_state"
            >
              <p className="text-muted-foreground text-sm">
                No invoices yet. Create your first invoice.
              </p>
            </div>
          ) : (
            <Table data-ocid="dashboard.invoices.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv, i) => (
                  <TableRow
                    key={inv.id.toString()}
                    className="border-border"
                    data-ocid={`dashboard.invoices.item.${i + 1}` as any}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {shortId(inv.id)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {customerMap.get(inv.customerId.toString()) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      $
                      {invoiceTotal(inv.items).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === InvoiceStatus.paid
                            ? "default"
                            : "secondary"
                        }
                        className={
                          inv.status === InvoiceStatus.paid
                            ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

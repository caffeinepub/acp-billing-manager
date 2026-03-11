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
import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import { InvoiceStatus } from "../backend.d";
import { useCustomers, useInvoices, useProducts } from "../hooks/useQueries";

function invoiceTotal(items: { quantity: bigint; unitPrice: number }[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.quantity) * item.unitPrice,
    0,
  );
}

export function ReportsPage() {
  const { data: invoices = [], isLoading: li } = useInvoices();
  const { data: customers = [], isLoading: lc } = useCustomers();
  const { data: products = [], isLoading: lp } = useProducts();

  const isLoading = li || lc || lp;

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.paid,
    );
    const unpaidInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.unpaid,
    );
    const totalRevenue = paidInvoices.reduce(
      (s, inv) => s + invoiceTotal(inv.items),
      0,
    );
    const unpaidAmount = unpaidInvoices.reduce(
      (s, inv) => s + invoiceTotal(inv.items),
      0,
    );
    const avgInvoice =
      paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;
    return {
      totalRevenue,
      unpaidAmount,
      avgInvoice,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
    };
  }, [invoices]);

  const topCustomers = useMemo(() => {
    const counts = new Map<
      string,
      { name: string; count: number; total: number }
    >();
    for (const inv of invoices) {
      const key = inv.customerId.toString();
      const cust = customers.find((c) => c.id.toString() === key);
      const entry = counts.get(key) ?? {
        name: cust?.name ?? "Unknown",
        count: 0,
        total: 0,
      };
      entry.count += 1;
      entry.total += invoiceTotal(inv.items);
      counts.set(key, entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [invoices, customers]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.stock < 10n)
        .sort((a, b) => Number(a.stock - b.stock)),
    [products],
  );

  const summaryCards = [
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Outstanding (Unpaid)",
      value: `$${stats.unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: "Avg. Invoice Value",
      value: `$${stats.avgInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-blue-400",
    },
    {
      label: "Paid Invoices",
      value: `${stats.paidCount} of ${invoices.length}`,
      icon: Users,
      color: "text-green-400",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Business performance and inventory analysis
        </p>
      </div>

      <div>
        <h2 className="font-display text-base font-semibold mb-4">
          Sales Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton
                    className="h-7 w-28"
                    data-ocid="reports.loading_state"
                  />
                ) : (
                  <p className={`text-xl font-display font-bold ${card.color}`}>
                    {card.value}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top Customers by Invoice Count
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-6 space-y-2"
                data-ocid="reports.customers.loading_state"
              >
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : topCustomers.length === 0 ? (
              <div
                className="p-8 text-center"
                data-ocid="reports.customers.empty_state"
              >
                <p className="text-muted-foreground text-sm">
                  No invoice data yet.
                </p>
              </div>
            ) : (
              <Table data-ocid="reports.customers.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Total Billed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((tc, i) => (
                    <TableRow
                      key={tc.name}
                      className="border-border"
                      data-ocid={`reports.customers.item.${i + 1}` as any}
                    >
                      <TableCell className="font-medium">{tc.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
                          {tc.count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        $
                        {tc.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              Low Stock Products
              {lowStockProducts.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {lowStockProducts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-6 space-y-2"
                data-ocid="reports.inventory.loading_state"
              >
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div
                className="p-8 text-center"
                data-ocid="reports.inventory.empty_state"
              >
                <p className="text-muted-foreground text-sm">
                  All products are well-stocked.
                </p>
              </div>
            ) : (
              <Table data-ocid="reports.inventory.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((p, i) => (
                    <TableRow
                      key={p.id.toString()}
                      className="border-border bg-amber-500/5"
                      data-ocid={`reports.inventory.item.${i + 1}` as any}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-amber-400">
                          {String(p.stock)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

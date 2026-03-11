import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Loader2, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { InvoiceStatus } from "../backend.d";
import {
  useCreateInvoice,
  useCustomers,
  useDeleteInvoice,
  useInvoices,
  useProducts,
  useUpdateInvoice,
} from "../hooks/useQueries";
import type { Invoice, InvoiceItem } from "../hooks/useQueries";
import { formatINR } from "../lib/currency";

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
  return s.length > 12 ? `#${s.slice(-8)}` : `#${s}`;
}

let lineItemCounter = 0;
type LineItem = {
  id: number;
  productId: string;
  quantity: string;
  unitPrice: string;
};

export function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createMut = useCreateInvoice();
  const updateMut = useUpdateInvoice();
  const deleteMut = useDeleteInvoice();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const [custId, setCustId] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.unpaid);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: lineItemCounter++, productId: "", quantity: "1", unitPrice: "" },
  ]);

  const customerMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of customers) m.set(c.id.toString(), c.name);
    return m;
  }, [customers]);

  const productMap = useMemo(() => {
    const m = new Map<string, { name: string; price: number; unit: string }>();
    for (const p of products)
      m.set(p.id.toString(), {
        name: `${p.brand} - ${p.colourName}`,
        price: p.rate,
        unit: "SQFT",
      });
    return m;
  }, [products]);

  const grandTotal = lineItems.reduce((sum, li) => {
    const qty = Number.parseFloat(li.quantity) || 0;
    const up = Number.parseFloat(li.unitPrice) || 0;
    return sum + qty * up;
  }, 0);

  function openCreate() {
    setEditingInvoice(null);
    setCustId("");
    setStatus(InvoiceStatus.unpaid);
    setLineItems([
      { id: lineItemCounter++, productId: "", quantity: "1", unitPrice: "" },
    ]);
    setSheetOpen(true);
  }

  function openEdit(inv: Invoice) {
    setEditingInvoice(inv);
    setCustId(inv.customerId.toString());
    setStatus(inv.status);
    setLineItems(
      inv.items.map((it) => ({
        id: lineItemCounter++,
        productId: it.productId.toString(),
        quantity: String(it.quantity),
        unitPrice: String(it.unitPrice),
      })),
    );
    setSheetOpen(true);
  }

  function updateLineItem(i: number, field: keyof LineItem, val: string) {
    setLineItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === "productId") {
        const prod = productMap.get(val);
        if (prod) next[i].unitPrice = String(prod.price);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!custId) {
      toast.error("Select a customer");
      return;
    }
    if (lineItems.some((li) => !li.productId || !li.quantity)) {
      toast.error("Fill all line items");
      return;
    }
    const items: InvoiceItem[] = lineItems.map((li) => ({
      productId: products.find((p) => p.id.toString() === li.productId)!.id,
      quantity: BigInt(li.quantity),
      unitPrice: Number.parseFloat(li.unitPrice),
    }));
    const customer = customers.find((c) => c.id.toString() === custId)!;
    try {
      if (editingInvoice) {
        await updateMut.mutateAsync({
          id: editingInvoice.id,
          customerId: customer.id,
          items,
          status,
        });
        toast.success("Invoice updated");
      } else {
        await createMut.mutateAsync({ customerId: customer.id, items, status });
        toast.success("Invoice created");
      }
      setSheetOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success("Invoice deleted");
      setDeleteTarget(null);
      if (detailInvoice?.id === deleteTarget.id) setDetailInvoice(null);
    } catch {
      toast.error("Failed to delete invoice");
    }
  }

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => Number(b.date - a.date)),
    [invoices],
  );

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {invoices.length} total invoices
          </p>
        </div>
        <Button
          onClick={openCreate}
          data-ocid="invoices.create.open_modal_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="invoices.loading_state">
            {["a", "b", "c", "d", "e"].map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div className="p-12 text-center" data-ocid="invoices.empty_state">
            <p className="text-muted-foreground">
              No invoices yet. Create your first invoice.
            </p>
          </div>
        ) : (
          <Table data-ocid="invoices.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.map((inv, i) => (
                <TableRow
                  key={inv.id.toString()}
                  className="border-border"
                  data-ocid={`invoices.item.${i + 1}` as any}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {shortId(inv.id)}
                  </TableCell>
                  <TableCell>
                    {customerMap.get(inv.customerId.toString()) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(inv.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.items.length} item{inv.items.length !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatINR(invoiceTotal(inv.items))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        inv.status === InvoiceStatus.paid
                          ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailInvoice(inv)}
                        data-ocid={`invoices.view.button.${i + 1}` as any}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(inv)}
                        data-ocid={`invoices.edit_button.${i + 1}` as any}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(inv)}
                        data-ocid={`invoices.delete_button.${i + 1}` as any}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="w-full sm:max-w-xl overflow-y-auto"
          data-ocid="invoices.sheet"
        >
          <SheetHeader>
            <SheetTitle className="font-display">
              {editingInvoice ? "Edit Invoice" : "New Invoice"}
            </SheetTitle>
            <SheetDescription>Fill in invoice details below.</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={custId} onValueChange={setCustId}>
                <SelectTrigger data-ocid="invoices.customer.select">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as InvoiceStatus)}
              >
                <SelectTrigger data-ocid="invoices.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InvoiceStatus.unpaid}>Unpaid</SelectItem>
                  <SelectItem value={InvoiceStatus.paid}>Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() =>
                    setLineItems((prev) => [
                      ...prev,
                      {
                        id: lineItemCounter++,
                        productId: "",
                        quantity: "1",
                        unitPrice: "",
                      },
                    ])
                  }
                  data-ocid="invoices.add_item.button"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>
              {lineItems.map((li, i) => (
                <div
                  key={li.id}
                  className="p-3 rounded-lg bg-accent/30 border border-border space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">
                      Item {i + 1}
                    </span>
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground"
                        onClick={() =>
                          setLineItems((prev) => prev.filter((_, j) => j !== i))
                        }
                        data-ocid={
                          `invoices.remove_item.button.${i + 1}` as any
                        }
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Select
                    value={li.productId}
                    onValueChange={(v) => updateLineItem(i, "productId", v)}
                  >
                    <SelectTrigger
                      className="text-sm"
                      data-ocid={`invoices.item_product.select.${i + 1}` as any}
                    >
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem
                          key={p.id.toString()}
                          value={p.id.toString()}
                        >
                          {p.brand} - {p.colourName} — {formatINR(p.rate)}/SQFT
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={li.quantity}
                        onChange={(e) =>
                          updateLineItem(i, "quantity", e.target.value)
                        }
                        className="text-sm"
                        data-ocid={`invoices.item_qty.input.${i + 1}` as any}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit Price (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.unitPrice}
                        onChange={(e) =>
                          updateLineItem(i, "unitPrice", e.target.value)
                        }
                        className="text-sm"
                        data-ocid={`invoices.item_price.input.${i + 1}` as any}
                      />
                    </div>
                  </div>
                  <p className="text-right text-sm font-medium text-primary">
                    Subtotal:{" "}
                    {formatINR(
                      (Number.parseFloat(li.quantity) || 0) *
                        (Number.parseFloat(li.unitPrice) || 0),
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-medium">Grand Total</span>
              <span className="font-display text-xl font-bold text-primary">
                {formatINR(grandTotal)}
              </span>
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setSheetOpen(false)}
              data-ocid="invoices.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="invoices.submit.button"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingInvoice ? "Save Changes" : "Create Invoice"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Invoice Detail Sheet */}
      {detailInvoice && (
        <Sheet
          open={!!detailInvoice}
          onOpenChange={(o) => !o && setDetailInvoice(null)}
        >
          <SheetContent
            className="w-full sm:max-w-xl overflow-y-auto"
            data-ocid="invoices.detail.sheet"
          >
            <SheetHeader>
              <SheetTitle className="font-display flex items-center justify-between">
                Invoice {shortId(detailInvoice.id)}
                <Badge
                  className={
                    detailInvoice.status === InvoiceStatus.paid
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }
                >
                  {detailInvoice.status}
                </Badge>
              </SheetTitle>
              <SheetDescription>
                {customerMap.get(detailInvoice.customerId.toString()) ??
                  "Unknown"}{" "}
                · {formatDate(detailInvoice.date)}
              </SheetDescription>
            </SheetHeader>

            <div className="py-4 space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailInvoice.items.map((item, i) => {
                    const prod = productMap.get(item.productId.toString());
                    return (
                      <TableRow
                        key={`detail-${item.productId.toString()}-${i}`}
                        className="border-border"
                      >
                        <TableCell className="font-medium">
                          {prod?.name ?? item.productId.toString().slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-right">
                          {String(item.quantity)} {prod?.unit ?? ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatINR(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(Number(item.quantity) * item.unitPrice)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Grand Total</span>
                <span className="font-display text-2xl font-bold text-primary">
                  {formatINR(invoiceTotal(detailInvoice.items))}
                </span>
              </div>
            </div>

            <SheetFooter className="gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.print()}
                data-ocid="invoices.print.button"
              >
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button
                variant="outline"
                onClick={() => setDetailInvoice(null)}
                data-ocid="invoices.detail.close_button"
              >
                Close
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="invoices.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice{" "}
              {deleteTarget ? shortId(deleteTarget.id) : ""}? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="invoices.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="invoices.delete.confirm_button"
            >
              {deleteMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";
import type { Product } from "../hooks/useQueries";

const EMPTY_FORM = { name: "", unit: "", price: "", stock: "" };

export function InventoryPage() {
  const { data: products = [], isLoading } = useProducts();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      unit: p.unit,
      price: String(p.price),
      stock: String(p.stock),
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const price = Number.parseFloat(form.price);
    const stock = BigInt(form.stock || "0");
    if (!form.name || !form.unit || Number.isNaN(price)) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          name: form.name,
          unit: form.unit,
          price,
          stock,
        });
        toast.success("Product updated");
      } else {
        await createMut.mutateAsync({
          name: form.name,
          unit: form.unit,
          price,
          stock,
        });
        toast.success("Product created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success("Product deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete product");
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;
  const lowStockCount = products.filter((p) => p.stock < 10n).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} products
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-400 font-medium">
                · {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="inventory.add.open_modal_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {lowStockCount} product{lowStockCount > 1 ? "s are" : " is"} running
            low on stock (below 10 units)
          </span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="inventory.search_input"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="inventory.loading_state">
            {["a", "b", "c", "d", "e"].map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" data-ocid="inventory.empty_state">
            <p className="text-muted-foreground">
              {search
                ? `No products matching "${search}"`
                : "No products yet. Add your first product."}
            </p>
          </div>
        ) : (
          <Table data-ocid="inventory.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Product Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p, i) => {
                const isLow = p.stock < 10n;
                return (
                  <TableRow
                    key={p.id.toString()}
                    className={cn("border-border", isLow && "bg-amber-500/5")}
                    data-ocid={`inventory.item.${i + 1}` as any}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.unit}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${p.price.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn("font-medium", isLow && "text-amber-400")}
                    >
                      {String(p.stock)}
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          data-ocid={`inventory.edit_button.${i + 1}` as any}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(p)}
                          data-ocid={`inventory.delete_button.${i + 1}` as any}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              Fill in the product details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="ACP Panel 4mm"
                data-ocid="inventory.name.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="sheet"
                  data-ocid="inventory.unit.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="inventory.price.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
                placeholder="0"
                data-ocid="inventory.stock.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="inventory.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="inventory.submit.button"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="inventory.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="inventory.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="inventory.delete.confirm_button"
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

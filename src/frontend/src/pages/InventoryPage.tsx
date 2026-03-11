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
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";
import type { Product } from "../hooks/useQueries";
import { formatINR } from "../lib/currency";

const EMPTY_FORM = {
  brand: "",
  grade: "",
  colourCode: "",
  colourName: "",
  thickness: "",
  length: "",
  width: "",
  qty: "",
  sqft: "",
  batchNo: "",
  rate: "",
};

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

  // Auto-calculate SQFT from length * width * qty
  useEffect(() => {
    const l = Number.parseFloat(form.length);
    const w = Number.parseFloat(form.width);
    const q = Number.parseFloat(form.qty);
    if (
      !Number.isNaN(l) &&
      !Number.isNaN(w) &&
      !Number.isNaN(q) &&
      l > 0 &&
      w > 0 &&
      q > 0
    ) {
      const calculated = (l * w * q).toFixed(2);
      setForm((f) => ({ ...f, sqft: calculated }));
    }
  }, [form.length, form.width, form.qty]);

  const filtered = products.filter(
    (p) =>
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.colourName.toLowerCase().includes(search.toLowerCase()) ||
      p.colourCode.toLowerCase().includes(search.toLowerCase()) ||
      p.batchNo.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      brand: p.brand,
      grade: p.grade,
      colourCode: p.colourCode,
      colourName: p.colourName,
      thickness: String(p.thickness),
      length: String(p.length),
      width: String(p.width),
      qty: String(p.qty),
      sqft: String(p.sqft),
      batchNo: p.batchNo,
      rate: String(p.rate),
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (
      !form.brand ||
      !form.grade ||
      !form.colourCode ||
      !form.colourName ||
      !form.batchNo
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const thickness = Number.parseFloat(form.thickness || "0");
    const length = Number.parseFloat(form.length || "0");
    const width = Number.parseFloat(form.width || "0");
    const qty = BigInt(form.qty || "0");
    const sqft = Number.parseFloat(form.sqft || "0");
    const rate = Number.parseFloat(form.rate || "0");
    if (
      Number.isNaN(thickness) ||
      Number.isNaN(length) ||
      Number.isNaN(width) ||
      Number.isNaN(sqft) ||
      Number.isNaN(rate)
    ) {
      toast.error("Please enter valid numbers");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          brand: form.brand,
          grade: form.grade,
          colourCode: form.colourCode,
          colourName: form.colourName,
          thickness,
          length,
          width,
          qty,
          sqft,
          batchNo: form.batchNo,
          rate,
        });
        toast.success("Product updated");
      } else {
        await createMut.mutateAsync({
          brand: form.brand,
          grade: form.grade,
          colourCode: form.colourCode,
          colourName: form.colourName,
          thickness,
          length,
          width,
          qty,
          sqft,
          batchNo: form.batchNo,
          rate,
        });
        toast.success("Product added");
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} products
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by brand, colour name, code or batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="inventory.search_input"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
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
                <TableHead>Brand</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>C.Code</TableHead>
                <TableHead>Colour Name</TableHead>
                <TableHead>Thickness</TableHead>
                <TableHead>L x W</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>SQFT</TableHead>
                <TableHead>Batch No</TableHead>
                <TableHead>Rate (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p, i) => (
                <TableRow
                  key={p.id.toString()}
                  className="border-border"
                  data-ocid={`inventory.item.${i + 1}` as any}
                >
                  <TableCell className="font-medium">{p.brand}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.grade}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.colourCode}
                  </TableCell>
                  <TableCell>{p.colourName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.thickness} mm
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.length} x {p.width}
                  </TableCell>
                  <TableCell className="font-medium">{String(p.qty)}</TableCell>
                  <TableCell className="font-medium">
                    {p.sqft.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.batchNo}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatINR(p.rate)}
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              Fill in all the ACP panel details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Brand *</Label>
              <Input
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="e.g. Alucobond"
                data-ocid="inventory.brand.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Grade *</Label>
              <Input
                value={form.grade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grade: e.target.value }))
                }
                placeholder="e.g. A1, FR"
                data-ocid="inventory.grade.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>C.Code *</Label>
              <Input
                value={form.colourCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colourCode: e.target.value }))
                }
                placeholder="e.g. P001"
                data-ocid="inventory.colour_code.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Colour Name *</Label>
              <Input
                value={form.colourName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colourName: e.target.value }))
                }
                placeholder="e.g. Silver Metallic"
                data-ocid="inventory.colour_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Thickness (mm)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.thickness}
                onChange={(e) =>
                  setForm((f) => ({ ...f, thickness: e.target.value }))
                }
                placeholder="e.g. 4"
                data-ocid="inventory.thickness.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Batch No *</Label>
              <Input
                value={form.batchNo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, batchNo: e.target.value }))
                }
                placeholder="e.g. B2024-01"
                data-ocid="inventory.batch_no.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Length (ft)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.length}
                onChange={(e) =>
                  setForm((f) => ({ ...f, length: e.target.value }))
                }
                placeholder="e.g. 8"
                data-ocid="inventory.length.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Width (ft)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.width}
                onChange={(e) =>
                  setForm((f) => ({ ...f, width: e.target.value }))
                }
                placeholder="e.g. 4"
                data-ocid="inventory.width.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Qty (sheets)</Label>
              <Input
                type="number"
                min="0"
                value={form.qty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qty: e.target.value }))
                }
                placeholder="0"
                data-ocid="inventory.qty.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>SQFT (auto-calculated)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.sqft}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sqft: e.target.value }))
                }
                placeholder="0.00"
                data-ocid="inventory.sqft.input"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Rate (₹ per SQFT)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rate: e.target.value }))
                }
                placeholder="0.00"
                data-ocid="inventory.rate.input"
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
              <strong>
                {deleteTarget?.brand} - {deleteTarget?.colourName}
              </strong>
              ? This action cannot be undone.
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

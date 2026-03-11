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
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../hooks/useQueries";
import type { Customer } from "../hooks/useQueries";

const EMPTY_FORM = { name: "", phone: "", email: "", address: "" };

export function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success("Customer updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Customer created");
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
      toast.success("Customer deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete customer");
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {customers.length} total customers
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="customers.add.open_modal_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="customers.search_input"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="customers.loading_state">
            {["a", "b", "c", "d", "e"].map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" data-ocid="customers.empty_state">
            <p className="text-muted-foreground">
              {search
                ? `No customers matching "${search}"`
                : "No customers yet. Add your first customer."}
            </p>
          </div>
        ) : (
          <Table data-ocid="customers.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow
                  key={c.id.toString()}
                  className="border-border"
                  data-ocid={`customers.item.${i + 1}` as any}
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[180px] truncate">
                    {c.address}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        data-ocid={`customers.edit_button.${i + 1}` as any}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(c)}
                        data-ocid={`customers.delete_button.${i + 1}` as any}
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
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
            <DialogDescription>
              Fill in the customer details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Acme Industries Ltd."
                data-ocid="customers.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+1 555-000-1234"
                data-ocid="customers.phone.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="contact@acme.com"
                data-ocid="customers.email.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="123 Main St, City, State"
                data-ocid="customers.address.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="customers.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="customers.submit.button"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editing ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="customers.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="customers.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="customers.delete.confirm_button"
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

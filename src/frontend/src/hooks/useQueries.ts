import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Product,
} from "../backend.d";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInvoices() {
  const { actor, isFetching } = useActor();
  return useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInvoices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createCustomer(
        data.name,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: Principal;
      name: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCustomer(
        data.id,
        data.name,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      unit: string;
      price: number;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createProduct(data.name, data.unit, data.price, data.stock);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: Principal;
      name: string;
      unit: string;
      price: number;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateProduct(
        data.id,
        data.name,
        data.unit,
        data.price,
        data.stock,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerId: Principal;
      items: InvoiceItem[];
      status: InvoiceStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createInvoice(data.customerId, data.items, data.status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: Principal;
      customerId: Principal;
      items: InvoiceItem[];
      status: InvoiceStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateInvoice(
        data.id,
        data.customerId,
        data.items,
        data.status,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteInvoice(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export type { Customer, Product, Invoice, InvoiceItem };

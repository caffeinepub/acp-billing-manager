import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InvoiceItem {
    productId: Principal;
    quantity: bigint;
    unitPrice: number;
}
export type Time = bigint;
export interface Invoice {
    id: Principal;
    status: InvoiceStatus;
    date: Time;
    customerId: Principal;
    items: Array<InvoiceItem>;
}
export interface Customer {
    id: Principal;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface Product {
    id: Principal;
    brand: string;
    grade: string;
    colourCode: string;
    colourName: string;
    thickness: number;
    length: number;
    width: number;
    qty: bigint;
    sqft: number;
    batchNo: string;
    rate: number;
}
export enum InvoiceStatus {
    paid = "paid",
    unpaid = "unpaid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomer(name: string, phone: string, email: string, address: string): Promise<Customer>;
    createInvoice(customerId: Principal, items: Array<InvoiceItem>, status: InvoiceStatus): Promise<Invoice>;
    createProduct(brand: string, grade: string, colourCode: string, colourName: string, thickness: number, length: number, width: number, qty: bigint, sqft: number, batchNo: string, rate: number): Promise<Product>;
    deleteCustomer(id: Principal): Promise<void>;
    deleteInvoice(id: Principal): Promise<void>;
    deleteProduct(id: Principal): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    updateCustomer(id: Principal, name: string, phone: string, email: string, address: string): Promise<Customer>;
    updateInvoice(id: Principal, customerId: Principal, items: Array<InvoiceItem>, status: InvoiceStatus): Promise<Invoice>;
    updateProduct(id: Principal, brand: string, grade: string, colourCode: string, colourName: string, thickness: number, length: number, width: number, qty: bigint, sqft: number, batchNo: string, rate: number): Promise<Product>;
}

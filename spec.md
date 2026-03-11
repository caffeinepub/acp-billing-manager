# ACP Billing Manager

## Current State
New project with no existing backend or frontend code.

## Requested Changes (Diff)

### Add
- Dashboard with business insights (revenue, orders, stock value)
- Customer (party) management: create, edit, list customers with contact info
- ACP panel inventory management: products with stock levels, auto stock deduction on sale
- Invoice creation with packing-list style line items, quantity, price, totals
- Invoice listing with search/filter by customer, date, status
- PDF export for invoices
- Basic reporting: sales summary, low stock alerts
- Authorization (admin login)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Customers CRUD, Products/Inventory CRUD, Invoices CRUD with stock deduction logic, Dashboard stats query
2. Frontend: Sidebar navigation, Dashboard page, Customers page, Inventory page, Invoices page with create flow, Reports page
3. Authorization for admin access
4. PDF export via browser print/jsPDF on frontend

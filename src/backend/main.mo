import Text "mo:core/Text";
import Float "mo:core/Float";
import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let sales = Map.empty<Principal, Float>();
  let customers = Map.empty<Principal, Customer>();
  let invoices = Map.empty<Principal, Invoice>();
  let productSales = Map.empty<Principal, List.List<SaleEntry>>();

  // ── Old Product type kept to absorb previously-stored stable data ──────────
  // Do NOT rename or remove this; Motoko matches stable vars by name.
  type OldProduct = {
    id : Principal;
    name : Text;
    unit : Text;
    price : Float;
    stock : Nat;
  };
  let products = Map.empty<Principal, OldProduct>();

  // ── New Product type ────────────────────────────────────────────────────────
  public type Product = {
    id : Principal;
    brand : Text;
    grade : Text;
    colourCode : Text;
    colourName : Text;
    thickness : Float;
    length : Float;
    width : Float;
    qty : Nat;
    sqft : Float;
    batchNo : Text;
    rate : Float;
  };

  let productsV2 = Map.empty<Principal, Product>();
  stable var migrationDone = false;

  // One-time migration: convert old Products into the new schema.
  system func postupgrade() {
    if (not migrationDone) {
      for (p in products.values()) {
        let newP : Product = {
          id = p.id;
          brand = p.name;
          grade = "";
          colourCode = "";
          colourName = "";
          thickness = 0.0;
          length = 0.0;
          width = 0.0;
          qty = p.stock;
          sqft = 0.0;
          batchNo = "";
          rate = p.price;
        };
        productsV2.add(p.id, newP);
      };
      migrationDone := true;
    };
  };

  // ── Other types ─────────────────────────────────────────────────────────────
  public type Customer = {
    id : Principal;
    name : Text;
    phone : Text;
    email : Text;
    address : Text;
  };

  module Customer {
    public func compare(c1 : Customer, c2 : Customer) : Order.Order {
      switch (Text.compare(c1.name, c2.name)) {
        case (#equal) { Text.compare(c1.email, c2.email) };
        case (order) { order };
      };
    };
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      switch (Text.compare(p1.brand, p2.brand)) {
        case (#equal) { Text.compare(p1.colourName, p2.colourName) };
        case (order) { order };
      };
    };
  };

  public type InvoiceItem = {
    productId : Principal;
    quantity : Nat;
    unitPrice : Float;
  };

  public type Invoice = {
    id : Principal;
    customerId : Principal;
    date : Time.Time;
    items : [InvoiceItem];
    status : InvoiceStatus;
  };

  module Invoice {
    public func compare(i1 : Invoice, i2 : Invoice) : Order.Order {
      switch (Float.compare(i1.totalPrice(), i2.totalPrice())) {
        case (#equal) { Text.compare(i1.id.toText(), i2.id.toText()) };
        case (order) { order };
      };
    };

    public func totalPrice(self : Invoice) : Float {
      self.items.foldLeft(
        0.0,
        func(acc, item) { acc + item.unitPrice * item.quantity.toFloat() },
      );
    };
  };

  public type InvoiceStatus = { #paid; #unpaid };
  public type SaleEntry = {
    date : Time.Time;
    quantity : Nat;
    totalPrice : Float;
  };

  // ── Authorization ────────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func checkAdmin(caller : Principal) : () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // ── Customer operations ──────────────────────────────────────────────────────
  public shared ({ caller }) func createCustomer(name : Text, phone : Text, email : Text, address : Text) : async Customer {
    checkAdmin(caller);
    let id = Principal.fromText(name.concat(phone));
    let customer = { id; name; phone; email; address };
    customers.add(id, customer);
    customer;
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    checkAdmin(caller);
    customers.values().toArray().sort();
  };

  public shared ({ caller }) func updateCustomer(id : Principal, name : Text, phone : Text, email : Text, address : Text) : async Customer {
    checkAdmin(caller);
    let c = { id; name; phone; email; address };
    customers.add(id, c);
    c;
  };

  public shared ({ caller }) func deleteCustomer(id : Principal) : async () {
    checkAdmin(caller);
    customers.remove(id);
  };

  // ── Product operations (all use productsV2) ──────────────────────────────────
  public shared ({ caller }) func createProduct(
    brand : Text,
    grade : Text,
    colourCode : Text,
    colourName : Text,
    thickness : Float,
    length : Float,
    width : Float,
    qty : Nat,
    sqft : Float,
    batchNo : Text,
    rate : Float,
  ) : async Product {
    checkAdmin(caller);
    let id = Principal.fromText(brand.concat(colourCode).concat(batchNo));
    let p = { id; brand; grade; colourCode; colourName; thickness; length; width; qty; sqft; batchNo; rate };
    productsV2.add(id, p);
    p;
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    checkAdmin(caller);
    productsV2.values().toArray().sort();
  };

  public shared ({ caller }) func updateProduct(
    id : Principal,
    brand : Text,
    grade : Text,
    colourCode : Text,
    colourName : Text,
    thickness : Float,
    length : Float,
    width : Float,
    qty : Nat,
    sqft : Float,
    batchNo : Text,
    rate : Float,
  ) : async Product {
    checkAdmin(caller);
    let p = { id; brand; grade; colourCode; colourName; thickness; length; width; qty; sqft; batchNo; rate };
    productsV2.add(id, p);
    p;
  };

  public shared ({ caller }) func deleteProduct(id : Principal) : async () {
    checkAdmin(caller);
    productsV2.remove(id);
  };

  // ── Invoice operations ───────────────────────────────────────────────────────
  public shared ({ caller }) func createInvoice(customerId : Principal, items : [InvoiceItem], status : InvoiceStatus) : async Invoice {
    checkAdmin(caller);
    let id = Principal.fromText(customerId.toText());
    let inv = { id; customerId; date = Time.now(); items; status };
    invoices.add(id, inv);
    inv;
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    checkAdmin(caller);
    invoices.values().toArray().sort();
  };

  public shared ({ caller }) func updateInvoice(id : Principal, customerId : Principal, items : [InvoiceItem], status : InvoiceStatus) : async Invoice {
    checkAdmin(caller);
    let inv = { id; customerId; date = Time.now(); items; status };
    invoices.add(id, inv);
    inv;
  };

  public shared ({ caller }) func deleteInvoice(id : Principal) : async () {
    checkAdmin(caller);
    invoices.remove(id);
  };
};

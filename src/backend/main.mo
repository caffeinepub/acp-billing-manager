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
  let products = Map.empty<Principal, Product>();
  let invoices = Map.empty<Principal, Invoice>();
  let productSales = Map.empty<Principal, List.List<SaleEntry>>();

  public type Customer = {
    id : Principal;
    name : Text;
    phone : Text;
    email : Text;
    address : Text;
  };

  module Customer {
    public func compare(customer1 : Customer, customer2 : Customer) : Order.Order {
      switch (Text.compare(customer1.name, customer2.name)) {
        case (#equal) { Text.compare(customer1.email, customer2.email) };
        case (order) { order };
      };
    };
  };

  public type Product = {
    id : Principal;
    name : Text;
    unit : Text;
    price : Float;
    stock : Nat;
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      switch (Text.compare(product1.name, product2.name)) {
        case (#equal) { Float.compare(product1.price, product2.price) };
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
    public func compare(invoice1 : Invoice, invoice2 : Invoice) : Order.Order {
      switch (Float.compare(invoice1.totalPrice(), invoice2.totalPrice())) {
        case (#equal) { Text.compare(invoice1.id.toText(), invoice2.id.toText()) };
        case (order) { order };
      };
    };

    public func totalPrice(self : Invoice) : Float {
      self.items.foldLeft(
        0.0,
        func(acc, item) { acc + item.unitPrice * item.quantity.toFloat() }
      );
    };
  };

  public type InvoiceStatus = { #paid; #unpaid };
  public type SaleEntry = {
    date : Time.Time;
    quantity : Nat;
    totalPrice : Float;
  };

  // Authorization system (initialized for this actor)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func checkAdmin(caller : Principal) : () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Customer operations
  public shared ({ caller }) func createCustomer(name : Text, phone : Text, email : Text, address : Text) : async Customer {
    checkAdmin(caller);
    let id = Principal.fromText(name.concat(phone));
    let customer = {
      id;
      name;
      phone;
      email;
      address;
    };
    customers.add(id, customer);
    customer;
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    checkAdmin(caller);
    customers.values().toArray().sort();
  };

  public shared ({ caller }) func updateCustomer(id : Principal, name : Text, phone : Text, email : Text, address : Text) : async Customer {
    checkAdmin(caller);
    let newCustomer = {
      id;
      name;
      phone;
      email;
      address;
    };
    updateCustomerInternal(id, newCustomer);
  };

  func updateCustomerInternal(id : Principal, newCustomer : Customer) : Customer {
    customers.add(id, newCustomer);
    newCustomer;
  };

  public shared ({ caller }) func deleteCustomer(id : Principal) : async () {
    checkAdmin(caller);
    customers.remove(id);
  };

  // Product operations
  public shared ({ caller }) func createProduct(name : Text, unit : Text, price : Float, stock : Nat) : async Product {
    checkAdmin(caller);
    let id = Principal.fromText(name);
    let product = {
      id;
      name;
      unit;
      price;
      stock;
    };
    products.add(id, product);
    product;
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    checkAdmin(caller);
    products.values().toArray().sort();
  };

  public shared ({ caller }) func updateProduct(id : Principal, name : Text, unit : Text, price : Float, stock : Nat) : async Product {
    checkAdmin(caller);
    let newProduct = {
      id;
      name;
      unit;
      price;
      stock;
    };
    updateProductInternal(id, newProduct);
  };

  func updateProductInternal(id : Principal, newProduct : Product) : Product {
    products.add(id, newProduct);
    newProduct;
  };

  public shared ({ caller }) func deleteProduct(id : Principal) : async () {
    checkAdmin(caller);
    products.remove(id);
  };

  // Invoice operations
  public shared ({ caller }) func createInvoice(customerId : Principal, items : [InvoiceItem], status : InvoiceStatus) : async Invoice {
    checkAdmin(caller);
    let id = Principal.fromText(customerId.toText());
    let invoice = {
      id;
      customerId;
      date = Time.now();
      items;
      status;
    };
    invoices.add(id, invoice);
    invoice;
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    checkAdmin(caller);
    invoices.values().toArray().sort();
  };

  public shared ({ caller }) func updateInvoice(id : Principal, customerId : Principal, items : [InvoiceItem], status : InvoiceStatus) : async Invoice {
    checkAdmin(caller);
    let newInvoice = {
      id;
      customerId;
      date = Time.now();
      items;
      status;
    };
    updateInvoiceInternal(id, newInvoice);
  };

  func updateInvoiceInternal(id : Principal, newInvoice : Invoice) : Invoice {
    invoices.add(id, newInvoice);
    newInvoice;
  };

  public shared ({ caller }) func deleteInvoice(id : Principal) : async () {
    checkAdmin(caller);
    invoices.remove(id);
  };
};

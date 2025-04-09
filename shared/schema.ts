import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// School settings type
export type SchoolSettings = {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  logo: string | null;
  receiptPrefix: string;
  academicYear: string;
  currentTerm: string;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableAutomaticReminders: boolean;
  reminderDays: number;
  taxPercentage: number;
  receiptFooterText: string;
  receiptCopies: number;
  theme: "light" | "dark" | "system";
};

// Define a set of constants for grade levels
export const GRADES = [
  "Nursery",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;

export const SECTIONS = ["A", "B", "C", "D"] as const;

export const FEE_TYPES = [
  "Tuition",
  "Admission",
  "Examination",
  "Laboratory",
  "Library",
  "Transportation",
  "Uniform",
  "Sports",
  "Annual Day",
  "Other",
] as const;

export const TRANSPORTATION_FREQUENCY = [
  "Monthly",
  "Quarterly",
  "Semi-Annual",
  "Annual",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "Check",
  "Online Transfer",
  "UPI",
  "Credit/Debit Card",
] as const;

export const PAYMENT_STATUS = [
  "Paid",
  "Pending",
  "Partial",
  "Overdue",
] as const;

// Transportation Routes table
export const transportationRoutes = pgTable("transportation_routes", {
  id: serial("id").primaryKey(),
  routeName: text("route_name").notNull(),
  description: text("description"),
  distance: doublePrecision("distance"), // in kilometers
  fare: doublePrecision("fare").notNull(), // base fare amount
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  admissionNumber: text("admission_number").notNull().unique(),
  studentName: text("student_name").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  rollNumber: integer("roll_number").notNull(),
  parentName: text("parent_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email"),
  feeCategory: text("fee_category").default("Regular").notNull(),
  transportationRouteId: integer("transportation_route_id"), // Reference to transportation route
  pickupPoint: text("pickup_point"), // Optional pickup point details
  admissionDate: date("admission_date").notNull(),
});

// Fee Structure table
export const feeStructure = pgTable("fee_structure", {
  id: serial("id").primaryKey(),
  grade: text("grade").notNull(),
  feeType: text("fee_type").notNull(),
  amount: doublePrecision("amount").notNull(),
  frequency: text("frequency").notNull(), // "Monthly", "Quarterly", "Annual", "One-time"
  dueDay: integer("due_day"), // Day of the month when fee is due (for monthly fees)
});

// Fee Receipts table
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  studentId: integer("student_id").notNull(),
  receiptDate: date("receipt_date").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("Completed").notNull(),
});

// Receipt Items table (to store individual fee items in a receipt)
export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull(),
  feeType: text("fee_type").notNull(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  period: text("period"), // e.g., "May 2023" for monthly fees
});

// Fee Dues table (to track pending fees)
export const feeDues = pgTable("fee_dues", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  feeType: text("fee_type").notNull(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("Due").notNull(), // "Paid", "Due", "Overdue", "Partial"
  period: text("period"), // e.g., "May 2023" for monthly fees
  amountPaid: doublePrecision("amount_paid").default(0).notNull(),
});

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // "Administrator", "Teacher"
  fullName: text("full_name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertTransportationRouteSchema = createInsertSchema(
  transportationRoutes,
).pick({
  routeName: true,
  description: true,
  distance: true,
  fare: true,
  isActive: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  admissionNumber: true,
  studentName: true,
  grade: true,
  section: true,
  rollNumber: true,
  parentName: true,
  contactNumber: true,
  email: true,
  feeCategory: true,
  transportationRouteId: true,
  pickupPoint: true,
  admissionDate: true,
});

export const insertFeeStructureSchema = createInsertSchema(feeStructure).pick({
  grade: true,
  feeType: true,
  amount: true,
  frequency: true,
  dueDay: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).pick({
  receiptNumber: true,
  studentId: true,
  receiptDate: true,
  totalAmount: true,
  paymentMethod: true,
  paymentReference: true,
  remarks: true,
  status: true,
});

export const insertReceiptItemSchema = createInsertSchema(receiptItems).pick({
  receiptId: true,
  feeType: true,
  description: true,
  amount: true,
  period: true,
});

export const insertFeeDueSchema = createInsertSchema(feeDues).pick({
  studentId: true,
  feeType: true,
  description: true,
  amount: true,
  dueDate: true,
  status: true,
  period: true,
  amountPaid: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  fullName: true,
  email: true,
});

// Types
export type TransportationRoute = typeof transportationRoutes.$inferSelect;
export type InsertTransportationRoute = z.infer<
  typeof insertTransportationRouteSchema
>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type FeeStructureItem = typeof feeStructure.$inferSelect;
export type InsertFeeStructureItem = z.infer<typeof insertFeeStructureSchema>;

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

export type ReceiptItem = typeof receiptItems.$inferSelect;
export type InsertReceiptItem = z.infer<typeof insertReceiptItemSchema>;

export type FeeDue = typeof feeDues.$inferSelect;
export type InsertFeeDue = z.infer<typeof insertFeeDueSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

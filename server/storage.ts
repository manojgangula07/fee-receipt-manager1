import {
  students,
  Student,
  InsertStudent,
  feeStructure,
  FeeStructureItem,
  InsertFeeStructureItem,
  receipts,
  Receipt,
  InsertReceipt,
  receiptItems,
  ReceiptItem,
  InsertReceiptItem,
  feeDues,
  FeeDue,
  InsertFeeDue,
  users,
  User,
  InsertUser,
  transportationRoutes,
  TransportationRoute,
  InsertTransportationRoute,
  GRADES,
  FEE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TRANSPORTATION_FREQUENCY,
  SchoolSettings,
} from "@shared/schema";

export interface IStorage {
  // Transportation route operations
  getTransportationRoute(id: number): Promise<TransportationRoute | undefined>;
  getAllTransportationRoutes(
    activeOnly?: boolean,
  ): Promise<TransportationRoute[]>;
  createTransportationRoute(
    route: InsertTransportationRoute,
  ): Promise<TransportationRoute>;
  updateTransportationRoute(
    id: number,
    route: Partial<InsertTransportationRoute>,
  ): Promise<TransportationRoute | undefined>;
  deleteTransportationRoute(id: number): Promise<boolean>;

  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByAdmissionNumber(
    admissionNumber: string,
  ): Promise<Student | undefined>;
  searchStudents(query: string, grade?: string): Promise<Student[]>;
  getStudentsByGrade(grade: string): Promise<Student[]>;
  getStudentsByTransportationRoute(routeId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(
    id: number,
    student: Partial<InsertStudent>,
  ): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Fee structure operations
  getFeeStructure(id: number): Promise<FeeStructureItem | undefined>;
  getFeeStructureByGrade(grade: string): Promise<FeeStructureItem[]>;
  getAllFeeStructure(): Promise<FeeStructureItem[]>;
  createFeeStructure(
    feeStructure: InsertFeeStructureItem,
  ): Promise<FeeStructureItem>;
  updateFeeStructure(
    id: number,
    feeStructure: Partial<InsertFeeStructureItem>,
  ): Promise<FeeStructureItem | undefined>;
  deleteFeeStructure(id: number): Promise<boolean>;

  // Receipt operations
  getReceipt(id: number): Promise<Receipt | undefined>;
  getReceiptByNumber(receiptNumber: string): Promise<Receipt | undefined>;
  getReceiptsByStudent(studentId: number): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(
    id: number,
    receipt: Partial<InsertReceipt>,
  ): Promise<Receipt | undefined>;
  deleteReceipt(id: number): Promise<boolean>;
  getRecentReceipts(
    limit: number,
  ): Promise<
    (Receipt & { studentName: string; grade: string; section: string })[]
  >;

  // Receipt items operations
  getReceiptItems(receiptId: number): Promise<ReceiptItem[]>;
  createReceiptItem(receiptItem: InsertReceiptItem): Promise<ReceiptItem>;
  updateReceiptItem(
    id: number,
    receiptItem: Partial<InsertReceiptItem>,
  ): Promise<ReceiptItem | undefined>;
  deleteReceiptItem(id: number): Promise<boolean>;

  // Fee due operations
  getFeeDue(id: number): Promise<FeeDue | undefined>;
  getFeeDuesByStudent(studentId: number): Promise<FeeDue[]>;
  createFeeDue(feeDue: InsertFeeDue): Promise<FeeDue>;
  updateFeeDue(
    id: number,
    feeDue: Partial<InsertFeeDue>,
  ): Promise<FeeDue | undefined>;
  deleteFeeDue(id: number): Promise<boolean>;
  getDefaulters(): Promise<
    (FeeDue & { studentName: string; grade: string; admissionNumber: string })[]
  >;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Statistics for dashboard
  getDashboardStats(): Promise<{
    todayCollection: number;
    receiptsGenerated: number;
    pendingPayments: number;
    totalStudents: number;
  }>;

  // School settings operations
  getSchoolSettings(): Promise<SchoolSettings>;
  updateSchoolSettings(
    settings: Partial<SchoolSettings>,
  ): Promise<SchoolSettings>;
}

export class MemStorage implements IStorage {
  private students: Map<number, Student>;
  private feeStructure: Map<number, FeeStructureItem>;
  private receipts: Map<number, Receipt>;
  private receiptItems: Map<number, ReceiptItem>;
  private feeDues: Map<number, FeeDue>;
  private users: Map<number, User>;
  private transportationRoutes: Map<number, TransportationRoute>;
  private schoolSettings: SchoolSettings;
  private dataFile = 'data.json';

  private currentStudentId: number = 1;
  private currentFeeStructureId: number = 1;
  private currentReceiptId: number = 1;
  private currentReceiptItemId: number = 1;
  private currentFeeDueId: number = 1;
  private currentUserId: number = 1;
  private currentTransportationRouteId: number = 1;

  constructor() {
    this.students = new Map();
    this.feeStructure = new Map();
    this.receipts = new Map();
    this.receiptItems = new Map();
    this.feeDues = new Map();
    this.users = new Map();
    this.transportationRoutes = new Map();

    // Initialize school settings with default values
    this.schoolSettings = {
      schoolName: "Krishnaveni Talent School Ramannapet",
      address: "Near Old Bus stand, Ramannapet, 508113",
      phone: "+91-7386685333",
      email: "ktsramannapet@gmail.com",
      website: "www.globalexcellence.edu",
      principalName: "Dr. Rajendra Kumar",
      logo: null,
      receiptPrefix: "GES",
      academicYear: "2025-2026",
      currentTerm: "Quarter 1",
      enableEmailNotifications: false,
      enableSMSNotifications: false,
      enableAutomaticReminders: false,
      reminderDays: 5,
      taxPercentage: 0,
      receiptFooterText:
        "Thank you for your payment. This receipt is system generated.",
      receiptCopies: 2,
      theme: "light",
    };

    // Only create admin user
    this.seedData();
    // Save empty data
    this.saveData();
  }

  // School Settings Operations
  async getSchoolSettings(): Promise<SchoolSettings> {
    return this.schoolSettings;
  }

  async updateSchoolSettings(
    settings: Partial<SchoolSettings>,
  ): Promise<SchoolSettings> {
    this.schoolSettings = {
      ...this.schoolSettings,
      ...settings,
    };
    this.saveData();
    return this.schoolSettings;
  }

  // Transportation route operations
  async getTransportationRoute(
    id: number,
  ): Promise<TransportationRoute | undefined> {
    return this.transportationRoutes.get(id);
  }

  async getAllTransportationRoutes(
    activeOnly: boolean = false,
  ): Promise<TransportationRoute[]> {
    const routes = Array.from(this.transportationRoutes.values());
    if (activeOnly) {
      return routes.filter((route) => route.isActive === true);
    }
    return routes;
  }

  async createTransportationRoute(
    route: InsertTransportationRoute,
  ): Promise<TransportationRoute> {
    const id = this.currentTransportationRouteId++;
    const newRoute: TransportationRoute = {
      ...route,
      id,
      createdAt: new Date(),
    };
    this.transportationRoutes.set(id, newRoute);
    this.saveData();
    return newRoute;
  }

  async updateTransportationRoute(
    id: number,
    route: Partial<InsertTransportationRoute>,
  ): Promise<TransportationRoute | undefined> {
    const existingRoute = this.transportationRoutes.get(id);
    if (!existingRoute) return undefined;

    const updatedRoute = { ...existingRoute, ...route };
    this.transportationRoutes.set(id, updatedRoute);
    this.saveData();
    return updatedRoute;
  }

  async deleteTransportationRoute(id: number): Promise<boolean> {
    const success = this.transportationRoutes.delete(id);
    this.saveData();
    return success;
  }

  async getStudentsByTransportationRoute(routeId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.transportationRouteId === routeId,
    );
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByAdmissionNumber(
    admissionNumber: string,
  ): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.admissionNumber === admissionNumber,
    );
  }

  async searchStudents(query: string, grade?: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter((student) => {
      const matchesQuery =
        student.studentName.toLowerCase().includes(query.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(query.toLowerCase()) ||
        student.parentName.toLowerCase().includes(query.toLowerCase());

      if (grade) {
        return matchesQuery && student.grade === grade;
      }

      return matchesQuery;
    });
  }

  async getStudentsByGrade(grade: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.grade === grade,
    );
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    this.saveData();
    return newStudent;
  }

  async updateStudent(
    id: number,
    student: Partial<InsertStudent>,
  ): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) return undefined;

    const updatedStudent = { ...existingStudent, ...student };
    this.students.set(id, updatedStudent);
    this.saveData();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const success = this.students.delete(id);
    this.saveData();
    return success;
  }

  // Fee structure operations
  async getFeeStructure(id: number): Promise<FeeStructureItem | undefined> {
    return this.feeStructure.get(id);
  }

  async getFeeStructureByGrade(grade: string): Promise<FeeStructureItem[]> {
    return Array.from(this.feeStructure.values()).filter(
      (item) => item.grade === grade,
    );
  }

  async getAllFeeStructure(): Promise<FeeStructureItem[]> {
    return Array.from(this.feeStructure.values());
  }

  async createFeeStructure(
    feeStructureItem: InsertFeeStructureItem,
  ): Promise<FeeStructureItem> {
    const id = this.currentFeeStructureId++;
    const newFeeStructureItem: FeeStructureItem = { ...feeStructureItem, id };
    this.feeStructure.set(id, newFeeStructureItem);
    this.saveData();
    return newFeeStructureItem;
  }

  async updateFeeStructure(
    id: number,
    feeStructureItem: Partial<InsertFeeStructureItem>,
  ): Promise<FeeStructureItem | undefined> {
    const existingFeeStructureItem = this.feeStructure.get(id);
    if (!existingFeeStructureItem) return undefined;

    const updatedFeeStructureItem = {
      ...existingFeeStructureItem,
      ...feeStructureItem,
    };
    this.feeStructure.set(id, updatedFeeStructureItem);
    this.saveData();
    return updatedFeeStructureItem;
  }

  async deleteFeeStructure(id: number): Promise<boolean> {
    const success = this.feeStructure.delete(id);
    this.saveData();
    return success;
  }

  // Receipt operations
  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async getReceiptByNumber(
    receiptNumber: string,
  ): Promise<Receipt | undefined> {
    return Array.from(this.receipts.values()).find(
      (receipt) => receipt.receiptNumber === receiptNumber,
    );
  }

  async getReceiptsByStudent(studentId: number): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).filter(
      (receipt) => receipt.studentId === studentId,
    );
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const id = this.currentReceiptId++;
    const newReceipt: Receipt = {
      ...receipt,
      id,
      createdAt: new Date(),
    };
    this.receipts.set(id, newReceipt);
    this.saveData();
    return newReceipt;
  }

  async updateReceipt(
    id: number,
    receipt: Partial<InsertReceipt>,
  ): Promise<Receipt | undefined> {
    const existingReceipt = this.receipts.get(id);
    if (!existingReceipt) return undefined;

    const updatedReceipt = { ...existingReceipt, ...receipt };
    this.receipts.set(id, updatedReceipt);
    this.saveData();
    return updatedReceipt;
  }

  async deleteReceipt(id: number): Promise<boolean> {
    const success = this.receipts.delete(id);
    this.saveData();
    return success;
  }

  async getRecentReceipts(
    limit: number,
  ): Promise<
    (Receipt & { studentName: string; grade: string; section: string })[]
  > {
    const allReceipts = Array.from(this.receipts.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    return allReceipts.map((receipt) => {
      const student = this.students.get(receipt.studentId);
      return {
        ...receipt,
        studentName: student?.studentName || "Unknown",
        grade: student?.grade || "Unknown",
        section: student?.section || "Unknown",
      };
    });
  }

  // Receipt items operations
  async getReceiptItems(receiptId: number): Promise<ReceiptItem[]> {
    return Array.from(this.receiptItems.values()).filter(
      (item) => item.receiptId === receiptId,
    );
  }

  async createReceiptItem(
    receiptItem: InsertReceiptItem,
  ): Promise<ReceiptItem> {
    const id = this.currentReceiptItemId++;
    const newReceiptItem: ReceiptItem = { ...receiptItem, id };
    this.receiptItems.set(id, newReceiptItem);
    this.saveData();
    return newReceiptItem;
  }

  async updateReceiptItem(
    id: number,
    receiptItem: Partial<InsertReceiptItem>,
  ): Promise<ReceiptItem | undefined> {
    const existingReceiptItem = this.receiptItems.get(id);
    if (!existingReceiptItem) return undefined;

    const updatedReceiptItem = { ...existingReceiptItem, ...receiptItem };
    this.receiptItems.set(id, updatedReceiptItem);
    this.saveData();
    return updatedReceiptItem;
  }

  async deleteReceiptItem(id: number): Promise<boolean> {
    const success = this.receiptItems.delete(id);
    this.saveData();
    return success;
  }

  // Fee due operations
  async getFeeDue(id: number): Promise<FeeDue | undefined> {
    return this.feeDues.get(id);
  }

  async getFeeDuesByStudent(studentId: number): Promise<FeeDue[]> {
    return Array.from(this.feeDues.values()).filter(
      (feeDue) => feeDue.studentId === studentId,
    );
  }

  async createFeeDue(feeDue: InsertFeeDue): Promise<FeeDue> {
    const id = this.currentFeeDueId++;
    const newFeeDue: FeeDue = { ...feeDue, id };
    this.feeDues.set(id, newFeeDue);
    this.saveData();
    return newFeeDue;
  }

  async updateFeeDue(
    id: number,
    feeDue: Partial<InsertFeeDue>,
  ): Promise<FeeDue | undefined> {
    const existingFeeDue = this.feeDues.get(id);
    if (!existingFeeDue) return undefined;

    const updatedFeeDue = { ...existingFeeDue, ...feeDue };
    this.feeDues.set(id, updatedFeeDue);
    this.saveData();
    return updatedFeeDue;
  }

  async deleteFeeDue(id: number): Promise<boolean> {
    const success = this.feeDues.delete(id);
    this.saveData();
    return success;
  }

  async getDefaulters(): Promise<
    (FeeDue & { studentName: string; grade: string; admissionNumber: string })[]
  > {
    const overdueFeeDues = Array.from(this.feeDues.values()).filter(
      (feeDue) => feeDue.status === "Overdue" || feeDue.status === "Due",
    );

    return overdueFeeDues.map((feeDue) => {
      const student = this.students.get(feeDue.studentId);
      return {
        ...feeDue,
        studentName: student?.studentName || "Unknown",
        grade: student?.grade || "Unknown",
        admissionNumber: student?.admissionNumber || "Unknown",
      };
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    this.saveData();
    return newUser;
  }

  async updateUser(
    id: number,
    user: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    this.saveData();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const success = this.users.delete(id);
    this.saveData();
    return success;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    todayCollection: number;
    receiptsGenerated: number;
    pendingPayments: number;
    totalStudents: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollection = Array.from(this.receipts.values())
      .filter((receipt) => {
        const receiptDate = new Date(receipt.receiptDate);
        receiptDate.setHours(0, 0, 0, 0);
        return receiptDate.getTime() === today.getTime();
      })
      .reduce((sum, receipt) => sum + receipt.totalAmount, 0);

    const receiptsGenerated = Array.from(this.receipts.values()).length;

    const pendingPayments = Array.from(this.feeDues.values()).filter(
      (feeDue) =>
        feeDue.status === "Due" ||
        feeDue.status === "Overdue" ||
        feeDue.status === "Partial",
    ).length;

    const totalStudents = this.students.size;

    return {
      todayCollection,
      receiptsGenerated,
      pendingPayments,
      totalStudents,
    };
  }

  // Seed data method - empty to start fresh
  private seedData() {
    // Add admin user only
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "Administrator",
      fullName: "Admin Staff",
      email: "admin@school.com",
    });
  }

  private async loadData() {
    try {
      const fs = await import('fs/promises');
      const data = JSON.parse(await fs.readFile(this.dataFile, 'utf8'));
      this.students = new Map(Object.entries(data.students || {}).map(([k, v]) => [Number(k), v as Student]));
      this.feeStructure = new Map(Object.entries(data.feeStructure || {}).map(([k, v]) => [Number(k), v as FeeStructureItem]));
      this.receipts = new Map(Object.entries(data.receipts || {}).map(([k, v]) => [Number(k), v as Receipt]));
      this.receiptItems = new Map(Object.entries(data.receiptItems || {}).map(([k, v]) => [Number(k), v as ReceiptItem]));
      this.feeDues = new Map(Object.entries(data.feeDues || {}).map(([k, v]) => [Number(k), v as FeeDue]));
      this.users = new Map(Object.entries(data.users || {}).map(([k, v]) => [Number(k), v as User]));
      this.transportationRoutes = new Map(Object.entries(data.transportationRoutes || {}).map(([k, v]) => [Number(k), v as TransportationRoute]));
      this.schoolSettings = data.schoolSettings || this.schoolSettings;

      this.currentStudentId = Math.max(0, ...Array.from(this.students.keys())) + 1;
      this.currentFeeStructureId = Math.max(0, ...Array.from(this.feeStructure.keys())) + 1;
      this.currentReceiptId = Math.max(0, ...Array.from(this.receipts.keys())) + 1;
      this.currentReceiptItemId = Math.max(0, ...Array.from(this.receiptItems.keys())) + 1;
      this.currentFeeDueId = Math.max(0, ...Array.from(this.feeDues.keys())) + 1;
      this.currentUserId = Math.max(0, ...Array.from(this.users.keys())) + 1;
      this.currentTransportationRouteId = Math.max(0, ...Array.from(this.transportationRoutes.keys())) + 1;
    } catch (e) {
      // If file doesn't exist or is invalid, use default empty maps and settings.  The seedData will populate it
      console.error("Error loading data:", e);
    }
  }

  private async saveData() {
    try {
      const fs = await import('fs/promises');
      const data = {
        students: Object.fromEntries(this.students),
        feeStructure: Object.fromEntries(this.feeStructure),
        receipts: Object.fromEntries(this.receipts),
        receiptItems: Object.fromEntries(this.receiptItems),
        feeDues: Object.fromEntries(this.feeDues),
        users: Object.fromEntries(this.users),
        transportationRoutes: Object.fromEntries(this.transportationRoutes),
        schoolSettings: this.schoolSettings,
      };
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      this.seedData(); // Reseed data if save fails
    }
  }
}

export const storage = new MemStorage();
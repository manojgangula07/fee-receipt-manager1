import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as xlsx from "xlsx";
import { z } from "zod";
import {
  insertStudentSchema,
  insertFeeStructureSchema,
  insertReceiptSchema,
  insertReceiptItemSchema,
  insertFeeDueSchema,
  insertUserSchema,
  insertTransportationRouteSchema,
  GRADES,
  FEE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TRANSPORTATION_FREQUENCY
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse application/json
  app.use(express.json());

  // CORS headers
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // STUDENTS API
  // Get all students or search students
  app.get("/api/students", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const grade = req.query.grade as string;
      const students = await storage.searchStudents(query, grade);
      res.json(students);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Get student by ID
  app.get("/api/students/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Create student
  app.post("/api/students", async (req: Request, res: Response) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);

      // Get fee structure for the grade and create fee dues
      const feeStructure = await storage.getFeeStructureByGrade(student.grade);
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      for (const fee of feeStructure) {
        const feeDue = {
          studentId: student.id,
          feeType: fee.feeType,
          description: `${fee.feeType} Fee (${fee.frequency === 'Monthly' ? currentMonth : currentYear})`,
          amount: fee.amount,
          dueDate: new Date(),
          status: 'Due',
          period: fee.frequency === 'Monthly' ? `${currentMonth} ${currentYear}` : currentYear.toString(),
          amountPaid: 0
        };
        await storage.createFeeDue(feeDue);
      }

      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Update student
  app.put("/api/students/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, validatedData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Delete student
  app.delete("/api/students/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // FEE STRUCTURE API
  // Get all fee structure items
  app.get("/api/fee-structure", async (_req: Request, res: Response) => {
    try {
      const feeStructureItems = await storage.getAllFeeStructure();
      res.json(feeStructureItems);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Get fee structure items by grade
  app.get("/api/fee-structure/grade/:grade", async (req: Request, res: Response) => {
    try {
      const grade = req.params.grade;
      const feeStructureItems = await storage.getFeeStructureByGrade(grade);
      res.json(feeStructureItems);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Create fee structure item
  app.post("/api/fee-structure", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFeeStructureSchema.parse(req.body);
      const feeStructureItem = await storage.createFeeStructure(validatedData);
      res.status(201).json(feeStructureItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Update fee structure item
  app.put("/api/fee-structure/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFeeStructureSchema.partial().parse(req.body);
      const feeStructureItem = await storage.updateFeeStructure(id, validatedData);
      if (!feeStructureItem) {
        return res.status(404).json({ message: "Fee structure item not found" });
      }
      res.json(feeStructureItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Delete fee structure item
  app.delete("/api/fee-structure/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFeeStructure(id);
      if (!success) {
        return res.status(404).json({ message: "Fee structure item not found" });
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // RECEIPTS API
  // Get all receipts or recent receipts
  app.get("/api/receipts", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const receipts = await storage.getRecentReceipts(limit);
      res.json(receipts);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Get receipt by ID
  app.get("/api/receipts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const receipt = await storage.getReceipt(id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }

      // Get the receipt items
      const receiptItems = await storage.getReceiptItems(id);

      // Get the student
      const student = await storage.getStudent(receipt.studentId);

      res.json({
        receipt,
        items: receiptItems,
        student
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Generate a receipt number
  app.get("/api/generate-receipt-number", async (req: Request, res: Response) => {
    try {
      const grade = req.query.grade as string || "";
      const section = req.query.section as string || "";

      // Get the count of existing receipts
      const allReceipts = await storage.getRecentReceipts(1000);
      const count = allReceipts.length + 1;

      // Format: REC{GRADE}{SECTION}{COUNT}
      const receiptNumber = `REC${grade}${section}${count.toString().padStart(4, '0')}`;

      res.json({ receiptNumber });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Create receipt with items
  app.post("/api/receipts", async (req: Request, res: Response) => {
    try {
      const { receipt, items } = req.body;

      // Validate receipt data
      const validatedReceiptData = insertReceiptSchema.parse(receipt);

      // Create the receipt
      const createdReceipt = await storage.createReceipt(validatedReceiptData);

      // Create receipt items
      const receiptItems = [];
      for (const item of items) {
        const validatedItemData = insertReceiptItemSchema.parse({
          ...item,
          receiptId: createdReceipt.id
        });

        const createdItem = await storage.createReceiptItem(validatedItemData);
        receiptItems.push(createdItem);

        // Update fee due status if it exists
        if (item.feeDueId) {
          const feeDue = await storage.getFeeDue(item.feeDueId);
          if (feeDue) {
            // Update the fee due status
            const amountPaid = feeDue.amountPaid + item.amount;
            let status = 'Due';

            if (amountPaid >= feeDue.amount) {
              status = 'Paid';
            } else if (amountPaid > 0) {
              status = 'Partial';
            }

            await storage.updateFeeDue(feeDue.id, { 
              amountPaid,
              status
            });
          }
        }
      }

      res.status(201).json({
        receipt: createdReceipt,
        items: receiptItems
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // FEE DUES API
  // Get fee dues by student
  app.get("/api/fee-dues/student/:studentId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const feeDues = await storage.getFeeDuesByStudent(studentId);
      res.json(feeDues);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Get defaulters list
  app.get("/api/defaulters", async (_req: Request, res: Response) => {
    try {
      const defaulters = await storage.getDefaulters();
      res.json(defaulters);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Create fee due
  app.post("/api/fee-dues", async (req: Request, res: Response) => {
    try {
      const { studentId, grade } = req.body;

      // Get fee structure for the grade
      const feeStructure = await storage.getFeeStructureByGrade(grade);
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      // Create fee dues for each fee type
      const feeDues = [];
      for (const fee of feeStructure) {
        const validatedData = insertFeeDueSchema.parse({
          studentId,
          feeType: fee.feeType,
          description: `${fee.feeType} Fee (${fee.frequency === 'Monthly' ? currentMonth : currentYear})`,
          amount: fee.amount,
          dueDate: new Date().toISOString(),
          status: 'Due',
          period: fee.frequency === 'Monthly' ? `${currentMonth} ${currentYear}` : currentYear.toString(),
          amountPaid: 0
        });
        const feeDue = await storage.createFeeDue(validatedData);
        feeDues.push(feeDue);
      }

      res.status(201).json(feeDues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Update fee due
  app.put("/api/fee-dues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFeeDueSchema.partial().parse(req.body);
      const feeDue = await storage.updateFeeDue(id, validatedData);
      if (!feeDue) {
        return res.status(404).json({ message: "Fee due not found" });
      }
      res.json(feeDue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // TRANSPORTATION ROUTES API
  // Get all transportation routes
  app.get("/api/transportation-routes", async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const routes = await storage.getAllTransportationRoutes(activeOnly);
      res.json(routes);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Get transportation route by ID
  app.get("/api/transportation-routes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getTransportationRoute(id);
      if (!route) {
        return res.status(404).json({ message: "Transportation route not found" });
      }
      res.json(route);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Get students by transportation route
  app.get("/api/transportation-routes/:id/students", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // First check if the route exists
      const route = await storage.getTransportationRoute(id);
      if (!route) {
        return res.status(404).json({ message: "Transportation route not found" });
      }

      const students = await storage.getStudentsByTransportationRoute(id);
      res.json(students);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Create transportation route
  app.post("/api/transportation-routes", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransportationRouteSchema.parse(req.body);
      const route = await storage.createTransportationRoute(validatedData);
      res.status(201).json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Update transportation route
  app.put("/api/transportation-routes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTransportationRouteSchema.partial().parse(req.body);
      const route = await storage.updateTransportationRoute(id, validatedData);
      if (!route) {
        return res.status(404).json({ message: "Transportation route not found" });
      }
      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Delete transportation route
  app.delete("/api/transportation-routes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // First check if there are any students using this route
      const students = await storage.getStudentsByTransportationRoute(id);
      if (students.length > 0) {
        return res.status(400).json({
          message: "Cannot delete transportation route as it is assigned to students",
          studentCount: students.length
        });
      }

      const success = await storage.deleteTransportationRoute(id);
      if (!success) {
        return res.status(404).json({ message: "Transportation route not found" });
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // DASHBOARD API
  // Get dashboard statistics
  app.get("/api/dashboard/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // EXCEL API
  // Import fee structure from Excel
  app.post("/api/excel/import-fee-structure", async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;

      if (!excelData || typeof excelData !== 'string') {
        return res.status(400).json({ message: "Invalid Excel data format" });
      }

      // Parse Base64 Excel data
      const buffer = Buffer.from(excelData, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });

      // Assume the first sheet contains fee structure data
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(sheet);

      // Process each row
      const importedFees = [];
      for (const row of data) {
        try {
          // Map Excel columns to fee structure schema
          const feeStructure = {
            grade: String(row['Grade'] || row['grade'] || '').trim(),
            feeType: String(row['Fee Type'] || row['feeType'] || '').trim(),
            amount: Number(row['Amount'] || row['amount'] || 0),
            frequency: String(row['Frequency'] || row['frequency'] || '').trim(),
            dueDay: Number(row['Due Day'] || row['dueDay'] || 1)
          };

          // Validate and create fee structure
          const validatedFee = insertFeeStructureSchema.parse(feeStructure);
          const createdFee = await storage.createFeeStructure(validatedFee);
          importedFees.push(createdFee);
        } catch (error) {
          console.error('Error importing fee structure:', error);
        }
      }

      res.status(200).json({ 
        message: `Successfully imported ${importedFees.length} fee items`,
        importedCount: importedFees.length,
        totalRows: data.length
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Import students from Excel
  app.post("/api/excel/import-students", async (req: Request, res: Response) => {
    try {
      const { excelData } = req.body;

      if (!excelData || typeof excelData !== 'string') {
        return res.status(400).json({ message: "Invalid Excel data format" });
      }

      // Parse Base64 Excel data
      const buffer = Buffer.from(excelData, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });

      // Assume the first sheet contains student data
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(sheet);

      // Process each row
      const importedStudents = [];
      for (const row of data) {
        try {
          // Map Excel columns to student schema
          const student = {
            admissionNumber: String(row['Admission No.'] || row['AdmissionNumber'] || ''),
            studentName: String(row['Student Name'] || row['StudentName'] || ''),
            grade: String(row['Class'] || row['Grade'] || ''),
            section: String(row['Section'] || 'A'),
            rollNumber: Number(row['Roll No.'] || row['RollNumber'] || 0),
            parentName: String(row['Parent Name'] || row['ParentName'] || ''),
            contactNumber: String(row['Contact No.'] || row['ContactNumber'] || ''),
            email: String(row['Email'] || ''),
            feeCategory: String(row['Fee Category'] || row['FeeCategory'] || 'Regular'),
            admissionDate: row['Admission Date'] ? new Date(row['Admission Date']).toISOString() : new Date().toISOString()
          };

          // Validate and create student
          const validatedStudent = insertStudentSchema.parse(student);
          const createdStudent = await storage.createStudent(validatedStudent);
          importedStudents.push(createdStudent);
        } catch (error) {
          // Skip invalid rows but continue processing
          console.error('Error importing student:', error);
        }
      }

      res.status(200).json({ 
        message: `Successfully imported ${importedStudents.length} students`,
        importedCount: importedStudents.length,
        totalRows: data.length
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Export students to Excel
  app.get("/api/excel/export-students", async (req: Request, res: Response) => {
    try {
      const grade = req.query.grade as string;
      let students;

      if (grade) {
        students = await storage.getStudentsByGrade(grade);
      } else {
        students = await storage.searchStudents("");
      }

      // Create worksheet
      const worksheet = xlsx.utils.json_to_sheet(students.map(student => ({
        'Admission No.': student.admissionNumber,
        'Student Name': student.studentName,
        'Class': student.grade,
        'Section': student.section,
        'Roll No.': student.rollNumber,
        'Parent Name': student.parentName,
        'Contact No.': student.contactNumber,
        'Email': student.email,
        'Fee Category': student.feeCategory,
        'Admission Date': student.admissionDate.toISOString().split('T')[0]
      })));

      // Create workbook
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

      // Generate Excel file
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Convert to Base64
      const excelBase64 = excelBuffer.toString('base64');

      res.json({ excelData: excelBase64 });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Export fee collection report
  app.get("/api/excel/fee-collection-report", async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      // Get all receipts
      const allReceipts = await storage.getRecentReceipts(1000);

      // Filter by date range
      const filteredReceipts = allReceipts.filter(receipt => {
        const receiptDate = new Date(receipt.receiptDate);
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      // Create worksheet
      const worksheet = xlsx.utils.json_to_sheet(filteredReceipts.map(receipt => ({
        'Receipt No.': receipt.receiptNumber,
        'Student Name': receipt.studentName,
        'Class': receipt.grade,
        'Section': receipt.section,
        'Date': new Date(receipt.receiptDate).toISOString().split('T')[0],
        'Amount': receipt.totalAmount,
        'Payment Method': receipt.paymentMethod,
        'Status': receipt.status
      })));

      // Create workbook
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Fee Collection');

      // Generate Excel file
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Convert to Base64
      const excelBase64 = excelBuffer.toString('base64');

      res.json({ excelData: excelBase64 });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Export defaulters report
  app.get("/api/excel/defaulters-report", async (_req: Request, res: Response) => {
    try {
      const defaulters = await storage.getDefaulters();

      // Create worksheet
      const worksheet = xlsx.utils.json_to_sheet(defaulters.map(defaulter => ({
        'Admission No.': defaulter.admissionNumber,
        'Student Name': defaulter.studentName,
        'Class': defaulter.grade,
        'Fee Type': defaulter.feeType,
        'Description': defaulter.description,
        'Amount Due': defaulter.amount - defaulter.amountPaid,
        'Due Date': new Date(defaulter.dueDate).toISOString().split('T')[0],
        'Status': defaulter.status
      })));

      // Create workbook
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Defaulters');

      // Generate Excel file
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Convert to Base64
      const excelBase64 = excelBuffer.toString('base64');

      res.json({ excelData: excelBase64 });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // CONSTANTS API
  // Get all constants
  app.get("/api/constants", (_req: Request, res: Response) => {
    try {
      res.json({
        GRADES,
        FEE_TYPES,
        PAYMENT_METHODS,
        PAYMENT_STATUS,
        TRANSPORTATION_FREQUENCY
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: erroressage });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // SCHOOL SETTINGS API
  // Get school settings
  app.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSchoolSettings();
      res.json(settings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Update school settings
  app.put("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      const updatedSettings = await storage.updateSchoolSettings(settings);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
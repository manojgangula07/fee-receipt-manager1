import * as XLSX from 'xlsx';
import type { Student, FeeStructureItem, Receipt, TransportationRoute } from '../../shared/schema';

/**
 * Converts an Excel file to a base64 string for API upload
 * @param file The Excel file to convert
 * @returns Promise with base64 string
 */
export const convertExcelToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (typeof event.target.result === 'string') {
          const base64String = event.target.result.split(',')[1];
          resolve(base64String);
        } else {
          const uint8Array = new Uint8Array(event.target.result as ArrayBuffer);
          const base64String = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
          resolve(base64String);
        }
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Creates and downloads an Excel file from base64 data
 * @param base64Data Base64 encoded Excel data
 * @param fileName Name of the file to download
 */
export const downloadExcelFromBase64 = (base64Data: string, fileName: string): void => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Creates a sample Excel template for student imports
 * @returns XLSX workbook with template
 */
export const createStudentImportTemplate = (): XLSX.WorkBook => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Admission No.', 'Student Name', 'Class', 'Section', 'Roll No.', 'Parent Name', 'Contact No.', 'Email', 'Fee Category', 'Admission Date'],
    ['ADM2023001', 'Student Name', '5', 'A', '1', 'Parent Name', '9876543210', 'parent@example.com', 'Regular', '2023-04-01']
  ]);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  return workbook;
};

/**
 * Creates and downloads a sample student import template
 */
export const downloadStudentImportTemplate = (): void => {
  const workbook = createStudentImportTemplate();
  XLSX.writeFile(workbook, 'student_import_template.xlsx');
};

/**
 * Creates a fee structure template Excel file
 */
export const downloadFeeStructureTemplate = (): void => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Grade', 'Fee Type', 'Amount', 'Frequency', 'Due Day'],
    ['1', 'Tuition', '2500', 'Monthly', '10'],
    ['1', 'Library', '500', 'Annual', '15'],
    ['1', 'Sports', '500', 'Annual', '15']
  ]);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Structure');
  
  XLSX.writeFile(workbook, 'fee_structure_template.xlsx');
};

/**
 * Export students data to Excel
 * @param students Array of student records
 * @param fileName Optional custom file name
 */
export const exportStudentsToExcel = (students: Student[], fileName = 'students_export.xlsx'): void => {
  // Convert student data to rows for export
  const rows = [
    ['ID', 'Admission No.', 'Student Name', 'Grade', 'Section', 'Roll No.', 
     'Parent Name', 'Contact Number', 'Email', 'Fee Category', 'Transportation Route ID', 
     'Pickup Point', 'Admission Date']
  ];

  students.forEach(student => {
    rows.push([
      student.id.toString(),
      student.admissionNumber,
      student.studentName,
      student.grade,
      student.section,
      student.rollNumber.toString(),
      student.parentName,
      student.contactNumber,
      student.email || '',
      student.feeCategory,
      student.transportationRouteId?.toString() || '',
      student.pickupPoint || '',
      student.admissionDate
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths for better readability
  const wscols = [
    { wch: 5 },  // ID
    { wch: 15 }, // Admission No.
    { wch: 25 }, // Student Name
    { wch: 10 }, // Grade
    { wch: 10 }, // Section
    { wch: 10 }, // Roll No.
    { wch: 25 }, // Parent Name
    { wch: 15 }, // Contact Number
    { wch: 25 }, // Email
    { wch: 15 }, // Fee Category
    { wch: 10 }, // Transportation Route ID
    { wch: 20 }, // Pickup Point
    { wch: 15 }  // Admission Date
  ];
  worksheet['!cols'] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export fee structure data to Excel
 * @param feeStructure Array of fee structure items
 * @param fileName Optional custom file name
 */
export const exportFeeStructureToExcel = (feeStructure: FeeStructureItem[], fileName = 'fee_structure_export.xlsx'): void => {
  const rows = [
    ['ID', 'Grade', 'Fee Type', 'Amount', 'Frequency', 'Due Day']
  ];

  feeStructure.forEach(item => {
    rows.push([
      item.id.toString(),
      item.grade,
      item.feeType,
      item.amount.toString(),
      item.frequency,
      item.dueDay?.toString() || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // ID
    { wch: 10 }, // Grade
    { wch: 20 }, // Fee Type
    { wch: 10 }, // Amount
    { wch: 15 }, // Frequency
    { wch: 10 }  // Due Day
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Structure');
  
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export transportation routes data to Excel
 * @param routes Array of transportation routes
 * @param fileName Optional custom file name
 */
export const exportTransportationRoutesToExcel = (routes: TransportationRoute[], fileName = 'transportation_routes_export.xlsx'): void => {
  const rows = [
    ['ID', 'Route Name', 'Fare', 'Distance', 'Description', 'Active Status']
  ];

  routes.forEach(route => {
    rows.push([
      route.id.toString(),
      route.routeName,
      route.fare.toString(),
      route.distance?.toString() || '',
      route.description || '',
      route.isActive ? 'Active' : 'Inactive'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // ID
    { wch: 25 }, // Route Name
    { wch: 10 }, // Fare
    { wch: 10 }, // Distance
    { wch: 30 }, // Description
    { wch: 15 }  // Active Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transportation Routes');
  
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export fee receipts data to Excel
 * @param receipts Array of receipts, including student information
 * @param fileName Optional custom file name
 */
export const exportReceiptsToExcel = (receipts: any[], fileName = 'receipts_export.xlsx'): void => {
  const rows = [
    ['Receipt No.', 'Student ID', 'Student Name', 'Grade', 'Receipt Date', 
     'Total Amount', 'Payment Method', 'Payment Reference', 'Status', 'Remarks']
  ];

  receipts.forEach(receipt => {
    rows.push([
      receipt.receiptNumber,
      receipt.studentId.toString(),
      receipt.studentName || '',
      receipt.grade || '',
      receipt.receiptDate,
      receipt.totalAmount.toString(),
      receipt.paymentMethod,
      receipt.paymentReference || '',
      receipt.status,
      receipt.remarks || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Receipt No.
    { wch: 10 }, // Student ID
    { wch: 25 }, // Student Name
    { wch: 10 }, // Grade
    { wch: 15 }, // Receipt Date
    { wch: 15 }, // Total Amount
    { wch: 15 }, // Payment Method
    { wch: 20 }, // Payment Reference
    { wch: 15 }, // Status
    { wch: 30 }  // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');
  
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export defaulters report to Excel
 * @param defaulters Array of defaulters data
 * @param fileName Optional custom file name
 */
export const exportDefaultersToExcel = (defaulters: any[], fileName = 'defaulters_report.xlsx'): void => {
  const rows = [
    ['Student ID', 'Admission No.', 'Student Name', 'Grade', 'Fee Type', 
     'Amount Due', 'Due Date', 'Status', 'Parent Contact']
  ];

  defaulters.forEach(defaulter => {
    rows.push([
      defaulter.studentId.toString(),
      defaulter.admissionNumber || '',
      defaulter.studentName || '',
      defaulter.grade || '',
      defaulter.feeType,
      defaulter.amount.toString(),
      defaulter.dueDate,
      defaulter.status,
      defaulter.contactNumber || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 }, // Student ID
    { wch: 15 }, // Admission No.
    { wch: 25 }, // Student Name
    { wch: 10 }, // Grade
    { wch: 20 }, // Fee Type
    { wch: 15 }, // Amount Due
    { wch: 15 }, // Due Date
    { wch: 15 }, // Status
    { wch: 15 }  // Parent Contact
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Defaulters');
  
  XLSX.writeFile(workbook, fileName);
};

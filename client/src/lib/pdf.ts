import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Receipt, Student, ReceiptItem } from '@shared/schema';

/**
 * Generates a dual-copy PDF receipt (school copy and student copy)
 * @param receipt Receipt data
 * @param student Student data
 * @param items Receipt line items
 * @param schoolName School name
 * @returns PDF document
 */
export const generateReceiptPDF = (
  receipt: Receipt,
  student: Student,
  items: ReceiptItem[],
  schoolName: string = 'Sunrise Beacon School'
): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Draw cut line in middle of page
  doc.setDrawColor(150, 150, 150);
  doc.setLineDashPattern([3, 3], 0);
  doc.line(10, 148.5, 200, 148.5);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('✂ -------------------------------------------------- CUT HERE -------------------------------------------------- ✂', 105, 147, { align: 'center' });
  
  // Set font for the rest of the document
  doc.setFont('helvetica');
  
  // Function to create a receipt on the page
  const createReceipt = (yOffset: number, copyType: 'SCHOOL COPY' | 'STUDENT COPY') => {
    // Add school logo placeholder
    doc.setFillColor(22, 82, 152); // Primary color
    doc.rect(15, yOffset + 15, 20, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SB', 25, yOffset + 28, { align: 'center' });
    
    // Add school name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, 105, yOffset + 20, { align: 'center' });
    
    // Add 'Fee Receipt' label and copy type
    doc.setFontSize(12);
    doc.text('Fee Receipt', 105, yOffset + 28, { align: 'center' });
    
    // Add copy type with background
    doc.setFillColor(22, 82, 152);
    doc.rect(150, yOffset + 15, 45, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(copyType, 172.5, yOffset + 21, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Add receipt number and date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: ${receipt.receiptNumber}`, 150, yOffset + 35, { align: 'left' });
    doc.text(`Date: ${new Date(receipt.receiptDate).toLocaleDateString()}`, 150, yOffset + 40, { align: 'left' });
    
    // Add student details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Details:', 15, yOffset + 40);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Admission No: ${student.admissionNumber}`, 15, yOffset + 46);
    doc.text(`Name: ${student.studentName}`, 15, yOffset + 52);
    doc.text(`Class: ${student.grade}-${student.section}`, 15, yOffset + 58);
    doc.text(`Parent Name: ${student.parentName}`, 15, yOffset + 64);
    
    // Add fee details table - smaller to fit on half page
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Fee Details:', 15, yOffset + 72);
    
    // Setup table
    autoTable(doc, {
      startY: yOffset + 75,
      head: [['Description', 'Period', 'Amount (₹)']],
      body: items.map(item => [
        item.description,
        item.period || '',
        item.amount.toFixed(2)
      ]),
      foot: [['', 'Total', receipt.totalAmount.toFixed(2)]],
      theme: 'grid',
      headStyles: {
        fillColor: [22, 82, 152],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 8
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8
      },
      margin: { top: 0, bottom: 0 },
      tableWidth: 180
    });
    
    // Get the Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 2;
    
    // Add payment details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details:', 15, finalY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${receipt.paymentMethod}`, 15, finalY + 10);
    
    if (receipt.paymentReference) {
      doc.text(`Reference Number: ${receipt.paymentReference}`, 15, finalY + 15);
    }
    
    // Add amount in words - make it shorter to fit
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in words:', 15, finalY + 20);
    doc.setFont('helvetica', 'normal');
    
    const amountInWords = numberToWords(receipt.totalAmount);
    // Handle wrapping for long amounts in words
    const words = amountInWords.split(' ');
    let line = '';
    let yPos = finalY + 25;
    
    for (const word of words) {
      if ((line + word).length > 40) {
        doc.text(`${line} only`, 15, yPos);
        line = word;
        yPos += 5;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) {
      doc.text(`${line} only`, 15, yPos);
    }
    
    // Add signature
    doc.text('Authorized Signature', 145, finalY + 25, { align: 'center' });
    doc.line(125, finalY + 20, 165, finalY + 20);
    
    // Add footer for the section
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    let footerY = Math.min(yOffset + 140, finalY + 35);
    doc.text('This is a computer-generated receipt and does not require a signature.', 105, footerY, { align: 'center' });
  };
  
  // Create School Copy (top half)
  createReceipt(0, 'SCHOOL COPY');
  
  // Create Student Copy (bottom half)
  createReceipt(148.5, 'STUDENT COPY');
  
  return doc;
};

/**
 * Converts a number to words (for amount in words on receipt)
 * @param num Number to convert
 * @returns String representation of the number in words
 */
function numberToWords(num: number): string {
  const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num === 0) return 'zero';
  
  function convert(n: number): string {
    if (n < 20) {
      return units[n];
    }
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    }
    if (n < 1000) {
      return units[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    }
    if (n < 100000) {
      return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    }
    if (n < 10000000) {
      return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    }
    return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convert(rupees) + ' rupees';
  
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' paise';
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Generates a PDF for the fee defaulters report
 * @param defaulters Array of defaulter data
 * @returns PDF document
 */
export const generateDefaultersReportPDF = (defaulters: any[]): jsPDF => {
  const doc = new jsPDF();
  
  // Report Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Fee Defaulters Report', 105, 20, { align: 'center' });
  
  // Report Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Setup table
  autoTable(doc, {
    startY: 40,
    head: [['Admission No.', 'Student Name', 'Class', 'Fee Type', 'Amount Due', 'Due Date', 'Status']],
    body: defaulters.map(defaulter => [
      defaulter.admissionNumber,
      defaulter.studentName,
      defaulter.grade,
      defaulter.feeType,
      (defaulter.amount - defaulter.amountPaid).toFixed(2),
      new Date(defaulter.dueDate).toLocaleDateString(),
      defaulter.status
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [22, 82, 152],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  return doc;
};

/**
 * Generates a PDF for the fee collection report
 * @param collections Array of collection data (receipts)
 * @param startDate Start date of report period
 * @param endDate End date of report period
 * @returns PDF document
 */
export const generateCollectionReportPDF = (
  collections: any[],
  startDate: Date,
  endDate: Date
): jsPDF => {
  const doc = new jsPDF();
  
  // Report Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Fee Collection Report', 105, 20, { align: 'center' });
  
  // Report Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Total Collection
  const totalCollection = collections.reduce((sum, receipt) => sum + receipt.totalAmount, 0).toFixed(2);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Collection: ₹${totalCollection}`, 105, 38, { align: 'center' });
  
  // Setup table
  autoTable(doc, {
    startY: 45,
    head: [['Receipt No.', 'Date', 'Student Name', 'Class', 'Amount', 'Payment Method']],
    body: collections.map(collection => [
      collection.receiptNumber,
      new Date(collection.receiptDate).toLocaleDateString(),
      collection.studentName,
      `${collection.grade}-${collection.section}`,
      collection.totalAmount.toFixed(2),
      collection.paymentMethod
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [22, 82, 152],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  return doc;
};

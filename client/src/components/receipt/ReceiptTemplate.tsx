import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Receipt, Student, ReceiptItem } from '@shared/schema';
import { generateReceiptPDF } from '@/lib/pdf';

interface ReceiptTemplateProps {
  receipt: Receipt;
  student: Student;
  items: ReceiptItem[];
  onPrint?: () => void;
  onDownload?: () => void;
}

export function ReceiptTemplate({ receipt, student, items, onPrint, onDownload }: ReceiptTemplateProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    
    const doc = generateReceiptPDF(receipt, student, items);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    
    const doc = generateReceiptPDF(receipt, student, items);
    doc.save(`Receipt_${receipt.receiptNumber}.pdf`);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      {/* Receipt Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <div className="bg-primary-600 text-white h-12 w-12 rounded-md flex items-center justify-center text-lg font-bold">
            SB
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold">Sunrise Beacon School</h2>
            <p className="text-gray-500 text-sm">Excellence in Education</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-xl font-bold text-primary-600">FEE RECEIPT</h3>
          <p className="text-sm text-gray-600">Receipt No: {receipt.receiptNumber}</p>
          <p className="text-sm text-gray-600">Date: {format(new Date(receipt.receiptDate), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* Student Details */}
      <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-md">
        <div>
          <p className="text-sm text-gray-500">Admission No.</p>
          <p className="font-medium">{student.admissionNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Student Name</p>
          <p className="font-medium">{student.studentName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Class & Section</p>
          <p className="font-medium">{student.grade}-{student.section}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Parent Name</p>
          <p className="font-medium">{student.parentName}</p>
        </div>
      </div>

      {/* Fee Details */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-gray-700">Fee Details</h4>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold">Description</th>
              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold">Period</th>
              <th className="border border-gray-200 px-4 py-2 text-right text-sm font-semibold">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-200 px-4 py-2 text-sm">{item.description}</td>
                <td className="border border-gray-200 px-4 py-2 text-sm">{item.period}</td>
                <td className="border border-gray-200 px-4 py-2 text-sm text-right">{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={2} className="border border-gray-200 px-4 py-2 text-right">Total</td>
              <td className="border border-gray-200 px-4 py-2 text-right">₹{totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-md">
        <div>
          <p className="text-sm text-gray-500">Payment Method</p>
          <p className="font-medium">{receipt.paymentMethod}</p>
        </div>
        {receipt.paymentReference && (
          <div>
            <p className="text-sm text-gray-500">Reference Number</p>
            <p className="font-medium">{receipt.paymentReference}</p>
          </div>
        )}
      </div>

      {/* Remarks */}
      {receipt.remarks && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2 text-gray-700">Remarks</h4>
          <p className="text-sm bg-gray-50 p-3 rounded-md">{receipt.remarks}</p>
        </div>
      )}

      {/* Signature Section */}
      <div className="flex justify-end mt-8">
        <div className="text-center">
          <div className="border-t border-gray-300 w-40 mx-auto mb-2"></div>
          <p className="text-sm font-medium">Authorized Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>This is a computer-generated receipt and does not require a signature.</p>
        <p className="mt-1 text-primary-600 font-semibold">Note: The printed PDF will include both School Copy and Student Copy for easy distribution.</p>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button 
          variant="outline" 
          className="text-primary-600 border-primary-600"
          onClick={handleDownload}
        >
          Download PDF
        </Button>
        <Button onClick={handlePrint}>
          Print Receipt
        </Button>
      </div>
    </div>
  );
}

export default ReceiptTemplate;

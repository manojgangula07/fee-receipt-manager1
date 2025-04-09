import { InsertReceipt, Student } from "@shared/schema";
import { convertNumberToWords } from "@/lib/receipt-utils";

interface ReceiptPreviewProps {
  receiptData: InsertReceipt;
  student: Student | null;
  feeItems: {
    feeType: string;
    description?: string;
    period?: string;
    amount: number;
  }[];
  onClose: () => void;
  onPrint: () => void;
}

const ReceiptPreview = ({ receiptData, student, feeItems, onClose, onPrint }: ReceiptPreviewProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount.toLocaleString('en-IN');
  };

  return (
    <div className="print-receipt bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center no-print">
        <h3 className="font-condensed font-bold text-text-primary text-lg">Receipt Preview</h3>
        <div className="flex space-x-2">
          <button 
            type="button" 
            className="bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <span className="material-icons mr-1 text-sm">email</span>
            <span>Email</span>
          </button>
          <button 
            type="button" 
            className="bg-secondary hover:bg-secondary-dark text-white px-3 py-1 rounded-md text-sm flex items-center"
            onClick={onPrint}
          >
            <span className="material-icons mr-1 text-sm">print</span>
            <span>Print</span>
          </button>
          <button 
            type="button" 
            className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <span className="material-icons mr-1 text-sm">save</span>
            <span>Save as PDF</span>
          </button>
          <button 
            type="button" 
            className="bg-gray-200 hover:bg-gray-300 text-text-primary px-3 py-1 rounded-md text-sm flex items-center"
            onClick={onClose}
          >
            <span className="material-icons mr-1 text-sm">close</span>
            <span>Close</span>
          </button>
        </div>
      </div>
      
      {/* Receipt Template */}
      <div className="p-6">
        {/* School Header */}
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white mr-4">
              <span className="material-icons text-3xl">school</span>
            </div>
            <div>
              <h2 className="text-2xl font-condensed font-bold text-primary">MODERN ACADEMY</h2>
              <p className="text-text-secondary">123 Education Lane, Knowledge City - 110001</p>
              <p className="text-text-secondary text-sm">Tel: 011-12345678 | Email: info@modernacademy.edu</p>
            </div>
          </div>
        </div>
        
        {/* Receipt Header */}
        <div className="flex justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-1">FEE RECEIPT</h3>
            <p className="text-text-secondary text-sm">Academic Year: {receiptData.academicYear}</p>
          </div>
          <div className="text-right">
            <p className="text-text-secondary text-sm">Receipt No: <span className="text-text-primary font-medium">{receiptData.receiptNumber}</span></p>
            <p className="text-text-secondary text-sm">Date: <span className="text-text-primary font-medium">{formatDate(receiptData.issueDate.toString())}</span></p>
          </div>
        </div>
        
        {/* Student Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-text-secondary text-sm mb-1">Student Name:</p>
            <p className="text-text-primary font-medium">{student?.name}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Class & Section:</p>
            <p className="text-text-primary font-medium">{student?.classId}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Admission No:</p>
            <p className="text-text-primary font-medium">{student?.admissionNumber}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Parent Name:</p>
            <p className="text-text-primary font-medium">{student?.parentName}</p>
          </div>
        </div>
        
        {/* Payment Details Table */}
        <div className="mb-6">
          <table className="min-w-full border border-background-dark">
            <thead>
              <tr className="bg-background-light">
                <th className="border border-background-dark px-4 py-2 text-left text-sm font-medium text-text-primary">Fee Type</th>
                <th className="border border-background-dark px-4 py-2 text-right text-sm font-medium text-text-primary">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {feeItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-background-dark px-4 py-2 text-sm text-text-primary">
                    {item.feeType} {item.period && `(${item.period})`}
                  </td>
                  <td className="border border-background-dark px-4 py-2 text-right text-sm text-text-primary">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-background-light font-medium">
                <td className="border border-background-dark px-4 py-2 text-sm text-text-primary">Total</td>
                <td className="border border-background-dark px-4 py-2 text-right text-sm text-text-primary">
                  {formatCurrency(receiptData.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Payment Method */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-text-secondary text-sm mb-1">Amount in Words:</p>
            <p className="text-text-primary font-medium">
              {convertNumberToWords(Number(receiptData.totalAmount))} Rupees Only
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Payment Mode:</p>
            <p className="text-text-primary font-medium">{receiptData.paymentMethod}</p>
          </div>
          {receiptData.transactionReference && (
            <div>
              <p className="text-text-secondary text-sm mb-1">Transaction Reference:</p>
              <p className="text-text-primary font-medium">{receiptData.transactionReference}</p>
            </div>
          )}
          <div>
            <p className="text-text-secondary text-sm mb-1">Payment Status:</p>
            <p className="text-success font-medium">Paid</p>
          </div>
        </div>
        
        {/* Remarks and Signature */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-text-secondary text-sm mb-1">Remarks:</p>
            <p className="text-text-primary text-sm italic">{receiptData.remarks || "Payment received in full."}</p>
          </div>
          <div className="text-right">
            <div className="h-16 flex items-end justify-end">
              <p className="text-text-primary font-medium border-t border-text-primary pt-1 mb-3">Authorized Signatory</p>
            </div>
          </div>
        </div>
        
        {/* Footer Note */}
        <div className="border-t pt-4 text-center">
          <p className="text-text-secondary text-xs">This is a computer-generated receipt and doesn't require a physical signature.</p>
          <p className="text-text-secondary text-xs mt-1">For any queries regarding this receipt, please contact the school office.</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;

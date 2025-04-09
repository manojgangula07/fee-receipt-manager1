import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ReceiptWithStudent extends Receipt {
  studentName: string;
  className: string;
  sectionName: string;
}

interface RecentPaymentsTableProps {
  recentPayments: ReceiptWithStudent[] | undefined;
  isLoading: boolean;
}

const RecentPaymentsTable = ({ recentPayments, isLoading }: RecentPaymentsTableProps) => {
  const { toast } = useToast();
  const [printingReceipt, setPrintingReceipt] = useState<string | null>(null);

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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // Handle view receipt
  const handleViewReceipt = (receiptId: number) => {
    window.open(`/receipt/${receiptId}`, '_blank');
  };

  // Handle print receipt
  const handlePrintReceipt = async (receiptNumber: string) => {
    try {
      setPrintingReceipt(receiptNumber);
      
      // Get receipt data for printing
      const response = await apiRequest('GET', `/api/receipts/print/${receiptNumber}`, undefined);
      
      if (response.ok) {
        // Trigger print dialog
        window.open(`/print-receipt/${receiptNumber}`, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Could not load receipt for printing",
          variant: "destructive",
        });
      }
      
      setPrintingReceipt(null);
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to print receipt",
        variant: "destructive",
      });
      setPrintingReceipt(null);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="font-condensed font-bold text-text-primary text-lg">Recent Payments</h3>
          <a href="/search-receipts" className="text-primary text-sm flex items-center">
            <span>View all</span>
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </a>
        </div>
        <div className="p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="font-condensed font-bold text-text-primary text-lg">Recent Payments</h3>
        <a href="/search-receipts" className="text-primary text-sm flex items-center">
          <span>View all</span>
          <span className="material-icons text-sm ml-1">arrow_forward</span>
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-background-dark">
          <thead className="bg-background-light">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Receipt No.</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Student Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Class</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Payment Mode</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-background-dark">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-background-light">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{payment.receiptNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{payment.studentName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{payment.className} - {payment.sectionName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{formatCurrency(payment.totalAmount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{formatDate(payment.issueDate.toString())}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{payment.paymentMethod}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'paid' 
                        ? 'bg-green-100 text-success' 
                        : payment.status === 'cancelled' 
                          ? 'bg-red-100 text-error' 
                          : 'bg-orange-100 text-accent-dark'
                    }`}>
                      {payment.status === 'paid' ? 'Paid' : payment.status === 'cancelled' ? 'Cancelled' : 'Partial'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                    <button 
                      className="text-primary hover:text-primary-dark"
                      onClick={() => handleViewReceipt(payment.id)}
                    >
                      <span className="material-icons text-sm">visibility</span>
                    </button>
                    <button 
                      className={`text-text-secondary hover:text-text-primary ${
                        printingReceipt === payment.receiptNumber ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => {
                        if (printingReceipt !== payment.receiptNumber) {
                          handlePrintReceipt(payment.receiptNumber);
                        }
                      }}
                    >
                      <span className="material-icons text-sm">
                        {printingReceipt === payment.receiptNumber ? 'hourglass_empty' : 'print'}
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">
                  No recent payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentPaymentsTable;

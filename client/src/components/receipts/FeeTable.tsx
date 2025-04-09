import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Fee {
  id: number;
  feeType: string;
  amount: number;
  dueDate: string;
  status: 'due' | 'partial' | 'paid';
  period?: string;
}

interface FeeTableProps {
  studentFees: Fee[] | undefined;
  isLoading: boolean;
  onFeeSelect: (feeIds: number[], feeItems: any[], totalAmount: number) => void;
}

const FeeTable = ({ studentFees, isLoading, onFeeSelect }: FeeTableProps) => {
  const [selectedFees, setSelectedFees] = useState<number[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [transactionReference, setTransactionReference] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Handle fee selection
  const handleFeeSelect = (feeId: number, checked: boolean) => {
    let newSelectedFees;
    
    if (checked) {
      newSelectedFees = [...selectedFees, feeId];
    } else {
      newSelectedFees = selectedFees.filter(id => id !== feeId);
    }
    
    setSelectedFees(newSelectedFees);
    
    // Calculate total amount and prepare fee items
    const feeItems = studentFees
      ?.filter(fee => newSelectedFees.includes(fee.id))
      .map(fee => ({
        feeType: fee.feeType,
        description: fee.feeType,
        period: fee.period || "",
        amount: fee.amount
      })) || [];
    
    const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
    setPaymentAmount(totalAmount);
    
    // Notify parent component
    onFeeSelect(newSelectedFees, feeItems, totalAmount);
  };

  // Update parent component when payment details change
  useEffect(() => {
    // Only calculate and update if there are selected fees
    if (selectedFees.length > 0) {
      const feeItems = studentFees
        ?.filter(fee => selectedFees.includes(fee.id))
        .map(fee => ({
          feeType: fee.feeType,
          description: fee.feeType,
          period: fee.period || "",
          amount: fee.amount
        })) || [];
      
      onFeeSelect(selectedFees, feeItems, paymentAmount);
    }
  }, [paymentDate, paymentMode, transactionReference, remarks]);

  // Select all fees
  const handleSelectAll = (checked: boolean) => {
    if (checked && studentFees) {
      const allFeeIds = studentFees
        .filter(fee => fee.status === 'due' || fee.status === 'partial')
        .map(fee => fee.id);
      
      setSelectedFees(allFeeIds);
      
      // Calculate total and prepare fee items
      const feeItems = studentFees
        .filter(fee => fee.status === 'due' || fee.status === 'partial')
        .map(fee => ({
          feeType: fee.feeType,
          description: fee.feeType,
          period: fee.period || "",
          amount: fee.amount
        }));
      
      const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
      setPaymentAmount(totalAmount);
      
      // Notify parent component
      onFeeSelect(allFeeIds, feeItems, totalAmount);
    } else {
      setSelectedFees([]);
      setPaymentAmount(0);
      
      // Notify parent component
      onFeeSelect([], [], 0);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border-b">
        <h4 className="font-medium text-text-primary mb-3">Fee Details</h4>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!studentFees || studentFees.length === 0) {
    return (
      <div className="p-4 border-b">
        <h4 className="font-medium text-text-primary mb-3">Fee Details</h4>
        <div className="bg-background-light p-8 rounded-md text-center">
          <span className="material-icons text-4xl text-text-secondary">info</span>
          <p className="text-text-secondary mt-2">No fee details available for this student</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fee Details */}
      <div className="p-4 border-b">
        <h4 className="font-medium text-text-primary mb-3">Fee Details</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-background-dark">
            <thead className="bg-background-light">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">
                  <Checkbox 
                    id="select-all"
                    checked={selectedFees.length === studentFees.filter(fee => fee.status === 'due' || fee.status === 'partial').length && selectedFees.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="ml-2">Select All</label>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fee Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount (₹)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-background-dark">
              {studentFees.map((fee) => (
                <tr key={fee.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Checkbox 
                      id={`fee-${fee.id}`}
                      checked={selectedFees.includes(fee.id)}
                      onCheckedChange={(checked) => handleFeeSelect(fee.id, checked as boolean)}
                      disabled={fee.status === 'paid'}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                    {fee.feeType} {fee.period && `(${fee.period})`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                    {fee.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                    {formatDate(fee.dueDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fee.status === 'paid' 
                        ? 'bg-green-100 text-success' 
                        : fee.status === 'partial'
                          ? 'bg-orange-100 text-accent-dark'
                          : 'bg-orange-100 text-accent-dark'
                    }`}>
                      {fee.status === 'paid' ? 'Paid' : fee.status === 'partial' ? 'Partial' : 'Due'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-background-light font-medium">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary" colSpan={2}>
                  Total Amount
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                  {paymentAmount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap"></td>
                <td className="px-4 py-3 whitespace-nowrap"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Payment Information */}
      {selectedFees.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-medium text-text-primary mb-3">Payment Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Amount to Pay (₹)</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Payment Mode</label>
              <Select
                value={paymentMode}
                onValueChange={setPaymentMode}
              >
                <SelectTrigger className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Select Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Transaction Reference (if applicable)</label>
              <Input
                type="text"
                placeholder="e.g., Transaction ID, Cheque No."
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-text-secondary text-sm font-medium mb-2">Remarks (Optional)</label>
              <Textarea
                placeholder="Add any notes or remarks about this payment"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeeTable;

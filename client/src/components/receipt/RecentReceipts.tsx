import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ReceiptPreview } from './ReceiptPreview';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { generateReceiptPDF } from '@/lib/pdf';
import { ChevronDown, Eye, Printer, Download, Mail } from 'lucide-react';

interface RecentReceiptsProps {
  receipts: any[];
  title?: string;
  description?: string;
}

export function RecentReceipts({ 
  receipts, 
  title = "Recent Fee Receipts", 
  description = "View and manage recently generated receipts." 
}: RecentReceiptsProps) {
  const { toast } = useToast();
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleViewReceipt = async (receiptId: number) => {
    try {
      const response = await apiRequest('GET', `/api/receipts/${receiptId}`, undefined);
      const data = await response.json();
      setSelectedReceipt(data);
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load receipt details',
        variant: 'destructive',
      });
    }
  };

  const handlePrintReceipt = async (receiptId: number) => {
    try {
      const response = await apiRequest('GET', `/api/receipts/${receiptId}`, undefined);
      const data = await response.json();
      const doc = generateReceiptPDF(data.receipt, data.student, data.items);
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate receipt for printing',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = async (receiptId: number) => {
    try {
      const response = await apiRequest('GET', `/api/receipts/${receiptId}`, undefined);
      const data = await response.json();
      const doc = generateReceiptPDF(data.receipt, data.student, data.items);
      doc.save(`Receipt_${data.receipt.receiptNumber}.pdf`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const handleEmailReceipt = async (receiptId: number) => {
    // In a real app, this would send the receipt via email
    toast({
      title: 'Email Receipt',
      description: 'Email functionality would be implemented here',
      variant: 'default',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No receipts found.
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium text-primary-600">{receipt.receiptNumber}</TableCell>
                    <TableCell>{receipt.studentName}</TableCell>
                    <TableCell>{receipt.grade}-{receipt.section}</TableCell>
                    <TableCell>{format(new Date(receipt.receiptDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{receipt.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{receipt.paymentMethod}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        receipt.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        receipt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {receipt.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewReceipt(receipt.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(receipt.id)}>
                            <Printer className="mr-2 h-4 w-4" />
                            <span>Print</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReceipt(receipt.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEmailReceipt(receipt.id)}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Email</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <ReceiptPreview 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        receiptData={selectedReceipt}
      />
    </Card>
  );
}

export default RecentReceipts;

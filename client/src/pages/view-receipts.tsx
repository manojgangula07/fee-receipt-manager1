import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { ReceiptPreview } from '@/components/receipt/ReceiptPreview';
import { useToast } from '@/hooks/use-toast';
import { Search, ChevronDown, Printer, Eye, Mail, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { generateReceiptPDF } from '@/lib/pdf';

const searchSchema = z.object({
  query: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function ViewReceipts() {
  const { toast } = useToast();
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, watch } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      startDate: '',
      endDate: '',
      paymentMethod: '',
    }
  });

  const { data: receipts, isLoading, refetch } = useQuery({
    queryKey: ['/api/receipts?limit=100'], // In a real app, implement proper pagination with limits
  });

  // Filter receipts based on search criteria
  const filteredReceipts = receipts ? receipts.filter((receipt: any) => {
    const searchValues = watch();
    let matchesQuery = true;
    let matchesDate = true;
    let matchesPaymentMethod = true;

    // Search query filter
    if (searchValues.query) {
      const query = searchValues.query.toLowerCase();
      matchesQuery = 
        receipt.receiptNumber.toLowerCase().includes(query) ||
        receipt.studentName.toLowerCase().includes(query);
    }

    // Date range filter
    if (searchValues.startDate && searchValues.endDate) {
      const receiptDate = new Date(receipt.receiptDate);
      const startDate = new Date(searchValues.startDate);
      const endDate = new Date(searchValues.endDate);
      endDate.setHours(23, 59, 59); // Include the end date
      matchesDate = receiptDate >= startDate && receiptDate <= endDate;
    }

    // Payment method filter
    if (searchValues.paymentMethod) {
      matchesPaymentMethod = receipt.paymentMethod === searchValues.paymentMethod;
    }

    return matchesQuery && matchesDate && matchesPaymentMethod;
  }) : [];

  // Paginate receipts
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);

  const onSearch = () => {
    refetch();
  };

  const handleReset = () => {
    reset();
    refetch();
  };

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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>View Receipts</CardTitle>
          <CardDescription>Search, view, and manage fee receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="query">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="query"
                    placeholder="Receipt Number or Student Name"
                    className="pl-8"
                    {...register('query')}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select onValueChange={(value) => register('paymentMethod').onChange({ target: { value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Method</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee Receipts</CardTitle>
          <CardDescription>Showing {paginatedReceipts.length} of {filteredReceipts.length} receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading receipts...
                    </TableCell>
                  </TableRow>
                ) : paginatedReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No receipts found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReceipts.map((receipt: any) => (
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
                            <Button variant="ghost" size="sm" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
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
          
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length} entries
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(old => Math.max(old - 1, 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={currentPage === index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(old => Math.min(old + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptPreview 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
}

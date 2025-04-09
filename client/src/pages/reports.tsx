import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { generateCollectionReportPDF, generateDefaultersReportPDF } from '@/lib/pdf';
import { FileText, Download, Printer, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { GRADES } from '@shared/schema';

const collectionReportSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  grade: z.string().optional(),
});

const defaultersReportSchema = z.object({
  grade: z.string().optional(),
  status: z.string().optional(),
});

export default function Reports() {
  const { toast } = useToast();
  const [selectedReportType, setSelectedReportType] = useState<string>('collections');
  
  // Set default dates to last 30 days
  const defaultStartDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
  
  // Collection report form
  const { 
    register: registerCollection, 
    handleSubmit: handleCollectionSubmit, 
    watch: watchCollection,
    formState: { errors: collectionErrors }
  } = useForm<z.infer<typeof collectionReportSchema>>({
    resolver: zodResolver(collectionReportSchema),
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      grade: '',
    }
  });
  
  // Defaulters report form
  const { 
    register: registerDefaulter, 
    handleSubmit: handleDefaulterSubmit,
    watch: watchDefaulter, 
    formState: { errors: defaulterErrors }
  } = useForm<z.infer<typeof defaultersReportSchema>>({
    resolver: zodResolver(defaultersReportSchema),
    defaultValues: {
      grade: '',
      status: '',
    }
  });
  
  // Get collection report data
  const collectionParams = watchCollection();
  const { data: collections, isLoading: isLoadingCollections, refetch: refetchCollections } = useQuery({
    queryKey: ['/api/receipts'],
    enabled: false,
  });
  
  // Get defaulters report data
  const defaulterParams = watchDefaulter();
  const { data: defaulters, isLoading: isLoadingDefaulters, refetch: refetchDefaulters } = useQuery({
    queryKey: ['/api/defaulters'],
    enabled: false,
  });
  
  // Filter collections by date and grade
  const filteredCollections = collections?.filter((receipt: any) => {
    const receiptDate = new Date(receipt.receiptDate);
    const startDate = collectionParams.startDate ? new Date(collectionParams.startDate) : new Date(0);
    const endDate = collectionParams.endDate ? new Date(collectionParams.endDate) : new Date();
    endDate.setHours(23, 59, 59); // Include the end date
    
    const dateInRange = receiptDate >= startDate && receiptDate <= endDate;
    const matchesGrade = !collectionParams.grade || receipt.grade === collectionParams.grade;
    
    return dateInRange && matchesGrade;
  }) || [];
  
  // Filter defaulters by grade and status
  const filteredDefaulters = defaulters?.filter((defaulter: any) => {
    const matchesGrade = !defaulterParams.grade || defaulter.grade === defaulterParams.grade;
    const matchesStatus = !defaulterParams.status || defaulter.status === defaulterParams.status;
    
    return matchesGrade && matchesStatus;
  }) || [];
  
  // Calculate total collection amount
  const totalCollectionAmount = filteredCollections.reduce(
    (sum: number, receipt: any) => sum + receipt.totalAmount, 
    0
  );
  
  // Calculate total defaulters amount
  const totalDefaultersAmount = filteredDefaulters.reduce(
    (sum: number, defaulter: any) => sum + (defaulter.amount - defaulter.amountPaid), 
    0
  );
  
  const onCollectionSearch = () => {
    refetchCollections();
  };
  
  const onDefaulterSearch = () => {
    refetchDefaulters();
  };
  
  const handlePrintCollectionReport = () => {
    const startDate = new Date(collectionParams.startDate || defaultStartDate);
    const endDate = new Date(collectionParams.endDate || defaultEndDate);
    
    const doc = generateCollectionReportPDF(filteredCollections, startDate, endDate);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };
  
  const handleDownloadCollectionReport = () => {
    const startDate = new Date(collectionParams.startDate || defaultStartDate);
    const endDate = new Date(collectionParams.endDate || defaultEndDate);
    
    const doc = generateCollectionReportPDF(filteredCollections, startDate, endDate);
    doc.save('fee_collection_report.pdf');
  };
  
  const handlePrintDefaultersReport = () => {
    const doc = generateDefaultersReportPDF(filteredDefaulters);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };
  
  const handleDownloadDefaultersReport = () => {
    const doc = generateDefaultersReportPDF(filteredDefaulters);
    doc.save('fee_defaulters_report.pdf');
  };
  
  const handleExportToExcel = (reportType: string) => {
    let apiEndpoint = '';
    let fileName = '';
    
    if (reportType === 'collections') {
      const startDate = collectionParams.startDate || defaultStartDate;
      const endDate = collectionParams.endDate || defaultEndDate;
      apiEndpoint = `/api/excel/fee-collection-report?startDate=${startDate}&endDate=${endDate}`;
      fileName = 'fee_collection_report.xlsx';
    } else {
      apiEndpoint = '/api/excel/defaulters-report';
      fileName = 'fee_defaulters_report.xlsx';
    }
    
    toast({
      title: 'Exporting to Excel',
      description: 'Your report is being generated...',
    });
    
    apiRequest('GET', apiEndpoint, undefined)
      .then(res => res.json())
      .then(data => {
        // Create a download link
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excelData}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Export Successful',
          description: 'Your report has been downloaded',
        });
      })
      .catch(err => {
        toast({
          title: 'Export Failed',
          description: 'There was a problem exporting your report',
          variant: 'destructive',
        });
      });
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Reports & Analytics</CardTitle>
          <CardDescription>Generate various reports for fee management</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="collections" 
            value={selectedReportType}
            onValueChange={setSelectedReportType}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="collections">
                <BarChart3 className="mr-2 h-4 w-4" />
                Collection Reports
              </TabsTrigger>
              <TabsTrigger value="defaulters">
                <AlertCircle className="mr-2 h-4 w-4" />
                Defaulter Lists
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="collections" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fee Collection Report</CardTitle>
                  <CardDescription>View collection details for a specific date range</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCollectionSubmit(onCollectionSearch)} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-1/3 space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate" 
                          type="date" 
                          {...registerCollection('startDate')}
                          className={collectionErrors.startDate ? "border-red-500" : ""}
                        />
                        {collectionErrors.startDate && (
                          <p className="text-xs text-red-500">{collectionErrors.startDate.message}</p>
                        )}
                      </div>
                      
                      <div className="w-full sm:w-1/3 space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate" 
                          type="date" 
                          {...registerCollection('endDate')}
                          className={collectionErrors.endDate ? "border-red-500" : ""}
                        />
                        {collectionErrors.endDate && (
                          <p className="text-xs text-red-500">{collectionErrors.endDate.message}</p>
                        )}
                      </div>
                      
                      <div className="w-full sm:w-1/3 space-y-2">
                        <Label htmlFor="grade">Class/Grade (Optional)</Label>
                        <Select
                          onValueChange={(value) => registerCollection('grade').onChange({ target: { value } })}
                          defaultValue=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {GRADES.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade === 'KG' ? 'Kindergarten' : `Class ${grade}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="submit" disabled={isLoadingCollections}>
                        {isLoadingCollections ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Generate Report'
                        )}
                      </Button>
                    </div>
                  </form>
                  
                  {collections && (
                    <div className="mt-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Collection Summary
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(collectionParams.startDate || defaultStartDate), 'dd MMM yyyy')} to {format(new Date(collectionParams.endDate || defaultEndDate), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handlePrintCollectionReport}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDownloadCollectionReport}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportToExcel('collections')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-primary-50 p-4 rounded-md mb-4">
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Collections</p>
                            <p className="text-2xl font-bold text-primary-700">₹{totalCollectionAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Receipts</p>
                            <p className="text-2xl font-bold text-primary-700">{filteredCollections.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Receipt No.</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Amount (₹)</TableHead>
                              <TableHead>Payment Mode</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCollections.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4">
                                  No collection data found for the selected criteria.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCollections.map((receipt: any) => (
                                <TableRow key={receipt.id}>
                                  <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                                  <TableCell>{format(new Date(receipt.receiptDate), 'dd MMM yyyy')}</TableCell>
                                  <TableCell>{receipt.studentName}</TableCell>
                                  <TableCell>{receipt.grade}-{receipt.section}</TableCell>
                                  <TableCell>{receipt.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell>{receipt.paymentMethod}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="defaulters" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fee Defaulters Report</CardTitle>
                  <CardDescription>View students with pending or overdue fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDefaulterSubmit(onDefaulterSearch)} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-1/2 space-y-2">
                        <Label htmlFor="grade">Class/Grade (Optional)</Label>
                        <Select
                          onValueChange={(value) => registerDefaulter('grade').onChange({ target: { value } })}
                          defaultValue=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {GRADES.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade === 'KG' ? 'Kindergarten' : `Class ${grade}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-full sm:w-1/2 space-y-2">
                        <Label htmlFor="status">Status (Optional)</Label>
                        <Select
                          onValueChange={(value) => registerDefaulter('status').onChange({ target: { value } })}
                          defaultValue=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Due">Due</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="submit" disabled={isLoadingDefaulters}>
                        {isLoadingDefaulters ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Generate Report'
                        )}
                      </Button>
                    </div>
                  </form>
                  
                  {defaulters && (
                    <div className="mt-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Defaulters Summary
                          </h3>
                          <p className="text-sm text-gray-500">
                            Students with pending or overdue fees
                          </p>
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handlePrintDefaultersReport}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDownloadDefaultersReport}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportToExcel('defaulters')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-4 rounded-md mb-4">
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Due Amount</p>
                            <p className="text-2xl font-bold text-red-600">₹{totalDefaultersAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Defaulters</p>
                            <p className="text-2xl font-bold text-red-600">{filteredDefaulters.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Admission No.</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Fee Type</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Amount Due (₹)</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDefaulters.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-4">
                                  No defaulters found for the selected criteria.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredDefaulters.map((defaulter: any) => (
                                <TableRow key={defaulter.id}>
                                  <TableCell className="font-medium">{defaulter.admissionNumber}</TableCell>
                                  <TableCell>{defaulter.studentName}</TableCell>
                                  <TableCell>{defaulter.grade}</TableCell>
                                  <TableCell>{defaulter.description}</TableCell>
                                  <TableCell>{format(new Date(defaulter.dueDate), 'dd MMM yyyy')}</TableCell>
                                  <TableCell>{(defaulter.amount - defaulter.amountPaid).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                      defaulter.status === 'Overdue' ? 'bg-red-100 text-red-800' : 
                                      defaulter.status === 'Due' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {defaulter.status}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

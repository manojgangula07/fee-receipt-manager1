import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { convertExcelToBase64, downloadStudentImportTemplate, downloadFeeStructureTemplate } from '@/lib/excel';
import { apiRequest } from '@/lib/queryClient';
import { FilePlus, Upload, Download, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';

const fileSchema = z.object({
  file: z.instanceof(FileList).refine(files => files.length > 0, "Please select a file")
});

export default function ExcelImport() {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<any | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(fileSchema)
  });

  const importStudentsMutation = useMutation({
    mutationFn: async (data: { excelData: string }) => {
      // Start progress animation
      setProgress(20);
      setTimeout(() => setProgress(60), 500);
      
      const response = await apiRequest('POST', '/api/excel/import-students', data);
      
      // Complete progress animation
      setProgress(100);
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${data.importedCount} students.`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An error occurred during import.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const file = data.file[0];
      const excelData = await convertExcelToBase64(file);
      importStudentsMutation.mutate({ excelData });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process Excel file',
        variant: 'destructive',
      });
    }
  };

  return (
    <Tabs defaultValue="import">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="import">Import Data</TabsTrigger>
        <TabsTrigger value="export">Export Data</TabsTrigger>
      </TabsList>
      
      <TabsContent value="import" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Student Data</CardTitle>
            <CardDescription>
              Upload an Excel file containing student information to import into the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileSpreadsheet className="w-12 h-12 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Excel files only (XLSX, XLS)</p>
                      </div>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        accept=".xlsx,.xls" 
                        {...register('file')}
                      />
                    </label>
                  </div>
                  {errors.file && (
                    <p className="text-sm text-red-500">{errors.file.message?.toString()}</p>
                  )}
                </div>
              </div>
              
              {/* Import Progress */}
              {importStudentsMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Importing data...</div>
                    <div className="text-sm text-gray-500">{progress}%</div>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
              
              {/* Import Result */}
              {importResult && (
                <Alert className={importResult.importedCount > 0 ? "bg-green-50" : "bg-yellow-50"}>
                  <Check className="h-4 w-4" />
                  <AlertTitle>Import Complete</AlertTitle>
                  <AlertDescription>
                    Successfully imported {importResult.importedCount} of {importResult.totalRows} records.
                    {importResult.importedCount < importResult.totalRows && (
                      <span className="block mt-1">Some records were skipped due to validation errors.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => downloadStudentImportTemplate()}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Button type="submit" disabled={importStudentsMutation.isPending}>
                  {importStudentsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Students
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Fee Structure</CardTitle>
            <CardDescription>
              Upload an Excel file containing fee structure information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Import Fee Structure</h3>
                <p className="mt-1 text-xs text-gray-500">This feature is coming soon.</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => downloadFeeStructureTemplate()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="export" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>
              Export data from the system to Excel format for external use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Student Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Export the complete student database or filter by class.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({
                      title: "Export Initiated",
                      description: "Exporting student data to Excel...",
                    });
                    // In a real implementation, this would call the API to export data
                    apiRequest('GET', '/api/excel/export-students', undefined)
                      .then(res => res.json())
                      .then(data => {
                        // Simulate download
                        const link = document.createElement('a');
                        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excelData}`;
                        link.download = 'students.xlsx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      });
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Students
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Fee Collection Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Export fee collection data for a specific date range.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({
                      title: "Export Initiated",
                      description: "Exporting fee collection report to Excel...",
                    });
                    // In a real implementation, this would allow selecting a date range
                    apiRequest('GET', '/api/excel/fee-collection-report', undefined)
                      .then(res => res.json())
                      .then(data => {
                        // Simulate download
                        const link = document.createElement('a');
                        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excelData}`;
                        link.download = 'fee_collection_report.xlsx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      });
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Collections
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Defaulters Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Export a list of students with pending or overdue fees.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({
                      title: "Export Initiated",
                      description: "Exporting defaulters report to Excel...",
                    });
                    apiRequest('GET', '/api/excel/defaulters-report', undefined)
                      .then(res => res.json())
                      .then(data => {
                        // Simulate download
                        const link = document.createElement('a');
                        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excelData}`;
                        link.download = 'defaulters_report.xlsx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      });
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Defaulters
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Fee Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Export fee structure configuration for all classes.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "This feature will be available soon.",
                    });
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Fee Structure
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

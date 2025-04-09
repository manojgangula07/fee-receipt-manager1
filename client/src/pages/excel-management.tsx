import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, FileUp, Download, RefreshCw, AlertOctagon } from 'lucide-react';
import { 
  convertExcelToBase64, 
  downloadExcelFromBase64,
  downloadStudentImportTemplate,
  downloadFeeStructureTemplate,
  exportStudentsToExcel,
  exportFeeStructureToExcel,
  exportTransportationRoutesToExcel,
  exportReceiptsToExcel
} from '@/lib/excel';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import type { Student, FeeStructureItem, TransportationRoute } from '../../shared/schema';

export default function ExcelManagementPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'students' | 'feeStructure'>('students');

  // Fetch data for export
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: feeStructure = [] } = useQuery<FeeStructureItem[]>({
    queryKey: ['/api/fee-structure'],
  });

  const { data: transportationRoutes = [] } = useQuery<TransportationRoute[]>({
    queryKey: ['/api/transportation-routes'],
  });

  const { data: receipts = [] } = useQuery<any[]>({
    queryKey: ['/api/receipts'],
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel')) {
      setSelectedFile(file);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid Excel file (.xlsx or .xls)',
        variant: 'destructive'
      });
      event.target.value = '';
    }
  };

  const uploadExcel = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const excelData = await convertExcelToBase64(selectedFile);

      if (!excelData) {
        throw new Error('Failed to process Excel file');
      }

      let endpoint = '';
      switch (uploadType) {
        case 'students':
          endpoint = '/api/excel/import-students';
          break;
        case 'feeStructure':
          endpoint = '/api/excel/import-fee-structure';
          break;
      }

      const response = await apiRequest('POST', endpoint, { 
        excelData: excelData,
        fileName: selectedFile.name
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();

      toast({
        title: 'Upload Successful',
        description: data.message,
      });

      // Reset form
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleExport = async (type: string) => {
    try {
      switch (type) {
        case 'students':
          exportStudentsToExcel(students);
          break;
        case 'feeStructure':
          exportFeeStructureToExcel(feeStructure);
          break;
        case 'transportationRoutes':
          exportTransportationRoutesToExcel(transportationRoutes);
          break;
        case 'receipts':
          exportReceiptsToExcel(receipts);
          break;
        case 'defaulters':
          // Fetch defaulters first
          const defaultersResponse = await apiRequest('GET', '/api/defaulters');
          exportDefaultersToExcel(defaultersResponse);
          break;
        default:
          throw new Error('Unknown export type');
      }

      toast({
        title: "Export Successful",
        description: "Data exported to Excel successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data.",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = (type: 'students' | 'feeStructure') => {
    try {
      if (type === 'students') {
        downloadStudentImportTemplate();
      } else {
        downloadFeeStructureTemplate();
      }

      toast({
        title: "Template Downloaded",
        description: "Excel template downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download template.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Excel Management</h1>
        <p className="text-muted-foreground">Import, export, and synchronize data with Excel</p>
      </div>

      <Tabs defaultValue="import">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6 mt-6">
          <Alert className="bg-blue-50 border-blue-200">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">Data Import Guidelines</AlertTitle>
            <AlertDescription className="text-blue-700">
              Please ensure your Excel file follows our template format. Download the template below before importing data.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Data Import</CardTitle>
                <CardDescription>
                  Import student information including personal details and fee categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('students')}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Separator />
                <div className="space-y-4">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90"
                  />
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setUploadType('students');
                      uploadExcel();
                    }}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading && uploadType === 'students' ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <FileUp className="mr-2 h-4 w-4" />
                        Upload Student Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Structure Import</CardTitle>
                <CardDescription>
                  Import fee structure data including fee types, amounts, and frequencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('feeStructure')}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Separator />
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90"
                  />
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setUploadType('feeStructure');
                      uploadExcel();
                    }}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading && uploadType === 'feeStructure' ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <FileUp className="mr-2 h-4 w-4" />
                        Upload Fee Structure
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert variant="destructive" className="mt-6">
            <AlertOctagon className="h-4 w-4" />
            <AlertTitle>Important Note</AlertTitle>
            <AlertDescription>
              Importing data may overwrite existing records. Please ensure you have a backup before proceeding.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="export" className="space-y-6 mt-6">
          <Alert className="bg-green-50 border-green-200">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Data Export Options</AlertTitle>
            <AlertDescription className="text-green-700">
              Export your data to Excel for reporting, analysis, or backup purposes. All data is formatted for easy reading.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Student Data</CardTitle>
                <CardDescription>
                  Export complete student records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {students.length} Students Available
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleExport('students')}
                  disabled={students.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Students
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fee Structure</CardTitle>
                <CardDescription>
                  Export fee structure by grade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {feeStructure.length} Fee Items Available
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleExport('feeStructure')}
                  disabled={feeStructure.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Fee Structure
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transportation Routes</CardTitle>
                <CardDescription>
                  Export transportation route details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {transportationRoutes.length} Routes Available
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleExport('transportationRoutes')}
                  disabled={transportationRoutes.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Routes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fee Receipts</CardTitle>
                <CardDescription>
                  Export all receipt records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {receipts.length} Receipts Available
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleExport('receipts')}
                  disabled={receipts.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Receipts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Defaulters Report</CardTitle>
                <CardDescription>
                  Export list of fee defaulters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate updated defaulters report
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleExport('defaulters')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Defaulters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sync With External System</CardTitle>
                <CardDescription>
                  Synchronize with school ERP system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Last sync: Never
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "External system synchronization will be available in the next update.",
                    });
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
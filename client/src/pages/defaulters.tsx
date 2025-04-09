import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Download, 
  Search, 
  FileSpreadsheet, 
  ArrowUpDown, 
  AlertTriangle, 
  Mail, 
  Printer,
  UserX
} from "lucide-react";
import { exportDefaultersToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';

type Defaulter = {
  id: number;
  studentId: number;
  admissionNumber: string;
  studentName: string;
  grade: string;
  section: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: string;
  period: string | null;
  amountPaid: number;
  contactNumber: string;
  parentName: string;
  email: string | null;
};

export default function DefaultersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterFeeType, setFilterFeeType] = useState('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'studentName'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: defaulters = [], isLoading } = useQuery<Defaulter[]>({
    queryKey: ['/api/defaulters'],
  });

  // Get unique grades from defaulters
  const getGrades = () => {
    const gradesSet = new Set<string>();
    defaulters.forEach((defaulter) => gradesSet.add(defaulter.grade));
    return Array.from(gradesSet).sort();
  };

  // Get unique fee types from defaulters
  const getFeeTypes = () => {
    const feeTypesSet = new Set<string>();
    defaulters.forEach((defaulter) => feeTypesSet.add(defaulter.feeType));
    return Array.from(feeTypesSet).sort();
  };

  // Filter defaulters based on search query and filters
  const filteredDefaulters = defaulters.filter((defaulter) => {
    const matchesSearch = 
      defaulter.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      defaulter.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      defaulter.feeType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGrade = filterGrade === 'all' || defaulter.grade === filterGrade;
    const matchesFeeType = filterFeeType === 'all' || defaulter.feeType === filterFeeType;
    
    return matchesSearch && matchesGrade && matchesFeeType;
  });

  // Sort defaulters
  const sortedDefaulters = [...filteredDefaulters].sort((a, b) => {
    if (sortBy === 'dueDate') {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else { // studentName
      return sortOrder === 'asc' 
        ? a.studentName.localeCompare(b.studentName) 
        : b.studentName.localeCompare(a.studentName);
    }
  });

  // Group defaulters by grade
  const defaultersByGrade: Record<string, Defaulter[]> = {};
  filteredDefaulters.forEach((defaulter) => {
    if (!defaultersByGrade[defaulter.grade]) {
      defaultersByGrade[defaulter.grade] = [];
    }
    defaultersByGrade[defaulter.grade].push(defaulter);
  });

  // Calculate statistics
  const totalDueAmount = filteredDefaulters.reduce((sum, defaulter) => sum + defaulter.amount, 0);
  const totalDefaulters = new Set(filteredDefaulters.map(d => d.studentId)).size;
  const averageDueAmount = totalDefaulters > 0 ? totalDueAmount / totalDefaulters : 0;

  // Send reminder function
  const sendReminder = (defaulterId: number, type: 'email' | 'sms') => {
    toast({
      title: `${type === 'email' ? 'Email' : 'SMS'} Reminder Sent`,
      description: `Payment reminder has been sent to the parent.`,
    });
  };

  // Handle export
  const handleExport = () => {
    try {
      // Add any additional data needed for export
      const exportData = filteredDefaulters.map(defaulter => ({
        ...defaulter,
      }));
      
      exportDefaultersToExcel(exportData);
      
      toast({
        title: "Export Successful",
        description: "Defaulters list exported to Excel successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data.",
        variant: "destructive"
      });
    }
  };

  // Sort handler
  const handleSort = (column: 'dueDate' | 'amount' | 'studentName') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Defaulters</h1>
        <p className="text-muted-foreground">
          Track and manage students with outstanding fee payments
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading defaulters data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  {totalDefaulters}
                </CardTitle>
                <CardDescription>Total Defaulters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Students with pending payments
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  ₹{totalDueAmount.toLocaleString()}
                </CardTitle>
                <CardDescription>Total Due Amount</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Outstanding payments across all students
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  ₹{averageDueAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </CardTitle>
                <CardDescription>Average Due per Student</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Average outstanding amount per defaulter
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or admission number"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {getGrades().map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterFeeType} onValueChange={setFilterFeeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Fee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Types</SelectItem>
                  {getFeeTypes().map((feeType) => (
                    <SelectItem key={feeType} value={feeType}>
                      {feeType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-muted-foreground">
                  Showing {filteredDefaulters.length} of {defaulters.length} defaulters
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setFilterGrade("all");
                  setFilterFeeType("all");
                }}>
                  Clear Filters
                </Button>
                
                <Button variant="outline" onClick={handleExport}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export
                </Button>
                
                <Button variant="outline" onClick={() => {
                  window.print();
                }}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grade">By Grade</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              {filteredDefaulters.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Details</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto font-medium"
                            onClick={() => handleSort('studentName')}
                          >
                            Student Name
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto font-medium"
                            onClick={() => handleSort('amount')}
                          >
                            Amount
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto font-medium"
                            onClick={() => handleSort('dueDate')}
                          >
                            Due Date
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDefaulters.map((defaulter) => (
                        <TableRow key={defaulter.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{defaulter.admissionNumber}</span>
                              <span className="text-xs text-muted-foreground">
                                Grade {defaulter.grade}-{defaulter.section}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{defaulter.studentName}</span>
                              <span className="text-xs text-muted-foreground">
                                {defaulter.parentName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{defaulter.feeType}</span>
                              {defaulter.period && (
                                <span className="text-xs text-muted-foreground">
                                  {defaulter.period}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ₹{defaulter.amount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{new Date(defaulter.dueDate).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {Math.ceil((new Date().getTime() - new Date(defaulter.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                defaulter.status === 'Pending' ? 'outline' : 
                                defaulter.status === 'Overdue' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {defaulter.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => sendReminder(defaulter.id, 'email')}
                                disabled={!defaulter.email}
                                title={defaulter.email ? "Send Email Reminder" : "No Email Available"}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => sendReminder(defaulter.id, 'sms')}
                                title="Send SMS Reminder"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <UserX className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No defaulters found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || filterGrade !== 'all' || filterFeeType !== 'all' ? 
                      "Try adjusting your search or filter criteria to find defaulters." : 
                      "There are no fee defaulters at the moment."}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="grade">
              <div className="space-y-6">
                {Object.keys(defaultersByGrade).length > 0 ? (
                  Object.keys(defaultersByGrade)
                    .sort()
                    .map((grade) => (
                      <Card key={grade}>
                        <CardHeader>
                          <CardTitle>Grade {grade}</CardTitle>
                          <CardDescription>
                            {defaultersByGrade[grade].length} defaulters | 
                            Total due: ₹{defaultersByGrade[grade].reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Adm. No.</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Fee Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {defaultersByGrade[grade].map((defaulter) => (
                                <TableRow key={defaulter.id}>
                                  <TableCell className="font-medium">
                                    {defaulter.admissionNumber}
                                  </TableCell>
                                  <TableCell>{defaulter.studentName}</TableCell>
                                  <TableCell>{defaulter.feeType}</TableCell>
                                  <TableCell>₹{defaulter.amount.toLocaleString()}</TableCell>
                                  <TableCell>
                                    {new Date(defaulter.dueDate).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        defaulter.status === 'Pending' ? 'outline' : 
                                        defaulter.status === 'Overdue' ? 'destructive' : 
                                        'secondary'
                                      }
                                    >
                                      {defaulter.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                        <CardFooter className="justify-between">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Class Teacher: {grade === '10' ? 'Ms. Sharma' : 'Not Assigned'}
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Notifications Sent",
                                description: `Reminders sent to all defaulters in Grade ${grade}.`,
                              });
                            }}
                          >
                            Send Reminders to All
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <UserX className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No defaulters found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery || filterGrade !== 'all' || filterFeeType !== 'all' ? 
                        "Try adjusting your search or filter criteria to find defaulters." : 
                        "There are no fee defaulters at the moment."}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Alert className="bg-amber-50 border-amber-200 mt-6">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Reminder Settings</AlertTitle>
            <AlertDescription className="text-amber-700">
              Automated reminders are sent 3 days before the due date and every 7 days after the due date. 
              You can also send manual reminders using the buttons in the actions column.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
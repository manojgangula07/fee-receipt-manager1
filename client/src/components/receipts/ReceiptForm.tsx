import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";


const searchFormSchema = z.object({
  classId: z.string().optional(),
  section: z.string().optional(),
  admissionNumber: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface ReceiptFormProps {
  onSearchStudent: (data: { classId?: number; section?: string; admissionNumber?: string; }) => void;
  isSearching: boolean;
}

const ReceiptForm = ({ onSearchStudent, isSearching }: ReceiptFormProps) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);

  // Fetch student fees when a student is selected
  const fetchStudentFees = async (student: any) => {
    try {
      // First get all fee dues for the student
      const feeDuesResponse = await fetch(`/api/fee-dues/student/${student.id}`);
      const feeDues = await feeDuesResponse.json();
      
      // Get fee structure for reference
      const feeStructureResponse = await fetch(`/api/fee-structure/grade/${student.grade}`);
      const feeStructure = await feeStructureResponse.json();
      
      // Get transportation route if assigned
      let transportationFee = null;
      if (student.transportationRouteId) {
        const routeResponse = await fetch(`/api/transportation-routes/${student.transportationRouteId}`);
        const route = await routeResponse.json();
        transportationFee = route.fare;
      }

      // Map dues to fee items
      let allFees = feeDues.map(due => ({
        id: due.id,
        feeType: due.feeType,
        description: due.description,
        period: due.period,
        amount: due.amount - due.amountPaid,
        dueDate: new Date(due.dueDate),
        status: due.status,
        feeDueId: due.id,
        isPaid: due.status === 'Paid'
      }));

      // Filter out fully paid fees
      allFees = allFees.filter(fee => fee.amount > 0);

      // Fetch transportation fee if route is assigned
      if (student.transportationRouteId) {
        const routeResponse = await fetch(`/api/transportation-routes/${student.transportationRouteId}`);
        const route = await routeResponse.json();
        if (route) {
          allFees.push({
            id: Math.random().toString(36).substr(2, 9),
            feeType: "Transportation",
            description: `Transportation Fee (${route.routeName} - ${currentMonth})`,
            period: currentMonth,
            amount: route.fare,
            dueDate: new Date(),
            status: 'Due',
            frequency: 'Monthly'
          });
        }
      }

      // Filter out already paid fees
      const feeDuesResponse = await fetch(`/api/fee-dues/student/${student.id}`);
      const feeDues = await feeDuesResponse.json();

      allFees = allFees.filter(fee => {
        const paidFee = feeDues.find(due => 
          due.feeType === fee.feeType && 
          due.period === fee.period && 
          due.status === 'Paid'
        );
        return !paidFee;
      });

      setStudentFees(allFees);
      setSelectedStudent(student);
    } catch (error) {
      console.error('Error fetching student fees:', error);
    }
  };

  // Handle student search
  const handleStudentSearch = async (data: { classId?: number; section?: string; admissionNumber?: string; }) => {
    onSearchStudent(data);
    // Assuming the search returns a student object
    const response = await fetch('/api/students/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const student = await response.json();
    if (student) {
      fetchStudentFees(student);
    }
  };
  const [searchDisabled, setSearchDisabled] = useState(true);

  // Get all classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes'],
  });

  // Form setup
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      classId: "",
      section: "",
      admissionNumber: "",
    },
  });

  // Watch form values to enable/disable search button
  const { classId, section, admissionNumber } = form.watch();

  useEffect(() => {
    // Enable search if at least one field has a value
    setSearchDisabled(!(classId || section || admissionNumber));
  }, [classId, section, admissionNumber]);

  // Handle form submission
  const onSubmit = (data: SearchFormValues) => {
    handleStudentSearch({
      classId: data.classId ? parseInt(data.classId) : undefined,
      section: data.section,
      admissionNumber: data.admissionNumber,
    });
  };

  // Calculate total fee amount
  const totalAmount = studentFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="p-4 border-b bg-background-light">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary text-sm font-medium">Class</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingClasses}
                  >
                    <SelectTrigger className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <Skeleton className="h-24 w-full" />
                      ) : (
                        <>
                          <SelectItem value="none">Select Class</SelectItem>
                          {classes?.map((cls: { id: number; name: string }) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary text-sm font-medium">Section</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Section</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="admissionNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary text-sm font-medium">Admission Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., ADM2023001"
                    className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex items-end">
            <Button
              type="submit"
              variant="default"
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center"
              disabled={searchDisabled || isSearching}
            >
              <span className="material-icons mr-1 text-sm">
                {isSearching ? "hourglass_empty" : "search"}
              </span>
              <span>{isSearching ? "Searching..." : "Search Student"}</span>
            </Button>
          </div>
        </form>
      </Form>
      <FeeTable studentFees={studentFees} />
    </div>
  );
};

const FeeTable = ({ studentFees }: { studentFees: { feeType: string; description: string; period: string; amount: number; id: number; }[] | null }) => {
  const [selectedFees, setSelectedFees] = useState<number[]>([]);

  const handleToggleFee = (fee: { id: number }) => {
    setSelectedFees(prevSelected => {
      if (prevSelected.includes(fee.id)) {
        return prevSelected.filter(id => id !== fee.id);
      } else {
        return [...prevSelected, fee.id];
      }
    });
  };

  // Display fee details table
  return (
    <div className="p-4 border-b">
      <h4 className="font-medium text-text-primary mb-3">Fee Details</h4>
      {(!studentFees || studentFees.length === 0) ? (
        <div className="bg-background-light p-8 rounded-md text-center">
          <span className="material-icons text-4xl text-text-secondary">warning</span>
          <p className="text-text-secondary mt-2">{selectedStudent ? "No pending fees found for this student" : "Please search for a student to view their fee details"}</p>
          {selectedStudent && (
            <p className="text-sm text-muted-foreground mt-2">
              All fees have been paid. To generate a new receipt, please wait for the next billing cycle.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentFees.map((fee, index) => (
                <TableRow key={index}>
                  <TableCell>{fee.feeType}</TableCell>
                  <TableCell>{fee.description}</TableCell>
                  <TableCell>{fee.period}</TableCell>
                  <TableCell className="text-right">₹{fee.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={selectedFees.some(f => f.id === fee.id)}
                      onCheckedChange={() => handleToggleFee(fee)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ReceiptForm;
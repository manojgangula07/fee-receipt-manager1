import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Search, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GRADES, PAYMENT_METHODS } from "@shared/schema";

interface ReceiptFormProps {
  onReceiptGenerated: (receiptData: any) => void;
}

export function ReceiptForm({ onReceiptGenerated }: ReceiptFormProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    query: "",
    grade: "",
  });
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [feeDues, setFeeDues] = useState<any[]>([]);
  const [selectedFees, setSelectedFees] = useState<any[]>([]);
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [step, setStep] = useState<"search" | "payment">("search");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);

  // Form setup for payment details
  const paymentSchema = z.object({
    receiptDate: z.string().min(1, "Receipt date is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    paymentReference: z.string().optional(),
    amountReceived: z.number().min(0, "Amount must be greater than 0"),
    remarks: z.string().optional(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      receiptDate: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "",
      paymentReference: "",
      amountReceived: 0,
      remarks: "",
    },
  });

  // Watch payment method to show/hide reference field
  const paymentMethod = watch("paymentMethod");
  const showReferenceField =
    paymentMethod === "Online Transfer" ||
    paymentMethod === "UPI" ||
    paymentMethod === "Cash";

  // Query to search for students
  const {
    data: students,
    isLoading: isSearching,
    refetch,
  } = useQuery({
    queryKey: ["/api/students", searchParams],
    enabled: false,
  });

  // Get fee dues for selected student
  const { isLoading: isLoadingFeeDues, refetch: refetchFeeDues } = useQuery({
    queryKey: ["/api/fee-dues/student", selectedStudent?.id],
    enabled: false,
    onSuccess: async (data) => {
      setFeeDues(data);
      setSelectedFees([]);
      //Additional logic to fetch payment history and pending amount
      if (selectedStudent) {
        const student = selectedStudent;
        const receiptsResponse = await fetch(
          `/api/receipts/student/${student.id}`,
        );
        const receipts = await receiptsResponse.json();
        setPaymentHistory(receipts);

        const totalPending = data.reduce(
          (sum, due) => sum + (due.amount - due.amountPaid),
          0,
        );
        setPendingAmount(totalPending);
      }
    },
  });

  // Generate receipt number
  const generateReceiptNumber = async (grade: string, section: string) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/generate-receipt-number?grade=${grade}&section=${section}`,
        undefined,
      );
      const data = await response.json();
      setReceiptNumber(data.receiptNumber);
    } catch (error) {
      console.error("Error generating receipt number:", error);
      toast({
        title: "Error",
        description: "Failed to generate receipt number",
        variant: "destructive",
      });
    }
  };

  // Handle student selection
  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStep("payment");
    generateReceiptNumber(student.grade, student.section);
    refetchFeeDues();
  };

  // Handle fee selection
  const handleToggleFee = (fee: any) => {
    setSelectedFees((prev) => {
      if (prev.some((f) => f.id === fee.id)) {
        return prev.filter((f) => f.id !== fee.id);
      } else {
        return [...prev, fee];
      }
    });
  };

  // Calculate total amount
  const totalAmount = selectedFees.reduce(
    (sum, fee) => sum + (fee.amount - fee.amountPaid),
    0,
  );

  // Set amount received to total when fees are selected
  useEffect(() => {
    setValue("amountReceived", totalAmount);
  }, [totalAmount, setValue]);

  // Handle search submission
  const handleSearch = () => {
    refetch();
  };

  // Handle select all fees
  const handleSelectAllFees = () => {
    if (selectedFees.length === feeDues.length) {
      setSelectedFees([]);
    } else {
      setSelectedFees([...feeDues]);
    }
  };

  // Create receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/receipts", data),
    onSuccess: async (response) => {
      const data = await response.json();
      onReceiptGenerated(data);
      toast({
        title: "Success",
        description: "Receipt generated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate receipt",
        variant: "destructive",
      });
    },
  });

  // Handle payment form submission
  const onSubmit = (data: z.infer<typeof paymentSchema>) => {
    if (selectedFees.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one fee item",
        variant: "destructive",
      });
      return;
    }

    const receiptData = {
      receipt: {
        receiptNumber,
        studentId: selectedStudent.id,
        receiptDate: data.receiptDate,
        totalAmount: totalAmount,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        remarks: data.remarks,
        status: "Completed",
      },
      items: selectedFees.map((fee) => ({
        feeType: fee.feeType,
        description: fee.description,
        amount: fee.amount - fee.amountPaid,
        period: fee.period,
        feeDueId: fee.id,
      })),
    };

    createReceiptMutation.mutate(receiptData);
  };

  return (
    <div>
      {step === "search" ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Receipt</CardTitle>
            <CardDescription>
              Search for a student and generate a fee receipt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Enter student name or admission number"
                  value={searchParams.query}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, query: e.target.value })
                  }
                />
              </div>
              <div className="w-full sm:w-auto">
                <Select
                  value={searchParams.grade}
                  onValueChange={(value) =>
                    setSearchParams({ ...searchParams, grade: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade === "KG" ? "Kindergarten" : `Class ${grade}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Search
              </Button>
            </div>

            {/* Search Results */}
            {students && students.length > 0 ? (
              <div className="mt-4 border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Admission No.
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Student Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Class
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Parent Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.grade}-{student.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.parentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectStudent(student)}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : students && students.length === 0 ? (
              <div className="mt-4 p-4 text-center bg-gray-50 rounded-md">
                <p className="text-gray-600">
                  No students found. Try a different search term.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generate Fee Receipt</CardTitle>
            <CardDescription>
              Create a receipt for{" "}
              <span className="font-medium">
                {selectedStudent?.studentName}
              </span>{" "}
              ({selectedStudent?.grade}-{selectedStudent?.section})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Student Details */}
            <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <Label>Admission Number</Label>
                <Input
                  type="text"
                  value={selectedStudent?.admissionNumber}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Student Name</Label>
                <Input
                  type="text"
                  value={selectedStudent?.studentName}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Class & Section</Label>
                <Input
                  type="text"
                  value={`${selectedStudent?.grade}-${selectedStudent?.section}`}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Parent Name</Label>
                <Input
                  type="text"
                  value={selectedStudent?.parentName}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  type="text"
                  value={selectedStudent?.contactNumber}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Fee Category</Label>
                <Input
                  type="text"
                  value={selectedStudent?.feeCategory}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Payment History Section */}
            {paymentHistory && paymentHistory.length > 0 && (
              <>
                <h4 className="mb-4 font-medium text-gray-700">
                  Payment History
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Amount (₹)
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Method
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((receipt) => (
                        <tr key={receipt.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {format(
                              new Date(receipt.receiptDate),
                              "dd MMM yyyy",
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {receipt.totalAmount.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {receipt.paymentMethod}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {receipt.paymentReference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Fee Details Section */}
            <h4 className="mb-4 font-medium text-gray-700">Fee Details</h4>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Fee Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Total Amount (₹)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Partial Payment
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoadingFeeDues ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        <span>Loading fee details...</span>
                      </td>
                    </tr>
                  ) : feeDues.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No pending fees found for this student.
                      </td>
                    </tr>
                  ) : (
                    feeDues.map((feeDue) => (
                      <tr key={feeDue.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {feeDue.description}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {feeDue.amount.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {format(new Date(feeDue.dueDate), "dd MMM yyyy")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Badge
                            variant={
                              feeDue.status === "Overdue"
                                ? "destructive"
                                : feeDue.status === "Due"
                                  ? "outline"
                                  : "default"
                            }
                          >
                            {feeDue.status}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {feeDue.amountPaid > 0
                            ? `₹${feeDue.amountPaid.toFixed(2)} paid`
                            : "None"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Checkbox
                            checked={selectedFees.some(
                              (f) => f.id === feeDue.id,
                            )}
                            onCheckedChange={() => handleToggleFee(feeDue)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-50 font-medium">
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                      Total Selected:
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {totalAmount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500"></td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm"></td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm"></td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={handleSelectAllFees}
                      >
                        {selectedFees.length === feeDues.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mt-6">
                <h4 className="mb-4 font-medium text-gray-700">
                  Payment Details
                </h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <Label htmlFor="receiptDate">Receipt Date</Label>
                    <Controller
                      name="receiptDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="receiptDate"
                          type="date"
                          {...field}
                          className={errors.receiptDate ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {errors.receiptDate && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.receiptDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Receipt Number</Label>
                    <Input
                      value={receiptNumber}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className={
                              errors.paymentMethod ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.paymentMethod && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.paymentMethod.message}
                      </p>
                    )}
                  </div>

                  {showReferenceField && (
                    <div>
                      <Label htmlFor="paymentReference">Reference Number</Label>
                      <Controller
                        name="paymentReference"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="paymentReference"
                            placeholder="Check/Transaction ID"
                            {...field}
                          />
                        )}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="amountReceived">Amount Received (₹)</Label>
                    <Controller
                      name="amountReceived"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="amountReceived"
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          className={
                            errors.amountReceived ? "border-red-500" : ""
                          }
                        />
                      )}
                    />
                    {errors.amountReceived && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.amountReceived.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Controller
                      name="remarks"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="remarks"
                          placeholder="Any additional notes"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("search");
                    setSelectedStudent(null);
                    setFeeDues([]);
                    setSelectedFees([]);
                    setPaymentHistory([]);
                    setPendingAmount(0);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createReceiptMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createReceiptMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Receipt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReceiptForm;

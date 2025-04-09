import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  UserPlus, 
  Search, 
  User, 
  MoreHorizontal,
  Check,
  Edit,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Pencil,
  FileUp,
  UserCog,
  UserRoundX
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Zod schema for student form
const studentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  studentName: z.string().min(1, "Student name is required"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  rollNumber: z.coerce.number().min(1, "Roll number is required"),
  parentName: z.string().min(1, "Parent name is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  feeCategory: z.string().default("Regular"),
  transportationRouteId: z.coerce.number().optional().or(z.literal(0)).transform(val => val === 0 ? null : val),
  pickupPoint: z.string().optional().or(z.literal("")),
  admissionDate: z.string().min(1, "Admission date is required"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

// Student type matches the backend schema
type Student = {
  id: number;
  admissionNumber: string;
  studentName: string;
  grade: string;
  section: string;
  rollNumber: number;
  parentName: string;
  contactNumber: string;
  email: string | null;
  feeCategory: string;
  transportationRouteId: number | null;
  pickupPoint: string | null;
  admissionDate: string;
};

// Route type for transportation dropdown
type RouteType = {
  id: number;
  routeName: string;
  fare: number;
  isActive: boolean;
  description: string | null;
};

export default function StudentsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [currentTab, setCurrentTab] = useState("all");

  // Form for adding/editing students
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNumber: "",
      studentName: "",
      grade: "",
      section: "",
      rollNumber: 0,
      parentName: "",
      contactNumber: "",
      email: "",
      feeCategory: "Regular",
      transportationRouteId: 0,
      pickupPoint: "",
      admissionDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Query to fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students", searchQuery, filterGrade],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filterGrade && filterGrade !== "all") params.append("grade", filterGrade);
      const response = await fetch(`/api/students?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      return response.json();
    }
  });

  // Query to fetch transportation routes
  const { data: routes = [] } = useQuery({
    queryKey: ["/api/transportation-routes"],
    queryFn: async () => {
      const response = await fetch("/api/transportation-routes?activeOnly=true");
      if (!response.ok) {
        throw new Error("Failed to fetch routes");
      }
      return response.json();
    }
  });

  // Filtered students based on the selected tab
  const filteredStudents = students.filter((student: Student) => {
    if (currentTab === "all") return true;
    if (currentTab === "transportation") return student.transportationRouteId !== null;
    // Add more filters as needed
    return true;
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: StudentFormValues) => apiRequest("POST", "/api/students", data),
    onSuccess: () => {
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data: StudentFormValues) => {
      if (!selectedStudent) {
        throw new Error("No student selected for update");
      }
      return apiRequest("PUT", `/api/students/${selectedStudent.id}`, data);
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: () => {
      if (!selectedStudent) {
        throw new Error("No student selected for deletion");
      }
      return apiRequest("DELETE", `/api/students/${selectedStudent.id}`);
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  // Reset form when opening add dialog
  const handleAddDialogOpen = () => {
    form.reset({
      admissionNumber: "",
      studentName: "",
      grade: "",
      section: "",
      rollNumber: 0,
      parentName: "",
      contactNumber: "",
      email: "",
      feeCategory: "Regular",
      transportationRouteId: 0,
      pickupPoint: "",
      admissionDate: format(new Date(), "yyyy-MM-dd"),
    });
    setIsAddDialogOpen(true);
  };

  // Set form values when editing a student
  const handleEditDialogOpen = (student: Student) => {
    setSelectedStudent(student);
    form.reset({
      admissionNumber: student.admissionNumber,
      studentName: student.studentName,
      grade: student.grade,
      section: student.section,
      rollNumber: student.rollNumber,
      parentName: student.parentName,
      contactNumber: student.contactNumber,
      email: student.email || "",
      feeCategory: student.feeCategory,
      transportationRouteId: student.transportationRouteId || 0,
      pickupPoint: student.pickupPoint || "",
      admissionDate: student.admissionDate,
    });
    setIsEditDialogOpen(true);
  };

  // Set selected student when deleting
  const handleDeleteDialogOpen = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  // Form submission handler
  const onSubmit = (data: StudentFormValues) => {
    if (isEditDialogOpen) {
      updateStudentMutation.mutate(data);
    } else {
      createStudentMutation.mutate(data);
    }
  };

  // Get grades array from the fetched students for filter dropdown
  const getGrades = () => {
    const gradesSet = new Set<string>();
    students.forEach((student: Student) => gradesSet.add(student.grade));
    return Array.from(gradesSet).sort();
  };

  // Get route name from route ID
  const getRouteName = (routeId: number | null) => {
    if (!routeId) return null;
    const route = routes.find((r: RouteType) => r.id === routeId);
    return route ? route.routeName : "Unknown";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Add and manage student records, view student details</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddDialogOpen}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the student's details for admission. Required fields are marked with an asterisk (*).
              </DialogDescription>
            </DialogHeader>
            <StudentForm 
              form={form} 
              onSubmit={onSubmit} 
              isSubmitting={createStudentMutation.isPending}
              routes={routes}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or admission number"
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setFilterGrade("all");
          }}>
            Clear Filters
          </Button>
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="all" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto">
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="transportation">Using Transportation</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyStudentsList onAddStudent={handleAddDialogOpen} searchActive={!!searchQuery || (filterGrade !== "all")} />
          ) : (
            <StudentsTable 
              students={filteredStudents} 
              onEdit={handleEditDialogOpen} 
              onDelete={handleDeleteDialogOpen}
              getRouteName={getRouteName}
            />
          )}
        </TabsContent>
        
        <TabsContent value="transportation" className="mt-4">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading transportation students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyStudentsList 
              onAddStudent={handleAddDialogOpen} 
              message="No students using transportation found"
              searchActive={!!searchQuery || (filterGrade !== "all")}
            />
          ) : (
            <StudentsTable 
              students={filteredStudents} 
              onEdit={handleEditDialogOpen} 
              onDelete={handleDeleteDialogOpen}
              getRouteName={getRouteName}
              showTransportationDetails
            />
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-4">
          <StudentsTable 
            students={filteredStudents.sort((a: Student, b: Student) => 
              new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime()
            ).slice(0, 10)} 
            onEdit={handleEditDialogOpen} 
            onDelete={handleDeleteDialogOpen}
            getRouteName={getRouteName}
            showAdmissionDate
          />
        </TabsContent>
        
        <TabsContent value="statistics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Students"
              value={students.length.toString()}
              icon={<User className="h-5 w-5" />}
            />
            <StatCard
              title="Transportation Users"
              value={students.filter((s: Student) => s.transportationRouteId !== null).length.toString()}
              icon={<User className="h-5 w-5" />}
            />
            <StatCard
              title="Recently Added"
              value={students.filter((s: Student) => 
                new Date(s.admissionDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length.toString()}
              description="Last 30 days"
              icon={<User className="h-5 w-5" />}
            />
          </div>
          
          <div className="mt-6 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {getGrades().map(grade => {
                const count = students.filter((s: Student) => s.grade === grade).length;
                return (
                  <Card key={grade} className="text-center p-2">
                    <h4 className="font-medium">Grade {grade}</h4>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update the student's information. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          <StudentForm 
            form={form} 
            onSubmit={onSubmit} 
            isSubmitting={updateStudentMutation.isPending}
            isEditing
            routes={routes}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudent?.studentName}'s record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting this student will remove all associated fee records, receipts, and other data.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteStudentMutation.mutate()}
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for student form (used in both add and edit dialogs)
function StudentForm({ 
  form, 
  onSubmit, 
  isSubmitting,
  isEditing = false,
  routes = []
}: { 
  form: any;
  onSubmit: (values: StudentFormValues) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  routes: RouteType[];
}) {
  const grades = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D"];
  const feeCategories = ["Regular", "RTE", "Staff", "Scholarship"];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="admissionNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Number*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., ADM2023001" 
                      {...field} 
                      disabled={isEditing} // Disable editing admission number
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name of student" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade*</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grades.map(grade => (
                          <SelectItem key={grade} value={grade}>
                            {grade === "Nursery" || grade === "LKG" || grade === "UKG" 
                              ? grade 
                              : `Grade ${grade}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map(section => (
                          <SelectItem key={section} value={section}>
                            Section {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rollNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number*</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 12" 
                      {...field} 
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="admissionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Date*</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="parentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent/Guardian Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name of parent/guardian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="parent@example.com" type="email" {...field} />
                  </FormControl>
                  <FormDescription>Optional email address for communications</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feeCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Category*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transportationRouteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transportation Route</FormLabel>
                  <Select 
                    value={field.value ? field.value.toString() : "0"}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transportation route" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {routes.map(route => (
                        <SelectItem key={route.id} value={route.id.toString()}>
                          {route.routeName} (₹{route.fare})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Optional transportation route assignment</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Point</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Near Green Park" {...field} />
                  </FormControl>
                  <FormDescription>Optional pickup location details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Adding...") 
              : (isEditing ? "Update Student" : "Add Student")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Component for students table
function StudentsTable({ 
  students,
  onEdit,
  onDelete,
  getRouteName,
  showAdmissionDate = false,
  showTransportationDetails = false
}: { 
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  getRouteName: (routeId: number | null) => string | null;
  showAdmissionDate?: boolean;
  showTransportationDetails?: boolean;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adm. No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Roll No.</TableHead>
              <TableHead>Parent/Guardian</TableHead>
              <TableHead>Contact</TableHead>
              {showAdmissionDate && <TableHead>Admission Date</TableHead>}
              {showTransportationDetails && <TableHead>Transportation</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                <TableCell>{student.studentName}</TableCell>
                <TableCell>
                  {student.grade}-{student.section}
                  {student.feeCategory !== "Regular" && (
                    <Badge variant="outline" className="ml-2">
                      {student.feeCategory}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.parentName}</TableCell>
                <TableCell>{student.contactNumber}</TableCell>
                {showAdmissionDate && (
                  <TableCell>
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </TableCell>
                )}
                {showTransportationDetails && (
                  <TableCell>
                    {student.transportationRouteId ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {getRouteName(student.transportationRouteId)}
                        </span>
                        {student.pickupPoint && (
                          <span className="text-xs text-muted-foreground">
                            Pickup: {student.pickupPoint}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(student)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        // Using Link component would be better, but for simplicity
                        window.location.href = `/generate-receipt?student=${student.id}`;
                      }}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Generate Receipt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(student)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Component for empty state
function EmptyStudentsList({ 
  onAddStudent, 
  message = "No students found", 
  searchActive = false 
}: { 
  onAddStudent: () => void;
  message?: string;
  searchActive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed rounded-lg py-12">
      <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">{message}</h3>
      
      {searchActive ? (
        <p className="text-muted-foreground text-center max-w-md mt-2">
          Try adjusting your search or filter criteria to find what you're looking for.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            Get started by adding your first student record to the system.
          </p>
          <Button onClick={onAddStudent} className="mt-4">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </>
      )}
    </div>
  );
}

// Component for statistic cards
function StatCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
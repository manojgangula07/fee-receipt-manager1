import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { GRADES, FEE_TYPES } from '@shared/schema';
import { Loader2, PlusCircle, Edit, Trash } from 'lucide-react';

const feeStructureSchema = z.object({
  grade: z.string({
    required_error: "Please select a grade",
  }),
  feeType: z.string({
    required_error: "Please select a fee type",
  }),
  amount: z.coerce.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive("Amount must be positive"),
  frequency: z.string({
    required_error: "Please select a frequency",
  }),
  dueDay: z.coerce.number({
    required_error: "Due day is required",
    invalid_type_error: "Due day must be a number",
  }).min(1, "Due day must be between 1 and 31").max(31, "Due day must be between 1 and 31"),
});

type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;

export default function FeeStructure() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeeStructureFormValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      grade: '',
      feeType: '',
      amount: 0,
      frequency: '',
      dueDay: 10,
    },
  });

  // Fetch fee structure data
  const { data: feeStructure, isLoading } = useQuery({
    queryKey: ['/api/fee-structure'],
  });

  // Create mutation
  const createFeeMutation = useMutation({
    mutationFn: (data: FeeStructureFormValues) => 
      apiRequest('POST', '/api/fee-structure', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fee-structure'] });
      toast({
        title: 'Success',
        description: 'Fee structure item created successfully',
      });
      reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create fee structure item',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateFeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FeeStructureFormValues> }) => 
      apiRequest('PUT', `/api/fee-structure/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fee-structure'] });
      toast({
        title: 'Success',
        description: 'Fee structure item updated successfully',
      });
      reset();
      setEditingFee(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update fee structure item',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteFeeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/fee-structure/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fee-structure'] });
      toast({
        title: 'Success',
        description: 'Fee structure item deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete fee structure item',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FeeStructureFormValues) => {
    if (editingFee) {
      updateFeeMutation.mutate({ id: editingFee.id, data });
    } else {
      createFeeMutation.mutate(data);
    }
  };

  const handleEditFee = (fee: any) => {
    setEditingFee(fee);
    setValue('grade', fee.grade);
    setValue('feeType', fee.feeType);
    setValue('amount', fee.amount);
    setValue('frequency', fee.frequency);
    setValue('dueDay', fee.dueDay);
    setIsDialogOpen(true);
  };

  const handleDeleteFee = (id: number) => {
    if (confirm('Are you sure you want to delete this fee structure item?')) {
      deleteFeeMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingFee(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingFee(null);
    reset();
  };

  // Filter fee structure by grade
  const filteredFeeStructure = feeStructure?.filter((fee: any) => 
    selectedGrade === 'all' || fee.grade === selectedGrade
  );

  // Group fee structure by grade for the grade-wise view
  const feeStructureByGrade = feeStructure?.reduce((acc: any, fee: any) => {
    if (!acc[fee.grade]) {
      acc[fee.grade] = [];
    }
    acc[fee.grade].push(fee);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Fee Structure Management</CardTitle>
              <CardDescription>Configure and manage fee structure for all classes</CardDescription>
            </div>
            <Button 
              className="mt-4 md:mt-0" 
              onClick={handleAddNew}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Fee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list-view">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list-view">List View</TabsTrigger>
              <TabsTrigger value="grade-view">Grade-wise View</TabsTrigger>
            </TabsList>

            <TabsContent value="list-view" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="grade-filter">Filter by Grade</Label>
                <Select
                  value={selectedGrade}
                  onValueChange={setSelectedGrade}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade === 'KG' ? 'Kindergarten' : `Class ${grade}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading fee structure...</span>
                </div>
              ) : filteredFeeStructure?.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No fee structure items found. Add a new item to get started.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount (₹)</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Due Day</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeeStructure?.map((fee: any) => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.grade === 'KG' ? 'Kindergarten' : `Class ${fee.grade}`}</TableCell>
                          <TableCell>{fee.feeType}</TableCell>
                          <TableCell>{fee.amount ? fee.amount.toFixed(2) : '0.00'}</TableCell>
                          <TableCell>{fee.frequency}</TableCell>
                          <TableCell>{fee.dueDay}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditFee(fee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteFee(fee.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="grade-view" className="space-y-8 mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading fee structure...</span>
                </div>
              ) : !feeStructureByGrade || Object.keys(feeStructureByGrade).length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No fee structure items found. Add a new item to get started.</p>
                </div>
              ) : (
                GRADES.map((grade) => 
                  feeStructureByGrade[grade] ? (
                    <Card key={grade}>
                      <CardHeader>
                        <CardTitle>{grade === 'KG' ? 'Kindergarten' : `Class ${grade}`}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fee Type</TableHead>
                                <TableHead>Amount (₹)</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Due Day</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {feeStructureByGrade[grade].map((fee: any) => (
                                <TableRow key={fee.id}>
                                  <TableCell>{fee.feeType}</TableCell>
                                  <TableCell>{fee.amount ? fee.amount.toFixed(2) : '0.00'}</TableCell>
                                  <TableCell>{fee.frequency}</TableCell>
                                  <TableCell>{fee.dueDay}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditFee(fee)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteFee(fee.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null
                )
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFee ? 'Edit Fee Structure' : 'Add New Fee Structure'}</DialogTitle>
            <DialogDescription>
              {editingFee 
                ? 'Update the fee structure details below.' 
                : 'Enter the details for the new fee structure.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  onValueChange={(value) => setValue('grade', value)}
                  defaultValue={editingFee?.grade || ''}
                >
                  <SelectTrigger className={errors.grade ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade === 'KG' ? 'Kindergarten' : `Class ${grade}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && (
                  <p className="text-xs text-red-500">{errors.grade.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <Select
                  onValueChange={(value) => setValue('feeType', value)}
                  defaultValue={editingFee?.feeType || ''}
                >
                  <SelectTrigger className={errors.feeType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TYPES.map((feeType) => (
                      <SelectItem key={feeType} value={feeType}>{feeType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.feeType && (
                  <p className="text-xs text-red-500">{errors.feeType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                {...register('amount')}
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  onValueChange={(value) => setValue('frequency', value)}
                  defaultValue={editingFee?.frequency || ''}
                >
                  <SelectTrigger className={errors.frequency ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="One-time">One-time</SelectItem>
                    <SelectItem value="Term">Term</SelectItem>
                  </SelectContent>
                </Select>
                {errors.frequency && (
                  <p className="text-xs text-red-500">{errors.frequency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDay">Due Day</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Enter due day"
                  {...register('dueDay')}
                  className={errors.dueDay ? "border-red-500" : ""}
                />
                {errors.dueDay && (
                  <p className="text-xs text-red-500">{errors.dueDay.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
              >
                {createFeeMutation.isPending || updateFeeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingFee ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingFee ? 'Update Fee' : 'Add Fee'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
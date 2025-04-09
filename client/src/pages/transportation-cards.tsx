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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Bus, 
  MapPin, 
  Printer, 
  Tag, 
  User, 
  CreditCard, 
  CalendarRange, 
  ArrowRight, 
  Clock, 
  FileSpreadsheet,
  RefreshCw
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { TransportationRoute, Student } from '../../shared/schema';

type StudentWithTransport = Student & { 
  routeName?: string;
  fare?: number;
  issueDate?: string;
  validUntil?: string;
  cardNumber?: string;
  cardStatus?: 'Active' | 'Suspended' | 'Expired'; 
};

// Mock data for transportation cards (this would come from the API in a real implementation)
const CARD_MOCK_DATA: Record<number, { 
  cardNumber: string, 
  issueDate: string, 
  validUntil: string,
  cardStatus: 'Active' | 'Suspended' | 'Expired'
}> = {
  1: { 
    cardNumber: 'TC0001', 
    issueDate: '2023-07-01', 
    validUntil: '2024-06-30', 
    cardStatus: 'Active' 
  },
  2: { 
    cardNumber: 'TC0002', 
    issueDate: '2023-07-01', 
    validUntil: '2024-06-30', 
    cardStatus: 'Active' 
  },
  3: { 
    cardNumber: 'TC0003', 
    issueDate: '2023-07-01', 
    validUntil: '2023-12-31', 
    cardStatus: 'Expired' 
  },
  4: { 
    cardNumber: 'TC0004', 
    issueDate: '2023-07-01', 
    validUntil: '2024-06-30', 
    cardStatus: 'Suspended' 
  },
  5: { 
    cardNumber: 'TC0005', 
    issueDate: '2023-07-01', 
    validUntil: '2024-06-30', 
    cardStatus: 'Active' 
  },
};

export default function TransportationCardsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCardStudent, setSelectedCardStudent] = useState<StudentWithTransport | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('2025-06-30');
  
  // Fetch routes
  const { data: routes = [] } = useQuery<TransportationRoute[]>({
    queryKey: ['/api/transportation-routes'],
  });

  // Fetch students using transportation
  const { data: allStudents = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Enhance student data with transportation information
  const students: StudentWithTransport[] = allStudents
    .filter(student => student.transportationRouteId !== null)
    .map(student => {
      const route = routes.find(r => r.id === student.transportationRouteId);
      const cardData = CARD_MOCK_DATA[student.id] || {
        cardNumber: `TC${student.id.toString().padStart(4, '0')}`,
        issueDate: '2023-07-01',
        validUntil: '2024-06-30',
        cardStatus: 'Active' as const
      };
      
      return {
        ...student,
        routeName: route?.routeName || 'Unknown Route',
        fare: route?.fare || 0,
        ...cardData
      };
    });

  // Filter students based on search query and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.cardNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (student.routeName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesRoute = filterRoute === 'all' || 
      student.transportationRouteId?.toString() === filterRoute;
    
    const matchesStatus = filterStatus === 'all' || 
      student.cardStatus === filterStatus;
    
    return matchesSearch && matchesRoute && matchesStatus;
  });

  // Group students by route for route-based view
  const studentsByRoute: Record<string, StudentWithTransport[]> = {};
  filteredStudents.forEach(student => {
    const routeId = student.transportationRouteId?.toString() || 'unknown';
    if (!studentsByRoute[routeId]) {
      studentsByRoute[routeId] = [];
    }
    studentsByRoute[routeId].push(student);
  });

  // Calculate statistics
  const activeCards = students.filter(s => s.cardStatus === 'Active').length;
  const suspendedCards = students.filter(s => s.cardStatus === 'Suspended').length;
  const expiredCards = students.filter(s => s.cardStatus === 'Expired').length;

  // View transportation card
  const handleViewCard = (student: StudentWithTransport) => {
    setSelectedCardStudent(student);
    setIsCardDialogOpen(true);
  };

  // Handle renew card
  const handleRenewCard = (student: StudentWithTransport) => {
    setSelectedCardStudent(student);
    setIsRenewDialogOpen(true);
  };

  // Complete renewal
  const completeRenewal = () => {
    toast({
      title: "Card Renewed",
      description: `Transportation card for ${selectedCardStudent?.studentName} renewed until ${newExpiryDate}.`,
    });
    setIsRenewDialogOpen(false);
  };

  // Toggle card status (suspend/activate)
  const toggleCardStatus = (student: StudentWithTransport) => {
    const newStatus = student.cardStatus === 'Active' ? 'Suspended' : 'Active';
    toast({
      title: `Card ${newStatus}`,
      description: `Transportation card for ${student.studentName} has been ${newStatus.toLowerCase()}.`,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transportation Cards</h1>
        <p className="text-muted-foreground">
          Manage student transportation cards, renewals, and status
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading transportation data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  {students.length}
                </CardTitle>
                <CardDescription>Total Cards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Students using transportation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-green-600">
                  {activeCards}
                </CardTitle>
                <CardDescription>Active Cards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Currently valid and active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-amber-600">
                  {suspendedCards}
                </CardTitle>
                <CardDescription>Suspended Cards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Temporarily deactivated
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-red-600">
                  {expiredCards}
                </CardTitle>
                <CardDescription>Expired Cards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Require renewal
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, card number or route"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterRoute} onValueChange={setFilterRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id.toString()}>
                      {route.routeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-muted-foreground">
                  Showing {filteredStudents.length} of {students.length} transportation cards
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setFilterRoute("all");
                  setFilterStatus("all");
                }}>
                  Clear Filters
                </Button>
                
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Batch Renewal Initiated",
                    description: "Renewal process started for all expired cards.",
                  });
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Batch Renew
                </Button>
                
                <Button variant="outline" onClick={() => {
                  window.print();
                }}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print All Cards
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="cards">Card View</TabsTrigger>
              <TabsTrigger value="routes">Route View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cards" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{student.studentName}</CardTitle>
                        <Badge variant={
                          student.cardStatus === 'Active' ? 'default' :
                          student.cardStatus === 'Suspended' ? 'outline' :
                          'destructive'
                        }>
                          {student.cardStatus}
                        </Badge>
                      </div>
                      <CardDescription>
                        {student.grade}-{student.section} | {student.admissionNumber}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 flex-1">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Card:</span>
                          <span className="ml-auto font-medium">{student.cardNumber}</span>
                        </div>
                        <div className="flex items-center">
                          <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Route:</span>
                          <span className="ml-auto font-medium">{student.routeName}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Pickup:</span>
                          <span className="ml-auto font-medium truncate max-w-[120px]" title={student.pickupPoint || ''}>
                            {student.pickupPoint || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Valid Until:</span>
                          <span className="ml-auto font-medium">
                            {new Date(student.validUntil || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => handleViewCard(student)}>
                        View Card
                      </Button>
                      <div className="flex gap-1">
                        {student.cardStatus === 'Expired' ? (
                          <Button variant="default" size="sm" onClick={() => handleRenewCard(student)}>
                            Renew
                          </Button>
                        ) : (
                          <Button 
                            variant={student.cardStatus === 'Active' ? 'destructive' : 'default'} 
                            size="sm" 
                            onClick={() => toggleCardStatus(student)}
                          >
                            {student.cardStatus === 'Active' ? 'Suspend' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {filteredStudents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No transportation cards found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || filterRoute !== 'all' || filterStatus !== 'all' ? 
                      "Try adjusting your search or filter criteria." : 
                      "There are no students using transportation service."}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="routes" className="space-y-6 mt-6">
              {Object.keys(studentsByRoute).length > 0 ? (
                routes
                  .filter(route => studentsByRoute[route.id.toString()])
                  .map((route) => {
                    const routeStudents = studentsByRoute[route.id.toString()] || [];
                    return (
                      <Card key={route.id}>
                        <CardHeader>
                          <CardTitle>
                            <div className="flex items-center">
                              <Bus className="h-5 w-5 mr-2" />
                              {route.routeName}
                              <Badge variant="outline" className="ml-2">
                                {routeStudents.length} students
                              </Badge>
                            </div>
                          </CardTitle>
                          <CardDescription>
                            Fare: ₹{route.fare} | {route.description || 'No description'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {routeStudents.map((student) => (
                              <div key={student.id} className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{student.studentName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Grade {student.grade}-{student.section} | Pickup: {student.pickupPoint || 'Not specified'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={
                                    student.cardStatus === 'Active' ? 'default' :
                                    student.cardStatus === 'Suspended' ? 'outline' :
                                    'destructive'
                                  } className="ml-2">
                                    {student.cardStatus}
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewCard(student)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              Driver: {route.id === 1 ? 'Mr. Kumar (9876543210)' : 'Not Assigned'}
                            </span>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "Route Sheet Generated",
                                description: `Student list for ${route.routeName} has been exported.`,
                              });
                            }}
                          >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export Route Sheet
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No routes found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || filterRoute !== 'all' || filterStatus !== 'all' ? 
                      "Try adjusting your search or filter criteria." : 
                      "There are no active transportation routes."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* View Card Dialog */}
          <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Transportation Card</DialogTitle>
                <DialogDescription>
                  Student transportation card details
                </DialogDescription>
              </DialogHeader>
              
              {selectedCardStudent && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-6 space-y-4 bg-gradient-to-br from-primary/5 to-primary/20">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">
                          {selectedCardStudent.schoolName || 'ABC School'}
                        </h3>
                        <p className="text-sm text-muted-foreground">Transportation Card</p>
                      </div>
                      <div className="bg-primary text-white text-xs font-bold p-1 rounded">
                        {selectedCardStudent.academicYear || '2023-24'}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Student</p>
                        <p className="font-medium">{selectedCardStudent.studentName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Grade</p>
                        <p className="font-medium">{selectedCardStudent.grade}-{selectedCardStudent.section}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Card Number</p>
                        <p className="font-medium">{selectedCardStudent.cardNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge variant={
                          selectedCardStudent.cardStatus === 'Active' ? 'default' :
                          selectedCardStudent.cardStatus === 'Suspended' ? 'outline' :
                          'destructive'
                        }>
                          {selectedCardStudent.cardStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Route: {selectedCardStudent.routeName}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Pickup Point: {selectedCardStudent.pickupPoint || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Pickup Time: {selectedCardStudent.pickupTime || '7:30 AM'}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Issued On</p>
                        <p className="font-medium">{new Date(selectedCardStudent.issueDate || '').toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Valid Until</p>
                        <p className="font-medium">{new Date(selectedCardStudent.validUntil || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground italic">This card must be carried during transportation</p>
                    </div>
                  </div>
                
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Card
                    </Button>
                    
                    {selectedCardStudent.cardStatus === 'Expired' ? (
                      <Button onClick={() => {
                        setIsCardDialogOpen(false);
                        handleRenewCard(selectedCardStudent);
                      }}>
                        Renew Card
                      </Button>
                    ) : (
                      <Button 
                        variant={selectedCardStudent.cardStatus === 'Active' ? 'destructive' : 'default'}
                        onClick={() => {
                          toggleCardStatus(selectedCardStudent);
                          setIsCardDialogOpen(false);
                        }}
                      >
                        {selectedCardStudent.cardStatus === 'Active' ? 'Suspend Card' : 'Activate Card'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Renew Card Dialog */}
          <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Renew Transportation Card</DialogTitle>
                <DialogDescription>
                  Extend the validity of the transportation card
                </DialogDescription>
              </DialogHeader>
              
              {selectedCardStudent && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <div className="flex items-center p-2 border rounded-md">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedCardStudent.studentName}</span>
                      <Badge className="ml-auto">{selectedCardStudent.grade}-{selectedCardStudent.section}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Current Card Details</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-2 border rounded-md space-y-1">
                        <p className="text-xs text-muted-foreground">Card Number</p>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedCardStudent.cardNumber}</span>
                        </div>
                      </div>
                      <div className="p-2 border rounded-md space-y-1">
                        <p className="text-xs text-muted-foreground">Current Status</p>
                        <div className="flex items-center">
                          <Badge variant="destructive">Expired</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Validity</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-2 border rounded-md space-y-1">
                        <p className="text-xs text-muted-foreground">Current Expiry</p>
                        <div className="flex items-center">
                          <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{new Date(selectedCardStudent.validUntil || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-expiry" className="text-xs text-muted-foreground">New Expiry Date</Label>
                        <Input 
                          id="new-expiry" 
                          type="date" 
                          value={newExpiryDate} 
                          onChange={(e) => setNewExpiryDate(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Information</Label>
                    <div className="p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <span>Annual Transportation Fee:</span>
                        <span className="font-bold">₹{selectedCardStudent.fare ? selectedCardStudent.fare * 12 : 18000}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <span>Card Renewal Fee:</span>
                        <span>₹100</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between font-bold">
                        <span>Total Due:</span>
                        <span>₹{selectedCardStudent.fare ? selectedCardStudent.fare * 12 + 100 : 18100}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={completeRenewal}>
                  Complete Renewal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Icons
import { Edit, Trash2, Map, Plus, Users, LocateFixed, Banknote, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Create a schema for route validation
const routeSchema = z.object({
  routeName: z.string().min(3, {
    message: "Route name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  distance: z.coerce.number().positive({
    message: "Distance must be a positive number.",
  }).optional(),
  fare: z.coerce.number().positive({
    message: "Fare must be a positive number.",
  }),
  isActive: z.boolean().default(true),
});

type RouteType = {
  id: number;
  routeName: string;
  description: string | null;
  distance: number | null;
  fare: number;
  isActive: boolean;
  createdAt: string;
};

type RouteStudentType = {
  id: number;
  admissionNumber: string;
  studentName: string;
  grade: string;
  section: string;
  pickupPoint: string | null;
};

export default function TransportationRoutes() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [isViewStudentsDialogOpen, setIsViewStudentsDialogOpen] = useState(false);

  // Query to fetch all routes
  const { data: routes = [], isLoading } = useQuery<RouteType[]>({
    queryKey: ['/api/transportation-routes'],
    // Use the default query function that's setup to handle GET requests
  });

  // Query to fetch students for a specific route when viewing
  const { data: routeStudents = [], isLoading: isLoadingStudents } = useQuery<RouteStudentType[]>({
    queryKey: [`/api/transportation-routes/${selectedRoute?.id}/students`],
    // Only enable the query when the dialog is open and a route is selected
    enabled: isViewStudentsDialogOpen && !!selectedRoute,
  });

  // Form for creating/editing routes
  const form = useForm<z.infer<typeof routeSchema>>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      routeName: "",
      description: "",
      distance: undefined,
      fare: undefined,
      isActive: true,
    },
  });

  // Reset form when opening add dialog
  const handleAddDialogOpen = () => {
    form.reset({
      routeName: "",
      description: "",
      distance: undefined,
      fare: undefined,
      isActive: true,
    });
    setIsAddDialogOpen(true);
  };

  // Set form values when editing
  const handleEditDialogOpen = (route: RouteType) => {
    setSelectedRoute(route);
    form.reset({
      routeName: route.routeName,
      description: route.description || "",
      distance: route.distance || undefined,
      fare: route.fare,
      isActive: route.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Set selected route when deleting
  const handleDeleteDialogOpen = (route: RouteType) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };

  // Set selected route when viewing students
  const handleViewStudentsDialogOpen = (route: RouteType) => {
    setSelectedRoute(route);
    setIsViewStudentsDialogOpen(true);
  };

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: (values: z.infer<typeof routeSchema>) => 
      apiRequest('POST', '/api/transportation-routes', values),
    onSuccess: () => {
      // Invalidate all transportation routes queries with any query parameter
      queryClient.invalidateQueries({ 
        queryKey: [`/api/transportation-routes`],
        predicate: (query) => query.queryKey[0].toString().startsWith('/api/transportation-routes')
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Transportation route created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transportation route",
        variant: "destructive",
      });
    },
  });

  // Update route mutation
  const updateRouteMutation = useMutation({
    mutationFn: (values: z.infer<typeof routeSchema>) => 
      apiRequest('PUT', `/api/transportation-routes/${selectedRoute?.id}`, values),
    onSuccess: () => {
      // Invalidate all transportation routes queries with any query parameter
      queryClient.invalidateQueries({ 
        queryKey: [`/api/transportation-routes`],
        predicate: (query) => query.queryKey[0].toString().startsWith('/api/transportation-routes')
      });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Transportation route updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transportation route",
        variant: "destructive",
      });
    },
  });

  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: () => 
      apiRequest('DELETE', `/api/transportation-routes/${selectedRoute?.id}`),
    onSuccess: () => {
      // Invalidate all transportation routes queries with any query parameter
      queryClient.invalidateQueries({ 
        queryKey: [`/api/transportation-routes`],
        predicate: (query) => String(query.queryKey[0]).startsWith('/api/transportation-routes')
      });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Transportation route deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transportation route. It may be assigned to students.",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (values: z.infer<typeof routeSchema>) => {
    if (isEditDialogOpen) {
      updateRouteMutation.mutate(values);
    } else {
      createRouteMutation.mutate(values);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transportation Routes</h1>
          <p className="text-muted-foreground">Manage transportation routes and associated fees</p>
        </div>
        <div className="flex items-center gap-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddDialogOpen}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Route
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Transportation Route</DialogTitle>
                  <DialogDescription>
                    Create a new transportation route with pricing details.
                  </DialogDescription>
                </DialogHeader>

                <RouteForm 
                  form={form} 
                  onSubmit={onSubmit} 
                  isSubmitting={createRouteMutation.isPending}
                />
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading transportation routes...</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border border-dashed rounded-lg">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Routes Found</h3>
          <p className="text-muted-foreground">
            No transportation routes found. Add a new route to get started.
          </p>
          <Button onClick={handleAddDialogOpen} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Route
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <RouteCard 
              key={route.id} 
              route={route} 
              onEdit={handleEditDialogOpen}
              onDelete={handleDeleteDialogOpen}
              onViewStudents={handleViewStudentsDialogOpen}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Transportation Route</DialogTitle>
            <DialogDescription>
              Update the details for this transportation route.
            </DialogDescription>
          </DialogHeader>

          <RouteForm 
            form={form} 
            onSubmit={onSubmit} 
            isSubmitting={updateRouteMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the route "{selectedRoute?.routeName}"? 
              This action cannot be undone. Routes assigned to students cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteRouteMutation.mutate()}
              disabled={deleteRouteMutation.isPending}
            >
              {deleteRouteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Students Dialog */}
      <Dialog open={isViewStudentsDialogOpen} onOpenChange={setIsViewStudentsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Students on {selectedRoute?.routeName}</DialogTitle>
            <DialogDescription>
              Students currently assigned to this transportation route.
            </DialogDescription>
          </DialogHeader>

          {isLoadingStudents ? (
            <div className="py-4 text-center">Loading students...</div>
          ) : routeStudents.length === 0 ? (
            <div className="py-6 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No students are currently assigned to this route.</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Admission Number</th>
                    <th className="text-left py-2 px-3">Student Name</th>
                    <th className="text-left py-2 px-3">Grade</th>
                    <th className="text-left py-2 px-3">Pickup Point</th>
                  </tr>
                </thead>
                <tbody>
                  {routeStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">{student.admissionNumber}</td>
                      <td className="py-2 px-3">{student.studentName}</td>
                      <td className="py-2 px-3">{student.grade}-{student.section}</td>
                      <td className="py-2 px-3">{student.pickupPoint || "Not specified"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewStudentsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component for creating/editing routes
function RouteForm({ 
  form, 
  onSubmit, 
  isSubmitting 
}: { 
  form: any, 
  onSubmit: (values: z.infer<typeof routeSchema>) => void,
  isSubmitting: boolean 
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="routeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route Name*</FormLabel>
              <FormControl>
                <Input placeholder="e.g., North Zone" {...field} />
              </FormControl>
              <FormDescription>
                Provide a clear name for this transportation route.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Covers northern residential areas" {...field} />
              </FormControl>
              <FormDescription>
                Optional description of the route and areas covered.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="distance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance (km)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g., 5.2" 
                    {...field}
                    value={field.value === undefined ? "" : field.value} 
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fare"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fare Amount*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 1200" 
                    {...field}
                    value={field.value === undefined ? "" : field.value} 
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active Route</FormLabel>
                <FormDescription>
                  Inactive routes won't be available for new student assignments.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Card component for displaying a route
function RouteCard({ 
  route, 
  onEdit, 
  onDelete,
  onViewStudents
}: { 
  route: RouteType, 
  onEdit: (route: RouteType) => void,
  onDelete: (route: RouteType) => void,
  onViewStudents: (route: RouteType) => void
}) {
  return (
    <Card className={!route.isActive ? "opacity-70" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              {route.routeName}
            </CardTitle>
            {!route.isActive && <Badge variant="outline" className="mt-1">Inactive</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(route)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(route)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="line-clamp-2 h-10">
          {route.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <LocateFixed className="h-4 w-4 text-muted-foreground" />
            <span>{route.distance ? `${route.distance} km` : "Distance N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <span>₹{route.fare.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => onViewStudents(route)}>
          <Users className="mr-2 h-4 w-4" />
          View Students
        </Button>
      </CardFooter>
    </Card>
  );
}
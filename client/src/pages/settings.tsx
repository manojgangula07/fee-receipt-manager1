import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Mail, 
  Building, 
  Edit, 
  Trash2, 
  UserPlus, 
  Save, 
  RefreshCw,
  FileText,
  Printer,
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define types for our settings
type User = {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: 'admin' | 'teacher' | 'staff';
  lastLogin: string;
  createdAt: string;
  isActive: boolean;
};

type SchoolSettings = {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  logo: string | null;
  receiptPrefix: string;
  academicYear: string;
  currentTerm: string;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableAutomaticReminders: boolean;
  reminderDays: number;
  taxPercentage: number;
  receiptFooterText: string;
  receiptCopies: number;
  theme: 'light' | 'dark' | 'system';
};

// Mock users
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Administrator',
    email: 'admin@school.com',
    role: 'admin',
    lastLogin: '2023-08-15T09:30:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 2,
    username: 'jsmith',
    fullName: 'John Smith',
    email: 'john.smith@school.com',
    role: 'teacher',
    lastLogin: '2023-08-14T13:45:00Z',
    createdAt: '2023-01-15T00:00:00Z',
    isActive: true
  },
  {
    id: 3,
    username: 'mwilliams',
    fullName: 'Mary Williams',
    email: 'mary.williams@school.com',
    role: 'staff',
    lastLogin: '2023-08-10T11:20:00Z',
    createdAt: '2023-02-10T00:00:00Z',
    isActive: false
  }
];

// Mock initial system settings
const initialSettings: SchoolSettings = {
  schoolName: 'ABC School',
  address: '123 School Street, City, State, ZIP',
  phone: '123-456-7890',
  email: 'info@abcschool.com',
  website: 'www.abcschool.com',
  principalName: 'Dr. Jane Principal',
  logo: null,
  receiptPrefix: 'REC',
  academicYear: '2023-2024',
  currentTerm: 'Term 1',
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  enableAutomaticReminders: true,
  reminderDays: 3,
  taxPercentage: 0,
  receiptFooterText: 'Thank you for your payment. This is a computer-generated receipt and requires no signature.',
  receiptCopies: 2,
  theme: 'light'
};

// Form schemas
const schoolDetailsSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().optional(),
  principalName: z.string().min(1, "Principal name is required"),
  receiptPrefix: z.string().min(1, "Receipt prefix is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  currentTerm: z.string().min(1, "Current term is required"),
  taxPercentage: z.number().min(0).max(100),
  receiptFooterText: z.string().optional(),
  receiptCopies: z.number().min(1).max(5)
});

const notificationSettingsSchema = z.object({
  enableEmailNotifications: z.boolean(),
  enableSMSNotifications: z.boolean(),
  enableAutomaticReminders: z.boolean(),
  reminderDays: z.number().min(1).max(30)
});

const newUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "teacher", "staff"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SchoolSettings>(initialSettings);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);

  // School details form
  const schoolDetailsForm = useForm<z.infer<typeof schoolDetailsSchema>>({
    resolver: zodResolver(schoolDetailsSchema),
    defaultValues: {
      schoolName: settings.schoolName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website || '',
      principalName: settings.principalName,
      receiptPrefix: settings.receiptPrefix,
      academicYear: settings.academicYear,
      currentTerm: settings.currentTerm,
      taxPercentage: settings.taxPercentage,
      receiptFooterText: settings.receiptFooterText,
      receiptCopies: settings.receiptCopies
    }
  });

  // Notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      enableEmailNotifications: settings.enableEmailNotifications,
      enableSMSNotifications: settings.enableSMSNotifications,
      enableAutomaticReminders: settings.enableAutomaticReminders,
      reminderDays: settings.reminderDays
    }
  });

  // New user form
  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: '',
      fullName: '',
      email: '',
      role: 'staff',
      password: '',
      confirmPassword: ''
    }
  });

  // Handle school details form submission
  const onSchoolDetailsSubmit = (data: z.infer<typeof schoolDetailsSchema>) => {
    setSettings({
      ...settings,
      ...data
    });
    
    toast({
      title: "Settings Saved",
      description: "School details have been updated successfully.",
    });
  };

  // Handle notification settings form submission
  const onNotificationSettingsSubmit = (data: z.infer<typeof notificationSettingsSchema>) => {
    setSettings({
      ...settings,
      ...data
    });
    
    toast({
      title: "Settings Saved",
      description: "Notification settings have been updated successfully.",
    });
  };

  // Handle new user form submission
  const onNewUserSubmit = (data: z.infer<typeof newUserSchema>) => {
    const newUser: User = {
      id: users.length + 1,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      lastLogin: '-',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    setUsers([...users, newUser]);
    setIsAddUserDialogOpen(false);
    newUserForm.reset();
    
    toast({
      title: "User Added",
      description: `${data.fullName} has been added successfully.`,
    });
  };

  // Toggle user active status
  const toggleUserStatus = (userId: number) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          isActive: !user.isActive
        };
      }
      return user;
    }));
    
    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: user.isActive ? "User Deactivated" : "User Activated",
        description: `${user.fullName} has been ${user.isActive ? 'deactivated' : 'activated'}.`,
      });
    }
  };

  // Delete user
  const deleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setUsers(users.filter(user => user.id !== userId));
    
    if (user) {
      toast({
        title: "User Deleted",
        description: `${user.fullName} has been deleted.`,
      });
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, you'd upload this to your server
      // For this demo, we'll just show a success message
      toast({
        title: "Logo Uploaded",
        description: "School logo has been updated successfully.",
      });
    }
  };

  // Handle theme change
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings({
      ...settings,
      theme
    });
    
    toast({
      title: "Theme Changed",
      description: `Application theme has been changed to ${theme}.`,
    });
  };

  // Handle backup creation
  const handleCreateBackup = () => {
    toast({
      title: "Backup Created",
      description: "Database backup has been created successfully.",
    });
    setIsBackupDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and manage user accounts
        </p>
      </div>

      <Tabs defaultValue="school">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="school">
            <Building className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">School Details</span>
          </TabsTrigger>
          <TabsTrigger value="users">
            <User className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">User Management</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>
        
        {/* School Details Tab */}
        <TabsContent value="school" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>
                Update your school's basic information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...schoolDetailsForm}>
                <form 
                  onSubmit={schoolDetailsForm.handleSubmit(onSchoolDetailsSubmit)} 
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={schoolDetailsForm.control}
                        name="schoolName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter school name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={schoolDetailsForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter school address" 
                                {...field} 
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={schoolDetailsForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={schoolDetailsForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter school email" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={schoolDetailsForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter website URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={schoolDetailsForm.control}
                          name="principalName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Principal Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter principal name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <Label>School Logo</Label>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted">
                            {settings.logo ? (
                              <img 
                                src={settings.logo} 
                                alt="School Logo" 
                                className="max-w-full max-h-full" 
                              />
                            ) : (
                              <Building className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              type="file"
                              accept="image/*"
                              id="logo-upload"
                              onChange={handleLogoUpload}
                              className="text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary file:text-white
                                hover:file:bg-primary/90"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload a square image (PNG or JPG) for best results
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={schoolDetailsForm.control}
                          name="academicYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Academic Year</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 2023-2024" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={schoolDetailsForm.control}
                          name="currentTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Term</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select term" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Term 1">Term 1</SelectItem>
                                  <SelectItem value="Term 2">Term 2</SelectItem>
                                  <SelectItem value="Term 3">Term 3</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator className="my-4" />
                      <h3 className="text-md font-medium">Receipt Settings</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={schoolDetailsForm.control}
                          name="receiptPrefix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Receipt Prefix</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., REC" {...field} />
                              </FormControl>
                              <FormDescription>
                                Used for receipt numbering (e.g., REC001)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={schoolDetailsForm.control}
                          name="taxPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Percentage (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="0.01"
                                  {...field}
                                  value={field.value}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave at 0 for tax-exempt institutions
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={schoolDetailsForm.control}
                        name="receiptCopies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Copies</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="5" 
                                {...field}
                                value={field.value}
                                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormDescription>
                              Number of receipt copies to print (school copy, student copy, etc.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={schoolDetailsForm.control}
                        name="receiptFooterText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Receipt Footer Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter text to appear at the bottom of receipts" 
                                {...field} 
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="mt-4">
                    <Save className="mr-2 h-4 w-4" />
                    Save School Details
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Add, edit, or remove users and manage access rights
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.role === 'admin' ? 'default' :
                              user.role === 'teacher' ? 'secondary' :
                              'outline'
                            }
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.isActive ? 'default' : 'destructive'}
                            className={`bg-${user.isActive ? 'green' : 'red'}-100 text-${user.isActive ? 'green' : 'red'}-800 border-${user.isActive ? 'green' : 'red'}-200`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin !== '-' 
                            ? new Date(user.lastLogin).toLocaleString() 
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleUserStatus(user.id)}
                              disabled={user.role === 'admin' && users.filter(u => u.role === 'admin' && u.isActive).length <= 1}
                            >
                              <Shield className={`h-4 w-4 ${user.isActive ? 'text-red-500' : 'text-green-500'}`} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                toast({
                                  title: "Edit User",
                                  description: "User editing will be available in the next update.",
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteUser(user.id)}
                              disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how notifications are sent to students and parents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form 
                  onSubmit={notificationForm.handleSubmit(onNotificationSettingsSubmit)} 
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="enableEmailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Send email notifications for fee receipts and reminders
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="enableSMSNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>SMS Notifications</FormLabel>
                            <FormDescription>
                              Send SMS notifications for fee receipts and reminders
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Separator className="my-4" />
                    
                    <FormField
                      control={notificationForm.control}
                      name="enableAutomaticReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Automatic Payment Reminders</FormLabel>
                            <FormDescription>
                              Automatically send reminders for upcoming and overdue payments
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {notificationForm.watch("enableAutomaticReminders") && (
                      <FormField
                        control={notificationForm.control}
                        name="reminderDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reminder Days Before Due Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="30" 
                                {...field}
                                value={field.value}
                                onChange={e => field.onChange(parseInt(e.target.value) || 3)}
                              />
                            </FormControl>
                            <FormDescription>
                              Send reminders this many days before the due date
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="rounded-lg border p-3">
                      <h3 className="font-medium mb-2">Test Notifications</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">Send a test email notification</p>
                            <p className="text-xs text-muted-foreground">
                              Check if your email configuration is working
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              toast({
                                title: "Test Email Sent",
                                description: "A test email has been sent to the administrator.",
                              });
                            }}
                            disabled={!notificationForm.watch("enableEmailNotifications")}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Test Email
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">Send a test SMS notification</p>
                            <p className="text-xs text-muted-foreground">
                              Check if your SMS configuration is working
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Test SMS Sent",
                                description: "A test SMS has been sent to the administrator.",
                              });
                            }}
                            disabled={!notificationForm.watch("enableSMSNotifications")}
                          >
                            Test SMS
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div 
                        className={`border rounded-md p-2 cursor-pointer transition-all ${settings.theme === 'light' ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        <div className="h-24 rounded bg-white border mb-2"></div>
                        <p className="text-center font-medium">Light</p>
                      </div>
                      <div 
                        className={`border rounded-md p-2 cursor-pointer transition-all ${settings.theme === 'dark' ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        <div className="h-24 rounded bg-gray-800 border mb-2"></div>
                        <p className="text-center font-medium">Dark</p>
                      </div>
                      <div 
                        className={`border rounded-md p-2 cursor-pointer transition-all ${settings.theme === 'system' ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => handleThemeChange('system')}
                      >
                        <div className="h-24 rounded bg-gradient-to-r from-white to-gray-800 border mb-2"></div>
                        <p className="text-center font-medium">System</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <Label>Date Format</Label>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Currency Format</Label>
                    <Select defaultValue="en-IN">
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select currency format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-IN">Indian Rupee (₹)</SelectItem>
                        <SelectItem value="en-US">US Dollar ($)</SelectItem>
                        <SelectItem value="en-GB">British Pound (£)</SelectItem>
                        <SelectItem value="en-EU">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Appearance Settings Saved",
                      description: "Your appearance preferences have been updated.",
                    });
                  }}
                >
                  Save Appearance Settings
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>
                  Database backup, restore, and system updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-medium">Database Management</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Create Database Backup</p>
                      <p className="text-xs text-muted-foreground">
                        Create a backup of all system data
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setIsBackupDialogOpen(true)}>
                      <Download className="mr-2 h-4 w-4" />
                      Backup
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Restore from Backup</p>
                      <p className="text-xs text-muted-foreground">
                        Restore system data from a backup file
                      </p>
                    </div>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-medium">System Updates</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Check for Updates</p>
                      <p className="text-xs text-muted-foreground">
                        Current version: 1.0.0
                      </p>
                    </div>
                    <Button>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Now
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-medium">Reporting</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">System Log</p>
                      <p className="text-xs text-muted-foreground">
                        View system activity logs
                      </p>
                    </div>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      View Logs
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Print Configuration</p>
                      <p className="text-xs text-muted-foreground">
                        Configure printer settings for receipts
                      </p>
                    </div>
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>
                Information about your software license
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">License Type</p>
                    <p className="font-medium">School Edition</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Licensed To</p>
                    <p className="font-medium">{settings.schoolName}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Expires On</p>
                    <p className="font-medium">Never (Perpetual)</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Need Support?</p>
                    <p className="text-xs text-muted-foreground">
                      Contact our support team for assistance
                    </p>
                  </div>
                  <Button variant="outline">Contact Support</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. All fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newUserForm}>
            <form 
              onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} 
              className="space-y-4 py-2"
            >
              <FormField
                control={newUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be at least 3 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines what permissions the user will have
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newUserForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              Create a backup of all system data for safekeeping
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Backup Options</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="backup-data" defaultChecked />
                  <Label htmlFor="backup-data">Database Records</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="backup-files" defaultChecked />
                  <Label htmlFor="backup-files">Uploaded Files & Images</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="backup-settings" defaultChecked />
                  <Label htmlFor="backup-settings">System Settings</Label>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Backup Format</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="format-compressed" 
                    name="format" 
                    className="h-4 w-4 text-primary"
                    defaultChecked
                  />
                  <Label htmlFor="format-compressed">Compressed (.zip)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="format-uncompressed" 
                    name="format" 
                    className="h-4 w-4 text-primary" 
                  />
                  <Label htmlFor="format-uncompressed">Uncompressed</Label>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Backup files contain sensitive information. Store them securely.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
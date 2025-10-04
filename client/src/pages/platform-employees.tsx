import { useState, useMemo, useEffect } from "react";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from '@/hooks/use-mobile';
import { usePageTitle } from '@/hooks/usePageTitle';
import ThemeToggle from '@/components/ThemeToggle';
import ColorThemeSelector from '@/components/ColorThemeSelector';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUploader } from "@/components/UniversalFileUploader";
import { 
  Users, 
  Plus, 
  Search, 
  Settings,
  Trash2,
  User,
  Activity,
  Shield,
  Calendar,
  Save,
  X,
  Upload,
  Camera,
  Key,
  LogIn
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Employee, addEmployeeSchema, type AddEmployeeForm } from "@shared/schema";
import EmployeeEditModal from "@/components/modals/employee-edit-modal";

// Employee types and schema imported from shared/schema.ts

// Permission groups for better organization
const permissionGroups = {
  dashboard: ["dashboard_view"],
  categories: ["categories_view", "categories_create", "categories_edit", "categories_delete"],
  landing_pages: ["landing_pages_view", "landing_pages_create", "landing_pages_edit", "landing_pages_delete"],
  products: ["products_view", "products_create", "products_edit", "products_delete"],
  orders: ["orders_view", "orders_create", "orders_edit", "orders_delete", "orders_export"],
  whatsapp: ["whatsapp_view", "whatsapp_send", "whatsapp_manage"],
  ads: ["ads_view", "ads_create", "ads_edit", "ads_delete", "ads_analytics"],
  accounts: ["accounts_view", "accounts_manage", "accounts_reports"],
  accounting: ["accounting_view", "accounting_create", "accounting_edit", "accounting_delete"],
  inventory: ["inventory_view", "inventory_manage", "stock_update", "stock_reports"],
  settings: ["settings_view", "settings_edit"],
  design: ["design_view", "design_edit"],
  call_center: ["call_center_view", "call_center_manage"],
  preparation: ["preparation_view", "preparation_manage"],
  employees: ["employees_view", "employees_create", "employees_edit", "employees_delete"]
};

// Default permissions for each role
const defaultPermissions = {
  admin: Object.values(permissionGroups).flat(),
  manager: Object.values(permissionGroups).flat().filter(p => !p.includes('employees_delete')),
  supervisor: ["dashboard_view", "products_view", "orders_view", "orders_edit", "whatsapp_view", "whatsapp_send"],
  employee: ["dashboard_view", "products_view", "orders_view", "orders_create", "orders_edit", "orders_export"],
  viewer: ["dashboard_view"]
};

// Default permissions for each department
const departmentPermissions = {
  "الإدارة العامة": Object.values(permissionGroups).flat(),
  "المبيعات": ["dashboard_view", "products_view", "orders_view", "orders_create", "orders_edit", "orders_export", "whatsapp_view", "whatsapp_send", "call_center_view", "call_center_manage"],
  "التسويق": ["dashboard_view", "products_view", "landing_pages_view", "landing_pages_create", "landing_pages_edit", "ads_view", "ads_create", "ads_edit", "ads_analytics", "design_view", "design_edit"],
  "خدمة العملاء": ["dashboard_view", "orders_view", "orders_create", "orders_edit", "whatsapp_view", "whatsapp_send", "call_center_view", "call_center_manage"],
  "المحاسبة والمالية": ["dashboard_view", "accounting_view", "accounting_create", "accounting_edit", "accounts_view", "accounts_manage", "accounts_reports", "orders_view", "orders_export"],
  "المخازن والشحن": ["dashboard_view", "orders_view", "orders_edit", "preparation_view", "preparation_manage", "products_view", "inventory_view", "inventory_manage", "stock_update", "stock_reports"],
  "تطوير المنتجات": ["dashboard_view", "products_view", "products_create", "products_edit", "categories_view", "categories_create", "categories_edit"],
  "الموارد البشرية": ["dashboard_view", "employees_view", "employees_create", "employees_edit", "settings_view"]
};

export default function PlatformEmployees() {
  // تعيين عنوان الصفحة
  usePageTitle('إدارة الموظفين');

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Initialize with default permissions for employee role
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(defaultPermissions.employee);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [, setLocation] = useLocation();
  const [nationalIdFrontUrl, setNationalIdFrontUrl] = useState<string>("");
  const [nationalIdBackUrl, setNationalIdBackUrl] = useState<string>("");
  const [residenceCardFrontUrl, setResidenceCardFrontUrl] = useState<string>("");
  const [residenceCardBackUrl, setResidenceCardBackUrl] = useState<string>("");
  // Removed enlargedImage state - no longer needed
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<AddEmployeeForm>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "employee",
      status: "active",
      departmentId: "",
      salary: "",
      hireDate: new Date().toISOString().split('T')[0],
      profileImageUrl: ""
    }
  });

  // Get platform session from API  
  const { data: session } = useQuery<{platformId: string}>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Fetch complete platform data for sidebar
  const { data: platformData } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}`],
    enabled: !!session?.platformId,
    retry: false,
  });

  // Create complete session for sidebar
  const sidebarSession = session && platformData ? {
    platformId: session.platformId,
    platformName: (platformData as any)?.name || "منصتي",
    subdomain: (platformData as any)?.subdomain || "",
    userType: "platform_owner" as const, // Add missing userType
    logoUrl: (platformData as any)?.logoUrl
  } : null;

  // Get employees data
  const { data: employeesData, isLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/employees`],
    enabled: !!session?.platformId,
  });

  // Get departments data
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/departments`],
    enabled: !!session?.platformId,
  });

  // Get positions data
  const { data: positionsData } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/positions`],
    enabled: !!session?.platformId,
  });

  const departments = (departmentsData as any[]) || [];
  const positions = (positionsData as any[]) || [];

  // إنشاء الأقسام تلقائياً إذا لم تكن موجودة
  useEffect(() => {
    if (session?.platformId && departmentsData && Array.isArray(departmentsData) && departmentsData.length === 0 && !departmentsLoading) {
      // استدعاء API لإنشاء الأقسام الافتراضية
      fetch(`/api/platforms/${session.platformId}/departments/create-defaults`, {
        method: 'POST',
      })
      .then(() => {
        // إعادة تحميل البيانات
        queryClient.invalidateQueries({
          queryKey: [`/api/platforms/${session.platformId}/departments`],
        });
      })
      .catch(console.error);
    }
  }, [session?.platformId, departmentsData, departmentsLoading, queryClient]);
  
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // Removed image enlargement functions - using hover tooltips instead

  const employees = (employeesData as Employee[]) || [];

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return employees;
    
    return employees.filter((employee: Employee) => {
      const matchesSearch = searchTerm === "" || 
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      const matchesRole = roleFilter === "all" || employee.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [employees, searchTerm, statusFilter, roleFilter]);

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return apiRequest(`/api/platforms/${session?.platformId}/employees/${employeeId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/platforms/${session?.platformId}/employees`],
      });
      toast({
        title: "تم حذف الموظف",
        description: "تم حذف الموظف بنجاح",
      });
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
      toast({
        title: "خطأ في حذف الموظف",
        description: "حدث خطأ أثناء حذف الموظف",
        variant: "destructive",
      });
    },
  });

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (data: AddEmployeeForm) => {
      const employeeData = {
        ...data,
        department: (data as any).department === "none" ? "" : (data as any).department,
        position: (data as any).position === "none" ? "" : (data as any).position,
        salary: data.salary ? parseFloat(data.salary) : 0,
        hireDate: data.hireDate, // Keep as string, will be converted on server
        profileImageUrl: uploadedImageUrl || null,
        nationalIdFrontUrl: nationalIdFrontUrl || null,
        nationalIdBackUrl: nationalIdBackUrl || null,
        residenceCardFrontUrl: residenceCardFrontUrl || null,
        residenceCardBackUrl: residenceCardBackUrl || null,
        permissions: selectedPermissions,
        platformId: session?.platformId
      };
      return apiRequest(`/api/platforms/${session?.platformId}/employees`, "POST", employeeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/platforms/${session?.platformId}/employees`],
      });
      toast({
        title: "تم إضافة الموظف",
        description: "تم إضافة الموظف الجديد بنجاح",
      });
      setShowAddDialog(false);
      form.reset();
      setSelectedPermissions(defaultPermissions.employee);
      setUploadedImageUrl("");
      setNationalIdFrontUrl("");
      setNationalIdBackUrl("");
      setResidenceCardFrontUrl("");
      setResidenceCardBackUrl("");
    },
    onError: (error: any) => {
      console.error('Error adding employee:', error);
      toast({
        title: "خطأ في إضافة الموظف",
        description: error.message || "حدث خطأ أثناء إضافة الموظف",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEmployee = (employeeId: string) => {
    deleteEmployeeMutation.mutate(employeeId);
  };

  const handleAddEmployee = (data: AddEmployeeForm) => {
    console.log('🔍 Form validation state:', form.formState);
    console.log('❌ Form errors:', form.formState.errors);
    console.log('📝 Form data:', data);
    console.log('✅ Selected permissions:', selectedPermissions);
    
    // Check if there are any actual errors instead of relying on isValid
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    
    if (hasErrors) {
      console.error('❌ Form has errors:', form.formState.errors);
      toast({
        title: "خطأ في البيانات",
        description: "يرجى التحقق من البيانات المدخلة وإكمال الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields manually
    if (!data.fullName || !data.email || !data.departmentId || !data.password || !data.confirmPassword) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إكمال جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    // Include selected permissions in the data
    const employeeData = {
      ...data,
      permissions: selectedPermissions
    };
    
    console.log('📤 Sending employee data:', employeeData);
    addEmployeeMutation.mutate(employeeData);
  };

  const handleRoleChange = (newRole: string) => {
    form.setValue("role", newRole as any);
    // Set default permissions based on role
    const rolePermissions = defaultPermissions[newRole as keyof typeof defaultPermissions] || [];
    setSelectedPermissions([...rolePermissions]); // Force state update with new array
  };

  const handleDepartmentChange = (departmentId: string) => {
    form.setValue("departmentId", departmentId);
    
    // Find department name by ID
    const selectedDept = departments.find((dept: any) => dept.id === departmentId);
    if (selectedDept && selectedDept.name && departmentPermissions[selectedDept.name as keyof typeof departmentPermissions]) {
      const deptPermissions = departmentPermissions[selectedDept.name as keyof typeof departmentPermissions] || [];
      setSelectedPermissions([...deptPermissions]);
    }
  };



  const handleImageUpload = async () => {
    try {
      const response = await fetch(`/api/objects/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  };

  const handleImageUploadComplete = (files: { url: string; fileName: string; originalName: string; size: number }[]) => {
    if (files && files.length > 0) {
      const uploadedFile = files[0];
      console.log('Employee image uploaded:', uploadedFile);
      
      setUploadedImageUrl(uploadedFile.url);
      form.setValue("profileImageUrl", uploadedFile.url);
      
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع الصورة الشخصية بنجاح",
      });
    }
  };

  // دوال رفع الوثائق
  const handleDocumentUpload = (documentType: string, setterFunction: (url: string) => void, title: string) => {
    return (files: { url: string; fileName: string; originalName: string; size: number }[]) => {
      if (files && files.length > 0) {
        const uploadedFile = files[0];
        console.log(`Document uploaded (${documentType}):`, uploadedFile);
        
        setterFunction(uploadedFile.url);
        
        toast({
          title: "تم رفع الوثيقة",
          description: `تم رفع ${title} بنجاح`,
        });
      }
    };
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const getPermissionGroupName = (groupKey: string) => {
    const groupNames = {
      dashboard: "لوحة القيادة",
      categories: "الفئات",
      landing_pages: "صفحات الهبوط",
      products: "المنتجات",
      orders: "الطلبات",
      whatsapp: "واتساب",
      ads: "الإعلانات",
      accounts: "حساباتي",
      accounting: "المحاسبة",
      inventory: "المخزون",
      settings: "الإعدادات",
      design: "التصميم",
      call_center: "مركز الاتصال",
      preparation: "التحضير",
      employees: "الموظفين"
    };
    return groupNames[groupKey as keyof typeof groupNames] || groupKey;
  };

  const getPermissionName = (permission: string) => {
    const permissionNames = {
      // Dashboard
      dashboard_view: "عرض لوحة القيادة",
      
      // Categories
      categories_view: "عرض الفئات",
      categories_create: "إضافة فئة",
      categories_edit: "تحرير الفئات",
      categories_delete: "حذف الفئات",
      
      // Landing Pages
      landing_pages_view: "عرض صفحات الهبوط",
      landing_pages_create: "إنشاء صفحة هبوط",
      landing_pages_edit: "تحرير صفحات الهبوط",
      landing_pages_delete: "حذف صفحات الهبوط",
      
      // Products
      products_view: "عرض المنتجات",
      products_create: "إضافة منتج",
      products_edit: "تحرير المنتجات",
      products_delete: "حذف المنتجات",
      
      // Orders
      orders_view: "عرض الطلبات",
      orders_create: "إنشاء طلب",
      orders_edit: "تحرير الطلبات",
      orders_delete: "حذف الطلبات",
      orders_export: "تصدير الطلبات",
      
      // WhatsApp
      whatsapp_view: "عرض واتساب",
      whatsapp_send: "إرسال رسائل واتساب",
      whatsapp_manage: "إدارة واتساب",
      
      // Ads
      ads_view: "عرض الإعلانات",
      ads_create: "إنشاء إعلان",
      ads_edit: "تحرير الإعلانات",
      ads_delete: "حذف الإعلانات",
      ads_analytics: "تحليلات الإعلانات",
      
      // Accounts
      accounts_view: "عرض حساباتي",
      accounts_manage: "إدارة الحسابات المالية",
      accounts_reports: "تقارير الحسابات",
      
      // Accounting
      accounting_view: "عرض المحاسبة",
      accounting_create: "إنشاء قيد محاسبي",
      accounting_edit: "تحرير المحاسبة",
      accounting_delete: "حذف القيود المحاسبية",
      
      // Settings
      settings_view: "عرض الإعدادات",
      settings_edit: "تحرير الإعدادات",
      
      // Design
      design_view: "عرض التصميم",
      design_edit: "تحرير التصميم",
      
      // Call Center
      call_center_view: "عرض مركز الاتصال",
      call_center_manage: "إدارة مركز الاتصال",
      
      // Preparation
      preparation_view: "عرض التحضير",
      preparation_manage: "إدارة التحضير",
      
      // Inventory
      inventory_view: "عرض المخزون",
      inventory_manage: "إدارة المخزون",
      stock_update: "تحديث المخزون",
      stock_reports: "تقارير المخزون",
      
      // Employees
      employees_view: "عرض الموظفين",
      employees_create: "إضافة موظف",
      employees_edit: "تحرير الموظفين",
      employees_delete: "حذف الموظفين"
    };
    return permissionNames[permission as keyof typeof permissionNames] || permission;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "نشط", className: "bg-theme-gradient text-white border-theme-primary" },
      inactive: { label: "غير نشط", className: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300" },
      suspended: { label: "معلق", className: "bg-red-100 text-red-600 border-red-300 dark:bg-red-900 dark:text-red-300" },
      terminated: { label: "منتهي الخدمة", className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "مدير عام", className: "bg-theme-primary text-white border-theme-primary" },
      manager: { label: "مدير", className: "bg-theme-primary-light text-theme-primary border-theme-primary" },
      supervisor: { label: "مشرف", className: "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900 dark:text-blue-300" },
      employee: { label: "موظف", className: "bg-green-100 text-green-600 border-green-300 dark:bg-green-900 dark:text-green-300" },
      viewer: { label: "مشاهد", className: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300" },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-theme-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-theme-primary-lighter overflow-hidden">
      <PlatformSidebar 
        session={sidebarSession as any}
        currentPath="/platform-employees"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        !sidebarCollapsed ? (isMobile ? 'ml-0' : 'mr-64') : (isMobile ? 'mr-0' : 'mr-16')
      }`}>
        {/* Top header - same style as platform-dashboard and products */}
        <div className="bg-theme-primary-light theme-border shadow-lg border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Left side - Theme controls */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ColorThemeSelector />
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            
            {/* Right side - Platform info */}
            <div className="text-right">
              <h1 className="text-xl font-bold text-theme-primary">إدارة الموظفين</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">إدارة فريق العمل والصلاحيات</p>
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label htmlFor="status-filter" className="text-sm font-medium text-theme-primary">
                  فلترة حسب الحالة:
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-[200px] theme-border">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-primary-lighter theme-border">
                    <SelectItem value="all" className="hover:bg-theme-primary-light">جميع الحالات</SelectItem>
                    <SelectItem value="active" className="hover:bg-theme-primary-light">نشط</SelectItem>
                    <SelectItem value="inactive" className="hover:bg-theme-primary-light">غير نشط</SelectItem>
                    <SelectItem value="suspended" className="hover:bg-theme-primary-light">معلق</SelectItem>
                    <SelectItem value="terminated" className="hover:bg-theme-primary-light">منتهي الخدمة</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="bg-theme-primary-light text-theme-primary">
                  {filteredEmployees ? filteredEmployees.length : 0} موظف
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => {
                  setShowAddDialog(true);
                  setSelectedPermissions([...defaultPermissions.employee]); // Reset to employee permissions
                }} className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة موظف جديد
                </Button>
                <Button 
                  onClick={() => setLocation("/employee-login")}
                  variant="outline"
                  className="theme-border hover:bg-theme-primary-light hover:text-theme-primary transition-all duration-300"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  لوحة دخول الموظف
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي الموظفين</p>
                    <p className="text-2xl font-bold text-theme-primary">{employees.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-theme-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الموظفين النشطين</p>
                    <p className="text-2xl font-bold text-green-600">
                      {employees.filter(e => e.status === 'active').length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">المدراء</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {employees.filter(e => ['admin', 'manager'].includes((e as any).role || '')).length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الموظفين الجدد</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {employees.filter(e => {
                        if (!(e as any).hireDate) return false;
                        const hireDate = new Date((e as any).hireDate);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return hireDate >= thirtyDaysAgo;
                      }).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="theme-border bg-theme-primary-lighter mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 theme-border"
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEmployees && filteredEmployees.length > 0 ? (
            <div className="space-y-3">
              {filteredEmployees.map((employee: Employee) => (
                <Card key={employee.id} className="bg-theme-primary-lighter theme-border hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Action buttons on left side */}
                      <div className="flex items-center gap-3">
                        <EmployeeEditModal employee={employee as any}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="theme-border hover:bg-theme-primary-light hover:text-theme-primary transition-all duration-200 group flex items-center gap-2 px-3 py-2"
                            title="تعديل الموظف"
                          >
                            <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                            <span className="text-xs font-medium">إعدادات</span>
                          </Button>
                        </EmployeeEditModal>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowPermissionsDialog(true);
                          }}
                          className="theme-border hover:bg-green-50 hover:border-green-300 transition-all duration-200 group flex items-center gap-2 px-3 py-2"
                          title="إدارة الصلاحيات"
                        >
                          <Shield className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-xs font-medium text-green-600 group-hover:text-green-700">صلاحيات</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowPasswordDialog(true);
                          }}
                          className="theme-border hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 group flex items-center gap-2 px-3 py-2"
                          title="تعيين كلمة مرور"
                        >
                          <Key className="h-4 w-4 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-xs font-medium text-yellow-600 group-hover:text-yellow-700">كلمة مرور</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="theme-border hover:bg-red-50 hover:border-red-300 transition-all duration-200 group flex items-center gap-2 px-3 py-2"
                              title="حذف الموظف"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-xs font-medium text-red-500 group-hover:text-red-600">حذف</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-black border-theme-primary max-w-md" aria-describedby="delete-employee-description">
                            <AlertDialogHeader className="text-right">
                              <AlertDialogTitle className="text-theme-primary text-xl font-bold flex items-center gap-2 justify-end">
                                <Trash2 className="h-5 w-5 text-red-500" />
                                تأكيد الحذف
                              </AlertDialogTitle>
                              <div id="delete-employee-description" className="sr-only">
                                تأكيد حذف الموظف من النظام نهائياً
                              </div>
                            </AlertDialogHeader>
                            <AlertDialogDescription className="text-gray-300 text-right leading-relaxed mt-4">
                              هل أنت متأكد من حذف الموظف <span className="font-bold text-theme-primary">"{employee.fullName}"</span>؟ 
                              <br />
                              <span className="text-red-400 font-medium">هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات الموظف نهائياً.</span>
                            </AlertDialogDescription>
                            <AlertDialogFooter className="flex gap-3 justify-start">
                              <AlertDialogAction
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 font-medium transition-colors duration-200"
                              >
                                نعم، احذف الموظف
                              </AlertDialogAction>
                              <AlertDialogCancel className="theme-border bg-theme-primary-lighter hover:bg-theme-primary-light text-theme-primary px-6 py-2 font-medium">
                                إلغاء
                              </AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      {/* Profile image and name on right side - RTL layout */}
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="text-right">
                          <h3 className="text-lg font-semibold text-theme-primary">{employee.fullName}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{employee.email}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            {getStatusBadge(employee.status)}
                            {getRoleBadge(employee.role)}
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                          {employee.profileImageUrl ? (
                            <img 
                              src={employee.profileImageUrl} 
                              alt={employee.fullName}
                              className="w-full h-full object-cover rounded-full border-2 border-theme-primary profile-image-hover"
                              title={`صورة ${employee.fullName}`}
                            />
                          ) : (
                            <div className="w-full h-full bg-theme-gradient rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-theme-primary-lighter theme-border">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-theme-primary mb-2">لا يوجد موظفين</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  لم يتم العثور على أي موظفين مطابقين للفلاتر المحددة
                </p>
                <Button onClick={() => {
                  setShowAddDialog(true);
                  setSelectedPermissions([...defaultPermissions.employee]);
                }} className="bg-theme-gradient text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة أول موظف
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-theme-primary-lighter theme-border max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="add-employee-description">
          <DialogHeader>
            <DialogTitle className="text-theme-primary flex items-center gap-2">
              <User className="h-5 w-5" />
              إضافة موظف جديد
            </DialogTitle>
            <div id="add-employee-description" className="sr-only">
              نافذة لإضافة موظف جديد مع تحديد الصلاحيات والمعلومات الأساسية
            </div>
            <DialogDescription>
              أدخل بيانات الموظف الجديد وحدد الصلاحيات المناسبة
            </DialogDescription>
          </DialogHeader>
          
          {/* Documents Upload Section - Outside form */}
          <Card className="theme-border bg-theme-primary-light mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-theme-primary">الوثائق والمستندات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div>
                <h4 className="text-md font-medium text-theme-primary mb-3">الصورة الشخصية</h4>
                <div className="flex items-center gap-4">
                  {uploadedImageUrl ? (
                    <div className="relative">
                      <img 
                        src={uploadedImageUrl} 
                        alt="صورة شخصية" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-theme-primary profile-image-hover"
                        title="الصورة الشخصية"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrl("");
                          form.setValue("profileImageUrl", "");
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  
                  <ImageUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880}
                    category="profiles"
                    onComplete={handleImageUploadComplete}
                    buttonClassName="bg-theme-gradient text-white hover:opacity-90 text-sm"
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    {uploadedImageUrl ? "تغيير" : "رفع"}
                  </ImageUploader>
                </div>
              </div>

              {/* Documents Row - National ID and Residence Card side by side */}
              <div className="flex flex-wrap gap-8">
                {/* National ID Section */}
                <div className="flex-1 min-w-[300px]">
                  <h4 className="text-md font-medium text-theme-primary mb-3">الهوية الوطنية</h4>
                  <div className="flex gap-4">
                    {/* National ID Front */}
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">الوجه الأمامي</Label>
                      <div className="flex items-center gap-2">
                        {nationalIdFrontUrl ? (
                          <div className="relative">
                            <img 
                              src={nationalIdFrontUrl} 
                              alt="الهوية الوطنية - الأمام" 
                              className="w-20 h-12 object-cover border border-theme-primary rounded document-image-hover"
                              title="الهوية الوطنية - الوجه الأمامي"
                            />
                            <button
                              type="button"
                              onClick={() => setNationalIdFrontUrl("")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                            <Upload className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        
                        <ImageUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          category="general"
                          onComplete={handleDocumentUpload("nationalIdFront", setNationalIdFrontUrl, "الهوية الوطنية - الأمام")}
                          buttonClassName="bg-blue-500 text-white hover:bg-blue-600 text-xs px-2 py-1"
                        >
                          <Upload className="w-3 h-3 ml-1" />
                          {nationalIdFrontUrl ? "تغيير" : "رفع"}
                        </ImageUploader>
                      </div>
                    </div>

                    {/* National ID Back */}
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">الوجه الخلفي</Label>
                      <div className="flex items-center gap-2">
                        {nationalIdBackUrl ? (
                          <div className="relative">
                            <img 
                              src={nationalIdBackUrl} 
                              alt="الهوية الوطنية - الخلف" 
                              className="w-20 h-12 object-cover border border-theme-primary rounded document-image-hover"
                              title="الهوية الوطنية - الوجه الخلفي"
                            />
                            <button
                              type="button"
                              onClick={() => setNationalIdBackUrl("")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                            <Upload className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        
                        <ImageUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          category="general"
                          onComplete={handleDocumentUpload("nationalIdBack", setNationalIdBackUrl, "الهوية الوطنية - الخلف")}
                          buttonClassName="bg-blue-500 text-white hover:bg-blue-600 text-xs px-2 py-1"
                        >
                          <Upload className="w-3 h-3 ml-1" />
                          {nationalIdBackUrl ? "تغيير" : "رفع"}
                        </ImageUploader>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Residence Card Section */}
                <div className="flex-1 min-w-[300px]">
                  <h4 className="text-md font-medium text-theme-primary mb-3">بطاقة السكن</h4>
                  <div className="flex gap-4">
                    {/* Residence Card Front */}
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">الوجه الأمامي</Label>
                      <div className="flex items-center gap-2">
                        {residenceCardFrontUrl ? (
                          <div className="relative">
                            <img 
                              src={residenceCardFrontUrl} 
                              alt="بطاقة السكن - الأمام" 
                              className="w-20 h-12 object-cover border border-theme-primary rounded document-image-hover"
                              title="بطاقة السكن - الوجه الأمامي"
                            />
                            <button
                              type="button"
                              onClick={() => setResidenceCardFrontUrl("")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                            <Upload className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        
                        <ImageUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          category="general"
                          onComplete={handleDocumentUpload("residenceCardFront", setResidenceCardFrontUrl, "بطاقة السكن - الأمام")}
                          buttonClassName="bg-green-500 text-white hover:bg-green-600 text-xs px-2 py-1"
                        >
                          <Upload className="w-3 h-3 ml-1" />
                          {residenceCardFrontUrl ? "تغيير" : "رفع"}
                        </ImageUploader>
                      </div>
                    </div>

                    {/* Residence Card Back */}
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">الوجه الخلفي</Label>
                      <div className="flex items-center gap-2">
                        {residenceCardBackUrl ? (
                          <div className="relative">
                            <img 
                              src={residenceCardBackUrl} 
                              alt="بطاقة السكن - الخلف" 
                              className="w-20 h-12 object-cover border border-theme-primary rounded document-image-hover"
                              title="بطاقة السكن - الوجه الخلفي"
                            />
                            <button
                              type="button"
                              onClick={() => setResidenceCardBackUrl("")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                            <Upload className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        
                        <ImageUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          category="general"
                          onComplete={handleDocumentUpload("residenceCardBack", setResidenceCardBackUrl, "بطاقة السكن - الخلف")}
                          buttonClassName="bg-green-500 text-white hover:bg-green-600 text-xs px-2 py-1"
                        >
                          <Upload className="w-3 h-3 ml-1" />
                          {residenceCardBackUrl ? "تغيير" : "رفع"}
                        </ImageUploader>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                حجم أقصى لكل ملف: 5 ميجا بايت (JPG، PNG، PDF)
              </p>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddEmployee)} className="space-y-6">
              {/* Basic Information */}
              <Card className="theme-border bg-theme-primary-light">
                <CardHeader>
                  <CardTitle className="text-lg text-theme-primary">المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">الاسم الكامل *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="أدخل الاسم الكامل" 
                              {...field} 
                              className="theme-border"
                            />
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
                          <FormLabel className="text-theme-primary">البريد الإلكتروني *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="example@domain.com" 
                              {...field} 
                              className="theme-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="07xxxxxxxxx" 
                              {...field} 
                              className="theme-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">تاريخ التعيين *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                              className="theme-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Login Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">اسم المستخدم *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="أدخل اسم المستخدم" 
                              {...field} 
                              className="theme-border"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            سيستخدم للدخول إلى النظام
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">كلمة المرور *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="أدخل كلمة المرور" 
                                {...field} 
                                className="theme-border pl-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute left-0 top-0 h-full px-3 hover:bg-transparent text-gray-400"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? "👁️‍🗨️" : "👁️"}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">تأكيد كلمة المرور *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="أعد إدخال كلمة المرور" 
                            {...field} 
                            className="theme-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Job Information */}
              <Card className="theme-border bg-theme-primary-light">
                <CardHeader>
                  <CardTitle className="text-lg text-theme-primary">المعلومات الوظيفية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">الدور الوظيفي *</FormLabel>
                          <Select 
                            onValueChange={handleRoleChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="theme-border">
                                <SelectValue placeholder="اختر الدور الوظيفي" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-theme-primary-lighter theme-border">
                              <SelectItem value="admin">مدير عام</SelectItem>
                              <SelectItem value="manager">مدير</SelectItem>
                              <SelectItem value="supervisor">مشرف</SelectItem>
                              <SelectItem value="employee">موظف</SelectItem>
                              <SelectItem value="viewer">مشاهد</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">حالة الموظف *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="theme-border">
                                <SelectValue placeholder="اختر حالة الموظف" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-theme-primary-lighter theme-border">
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="inactive">غير نشط</SelectItem>
                              <SelectItem value="suspended">معلق</SelectItem>
                              <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-theme-primary">القسم *</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            handleDepartmentChange(value);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="theme-border">
                                <SelectValue placeholder="اختر القسم" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-theme-primary-lighter theme-border">
                              {departmentsLoading ? (
                                <SelectItem value="loading" disabled>جاري تحميل الأقسام...</SelectItem>
                              ) : departments.length > 0 ? (
                                departments.map((dept: any) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>لا توجد أقسام متاحة</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">الراتب (د.ع)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="مثال: 500000" 
                            {...field} 
                            className="theme-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card className="theme-border bg-theme-primary-light">
                <CardHeader>
                  <CardTitle className="text-lg text-theme-primary">الصلاحيات</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    حدد الصلاحيات التي يحتاجها الموظف. يتم تعيين الصلاحيات الافتراضية تلقائياً بناءً على القسم المختار.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(permissionGroups).map(([groupKey, permissions]) => (
                      <div key={groupKey} className="space-y-3">
                        <h4 className="font-semibold text-theme-primary border-b pb-2">
                          {getPermissionGroupName(groupKey)}
                        </h4>
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <div key={permission} className="flex items-center gap-4">
                              <Checkbox
                                id={permission}
                                checked={selectedPermissions.includes(permission)}
                                onCheckedChange={() => togglePermission(permission)}
                                className="theme-checkbox"
                              />
                              <Label
                                htmlFor={permission}
                                className="text-sm font-normal text-gray-700 dark:text-gray-300 cursor-pointer"
                              >
                                {getPermissionName(permission)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    form.reset();
                    setSelectedPermissions(defaultPermissions.employee); // Reset to default employee permissions
                  }}
                  className="theme-border"
                >
                  <X className="h-4 w-4 mr-2" />
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={addEmployeeMutation.isPending}
                  className="bg-theme-gradient text-white"
                >
                  {addEmployeeMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      إضافة الموظف
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Employee Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="bg-black border-theme-primary max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby="permissions-dialog-description">
          <DialogHeader className="text-right pb-4">
            <div id="permissions-dialog-description" className="sr-only">
              نافذة لإدارة صلاحيات الموظف وتحديد الوصول للأقسام المختلفة
            </div>
            {selectedEmployee && (
              <Card className="bg-theme-primary-lighter theme-border mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-theme-primary text-xl font-bold flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      إدارة الصلاحيات
                    </DialogTitle>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedEmployee.profileImageUrl ? (
                          <img 
                            src={selectedEmployee.profileImageUrl} 
                            alt={selectedEmployee.fullName}
                            className="w-full h-full object-cover rounded-full border-2 border-theme-primary"
                          />
                        ) : (
                          <div className="w-full h-full bg-theme-gradient rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-theme-primary font-semibold text-lg">{selectedEmployee.fullName}</p>
                        <p className="text-gray-400 text-sm">{selectedEmployee.email}</p>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          {getStatusBadge(selectedEmployee.status)}
                          {getRoleBadge(selectedEmployee.role)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <DialogDescription className="text-gray-400 text-right text-sm leading-relaxed">
              حدد الصلاحيات المناسبة للموظف. يمكن تعديل هذه الصلاحيات في أي وقت.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(permissionGroups).map(([groupKey, permissions]) => (
                <Card key={groupKey} className="bg-theme-primary-lighter theme-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-theme-primary text-lg font-bold border-b border-theme-primary pb-2">
                      {getPermissionGroupName(groupKey)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-4 p-2 rounded-lg hover:bg-theme-primary-light transition-colors duration-200">
                        <Checkbox
                          id={`perm-${permission}`}
                          checked={selectedEmployee?.permissions?.includes(permission) || false}
                          onCheckedChange={(checked) => {
                            if (selectedEmployee) {
                              const currentPermissions = selectedEmployee.permissions || [];
                              const newPermissions = checked 
                                ? [...currentPermissions, permission]
                                : currentPermissions.filter(p => p !== permission);
                              
                              // Update locally first for immediate feedback
                              setSelectedEmployee({
                                ...selectedEmployee,
                                permissions: newPermissions
                              });
                            }
                          }}
                          className="theme-checkbox"
                        />
                        <Label
                          htmlFor={`perm-${permission}`}
                          className="text-sm font-normal text-gray-700 dark:text-gray-300 cursor-pointer flex-1 text-right"
                        >
                          {getPermissionName(permission)}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-theme-primary pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPermissionsDialog(false)}
              className="theme-border bg-theme-primary-lighter hover:bg-theme-primary-light px-6"
            >
              إغلاق
            </Button>
            <Button
              onClick={async () => {
                if (!selectedEmployee) return;
                
                try {
                  await apiRequest(`/api/platforms/${session?.platformId}/employees/${selectedEmployee.id}`, "PUT", {
                    permissions: selectedEmployee.permissions
                  });
                  
                  // Update the employees list with new permissions
                  queryClient.invalidateQueries({
                    queryKey: [`/api/platforms/${session?.platformId}/employees`],
                  });
                  
                  setShowPermissionsDialog(false);
                  toast({
                    title: "تم حفظ الصلاحيات",
                    description: "تم تحديث صلاحيات الموظف بنجاح",
                  });
                } catch (error) {
                  console.error('Error updating permissions:', error);
                  toast({
                    title: "خطأ في حفظ الصلاحيات",
                    description: "حدث خطأ أثناء تحديث الصلاحيات",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-theme-gradient text-white px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-black border-theme-primary max-w-md" aria-describedby="password-dialog-description">
          <DialogHeader className="text-right">
            <DialogTitle className="text-theme-primary text-xl font-bold flex items-center gap-2 justify-end">
              <Key className="h-5 w-5 text-yellow-500" />
              تعيين كلمة مرور
            </DialogTitle>
            <div id="password-dialog-description" className="sr-only">
              نافذة لتعيين كلمة مرور جديدة للموظف
            </div>
            <DialogDescription className="text-gray-300 text-right mt-2">
              {selectedEmployee && (
                <>تعيين كلمة مرور جديدة للموظف: <span className="font-bold text-theme-primary">{selectedEmployee.fullName}</span></>
              )}
            </DialogDescription>
          </DialogHeader>

          <SetPasswordForm 
            employeeId={selectedEmployee?.id} 
            onSuccess={(result) => {
              toast({
                title: "تم تعيين كلمة المرور بنجاح",
                description: `اسم المستخدم: ${result.username}`,
              });
              setShowPasswordDialog(false);
            }}
            onCancel={() => setShowPasswordDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Removed ImageModal - using hover tooltips instead */}
    </div>
  );
}

// Set Password Form Component
function SetPasswordForm({ employeeId, onSuccess, onCancel }: {
  employeeId?: string;
  onSuccess: (result: { username: string }) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId) return;

    if (password !== confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور وتأكيد كلمة المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiRequest("/api/employee/set-password", "POST", {
        employeeId,
        password
      });

      onSuccess(result);
    } catch (error) {
      console.error("Set password error:", error);
      toast({
        title: "خطأ في تعيين كلمة المرور",
        description: "حدث خطأ أثناء تعيين كلمة المرور. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="space-y-2">
        <Label className="text-white text-right block">كلمة المرور الجديدة</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="أدخل كلمة المرور الجديدة"
            className="bg-gray-800 border-theme-primary text-white text-right pr-10"
            dir="ltr"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 hover:bg-transparent text-gray-400"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️‍🗨️" : "👁️"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white text-right block">تأكيد كلمة المرور</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="أعد إدخال كلمة المرور"
          className="bg-gray-800 border-theme-primary text-white text-right"
          dir="ltr"
        />
      </div>

      <DialogFooter className="gap-3 border-t border-theme-primary pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="theme-border bg-theme-primary-lighter hover:bg-theme-primary-light text-theme-primary px-6"
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              جاري التعيين...
            </div>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              تعيين كلمة المرور
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
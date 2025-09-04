import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/UniversalFileUploader";
import { User, Upload, Trash2, Lock, Briefcase, Building, Building2, Camera, Shield, Eye, Key, X } from "lucide-react";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  position: string;
  department: string;
  role: string;
  status: string;
  salary?: number;
  permissions?: string[];
  profileImageUrl?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  residenceCardFrontUrl?: string;
  residenceCardBackUrl?: string;
}

interface EmployeeEditModalProps {
  employee: Employee;
  children: React.ReactNode;
}

const editEmployeeSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  role: z.string().min(1, "الدور الوظيفي مطلوب"),
  status: z.string().min(1, "حالة الموظف مطلوبة"),
  departmentId: z.string().optional(),
  salary: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  profileImageUrl: z.string().optional(),
  nationalIdFrontUrl: z.string().optional(),
  nationalIdBackUrl: z.string().optional(),
  residenceCardFrontUrl: z.string().optional(),
  residenceCardBackUrl: z.string().optional(),
}).refine((data) => {
  // Only validate password match if password is provided
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) {
      return false;
    }
    if (data.password !== data.confirmPassword) {
      return false;
    }
  }
  return true;
}, {
  message: "كلمة المرور وتأكيد كلمة المرور يجب أن يتطابقا ويكونا 6 أحرف على الأقل",
  path: ["confirmPassword"],
});

type EditEmployeeForm = z.infer<typeof editEmployeeSchema>;

export default function EmployeeEditModal({ employee, children }: EmployeeEditModalProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(employee.permissions || []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current platform session
  const { data: session } = useQuery<{platformId: string}>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Fetch departments and positions
  const { data: departments = [] } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/departments`],
    enabled: !!session?.platformId,
  });



  const form = useForm<EditEmployeeForm>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      fullName: employee.fullName,
      email: employee.email || "",
      phone: employee.phone,
      username: employee.username,
      role: employee.role,
      status: employee.status,
      departmentId: employee.department || "",
      salary: employee.salary?.toString() || "",
      profileImageUrl: employee.profileImageUrl || "",
      nationalIdFrontUrl: employee.nationalIdFrontUrl || "",
      nationalIdBackUrl: employee.nationalIdBackUrl || "",
      residenceCardFrontUrl: employee.residenceCardFrontUrl || "",
      residenceCardBackUrl: employee.residenceCardBackUrl || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Reset form when employee changes or dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔄 Modal opened, employee data:', employee);
      console.log('🏢 Available departments:', departments);
      
      // Get current department ID - check both department and departmentId fields  
      let currentDepartmentId = employee.department || employee.departmentId || "";
      console.log('🏛️ Current department ID:', currentDepartmentId);
      console.log('🏛️ Employee department field:', employee.department);
      console.log('🏛️ Employee departmentId field:', employee.departmentId);
      
      // If department is empty but permissions exist, try to identify department by permissions
      if (!currentDepartmentId && employee.permissions && employee.permissions.length > 0 && departments.length > 0) {
        console.log('🔍 Trying to identify department from permissions...');
        const allPerms = Object.values(permissionGroups).flat();
        if (employee.permissions.length === allPerms.length) {
          // Has all permissions - likely الإدارة العامة
          const adminDept = departments.find((dept: any) => dept.name === "الإدارة العامة");
          if (adminDept) {
            currentDepartmentId = adminDept.id;
            console.log('✅ Identified as admin department:', currentDepartmentId);
          }
        }
      }
      
      // Always set permissions first to preserve them
      console.log('📋 Setting employee permissions:', employee.permissions);
      setSelectedPermissions(employee.permissions || []);
      
      // Reset form values with current department
      const formValues = {
        fullName: employee.fullName,
        email: employee.email || "",
        phone: employee.phone,
        username: employee.username,
        role: employee.role,
        status: employee.status,
        departmentId: currentDepartmentId,
        salary: employee.salary?.toString() || "",
        profileImageUrl: employee.profileImageUrl || "",
        nationalIdFrontUrl: employee.nationalIdFrontUrl || "",
        nationalIdBackUrl: employee.nationalIdBackUrl || "",
        residenceCardFrontUrl: employee.residenceCardFrontUrl || "",
        residenceCardBackUrl: employee.residenceCardBackUrl || "",
        password: "",
        confirmPassword: "",
      };
      
      console.log('🔧 Resetting form with values:', formValues);
      form.reset(formValues);
    }
  }, [open, employee, form, departments]);

  const editEmployeeMutation = useMutation({
    mutationFn: async (data: EditEmployeeForm) => {
      const updateData: any = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        username: data.username,
        role: data.role,
        status: data.status,
        department: data.departmentId || null,
        position: data.position || null,
        salary: data.salary ? parseFloat(data.salary) : null,
        permissions: selectedPermissions,
        profileImageUrl: data.profileImageUrl,
        nationalIdFrontUrl: data.nationalIdFrontUrl || null,
        nationalIdBackUrl: data.nationalIdBackUrl || null,
        residenceCardFrontUrl: data.residenceCardFrontUrl || null,
        residenceCardBackUrl: data.residenceCardBackUrl || null,
      };

      // Include password if provided
      if (data.password) {
        updateData.password = data.password;
      }

      return apiRequest(`/api/platforms/67ce2605-a0de-4262-bc05-be6131d96c26/employees/${employee.id}`, "PUT", updateData);
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات الموظف بنجاح",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/platforms/67ce2605-a0de-4262-bc05-be6131d96c26/employees`],
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث معلومات الموظف",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (files: { url: string; fileName: string; originalName: string; size: number }[]) => {
    if (files && files.length > 0) {
      const uploadedFile = files[0];
      form.setValue("profileImageUrl", uploadedFile.url);
      
      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم رفع صورة الملف الشخصي بنجاح",
      });
    }
  };

  // Permission handling functions - Updated to match platform-employees.tsx
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
    employees: ["employees_view", "employees_create", "employees_edit", "employees_delete", "employees_permissions"]
  };

  const allPermissions = Object.values(permissionGroups).flat();

  const getPermissionGroupName = (groupKey: string) => {
    const names: Record<string, string> = {
      dashboard: 'لوحة التحكم',
      categories: 'الفئات',
      landing_pages: 'الصفحات المقصودة',
      products: 'المنتجات',
      orders: 'الطلبات',
      whatsapp: 'واتساب',
      ads: 'الإعلانات',
      accounts: 'حساباتي',
      accounting: 'المحاسبة',
      inventory: 'المخزون',
      settings: 'الإعدادات',
      design: 'التصميم',
      call_center: 'مركز الاتصال',
      preparation: 'التحضير',
      employees: 'الموظفين'
    };
    return names[groupKey] || groupKey;
  };

  const getPermissionName = (permission: string) => {
    const permissionNames: Record<string, string> = {
      // Dashboard
      'dashboard_view': 'عرض لوحة التحكم',
      
      // Categories
      'categories_view': 'عرض الفئات',
      'categories_create': 'إنشاء فئات جديدة',
      'categories_edit': 'تعديل الفئات',
      'categories_delete': 'حذف الفئات',
      
      // Landing Pages
      'landing_pages_view': 'عرض الصفحات المقصودة',
      'landing_pages_create': 'إنشاء صفحات مقصودة جديدة',
      'landing_pages_edit': 'تعديل الصفحات المقصودة',
      'landing_pages_delete': 'حذف الصفحات المقصودة',
      
      // Products
      'products_view': 'عرض المنتجات',
      'products_create': 'إنشاء منتجات جديدة',
      'products_edit': 'تعديل المنتجات',
      'products_delete': 'حذف المنتجات',
      
      // Orders
      'orders_view': 'عرض الطلبات',
      'orders_create': 'إنشاء طلبات جديدة',
      'orders_edit': 'تعديل الطلبات',
      'orders_delete': 'حذف الطلبات',
      'orders_export': 'تصدير الطلبات',
      
      // WhatsApp
      'whatsapp_view': 'عرض واتساب',
      'whatsapp_send': 'إرسال رسائل واتساب',
      'whatsapp_manage': 'إدارة واتساب',
      
      // Ads
      'ads_view': 'عرض الإعلانات',
      'ads_create': 'إنشاء إعلانات جديدة',
      'ads_edit': 'تعديل الإعلانات',
      'ads_delete': 'حذف الإعلانات',
      'ads_analytics': 'عرض تحليلات الإعلانات',
      
      // Accounting
      'accounting_view': 'عرض المحاسبة',
      'accounting_create': 'إنشاء قيود محاسبية',
      'accounting_edit': 'تعديل المحاسبة',
      'accounting_delete': 'حذف القيود المحاسبية',
      
      // Settings
      'settings_view': 'عرض الإعدادات',
      'settings_edit': 'تعديل الإعدادات',
      
      // Design
      'design_view': 'عرض التصميم',
      'design_edit': 'تعديل التصميم',
      
      // Call Center
      'call_center_view': 'عرض مركز الاتصال',
      'call_center_manage': 'إدارة مركز الاتصال',
      
      // Preparation
      'preparation_view': 'عرض التحضير',
      'preparation_manage': 'إدارة التحضير',
      
      // Employees
      'employees_view': 'عرض الموظفين',
      'employees_create': 'إنشاء موظفين جدد',
      'employees_edit': 'تعديل الموظفين',
      'employees_delete': 'حذف الموظفين',
      
      // Accounts
      'accounts_view': 'عرض الحسابات',
      'accounts_manage': 'إدارة الحسابات',
      'accounts_reports': 'تقارير الحسابات',
      
      // Inventory
      'inventory_view': 'عرض المخزون',
      'inventory_manage': 'إدارة المخزون',
      'stock_update': 'تحديث المخزون',
      'stock_reports': 'تقارير المخزون'
    };
    return permissionNames[permission] || permission;
  };

  const handleRoleChange = (role: string) => {
    form.setValue('role', role);
    
    // Set default permissions based on role
    const rolePermissions: Record<string, string[]> = {
      admin: allPermissions,
      manager: [
        'dashboard_view', 
        'products_view', 'products_create', 'products_edit',
        'orders_view', 'orders_create', 'orders_edit', 
        'landing_pages_view', 'landing_pages_create', 'landing_pages_edit',
        'categories_view', 'categories_create', 'categories_edit',
        'whatsapp_view', 'whatsapp_send',
        'accounting_view'
      ],
      supervisor: [
        'dashboard_view', 
        'products_view', 'products_edit',
        'orders_view', 'orders_edit',
        'landing_pages_view',
        'categories_view'
      ],
      employee: [
        'dashboard_view', 
        'products_view',
        'orders_view', 'orders_edit'
      ],
      viewer: ['dashboard_view']
    };
    
    setSelectedPermissions(rolePermissions[role] || []);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  // Handle department change and set appropriate permissions
  const handleDepartmentChange = (departmentId: string) => {
    console.log('🏢 Department manually changed to:', departmentId);
    form.setValue('departmentId', departmentId);
    
    // Find department name by ID
    const selectedDept = departments.find((dept: any) => dept.id === departmentId);
    console.log('🏛️ Found department:', selectedDept);
    
    if (selectedDept && selectedDept.name) {
      // Define department permissions
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
      
      const deptPermissions = departmentPermissions[selectedDept.name as keyof typeof departmentPermissions] || [];
      console.log('🔧 Department permissions for', selectedDept.name, ':', deptPermissions);
      
      // Set permissions based on department selection
      if (selectedDept.name === "الإدارة العامة") {
        console.log('🔧 Setting all permissions for General Management');
        setSelectedPermissions(deptPermissions);
      } else if (deptPermissions.length > 0) {
        console.log('🔧 Setting department permissions for', selectedDept.name);
        setSelectedPermissions(deptPermissions);
      }
    }
  };

  const onSubmit = (data: EditEmployeeForm) => {
    console.log('🚀 Form submission data:', data);
    console.log('🔑 Selected permissions:', selectedPermissions);
    console.log('📦 Inventory permissions in selected:', selectedPermissions.filter(p => p.includes('inventory') || p.includes('stock')));
    
    // Remove empty strings from permissions
    const cleanPermissions = selectedPermissions.filter(p => p.trim() !== '');
    console.log('✨ Clean permissions to send:', cleanPermissions);
    console.log('📦 Clean inventory permissions:', cleanPermissions.filter(p => p.includes('inventory') || p.includes('stock')));
    
    editEmployeeMutation.mutate({
      ...data,
      permissions: cleanPermissions
    });
  };

  // Add handler for form validation errors
  const onError = (errors: any) => {
    toast({
      title: "خطأ في البيانات",
      description: "يرجى التحقق من صحة البيانات المدخلة",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-black border-theme-primary">
        <DialogHeader>
          <DialogTitle className="text-right text-white text-xl flex items-center gap-2">
            <i className="fas fa-user-edit text-theme-primary"></i>
            تعديل معلومات الموظف
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
            {/* Profile Image Section */}
            <Card className="theme-border bg-theme-primary-light">
              <CardHeader>
                <CardTitle className="text-lg text-theme-primary flex items-center gap-2">
                  <User className="h-5 w-5" />
                  الصورة الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Current Profile Image Display */}
                  <div className="relative">
                    {form.watch("profileImageUrl") ? (
                      <div className="relative group">
                        <img
                          src={form.watch("profileImageUrl")}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-theme-primary shadow-lg transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-theme-gradient border-4 border-theme-primary flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <ImageUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onComplete={handleUploadComplete}
                      buttonClassName="flex-1 bg-theme-gradient text-white hover:opacity-90 transition-all duration-200 py-2 px-4 rounded-lg"
                      category="profiles"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>{form.watch("profileImageUrl") ? "تغيير الصورة" : "رفع صورة"}</span>
                      </div>
                    </ImageUploader>

                    {form.watch("profileImageUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue("profileImageUrl", "")}
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        حذف الصورة
                      </Button>
                    )}
                  </div>

                  {/* Upload Guidelines */}
                  <div className="text-xs text-gray-500 text-center space-y-1">
                    <p>الحد الأقصى لحجم الملف: 5 ميجابايت</p>
                    <p>الصيغ المدعومة: JPG, PNG, GIF</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information Section */}
            <Card className="theme-border bg-theme-primary-light">
              <CardHeader>
                <CardTitle className="text-lg text-theme-primary flex items-center gap-2">
                  <User className="h-5 w-5" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-theme-primary">الاسم الكامل *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="theme-border" 
                            placeholder="أدخل الاسم الكامل"
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
                        <FormLabel className="text-theme-primary">البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            className="theme-border" 
                            placeholder="example@domain.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">رقم الهاتف *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="theme-border" 
                            placeholder="07xxxxxxxxx"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>



            {/* Password Change Section */}
            <Card className="theme-border bg-theme-primary-light">
              <CardHeader>
                <CardTitle className="text-lg text-theme-primary flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  تغيير كلمة المرور (اختياري)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">كلمة المرور الحالية</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showCurrentPassword ? "text" : "password"}
                            className="theme-border pl-10" 
                            placeholder="أدخل كلمة المرور الحالية"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 hover:bg-transparent text-gray-400"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? "👁️‍🗨️" : "👁️"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showNewPassword ? "text" : "password"}
                            className="theme-border pl-10" 
                            placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 hover:bg-transparent text-gray-400"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? "👁️‍🗨️" : "👁️"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">تأكيد كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          className="theme-border" 
                          placeholder="أعد إدخال كلمة المرور الجديدة"
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
                <CardTitle className="text-lg text-theme-primary flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  المعلومات الوظيفية
                </CardTitle>
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
                
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">القسم</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleDepartmentChange(value);
                        }} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="theme-border">
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-theme-primary-lighter theme-border">
                          <SelectItem value="none">بدون قسم محدد</SelectItem>
                          {(departments as any[])?.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
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

            {/* Documents Section */}
            <Card className="theme-border bg-theme-primary-light">
              <CardHeader>
                <CardTitle className="text-lg text-theme-primary flex items-center gap-2">
                  <i className="fas fa-id-card"></i>
                  الوثائق الرسمية
                </CardTitle>
                <p className="text-sm text-gray-400">
                  رفع الوثائق الرسمية للموظف (اختياري)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* National ID Front */}
                <div className="space-y-3">
                  <Label className="text-theme-primary font-medium">البطاقة الوطنية - الوجه الأمامي</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <ImageUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onComplete={(files) => {
                        if (files && files.length > 0) {
                          form.setValue("nationalIdFrontUrl", files[0].url);
                          toast({
                            title: "تم رفع الوثيقة",
                            description: "تم رفع البطاقة الوطنية - الوجه الأمامي بنجاح",
                          });
                        }
                      }}
                      buttonClassName="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      category="documents"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>رفع البطاقة الأمامية</span>
                      </div>
                    </ImageUploader>
                    {form.watch("nationalIdFrontUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue("nationalIdFrontUrl", "")}
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                  {form.watch("nationalIdFrontUrl") && (
                    <div className="relative group">
                      <img
                        src={form.watch("nationalIdFrontUrl")}
                        alt="National ID Front"
                        className="w-32 h-20 object-cover border-2 border-theme-primary rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => window.open(form.watch("nationalIdFrontUrl"), '_blank')}
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">انقر للعرض</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* National ID Back */}
                <div className="space-y-3">
                  <Label className="text-theme-primary font-medium">البطاقة الوطنية - الوجه الخلفي</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <ImageUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onComplete={(files) => {
                        if (files && files.length > 0) {
                          form.setValue("nationalIdBackUrl", files[0].url);
                          toast({
                            title: "تم رفع الوثيقة",
                            description: "تم رفع البطاقة الوطنية - الوجه الخلفي بنجاح",
                          });
                        }
                      }}
                      buttonClassName="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      category="documents"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>رفع البطاقة الخلفية</span>
                      </div>
                    </ImageUploader>
                    {form.watch("nationalIdBackUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue("nationalIdBackUrl", "")}
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                  {form.watch("nationalIdBackUrl") && (
                    <div className="relative group">
                      <img
                        src={form.watch("nationalIdBackUrl")}
                        alt="National ID Back"
                        className="w-32 h-20 object-cover border-2 border-theme-primary rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => window.open(form.watch("nationalIdBackUrl"), '_blank')}
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">انقر للعرض</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Residence Card Front */}
                <div className="space-y-3">
                  <Label className="text-theme-primary font-medium">بطاقة السكن - الوجه الأمامي</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <ImageUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onComplete={(files) => {
                        if (files && files.length > 0) {
                          form.setValue("residenceCardFrontUrl", files[0].url);
                          toast({
                            title: "تم رفع الوثيقة",
                            description: "تم رفع بطاقة السكن - الوجه الأمامي بنجاح",
                          });
                        }
                      }}
                      buttonClassName="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      category="documents"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>رفع بطاقة السكن الأمامية</span>
                      </div>
                    </ImageUploader>
                    {form.watch("residenceCardFrontUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue("residenceCardFrontUrl", "")}
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                  {form.watch("residenceCardFrontUrl") && (
                    <div className="relative group">
                      <img
                        src={form.watch("residenceCardFrontUrl")}
                        alt="Residence Card Front"
                        className="w-32 h-20 object-cover border-2 border-theme-primary rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => window.open(form.watch("residenceCardFrontUrl"), '_blank')}
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">انقر للعرض</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Residence Card Back */}
                <div className="space-y-3">
                  <Label className="text-theme-primary font-medium">بطاقة السكن - الوجه الخلفي</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <ImageUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onComplete={(files) => {
                        if (files && files.length > 0) {
                          form.setValue("residenceCardBackUrl", files[0].url);
                          toast({
                            title: "تم رفع الوثيقة",
                            description: "تم رفع بطاقة السكن - الوجه الخلفي بنجاح",
                          });
                        }
                      }}
                      buttonClassName="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      category="documents"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>رفع بطاقة السكن الخلفية</span>
                      </div>
                    </ImageUploader>
                    {form.watch("residenceCardBackUrl") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue("residenceCardBackUrl", "")}
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                  {form.watch("residenceCardBackUrl") && (
                    <div className="relative group">
                      <img
                        src={form.watch("residenceCardBackUrl")}
                        alt="Residence Card Back"
                        className="w-32 h-20 object-cover border-2 border-theme-primary rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => window.open(form.watch("residenceCardBackUrl"), '_blank')}
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">انقر للعرض</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card className="theme-border bg-theme-primary-light">
              <CardHeader>
                <CardTitle className="text-lg text-theme-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  الصلاحيات
                </CardTitle>
                <p className="text-sm text-gray-400">
                  حدد الصلاحيات التي يحتاجها الموظف. تم تعيين صلاحيات افتراضية بناءً على الدور الوظيفي.
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
                            <Label htmlFor={permission} className="text-sm text-gray-300 cursor-pointer">
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
              >
                <i className="fas fa-times ml-2"></i>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={editEmployeeMutation.isPending}
                className="flex-1 bg-theme-gradient text-white hover:opacity-90 transition-all duration-200 font-medium"

              >
                <i className={`${editEmployeeMutation.isPending ? 'fas fa-spinner fa-spin' : 'fas fa-save'} ml-2`}></i>
                {editEmployeeMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  BarChart3,
  Video,
  Target,
  Eye,
  Search,
  Edit,
  Copy,
  RefreshCw,
  Pause,
  ExternalLink,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  AlertCircle,
  Upload,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Play,
  Settings,
  MessageCircle,
  Camera,
  Phone,
  Check
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { completeMetaCampaignSchema, type CompleteMetaCampaign } from "@shared/schema";
import type { UploadedFile } from 'express-fileupload';

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

// Date range options
type DateRangeOption = {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
};

const getDateRangeOptions = (): DateRangeOption[] => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const weekStart = startOfWeek(today, { weekStartsOn: 6 }); // السبت
  const monthStart = startOfMonth(today);
  
  return [
    {
      value: 'today',
      label: 'اليوم',
      startDate: today,
      endDate: today
    },
    {
      value: 'yesterday',
      label: 'أمس',
      startDate: yesterday,
      endDate: yesterday
    },
    {
      value: 'week',
      label: 'هذا الأسبوع',
      startDate: weekStart,
      endDate: today
    },
    {
      value: 'month',
      label: 'هذا الشهر',
      startDate: monthStart,
      endDate: today
    },
    {
      value: 'all',
      label: 'طوال المدة',
      startDate: subDays(today, 365), // خر سنة
      endDate: today
    }
  ];
};

export default function PlatformAdsMetaManagement() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State for sidebar toggle  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);
  const [activeTab, setActiveTab] = useState("campaigns");
  
  // Update sidebar state when screen size changes
  useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [campaignStatus, setCampaignStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedAdSets, setSelectedAdSets] = useState<Set<string>>(new Set());
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [adSetStatusFilter, setAdSetStatusFilter] = useState<string>("all");
  const [adSetSearchTerm, setAdSetSearchTerm] = useState<string>("");
  const [adStatusFilter, setAdStatusFilter] = useState<string>("all");
  const [adSearchTerm, setAdSearchTerm] = useState<string>("");
  
  // Account filter state
  const [accountFilter, setAccountFilter] = useState<'all' | 'active' | 'needsPayment' | 'restricted' | 'needsSetup'>('all');
  const [selectOpen, setSelectOpen] = useState(false);
  
  // Function to handle filter click and open dropdown
  const handleFilterClick = (filter: 'all' | 'active' | 'needsPayment' | 'restricted' | 'needsSetup') => {
    setAccountFilter(filter);
    setSelectOpen(true);
  };
  
  // Date filter state
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>(getDateRangeOptions()[4]); // طوال المدة كافتراضي
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{from?: Date; to?: Date}>({});

  // QueryClient for cache invalidation
  const queryClient = useQueryClient();
  
  // Complete campaign creation state
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [campaignSectionCollapsed, setCampaignSectionCollapsed] = useState(false);
  const [adSetSectionCollapsed, setAdSetSectionCollapsed] = useState(true);
  const [adSectionCollapsed, setAdSectionCollapsed] = useState(true);
  const [targetingSectionCollapsed, setTargetingSectionCollapsed] = useState(true);
  const [campaignCompleted, setCampaignCompleted] = useState(false);
  const [adSetCompleted, setAdSetCompleted] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [targetingCompleted, setTargetingCompleted] = useState(false);
  
  // Geographic targeting visibility
  const [showRegionsSection, setShowRegionsSection] = useState(false);
  const [showCitiesSection, setShowCitiesSection] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // State لتخزين عدة فيديوهات
  const [uploadedVideos, setUploadedVideos] = useState<Array<{
    id: string;
    videoId: string;
    fileName: string;
    thumbnailUrl?: string;
    size: number;
    duration?: number;
  }>>([]);

  // دالة للحصول على التوقيت المحلي لبغداد
  const getBaghdadTime = () => {
    const now = new Date();
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Baghdad',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    const hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Query لجلب المنتجات
  const { data: products } = useQuery<any[]>({
    queryKey: ['/api/platform-products'],
    enabled: !!selectedAccount // Only fetch when account is selected
  });

  // Complete campaign form initialization
  const completeCampaignForm = useForm<CompleteMetaCampaign>({
    resolver: zodResolver(completeMetaCampaignSchema),
    defaultValues: {
      // Product data
      productId: "",
      
      // Ad Account
      adAccountId: "",
      
      // Campaign data
      campaignName: "",
      objective: "OUTCOME_SALES", // هدف التحويلات افتراضياً
      campaignBudgetMode: "UNLIMITED",
      campaignBudget: "",
      startTime: getBaghdadTime(),
      endTime: "",
      
      // Ad Set data
      adSetName: "",
      adSetBudgetMode: "DAILY_BUDGET",
      adSetBudget: "25", // ميزانية افتراضية 25 دينار عراقي
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      bidAmount: "",
      destinationType: "WEBSITE",
      
      // Ad data
      adName: "",
      adFormat: "SINGLE_VIDEO",
      landingPageUrl: "",
      displayName: "",
      adText: "",
      callToAction: "BOOK_NOW",
      
      // Media files
      videoUrl: "",
      imageUrls: [],
      imageHash: "",
      thumbnailUrl: "",
      
      // Pixel tracking
      pixelId: "",
      customEventType: "",
      
      // Facebook Page ID
      pageId: "",
      
      // وجهات الرسائل
      messageDestinations: [],
      
      // Targeting
      targeting: {
        genders: ["1", "2"], // جميع الأجناس
        ageMin: 18,
        ageMax: 65,
        geoLocations: {
          countries: ["IQ"],
          regions: [],
          cities: []
        },
        interests: [],
        behaviors: []
      },
      
      // Placements - مواضع الإعلان
      placements: {
        devicePlatforms: ["mobile"], // الأجهزة المحمولة افتراضياً
        publisherPlatforms: ["facebook", "instagram"], // Facebook و Instagram افتراضياً
        facebookPlacements: ["feed", "story"], // تغذية وقصص فيسبوك
        instagramPlacements: ["stream", "story", "reels"], // تغذية وقصص وريلز إنستغرام
        operatingSystems: ["iOS", "Android"], // iOS و Android افتراضياً
        connectionTypes: ["wifi", "cellular", "broadband"], // جميع أنواع الاتصال افتراضياً
        audienceNetwork: [], // اختياري - شبكة الجمهور
        advancedOptions: ["exclude_threads"] // استبعاد Threads افتراضياً
      },
    },
  });

  // Update form when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      completeCampaignForm.setValue('adAccountId', selectedAccount);
    }
  }, [selectedAccount, completeCampaignForm]);


  // إزالة الاتساب من أي قيم مفوظة
  useEffect(() => {
    const currentDestinations = completeCampaignForm.getValues('messageDestinations') || [];
    const filteredDestinations = currentDestinations.filter(dest => dest !== 'WHATSAPP');
    if (filteredDestinations.length !== currentDestinations.length) {
      completeCampaignForm.setValue('messageDestinations', filteredDestinations);
    }
  }, []);

  // دالة لملء البياات تلقائياً عند اختيار المنتج
  const handleProductSelect = async (productId: string) => {
    const selectedProduct = products?.find((p: any) => p.id === productId);
    if (selectedProduct) {
      const form = completeCampaignForm;
      
      // ملء الأسماء
      form.setValue('campaignName', `حملة ${selectedProduct.name}`);
      form.setValue('adSetName', `مجموعة ${selectedProduct.name}`);
      form.setValue('adName', `إلان ${selectedProduct.name}`);
      form.setValue('displayName', selectedProduct.name);
      
      // ملء نص الإلان من وصف المنتج
      if (selectedProduct.description) {
        form.setValue('adText', selectedProduct.description);
      }
      
      // جلب صفحة الهبوط اخاصة بالمنتج ومل الرابط
      try {
        const response = await fetch(`/api/platform-products/${productId}/landing-pages`);
        if (response.ok) {
          const landingPages = await response.json();
          if (landingPages && landingPages.length > 0) {
            const landingPage = landingPages[0]; // أخذ أو صفحة هبوط
            const platformSubdomain = landingPage.platform?.subdomain || '';
            // استخدام ومين الموقع الحاي مع النطاق الفرعي في المسار
            const landingPageUrl = `${window.location.origin}/${platformSubdomain}/${landingPage.customUrl || landingPage.id}`;
            form.setValue('landingPageUrl', landingPageUrl);
          }
        }
      } catch (error) {
        console.warn('فشل ف جلب صفحة الهبوط لمنتج:', error);
      }
    }
  };

  // Create complete campaign mutation
  const createCompleteCampaignMutation = useMutation({
    mutationFn: async (data: CompleteMetaCampaign) => {
      console.log('🎯 إرسل بيانات إنشاء حملة Meta الكاملة:', data);
      
      // حذف landingPageUrl من حملات الرائل
      const cleanData = { ...data };
      if (data.objective === 'OUTCOME_TRAFFIC') {
        delete cleanData.landingPageUrl;
        delete cleanData.pixelId;
        delete cleanData.customEventType;
      }
      
      console.log('🔧 البيانات النظيفة المرسلة:', cleanData);
      
      // إذا كان هناك عدة فيديوهات، أنشئ عدة إعلانات
      if (uploadedVideos.length > 0) {
        const campaignData = {
          ...cleanData,
          videos: uploadedVideos.map(video => ({
            videoId: video.videoId,
            fileName: video.fileName,
            thumbnailUrl: video.thumbnailUrl
          }))
        };

        console.log('🚀 إرسال طلب إنشاء حملة متعددة الإعلانات:', campaignData);
        
        const response = await fetch('/api/meta/campaigns/complete-multiple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData),
        });

        console.log('📡 استجابة الخادم:', response.status, response.statusText);

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          console.error('❌ خطأ في الاستجابة:', {
            status: response.status,
            statusText: response.statusText,
            contentType
          });
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || 'فشل في إنشاء الحملة مع عدة إعلانات');
          } else {
            const errorText = await response.text();
            console.error('❌ استجابة غير متوقعة:', errorText.substring(0, 200));
            throw new Error(`خطأ في الخادم: ${response.status} - ${response.statusText}`);
          }
        }

        const result = await response.json();
        console.log('✅ نتيجة إنشاء الحملة المتعددة:', result);
        return result;
      } else {
        // الطريقة العادية لإعلان واحد
        const response = await fetch('/api/meta/campaigns/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'فشل في إنشاء الحملة');
        }

        return response.json();
      }
    },
    onSuccess: (data) => {
      console.log('✅ تم إنشاء حملة Meta الكاملة بنجاح!', data);
      
      // عرض رسالة نجاح بالثيم
      toast({
        title: "🎉 تم إنشاء الحملة بنجاح",
        description: "تم إنشاء حملة Meta الكاملة مع المجموعة الإعلانية والإعلان",
        variant: "success",
      });
      
      // إغلاق dialog إنشاء الحملة وعرض dialog النجاح
      setCreateCampaignOpen(false);
      setSuccessDialogOpen(true);
      
      // رفرش الصفحة بعد 3 ثواني
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      completeCampaignForm.reset({
        // Product data
        productId: "",
        
        // Campaign data
        campaignName: "",
        objective: "OUTCOME_SALES", // هدف التحويلات افتراضياً
        campaignBudgetMode: "UNLIMITED",
        campaignBudget: "",
        startTime: getBaghdadTime(),
        endTime: "",
        
        // Ad Set data
        adSetName: "",
        adSetBudgetMode: "DAILY_BUDGET",
        adSetBudget: "25", // مزانية افتراضية 25 دينار عراقي
        bidStrategy: "LOWEST_COST_WITHOUT_CAP",
        bidAmount: "",
        destinationType: "WEBSITE",
        
        // Ad data
        adName: "",
        adFormat: "SINGLE_VIDEO",
        landingPageUrl: "",
        displayName: "",
        adText: "",
        adDescription: "",
        callToAction: "BOOK_NOW",
        
        // Media files
        videoUrl: "",
        
        // Targeting
        targeting: {
          ageMin: 18,
          ageMax: 65,
          genders: ["1", "2"],
          geoLocations: {
            countries: [],
            regions: [],
            cities: []
          },
          interests: []
        }
      });
      
      // إعادة تعيين حالة الأقسام
      setCampaignCompleted(false);
      setAdSetCompleted(false);
      setAdCompleted(false);
      setTargetingCompleted(false);
      setCampaignSectionCollapsed(false);
      setAdSetSectionCollapsed(true);
      setAdSectionCollapsed(true);
      setTargetingSectionCollapsed(true);
      
      // تحديث البيانات
      if (selectedAccount) {
        queryClient.invalidateQueries({ queryKey: ["/api/platform-ads/meta/campaigns", selectedAccount] });
      }
    },
    onError: (error: any) => {
      console.error('❌ خطأ في إنشاء حملة Meta الكاملة:', error);
      toast({
        title: "❌ فشل في إنشاء الحملة",
        description: error.message || "حدث خطأ أثناء إنشاء الحملة",
        variant: "destructive",
      });
    },
  });

  // Handle section click to show/hide sections
  const handleSectionClick = (section: string) => {
    switch (section) {
      case 'campaign':
        setCampaignSectionCollapsed(!campaignSectionCollapsed);
        break;
      case 'adset':
        setAdSetSectionCollapsed(!adSetSectionCollapsed);
        break;
      case 'ad':
        setAdSectionCollapsed(!adSectionCollapsed);
        break;
      case 'targeting':
        setTargetingSectionCollapsed(!targetingSectionCollapsed);
        break;
    }
  };

  // دالة رفع فيديو واحد
  const uploadSingleVideo = async (file: File): Promise<{
    videoId: string;
    fileName: string;
    thumbnailUrl?: string;
    size: number;
    duration?: number;
  }> => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch('/api/upload/meta-video/direct', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('يجب تسجيل الدخول أولاً للمتابعة.');
      }
      
      if (response.status === 400 && errorData.error === "Meta integration not configured") {
        throw new Error('لم يتم ربط حساب Meta بعد. يجب ربط الحساب أولاً من إعدادات المنصات الإعلانية.');
      }
      
      throw new Error(errorData.details || errorData.error || 'فشل في رفع الفيديو إلى Meta');
    }

    const result = await response.json();
    return {
      videoId: result.videoId,
      fileName: result.originalName || file.name,
      thumbnailUrl: result.thumbnailUrl,
      size: file.size,
      duration: result.duration
    };
  };

  // دالة رفع عدة فيديوهات
  const handleMultipleVideoUpload = async (files: FileList) => {
    setUploading(true);
    const newVideos: typeof uploadedVideos = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // التحقق من نوع الملف
        if (!file.type.startsWith('video/')) {
          toast({
            title: "❌ نوع ملف غير صحيح",
            description: `الملف "${file.name}" ليس فيديو`,
            variant: "destructive",
          });
          continue;
        }

        // التحقق من حجم الملف (أقل من 100MB)
        if (file.size > 100 * 1024 * 1024) {
          toast({
            title: "❌ حجم الملف كبير جداً",
            description: `الملف "${file.name}" يجب أن يكون أقل من 100MB`,
            variant: "destructive",
          });
          continue;
        }

        try {
          const uploadedVideo = await uploadSingleVideo(file);
          const videoData = {
            id: `video-${Date.now()}-${i}`,
            ...uploadedVideo
          };
          
          newVideos.push(videoData);
          
          toast({
            title: "✅ تم رفع الفيديو",
            description: `تم رفع "${uploadedVideo.fileName}" بنجاح (${i + 1}/${files.length})`,
            variant: "success",
          });
          
        } catch (error: any) {
          toast({
            title: "❌ خطأ في رفع الفيديو",
            description: `فشل رفع "${file.name}": ${error.message}`,
            variant: "destructive",
          });
        }
      }
      
      // إضافة الفيديوهات الجديدة للقائمة
      setUploadedVideos(prev => [...prev, ...newVideos]);
      
      if (newVideos.length > 0) {
        toast({
          title: "🎉 اكتمل الرفع",
          description: `تم رفع ${newVideos.length} فيديو من أصل ${files.length}`,
          variant: "success",
        });
      }
      
    } catch (error: any) {
      console.error('❌ خطأ في رفع الفيديوهات:', error);
      toast({
        title: "❌ خطأ عام في الرفع",
        description: error.message || "حدث خطأ أثناء رفع الفيديوهات",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // دالة حذف فيديو من القائمة
  const removeVideo = (videoId: string) => {
    setUploadedVideos(prev => prev.filter(video => video.id !== videoId));
  };

  // Mutation for toggling campaign status
  const toggleCampaignStatusMutation = useMutation({
    mutationFn: async ({ campaignId, status }: { campaignId: string; status: string }) => {
      console.log(`Toggling Meta campaign ${campaignId} to ${status}`);
      const response = await fetch(`/api/platform-ads/meta/campaigns/${campaignId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Meta campaign status update failed:", errorData);
        throw new Error(errorData.error || "فشل في تحدي حالة الحملة");
      }
      const result = await response.json();
      console.log("Meta campaign status update result:", result);
      return result;
    },
    onSuccess: () => {
      // Refresh campaigns data
      queryClient.invalidateQueries({ queryKey: ["/api/platform-ads/meta/campaigns", selectedAccount] });
      toast({
        title: "تم التحديث",
        description: "تم تديث حالة الحملة بنجاح",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة الحملة",
        variant: "destructive",
      });
    },
  });

  const toggleCampaignStatus = (campaignId: string, status: string) => {
    toggleCampaignStatusMutation.mutate({ campaignId, status });
  };

  // Mutation for toggling ad set status
  const toggleAdSetStatusMutation = useMutation({
    mutationFn: async ({ adSetId, status }: { adSetId: string; status: string }) => {
      console.log(`Toggling Meta ad set ${adSetId} to ${status}`);
      const response = await fetch(`/api/platform-ads/meta/adgroups/${adSetId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Meta ad set status update failed:", errorData);
        throw new Error(errorData.error || "فشل في تحديث حالة المجموعة اإعلانية");
      }
      const result = await response.json();
      console.log("Meta ad set status update result:", result);
      return result;
    },
    onSuccess: (data) => {
      // Refresh ad sets data
      queryClient.invalidateQueries({ queryKey: ["/api/platform-ads/meta/adgroups", selectedAccount] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-ads/meta/adgroup-insights"] });
      toast({
        title: "تم التحديث",
        description: `تم ${data.status === 'ACTIVE' ? 'تشغيل' : 'إيقاف'} المجموعة لإعلانية بنجاح`,
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة المموعة الإعلانية",
        variant: "destructive",
      });
    },
  });

  const toggleAdSetStatus = (adSetId: string, status: string) => {
    toggleAdSetStatusMutation.mutate({ adSetId, status });
  };

  // Mutation for toggling ad status
  const toggleAdStatusMutation = useMutation({
    mutationFn: async ({ adId, status }: { adId: string; status: string }) => {
      console.log(`Toggling Meta ad ${adId} to ${status}`);
      const response = await fetch(`/api/platform-ads/meta/ads/${adId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Meta ad status update failed:", errorData);
        throw new Error(errorData.error || "Failed to update ad status");
      }
      const result = await response.json();
      console.log("Meta ad status update result:", result);
      return result;
    },
    onSuccess: (data) => {
      // Refresh ads data
      queryClient.invalidateQueries({ queryKey: ["/api/platform-ads/meta/ads", selectedAccount] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-ads/meta/ad-insights"] });
      toast({
        title: "تم التحديث",
        description: `تم ${data.status === 'ACTIVE' ? 'تشغيل' : 'إيقاف'} الإعلان بنجاح`,
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ad status",
        variant: "destructive",
      });
    },
  });

  const toggleAdStatus = (adId: string, status: string) => {
    toggleAdStatusMutation.mutate({ adId, status });
  };

  // جلب جلسة المنصة
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/platform-session"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // جلب حالة الاتصال
  const { data: connectionStatus, isLoading: connectionLoading } = useQuery({
    queryKey: ["/api/platform-ads/connection-status"],
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // جلب الحسبات الإعلانية
  const { data: adAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/ad-accounts"],
    enabled: !!(connectionStatus as any)?.meta?.connected,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // جب البكسلات للحسا المختار
  const { data: pixels, isLoading: pixelsLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/pixels", selectedAccount],
    enabled: !!selectedAccount && !!(connectionStatus as any)?.meta?.connected,
    queryFn: async () => {
      const response = await fetch(`/api/platform-ads/meta/pixels/${selectedAccount}`);
      if (!response.ok) throw new Error('Failed to fetch pixels');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // جلب الصفحات
  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/pages"],
    enabled: !!(connectionStatus as any)?.meta?.connected,
    queryFn: async () => {
      const response = await fetch('/api/platform-ads/meta/pages');
      if (!response.ok) throw new Error('Failed to fetch pages');
      const data = await response.json();
      console.log('📄 بيانات الصفحات:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // تحديد أول بكسل وصفحة تلقائياً عند تحميل لبيانات
  useEffect(() => {
    if (pixels?.pixels && pages?.pages && pixels.pixels.length > 0 && pages.pages.length > 0) {
      const currentPixelId = completeCampaignForm.getValues('pixelId');
      const currentPageId = completeCampaignForm.getValues('pageId');
      
      if ((!currentPixelId || currentPixelId === "") || (!currentPageId || currentPageId === "")) {
        const firstPixel = pixels.pixels[0];
        const firstPage = pages.pages[0];
        
        // إعادة تعيين الفورم مع القيم الديدة
        const currentValues = completeCampaignForm.getValues();
        completeCampaignForm.reset({
          ...currentValues,
          pixelId: firstPixel.id,
          pageId: firstPage.id
        });
        
        console.log('🎯 تم تحديد البكسل الافتراضي:', firstPixel.name, firstPixel.id);
        console.log('📄 تم تحديد الصحة الافتراضية:', firstPage.name, firstPage.id);
      }
    }
  }, [pixels, pages, completeCampaignForm]);

  // جلب الحملات للحساب المختار
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/campaigns", selectedAccount],
    enabled: !!selectedAccount,
    queryFn: async () => {
      const response = await fetch(`/api/platform-ads/meta/campaigns/${selectedAccount}?limit=50`);
      if (!response.ok) {
        throw new Error('فشل في جلب الحملات');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // تصفية الحملت حسب البحث والحالة
  const filteredCampaigns = campaigns?.campaigns?.filter((campaign: any) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = campaignStatus === "all" || campaign.status.toLowerCase() === campaignStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  // جلب المجموعات الإعلانية للحساب المختار
  const { data: adSets, isLoading: adSetsLoading, error: adSetsError } = useQuery({
    queryKey: ["/api/platform-ads/meta/adgroups", selectedAccount],
    enabled: !!selectedAccount,
    queryFn: async () => {
      const response = await fetch(`/api/platform-ads/meta/adgroups/${selectedAccount}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Meta Ad Sets response:', data);
      return data;
    },
    staleTime: 30000,
    retry: (failureCount, error: any) => {
      // لا تعيد المحاولة في حالة rate limit - دع الباك إند يتعامل معها
      if (error?.message?.includes('User request limit reached') || 
          error?.message?.includes('يحتوي الحساب الإعلاني على الكثير ن استدعاءات API')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // جلب إحصايات الحملات
  const { data: campaignInsights, isLoading: campaignInsightsLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/campaign-insights", selectedAccount, selectedDateRange.value, selectedDateRange.startDate.toISOString(), selectedDateRange.endDate.toISOString()],
    queryFn: async () => {
      if (!selectedAccount || !campaigns?.campaigns) return {};
      
      const insights: Record<string, any> = {};
      const startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
      const endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
      
      // Fetch insights for each campaign with date range
      for (const campaign of campaigns.campaigns) {
        try {
          const response = await fetch(`/api/platform-ads/meta/campaign-insights/${campaign.id}?since=${startDate}&until=${endDate}`);
          if (response.ok) {
            const data = await response.json();
            insights[campaign.id] = data.insights || {};
          }
        } catch (error) {
          console.error(`Error fetching insights for campaign ${campaign.id}:`, error);
        }
      }
      
      return insights;
    },
    enabled: !!selectedAccount && !!campaigns?.campaigns,
    staleTime: 30000, // تحديث البيانات عد تغيير التاريخ
  });

  // جلب إحصائيا المجموعات الإعلنية
  const { data: adSetInsights, isLoading: adSetInsightsLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/adgroup-insights", selectedAccount, selectedDateRange.value, selectedDateRange.startDate.toISOString(), selectedDateRange.endDate.toISOString()],
    queryFn: async () => {
      if (!selectedAccount || !adSets?.adGroups) return {};
      
      const insights: Record<string, any> = {};
      const startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
      const endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
      
      // Fetch insights for each ad set with date range
      for (const adSet of adSets.adGroups) {
        try {
          const response = await fetch(`/api/platform-ads/meta/adgroup-insights/${adSet.id}?since=${startDate}&until=${endDate}`);
          if (response.ok) {
            const data = await response.json();
            insights[adSet.id] = data.insights || {};
          }
        } catch (error) {
          console.error(`Error fetching insights for ad set ${adSet.id}:`, error);
        }
      }
      
      return insights;
    },
    enabled: !!selectedAccount && !!adSets?.adGroups,
    staleTime: 30000, // تحديث البانات عند تغيير التاريخ
  });

  // جلب الإعلانات للحساب المختار
  const { data: ads, isLoading: adsLoading, error: adsError } = useQuery({
    queryKey: ["/api/platform-ads/meta/ads", selectedAccount],
    enabled: !!selectedAccount,
    queryFn: async () => {
      const response = await fetch(`/api/platform-ads/meta/ads/${selectedAccount}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Meta Ads response:', data);
      return data;
    },
    staleTime: 30000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('User request limit reached')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // جلب إحصائيا الإعلانات
  const { data: adInsights, isLoading: adInsightsLoading } = useQuery({
    queryKey: ["/api/platform-ads/meta/ad-insights", selectedAccount, selectedDateRange.value, selectedDateRange.startDate.toISOString(), selectedDateRange.endDate.toISOString()],
    queryFn: async () => {
      if (!selectedAccount || !ads?.ads) return {};
      
      const insights: Record<string, any> = {};
      const startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
      const endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
      
      // Fetch insights for each ad with date range
      for (const ad of ads.ads) {
        try {
          const response = await fetch(`/api/platform-ads/meta/ad-insights/${ad.id}?since=${startDate}&until=${endDate}`);
          if (response.ok) {
            const data = await response.json();
            insights[ad.id] = data.insights || {};
          }
        } catch (error) {
          console.error(`Error fetching insights for ad ${ad.id}:`, error);
        }
      }
      
      return insights;
    },
    enabled: !!selectedAccount && !!ads?.ads,
    staleTime: 30000,
  });

  // Hierarchical filtering functions - النظام الهرمي
  const getFilteredAdSets = () => {
    if (!adSets?.adGroups) return [];
    
    // If no campaigns are selected, show all ad sets
    if (selectedCampaigns.size === 0) {
      return adSets.adGroups.filter((adSet: any) => {
        const matchesStatus = adSetStatusFilter === "all" || adSet.status.toLowerCase() === adSetStatusFilter.toLowerCase();
        const matchesSearch = adSetSearchTerm === "" || adSet.name.toLowerCase().includes(adSetSearchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    }
    
    // Filter ad sets to only show those belonging to selected campaigns
    return adSets.adGroups.filter((adSet: any) => {
      const belongsToSelectedCampaign = selectedCampaigns.has(adSet.campaign_id);
      const matchesStatus = adSetStatusFilter === "all" || adSet.status.toLowerCase() === adSetStatusFilter.toLowerCase();
      const matchesSearch = adSetSearchTerm === "" || adSet.name.toLowerCase().includes(adSetSearchTerm.toLowerCase());
      return belongsToSelectedCampaign && matchesStatus && matchesSearch;
    });
  };

  const getFilteredAds = () => {
    if (!ads?.ads || ads.ads.length === 0) {
      return [];
    }
    
    // If no campaigns or ad sets are selected, show all ads
    if (selectedCampaigns.size === 0 && selectedAdSets.size === 0) {
      return ads.ads.filter((ad: any) => {
        const matchesStatus = adStatusFilter === "all" || ad.status.toLowerCase() === adStatusFilter.toLowerCase();
        const matchesSearch = adSearchTerm === "" || ad.name.toLowerCase().includes(adSearchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    }
    
    // Filter ads based on selected campaigns and ad sets
    const filteredAds = ads.ads.filter((ad: any) => {
      // If specific ad sets are selected, show ads from those ad sets
      if (selectedAdSets.size > 0) {
        return selectedAdSets.has(ad.adset?.id);
      }
      
      // If only campaigns are selected, show ads from ad sets that belong to selected campaigns
      if (selectedCampaigns.size > 0) {
        // Find the ad set this ad belongs to
        const adSet = adSets?.adGroups?.find((ag: any) => ag.id === ad.adset?.id);
        if (adSet) {
          return selectedCampaigns.has(adSet.campaign_id);
        }
        return false;
      }
      
      return true;
    }).filter((ad: any) => {
      const matchesStatus = adStatusFilter === "all" || ad.status.toLowerCase() === adStatusFilter.toLowerCase();
      const matchesSearch = adSearchTerm === "" || ad.name.toLowerCase().includes(adSearchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    
    return filteredAds;
  };

  // Use the hierarchical filtering functions
  const filteredAdSets = getFilteredAdSets();
  const filteredAds = getFilteredAds();

  // Helper function to get action value
  const getActionValue = (insights: any, actionType: string): number => {
    if (!insights.actions) return 0;
    const action = insights.actions.find((a: any) => a.action_type === actionType);
    return action ? parseFloat(action.value) : 0;
  };

  // Helper function to get leads/messaging (محادثات)
  const getLeadsValue = (insights: any): number => {
    if (!insights.actions) return 0;
    
    // جميع أنواع المحادثات (بما في ذلك حفظ المنشور)
    const conversationStarted = getActionValue(insights, 'onsite_conversion.messaging_conversation_started_7d');
    const conversationReplied = getActionValue(insights, 'onsite_conversion.messaging_conversation_replied_7d');
    const messagingFirstReply = getActionValue(insights, 'onsite_conversion.messaging_first_reply');
    const totalMessaging = getActionValue(insights, 'onsite_conversion.total_messaging_connection');
    const webLeads = getActionValue(insights, 'onsite_web_lead');
    const groupedLeads = getActionValue(insights, 'onsite_conversion.lead_grouped'); 
    const basicLeads = getActionValue(insights, 'lead');
    const onsiteConversionLead = getActionValue(insights, 'onsite_conversion.lead');
    const postSave = getActionValue(insights, 'onsite_conversion.post_save'); // حفظ المنشور كليد وليس كشراء
    
    // تجميع جميع أنواع المحادثات
    return conversationStarted + conversationReplied + messagingFirstReply + totalMessaging + webLeads + groupedLeads + basicLeads + onsiteConversionLead + postSave;
  };

  // Helper function to get conversions/purchases (شراء عبر الويب فقط) - مطابق لمنطق الخام
  const getConversionsValue = (insights: any): number => {
    if (!insights.actions) return 0;
    
    // استخدام نفس منطق الخادم لفلترة أفعال الشراء
    const purchaseActions = insights.actions.filter((action: any) => 
      (action.action_type.includes('purchase') || 
       action.action_type.includes('buy') ||
       action.action_type.includes('order')) &&
      // استبعاد أي شيء يحوي على view أو messaging أو conversation
      !action.action_type.includes('view') &&
      !action.action_type.includes('messaging') && 
      !action.action_type.includes('conversation') &&
      !action.action_type.includes('post_save') && 
      !action.action_type.includes('lead')
    );
    
    // تجميع قيم أفعال الشراء الفعلية
    return purchaseActions.reduce((total: number, action: any) => {
      return total + parseFloat(action.value);
    }, 0);
  };

  // Helper function to get cost per action
  const getCostPerAction = (insights: any, actionType: string): number => {
    if (!insights.cost_per_action_type) return 0;
    const cost = insights.cost_per_action_type.find((c: any) => c.action_type === actionType);
    return cost ? parseFloat(cost.value) : 0;
  };

  // Hierarchical selection handlers - معالج الاختيار الهرمي
  const handleCampaignSelection = (campaignId: string, isSelected: boolean) => {
    const newSelectedCampaigns = new Set(selectedCampaigns);
    const newSelectedAdSets = new Set(selectedAdSets);
    const newSelectedAds = new Set(selectedAds);
    
    if (isSelected) {
      newSelectedCampaigns.add(campaignId);
      // Auto-select all ad sets belonging to this campaign
      const campaignAdSets = adSets?.adGroups?.filter((ag: any) => ag.campaign_id === campaignId) || [];
      campaignAdSets.forEach((ag: any) => newSelectedAdSets.add(ag.id));
      // Auto-select all ads belonging to these ad sets
      const campaignAds = ads?.ads?.filter((ad: any) => {
        const adSet = adSets?.adGroups?.find((ag: any) => ag.id === ad.adset?.id);
        return adSet && adSet.campaign_id === campaignId;
      }) || [];
      campaignAds.forEach((ad: any) => newSelectedAds.add(ad.id));
    } else {
      newSelectedCampaigns.delete(campaignId);
      // Remove all ad sets belonging to this campaign
      const campaignAdSets = adSets?.adGroups?.filter((ag: any) => ag.campaign_id === campaignId) || [];
      campaignAdSets.forEach((ag: any) => newSelectedAdSets.delete(ag.id));
      // Remove all ads belonging to these ad sets
      const campaignAds = ads?.ads?.filter((ad: any) => {
        const adSet = adSets?.adGroups?.find((ag: any) => ag.id === ad.adset?.id);
        return adSet && adSet.campaign_id === campaignId;
      }) || [];
      campaignAds.forEach((ad: any) => newSelectedAds.delete(ad.id));
    }
    
    setSelectedCampaigns(newSelectedCampaigns);
    setSelectedAdSets(newSelectedAdSets);
    setSelectedAds(newSelectedAds);
  };

  const handleAdSetSelection = (adSetId: string, campaignId: string, isSelected: boolean) => {
    const newSelectedAdSets = new Set(selectedAdSets);
    const newSelectedAds = new Set(selectedAds);
    
    if (isSelected) {
      newSelectedAdSets.add(adSetId);
      // Auto-select parent campaign if not already selected
      setSelectedCampaigns(prev => new Set(prev).add(campaignId));
      // Auto-select all ads belonging to this ad set
      const adSetAds = ads?.ads?.filter((ad: any) => ad.adset?.id === adSetId) || [];
      adSetAds.forEach((ad: any) => newSelectedAds.add(ad.id));
    } else {
      newSelectedAdSets.delete(adSetId);
      // Remove all ads belonging to this ad set
      const adSetAds = ads?.ads?.filter((ad: any) => ad.adset?.id === adSetId) || [];
      adSetAds.forEach((ad: any) => newSelectedAds.delete(ad.id));
    }
    
    setSelectedAdSets(newSelectedAdSets);
    setSelectedAds(newSelectedAds);
  };

  const handleAdSelection = (adId: string, adSetId: string, campaignId: string, isSelected: boolean) => {
    const newSelectedAds = new Set(selectedAds);
    
    if (isSelected) {
      newSelectedAds.add(adId);
      // Auto-select parent ad set and campaign if not already selected
      setSelectedAdSets(prev => new Set(prev).add(adSetId));
      setSelectedCampaigns(prev => new Set(prev).add(campaignId));
    } else {
      newSelectedAds.delete(adId);
    }
    
    setSelectedAds(newSelectedAds);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PAUSED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'نشطة';
      case 'PAUSED': return 'متوقة';
      case 'ARCHIVED': return 'مؤرشفة';
      default: return status;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme-primary-lighter">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
          <p className="text-theme-primary font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary-lighter flex" dir="rtl">
      {/* Sidebar */}
      <PlatformSidebar 
        session={session as PlatformSession}
        currentPath="/platform-ads-meta-management"
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'mr-0 lg:mr-16' : 'mr-0 lg:mr-64'}`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">إدارة إعلانات ميتا</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة شاملة لحملات فيسبوك وإنستغرام</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-w-6xl mx-auto">
          {/* Connection Status Check */}
          {connectionLoading ? (
            <Card className="theme-border bg-theme-primary-lighter mb-6">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">جاري فحص حاة الاتصال...</p>
              </CardContent>
            </Card>
          ) : !(connectionStatus as any)?.meta?.connected ? (
            <Card className="theme-border bg-theme-primary-lighter mb-6">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Target className="w-16 h-16 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    الاتصال بـ Meta غير مفعل
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    جب أولاً ربط حسابك في Meta Business Manager للوصول إلى إدارة احملات
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/platform-ads-meta'}
                    className="bg-theme-gradient hover:opacity-90"
                  >
                    <ExternalLink className="ml-1 h-4 w-4" />
                    ربط حساب Meta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Payment Required Warning - Only show when selected account needs payment */}
              {selectedAccount && (adAccounts as any)?.accounts && (() => {
                const accounts = (adAccounts as any).accounts;
                // البحث عن الحساب المختار
                const selectedAccountData = accounts.find((acc: any) => 
                  acc.id.replace('act_', '') === selectedAccount
                );

                if (!selectedAccountData) return null;

                // فحص إذا كان الحساب المختار يحتاج دفع
                const needsPayment = 
                  selectedAccountData.account_status === 2 || // DISABLED due to payment issues
                  selectedAccountData.account_status === 3 || // UNSETTLED
                  (selectedAccountData.balance && parseInt(selectedAccountData.balance) < 0); // negative balance

                if (needsPayment) {
                  // حساب المبلغ المطلوب للحساب المختار فقط
                  const balance = selectedAccountData.balance ? parseInt(selectedAccountData.balance) : 0;
                  const amountOwed = selectedAccountData.amount_owed ? parseInt(selectedAccountData.amount_owed) : 0;
                  const totalAmountOwed = Math.max(Math.abs(balance), Math.abs(amountOwed));

                  // تحويل من cents إلى دولار
                  const totalOwedInDollars = (totalAmountOwed / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

                  return (
                    <Card className="theme-border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-red-800 dark:text-red-300">
                              🔒 الحساب مطلوب الدفع
                            </h3>
                            <p className="text-red-700 dark:text-red-300 max-w-md text-lg">
                              لا يمكن إنشاء أو التحكم في الحملات لهذا الحساب حتى يتم تسديد المبلغ المطلوب
                            </p>
                            <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 mt-4">
                              <div className="text-lg font-medium text-red-700 dark:text-red-300 mb-2">
                                {selectedAccountData.name}
                              </div>
                              <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                                ${totalOwedInDollars}
                              </div>
                              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                                المبلغ المطلوب تسديده
                              </div>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                              يرجى الدخول إلى <strong>Facebook Business Manager</strong> لتسديد المبلغ المطلوب
                            </p>
                          </div>
                          <Button 
                            onClick={() => window.open('https://business.facebook.com/billing_hub/payment_methods', '_blank')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="lg"
                          >
                            <ExternalLink className="ml-1 h-4 w-4" />
                            فتح إعدادات الدفع في فيسبوك
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Ad Accounts Selection */}
              <Card className="theme-border bg-theme-primary-lighter mb-6">
                <CardHeader>
                  <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                    <Users className="w-5 h-5" />
                    الحسابات الإعلانية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accountsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                      <p className="mr-4 text-gray-600 dark:text-gray-400">جاري تحميل الحسابات...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Select value={selectedAccount} onValueChange={setSelectedAccount} open={selectOpen} onOpenChange={setSelectOpen}>
                        <SelectTrigger className="w-full theme-border text-right">
                          <SelectValue placeholder="اختر الحساب الإعلاني" />
                        </SelectTrigger>
                        <SelectContent>
                          {(adAccounts as any)?.accounts
                            ?.filter((account: any) => {
                              if (accountFilter === 'all') return true;
                              if (accountFilter === 'active') return account.account_status === 1;
                              if (accountFilter === 'needsPayment') return account.account_status === 2 || account.account_status === 3 || (account.balance && parseInt(account.balance) < 0);
                              if (accountFilter === 'restricted') return account.account_status === 7 || account.account_status === 9 || account.account_status === 101;
                              if (accountFilter === 'needsSetup') return account.account_status === 8 || account.account_status === 100;
                              return false;
                            })
                            ?.map((account: any) => {
                              const getStatusText = (status: number) => {
                                switch(status) {
                                  case 1: return '🟢 نشط';
                                  case 2: return '🔴 معطل للدفع';
                                  case 3: return '🔴 غير مسدد';
                                  case 7: return '🟠 مراعة أمنية';
                                  case 8: return '🟡 غير متاح مؤقتاً';
                                  case 9: return '🟠 مراجعة دفع';
                                  case 100: return '🟡 إغلاق معلق';
                                  case 101: return '🟠 فترة سماح';
                                  default: return `حالة ${status}`;
                                }
                              };
                              
                              return (
                                <SelectItem key={account.id} value={account.id.replace('act_', '')}>
                                  <div className="text-right">
                                    <div className="font-medium">{account.name}</div>
                                    <div className="text-sm text-gray-500">{account.currency} • {getStatusText(account.account_status)}</div>
                                    {account.balance && parseInt(account.balance) !== 0 && (
                                      <div className="text-xs text-red-500">رصيد: ${(parseInt(account.balance) / 100).toFixed(2)}</div>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      
                      {(adAccounts as any)?.accounts && (() => {
                        const accounts = (adAccounts as any).accounts;
                        console.log('🔍 تحليل الحسابات:', accounts.slice(0, 2)); // للفحص
                        
                        const activeAccounts = accounts.filter((acc: any) => acc.account_status === 1);
                        const needsPayment = accounts.filter((acc: any) => 
                          acc.account_status === 2 || // DISABLED due to payment issues
                          acc.account_status === 3 || // UNSETTLED
                          (acc.balance && parseInt(acc.balance) < 0) // negative balance
                        );
                        const restricted = accounts.filter((acc: any) => 
                          acc.account_status === 7 || // PENDING_RISK_REVIEW
                          acc.account_status === 9 || // PENDING_SETTLEMENT
                          acc.account_status === 101 // IN_GRACE_PERIOD
                        );
                        const needsSetup = accounts.filter((acc: any) => 
                          acc.account_status === 8 || // TEMPORARILY_UNAVAILABLE
                          acc.account_status === 100 // PENDING_CLOSURE
                        );
                        
                        // ساب إجمالي المباغ المطلوبة
                        const totalAmountOwed = needsPayment.reduce((total: number, acc: any) => {
                          const balance = acc.balance ? parseInt(acc.balance) : 0;
                          const amountOwed = acc.amount_owed ? parseInt(acc.amount_owed) : 0;
                          return total + Math.max(balance, amountOwed);
                        }, 0);
                        
                        // حساب إجمالي المبالغ المنفقة للحسابات المطلوبة
                        const totalSpentNeedsPayment = needsPayment.reduce((total: number, acc: any) => {
                          const spent = acc.amount_spent ? parseInt(acc.amount_spent) : 0;
                          return total + spent;
                        }, 0);
                        
                        // تحويل من cents إلى ولار مع تنسيق الفواصل
                        const totalOwedInDollars = (totalAmountOwed / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        const totalSpentNeedsPaymentInDollars = (totalSpentNeedsPayment / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        
                        // حساب إجمالي البالغ المنفقة للحابات النشطة
                        const totalSpentActive = activeAccounts.reduce((total: number, acc: any) => {
                          const spent = acc.amount_spent ? parseInt(acc.amount_spent) : 0;
                          return total + spent;
                        }, 0);
                        const totalSpentInDollars = (totalSpentActive / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        
                        console.log('📊 العدادات:', { 
                          active: activeAccounts.length, 
                          needsPayment: needsPayment.length, 
                          restricted: restricted.length, 
                          needsSetup: needsSetup.length, 
                          totalOwed: totalOwedInDollars, 
                          totalSpentActive: totalSpentInDollars,
                          totalSpentNeedsPayment: totalSpentNeedsPaymentInDollars
                        });
                        
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                            <div 
                              onClick={() => handleFilterClick('all')}
                              className={`text-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                accountFilter === 'all' 
                                  ? 'bg-theme-gradient text-white shadow-lg ring-2 ring-theme-primary' 
                                  : 'bg-theme-primary-light dark:bg-gray-800 hover:bg-theme-primary hover:text-white'
                              }`}
                            >
                              <div className={`text-xl font-bold ${
                                accountFilter === 'all' ? 'text-white' : 'text-theme-primary'
                              }`}>{accounts.length}</div>
                              <div className={`text-xs ${
                                accountFilter === 'all' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                              }`}>إجمالي الحسابات</div>
                            </div>
                            <div 
                              onClick={() => handleFilterClick('active')}
                              className={`text-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                accountFilter === 'active'
                                  ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-500'
                                  : 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-600 hover:text-white'
                              }`}
                            >
                              <div className={`text-xl font-bold ${
                                accountFilter === 'active' ? 'text-white' : 'text-green-600 dark:text-green-400'
                              }`}>
                                {activeAccounts.length}
                              </div>
                              <div className={`text-xs ${
                                accountFilter === 'active' ? 'text-white/90' : 'text-green-600 dark:text-green-400'
                              }`}>حساب نشط</div>
                              {totalSpentActive > 0 && (
                                <div className={`text-xs font-medium mt-1 ${
                                  accountFilter === 'active' ? 'text-white' : 'text-green-700 dark:text-green-300'
                                }`}>
                                  منفق كلياً: {totalSpentInDollars} $
                                </div>
                              )}
                            </div>
                            <div 
                              onClick={() => handleFilterClick('needsPayment')}
                              className={`text-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                accountFilter === 'needsPayment'
                                  ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-500'
                                  : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-600 hover:text-white'
                              }`}
                            >
                              <div className={`text-xl font-bold ${
                                accountFilter === 'needsPayment' ? 'text-white' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {needsPayment.length}
                              </div>
                              <div className={`text-xs ${
                                accountFilter === 'needsPayment' ? 'text-white/90' : 'text-red-600 dark:text-red-400'
                              }`}>مطلوب دفع</div>
                              <div className={`text-xs font-medium mt-1 space-y-0.5 ${
                                accountFilter === 'needsPayment' ? 'text-white' : 'text-red-700 dark:text-red-300'
                              }`}>
                                {totalAmountOwed > 0 && (
                                  <div>مطلوب: {totalOwedInDollars} $</div>
                                )}
                                {totalSpentNeedsPayment > 0 && (
                                  <div>منفق: {totalSpentNeedsPaymentInDollars} $</div>
                                )}
                              </div>
                            </div>
                            <div 
                              onClick={() => handleFilterClick('restricted')}
                              className={`text-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                accountFilter === 'restricted'
                                  ? 'bg-orange-600 text-white shadow-lg ring-2 ring-orange-500'
                                  : 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-600 hover:text-white'
                              }`}
                            >
                              <div className={`text-xl font-bold ${
                                accountFilter === 'restricted' ? 'text-white' : 'text-orange-600 dark:text-orange-400'
                              }`}>
                                {restricted.length}
                              </div>
                              <div className={`text-xs ${
                                accountFilter === 'restricted' ? 'text-white/90' : 'text-orange-600 dark:text-orange-400'
                              }`}>حساب مقيد</div>
                            </div>
                            <div 
                              onClick={() => handleFilterClick('needsSetup')}
                              className={`text-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                accountFilter === 'needsSetup'
                                  ? 'bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-500'
                                  : 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-600 hover:text-white'
                              }`}
                            >
                              <div className={`text-xl font-bold ${
                                accountFilter === 'needsSetup' ? 'text-white' : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {needsSetup.length}
                              </div>
                              <div className={`text-xs ${
                                accountFilter === 'needsSetup' ? 'text-white/90' : 'text-yellow-600 dark:text-yellow-400'
                              }`}>يحتاج إعداد</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Date Filter */}
              {selectedAccount && (
                <Card className="theme-border bg-theme-primary-lighter">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div></div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">الفترة ازمنية:</span>
                        {getDateRangeOptions().map((option) => (
                          <Button
                            key={option.value}
                            variant={selectedDateRange.value === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDateRange(option)}
                            className={selectedDateRange.value === option.value 
                              ? "bg-theme-gradient hover:bg-theme-gradient/80 text-white border-0" 
                              : "hover:bg-theme-primary hover:text-white border-theme-primary text-xs"
                            }
                          >
                            {option.label}
                          </Button>
                        ))}
                        <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs hover:bg-theme-primary hover:text-white border-theme-primary">
                              <CalendarIcon className="ml-1 h-3 w-3" />
                              تاريخ مخصص
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <div className="space-y-3">
                              <div className="text-sm font-medium">اختر فتة مخصصة</div>
                              <div className="text-xs text-muted-foreground">
                                اختر تاريخ البدية أولاً ثم تاريخ النهاية
                              </div>
                              
                              <Calendar
                                mode="range"
                                selected={{ from: customDateRange.from, to: customDateRange.to }}
                                onSelect={(range) => {
                                  setCustomDateRange({ from: range?.from, to: range?.to });
                                }}
                                disabled={[{ after: new Date() }]}
                                numberOfMonths={1}
                                locale={ar}
                                className="rounded-md border"
                              />
                              
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCustomDateRange({});
                                    setCustomDateOpen(false);
                                  }}
                                  className="text-xs"
                                >
                                  إلغاء
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (customDateRange.from && customDateRange.to) {
                                      setSelectedDateRange({
                                        value: 'custom',
                                        label: 'مخصص',
                                        startDate: customDateRange.from,
                                        endDate: customDateRange.to
                                      });
                                      setCustomDateOpen(false);
                                    }
                                  }}
                                  disabled={!customDateRange.from || !customDateRange.to}
                                  className="bg-theme-gradient hover:bg-theme-gradient/80 text-white border-0 text-xs"
                                >
                                  تطبيق
                                </Button>
                              </div>
                              
                              {customDateRange?.from && customDateRange?.to && (
                                <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded text-center">
                                  <div className="font-medium text-xs mb-1">لفترة المحددة:</div>
                                  <div className="text-xs">
                                    {format(customDateRange.from, "MM/dd", { locale: ar })} - {format(customDateRange.to, "MM/dd", { locale: ar })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {/* عرض الفترة المحددة */}
                    <div className="text-sm text-muted-foreground dark:text-gray-300 mt-3 p-3 bg-theme-primary-light dark:bg-gray-700 rounded-lg theme-border">
                      📊 البيانات المعروضة للفترة: <span className="font-medium text-theme-primary">{selectedDateRange.label}</span>
                      <span className="mr-2">({format(selectedDateRange.startDate, "yyyy/MM/dd", { locale: ar })} - {format(selectedDateRange.endDate, "yyyy/MM/dd", { locale: ar })})</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Content Tabs */}
              {selectedAccount && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  {/* Campaigns Tab */}
                  <TabsContent value="campaigns" className="space-y-3">
                    {/* Control Panel - منفصل عن الجدول */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-semibold text-theme-primary">
                              الحملات العلانية ({filteredCampaigns.length})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="البحث في الحمات..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10 theme-border text-right w-40 text-sm"
                              />
                            </div>
                            {/* Status Filter */}
                            <Select value={campaignStatus} onValueChange={setCampaignStatus}>
                              <SelectTrigger className="w-32 theme-border text-right text-sm">
                                <SelectValue placeholder="حالة الحملة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">جميع الحملات</SelectItem>
                                <SelectItem value="active">نشطة</SelectItem>
                                <SelectItem value="paused">متوقفة</SelectItem>
                                <SelectItem value="archived">مؤرشفة</SelectItem>
                              </SelectContent>
                            </Select>
                            <Dialog open={createCampaignOpen} onOpenChange={(open) => {
                              if (open) {
                                // إعداد القيم الافتراضية مع البكسل والفحة
                                // اختيار أول كسل لا يحتوي على "بلا اتصال"
                                const availablePixels = pixels?.pixels || [];
                                const firstPixel = availablePixels.find((p: any) => !p.name.includes("بلا اتصال")) || availablePixels[0];
                                const firstPage = pages?.pages?.[0];
                                
                                // إعادة تعيين النموذج بالقيم الافتراضية
                                completeCampaignForm.reset({
                                  // Product data
                                  productId: "",
                                  
                                  // Ad Account
                                  adAccountId: selectedAccount || "",
                                  
                                  // Campaign data
                                  campaignName: "",
                                  objective: "OUTCOME_SALES",
                                  campaignBudgetMode: "UNLIMITED",
                                  campaignBudget: "",
                                  startTime: getBaghdadTime(),
                                  endTime: "",
                                  
                                  // Ad Set data
                                  adSetName: "",
                                  adSetBudgetMode: "DAILY_BUDGET",
                                  adSetBudget: "25",
                                  bidStrategy: "LOWEST_COST_WITHOUT_CAP",
                                  bidAmount: "",
                                  destinationType: "WEBSITE",
                                  
                                  // Ad data
                                  adName: "",
                                  adFormat: "SINGLE_VIDEO",
                                  landingPageUrl: "",
                                  displayName: "",
                                  adText: "",
                                  adDescription: "",
                                  callToAction: "MESSAGE_PAGE", // افتراضي للرائل
                                  
                                  // Media files
                                  videoUrl: "",
                                  
                                  // Pixel and Page - القيم الافتراضية المهمة!
                                  pixelId: firstPixel?.id || "",
                                  customEventType: "",
                                  pageId: firstPage?.id || "",
                                  
                                  // Message destinations
                                  messageDestinations: [],
                                  
                                  // Targeting - العراق كافتراضي
                                  targeting: {
                                    genders: ["1", "2"],
                                    ageMin: 18,
                                    ageMax: 65,
                                    geoLocations: {
                                      countries: ["IQ"], // العراق افتراضياً
                                      regions: [],
                                      cities: []
                                    },
                                    interests: [],
                                    behaviors: []
                                  },
                                  
                                  // Placements - المواضع الافتراضية
                                  placements: {
                                    devicePlatforms: ["mobile"], // الأجهزة المحمولة افتراضياً
                                    publisherPlatforms: ["facebook", "instagram"],
                                    facebookPlacements: ["feed", "right_hand_column", "instant_article"],
                                    instagramPlacements: ["stream", "story", "reels"],
                                    operatingSystems: ["iOS", "Android"], // iOS و Android افتراضياً
                                    connectionTypes: ["wifi", "cellular", "broadband"], // جميع أنواع الاتصال افتراضياً
                                    audienceNetwork: [], // اختياري - شبكة الجمهور
                                    advancedOptions: ["exclude_threads"] // استبعاد Threads افتراضياً
                                  }
                                });
                                
                                console.log('🎯 تم إعداد المودال مع القيم الافتراضية:');
                                console.log('📄 الصفحة:', firstPage?.name, firstPage?.id);
                                console.log('🎯 البكسل:', firstPixel?.name, firstPixel?.id);
                                console.log('🌍 الاستهداف: العراق');
                              }
                              setCreateCampaignOpen(open);
                            }}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                                  disabled={!selectedAccount}
                                  title={!selectedAccount ? "يرجى اختيار الحساب الإعلاني أولاً" : ""}
                                >
                                  <Plus className="h-3 w-3 ml-1" />
                                  إنشاء حملة كاملة
                                </Button>
                              </DialogTrigger>
                              
                              <DialogContent className="max-w-4xl bg-black/100 border-gray-700 backdrop-blur-sm theme-border max-h-[85vh] overflow-y-auto">
                                <DialogHeader className="text-right">
                                  <DialogTitle className="text-theme-primary text-lg font-semibold">إنشاء حملة Meta كاملة</DialogTitle>
                                  <DialogDescription className="text-theme-primary/70 text-sm">
                                    إنشاء حملة إعلانية شاملة مع المجموعة الإعلانية والإعلان (هدفي الرسائل والتحويلات فقط)
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div>
                                  <Form {...completeCampaignForm}>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      
                                      // التحقق من اختيار الحساب الإعلاني
                                      if (!selectedAccount) {
                                        toast({
                                          title: "خطأ",
                                          description: "يرجى اختيار الحساب الإعلاني أولاً",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      // الحصول على بيانات النموذج مع إضافة adAccountId
                                      const formData = completeCampaignForm.getValues();
                                      const dataToSend = {
                                        ...formData,
                                        adAccountId: selectedAccount
                                      };
                                      
                                      createCompleteCampaignMutation.mutate(dataToSend);
                                    }} className="compact-form">
                                      
                                      {/* قسم اختيار المنتج */}
                                      <div className="form-section bg-theme-primary-light border theme-border rounded-lg mb-4">
                                        <div className="p-3">
                                          <h3 className="text-base font-medium mb-3 text-theme-primary flex items-center">
                                            <span className="bg-theme-gradient text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">0</span>
                                            اختيار المنتج
                                          </h3>
                                          
                                          <FormField
                                            control={completeCampaignForm.control}
                                            name="productId"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-theme-primary">اختر المنتج للحملة</FormLabel>
                                                <Select 
                                                  onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleProductSelect(value);
                                                  }} 
                                                  value={field.value}
                                                >
                                                  <FormControl>
                                                    <SelectTrigger className="theme-input">
                                                      <SelectValue placeholder="اختر منتج لإنشاء الحملة" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent className="bg-black border-gray-700">
                                                    {products?.map((product: any) => (
                                                      <SelectItem key={product.id} value={product.id}>
                                                        {product.name}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                                <FormDescription>سيتم ملء يانات الحملة تلقئياً من معلومات المنتج</FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>

                                      {/* قسم بيانات الحملة */}
                                      <div className="form-section bg-theme-primary-light border theme-border rounded-lg">
                                        <h3 
                                          className={`text-base font-medium mb-2 flex items-center justify-between cursor-pointer hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm p-2 rounded transition-colors ${
                                            campaignCompleted 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-theme-primary'
                                          }`}
                                          onClick={() => handleSectionClick('campaign')}
                                        >
                                          {campaignSectionCollapsed ? 
                                            <ChevronDown className="h-4 w-4" /> : 
                                            <ChevronUp className="h-4 w-4" />
                                          }
                                          <div className="flex items-center">
                                            {campaignCompleted ? (
                                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                1
                                              </span>
                                            ) : (
                                              <span className="bg-theme-gradient text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">1</span>
                                            )}
                                            بيانات الحملة
                                            {campaignCompleted && (
                                              <CheckCircle className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                                            )}
                                          </div>
                                        </h3>
                                        
                                        {!campaignSectionCollapsed && (
                                          <div className="space-y-4">
                                            {/* Campaign Name & Objective */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="campaignName"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">اسم الحملة</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        placeholder="حملة تسويق المنتج الجديد" 
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="objective"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">هدف الحملة</FormLabel>
                                                    <Select onValueChange={(value) => {
                                                      field.onChange(value);
                                                      // تحديث زر الدعوة حسب الهف
                                                      if (value === 'OUTCOME_TRAFFIC') {
                                                        completeCampaignForm.setValue('callToAction', 'MESSAGE_PAGE');
                                                      } else if (value === 'OUTCOME_SALES') {
                                                        completeCampaignForm.setValue('callToAction', 'BOOK_NOW');
                                                      }
                                                    }} value={field.value || "OUTCOME_SALES"} defaultValue="OUTCOME_SALES">
                                                      <FormControl>
                                                        <SelectTrigger className="theme-input">
                                                          <SelectValue placeholder="اختر هدف الحملة" />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent className="bg-black border-gray-700 z-50">
                                                        <SelectItem value="OUTCOME_TRAFFIC">حملة رسائل (Messages)</SelectItem>
                                                        <SelectItem value="OUTCOME_SALES">حملة تحيلات (Conversions)</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            
                                            {/* Budget Type & Amount */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="campaignBudgetMode"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">نوع الميزانية (اختياري)</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                      <FormControl>
                                                        <SelectTrigger className="theme-input">
                                                          <SelectValue placeholder="اختر نوع الميزانية" />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent className="bg-black border-gray-700">
                                                        <SelectItem value="UNLIMITED">لا محدود (افتراضي)</SelectItem>
                                                        <SelectItem value="DAILY_BUDGET">ميزانية يومية</SelectItem>
                                                        <SelectItem value="LIFETIME_BUDGET">ميزانية إجمالية</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="campaignBudget"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">
                                                      {(() => {
                                                        const budgetMode = completeCampaignForm.watch('campaignBudgetMode');
                                                        if (budgetMode === 'UNLIMITED') return 'ميزانية الحملة (USD)';
                                                        if (budgetMode === 'DAILY_BUDGET') return 'الميزانية اليومية (USD)';
                                                        return 'الميزانية الإجمالية (USD)';
                                                      })()}
                                                      {completeCampaignForm.watch('campaignBudgetMode') === 'UNLIMITED' && (
                                                        <span className="text-blue-600 text-sm mr-2">(اختياري - لا محدود)</span>
                                                      )}
                                                    </FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="10.00" 
                                                        className="theme-input"
                                                        disabled={completeCampaignForm.watch('campaignBudgetMode') === 'UNLIMITED'}
                                                      />
                                                    </FormControl>
                                                    <FormDescription>
                                                      {(() => {
                                                        const budgetMode = completeCampaignForm.watch('campaignBudgetMode');
                                                        if (budgetMode === 'UNLIMITED') return 'لا حاجة لميزانية - سيتم استخدام ميزانية المجموعات الإعلانية';
                                                        if (budgetMode === 'DAILY_BUDGET') return 'أقل قيمة: $1.00 يومياً';
                                                        return 'أقل قيمة: $10.00 لكامل الحملة';
                                                      })()}
                                                    </FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            
                                            {/* Date Range */}
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="startTime"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">تاريخ البداية</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        type="datetime-local"
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormDescription>
                                                      يتم بدء الحملة في هذا التاريخ
                                                    </FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="endTime"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">تاريخ الانتهاء (اختياري)</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        type="datetime-local"
                                                        placeholder="اختياري - اتركه فارغاً للاستمرار"
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormDescription>
                                                      اختياري - إذا تُرك فارغاً ستستمر الحملة
                                                    </FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* قسم بياات المجموعة الإعانية */}
                                      <div className="form-section bg-theme-primary-light border theme-border rounded-lg mt-4">
                                        <h3 
                                          className={`text-base font-medium mb-2 flex items-center justify-between cursor-pointer hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm p-2 rounded transition-colors ${
                                            adSetCompleted 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-theme-primary'
                                          }`}
                                          onClick={() => handleSectionClick('adset')}
                                        >
                                          {adSetSectionCollapsed ? 
                                            <ChevronDown className="h-4 w-4" /> : 
                                            <ChevronUp className="h-4 w-4" />
                                          }
                                          <div className="flex items-center">
                                            {adSetCompleted ? (
                                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                2
                                              </span>
                                            ) : (
                                              <span className="bg-theme-gradient text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">2</span>
                                            )}
                                            بياات المجموعة الإعانية
                                            {adSetCompleted && (
                                              <CheckCircle className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                                            )}
                                          </div>
                                        </h3>
                                        
                                        {!adSetSectionCollapsed && (
                                          <div className="space-y-4">
                                            {/* Ad Set Name, Budget & Bid Strategy */}
                                            <div className="grid grid-cols-3 gap-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="adSetName"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">اسم المجموعة الإعلانية</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        placeholder="مجموعة الإعلانات الأساسية" 
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="adSetBudget"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">ميزانية المجموعة (USD) *</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="5.00" 
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormDescription>أقل قيمة: $1.00 يومياً</FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="bidStrategy"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">استراتيجية المزايدة</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                      <FormControl>
                                                        <SelectTrigger className="theme-input">
                                                          <SelectValue placeholder="اختر استرايجية المزايدة" />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent className="bg-black border-gray-700">
                                                        <SelectItem value="LOWEST_COST_WITHOUT_CAP">أقل تكلفة بدون حد</SelectItem>
                                                        <SelectItem value="LOWEST_COST_WITH_BID_CAP">أقل تكلفة مع حد للمزايدة</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            
                                            {/* Bid Amount */}
                                            {completeCampaignForm.watch('bidStrategy') === 'LOWEST_COST_WITH_BID_CAP' && (
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="bidAmount"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">حد المزايدة (USD)</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="1.00" 
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormDescription>الحد الأقصى للمزايدة لكل نتيجة</FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            )}
                                            
                                            {/* Age Range Facebook Style */}
                                            <div>
                                              <FormLabel className="text-theme-primary mb-2 block">الفئة العمرية</FormLabel>
                                              <Select onValueChange={(value) => {
                                                const [min, max] = value.split('-');
                                                completeCampaignForm.setValue('targeting.ageMin', parseInt(min));
                                                completeCampaignForm.setValue('targeting.ageMax', parseInt(max));
                                              }} defaultValue="18-65">
                                                <SelectTrigger className="theme-input">
                                                  <SelectValue placeholder="اختر الفئة العمرية" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-black border-gray-700">
                                                  <SelectItem value="13-17">13-17 سنة</SelectItem>
                                                  <SelectItem value="18-24">18-24 سنة</SelectItem>
                                                  <SelectItem value="25-34">25-34 سنة</SelectItem>
                                                  <SelectItem value="35-44">35-44 سنة</SelectItem>
                                                  <SelectItem value="45-54">45-54 سنة</SelectItem>
                                                  <SelectItem value="55-64">55-64 سنة</SelectItem>
                                                  <SelectItem value="18-65">18-65 سنة (جميع الأعمار)</SelectItem>
                                                  <SelectItem value="25-65">25-65 سنة</SelectItem>
                                                  <SelectItem value="35-65">35-65 سنة</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            
                                            {/* Geographic Targeting */}
                                            <div className="space-y-4">
                                              <h4 className="text-sm font-medium text-theme-primary mb-2">الاستهداف الجغرافي للعراق</h4>
                                              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                                                <p className="text-sm text-blue-300 mb-2">
                                                  📍 اختر نوع الاستهداف الجغرافي حسب حاجتك:
                                                </p>
                                                <ul className="text-xs text-blue-200 space-y-1">
                                                  <li>• <strong>العراق كاملاً:</strong> لاستهداف جميع المحافظات والمدن</li>
                                                  <li>• <strong>ولايات محددة:</strong> لاستهداف محافظات معينة</li>
                                                  <li>• <strong>مدن محددة:</strong> لاستهداف مدن بعينها</li>
                                                </ul>
                                              </div>
                                              
                                              {/* Geographic Targeting Type */}
                                              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                                                <label className="text-theme-primary font-medium mb-3 block">نوع الاستهداف الجغرافي</label>
                                                <div className="space-y-2">
                                                  <div className="flex items-center space-x-3">
                                                    <input
                                                      type="radio"
                                                      id="target-all-iraq"
                                                      name="geoTargetType"
                                                      className="ml-2"
                                                      checked={!!completeCampaignForm.watch('targeting.geoLocations.countries')?.includes('IQ')}
                                                      onChange={() => {
                                                        completeCampaignForm.setValue('targeting.geoLocations.countries', ['IQ']);
                                                        completeCampaignForm.setValue('targeting.geoLocations.regions', []);
                                                        completeCampaignForm.setValue('targeting.geoLocations.cities', []);
                                                        setShowRegionsSection(false);
                                                        setShowCitiesSection(false);
                                                      }}
                                                    />
                                                    <label htmlFor="target-all-iraq" className="text-white">
                                                      العراق كاملاً 🇮🇶 (جميع الولايات والمدن)
                                                    </label>
                                                  </div>
                                                  
                                                  <div className="flex items-center space-x-3">
                                                    <input
                                                      type="radio"
                                                      id="target-regions"
                                                      name="geoTargetType"
                                                      className="ml-2"
                                                      checked={showRegionsSection}
                                                      onChange={() => {
                                                        completeCampaignForm.setValue('targeting.geoLocations.countries', []);
                                                        completeCampaignForm.setValue('targeting.geoLocations.cities', []);
                                                        completeCampaignForm.setValue('targeting.geoLocations.regions', []);
                                                        setShowRegionsSection(true);
                                                        setShowCitiesSection(false);
                                                      }}
                                                    />
                                                    <label htmlFor="target-regions" className="text-white">
                                                      ولايات محددة (استهداف حسب المحافظة)
                                                    </label>
                                                  </div>
                                                  
                                                  <div className="flex items-center space-x-3">
                                                    <input
                                                      type="radio"
                                                      id="target-cities"
                                                      name="geoTargetType"
                                                      className="ml-2"
                                                      checked={showCitiesSection}
                                                      onChange={() => {
                                                        completeCampaignForm.setValue('targeting.geoLocations.countries', []);
                                                        completeCampaignForm.setValue('targeting.geoLocations.regions', []);
                                                        completeCampaignForm.setValue('targeting.geoLocations.cities', []);
                                                        setShowRegionsSection(false);
                                                        setShowCitiesSection(true);
                                                      }}
                                                    />
                                                    <label htmlFor="target-cities" className="text-white">
                                                      مدن محددة (استهداف دقيق للمدن)
                                                    </label>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Region/State Selection - Show only when regions radio is selected */}
                                              {showRegionsSection && (
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="targeting.geoLocations.regions"
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <div className="flex items-center justify-between mb-3">
                                                        <FormLabel className="text-theme-primary">اختر الولايات اعراقية</FormLabel>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const allRegions = ["Baghdad", "Basra", "Nineveh", "Erbil", "Sulaymaniyah", "Kirkuk", "Najaf", "Karbala", "Babylon", "Diyala", "Anbar", "Saladin", "Qadisiyyah", "Wasit", "Maysan", "Dhi_Qar", "Muthanna", "Dohuk"];
                                                            const currentRegions = field.value || [];
                                                            if (currentRegions.length === allRegions.length) {
                                                              field.onChange([]);
                                                            } else {
                                                              field.onChange(allRegions);
                                                            }
                                                          }}
                                                          className="px-3 py-1 text-xs bg-theme-primary hover:bg-theme-primary-light text-white rounded-md transition-colors"
                                                        >
                                                          {(field.value || []).length === 18 ? 'إلغاء تحديد اكل' : 'تحديد الكل'}
                                                        </button>
                                                      </div>
                                                      <div className="max-h-60 overflow-y-auto border rounded-md p-3 theme-border bg-gray-900/30">
                                                        <div className="grid grid-cols-4 gap-2">
                                                          {[
                                                            { id: "Baghdad", name: "محافظة بغداد" },
                                                            { id: "Basra", name: "محافظة لبصرة" },
                                                            { id: "Nineveh", name: "محافظة نينوى" },
                                                            { id: "Erbil", name: "محافظة ربيل" },
                                                            { id: "Sulaymaniyah", name: "محافظة السليمانية" },
                                                            { id: "Kirkuk", name: "محافظة كركوك" },
                                                            { id: "Najaf", name: "محافظة الجف" },
                                                            { id: "Karbala", name: "محافظة كربلاء" },
                                                            { id: "Babylon", name: "محافظة ببل" },
                                                            { id: "Diyala", name: "مافظة ديالى" },
                                                            { id: "Anbar", name: "محافظة الأنبار" },
                                                            { id: "Saladin", name: "حافظة صلاح الدين" },
                                                            { id: "Qadisiyyah", name: "محفظة القادسية" },
                                                            { id: "Wasit", name: "محافظة واسط" },
                                                            { id: "Maysan", name: "محافظة ميسان" },
                                                            { id: "Dhi_Qar", name: "محافظة ذي قار" },
                                                            { id: "Muthanna", name: "محافظة المثنى" },
                                                            { id: "Dohuk", name: "محافظة دهك" }
                                                          ].map((region) => (
                                                            <button
                                                              key={region.id}
                                                              type="button"
                                                              onClick={() => {
                                                                const currentRegions = field.value || [];
                                                                const isSelected = currentRegions.includes(region.id);
                                                                if (isSelected) {
                                                                  field.onChange(currentRegions.filter(r => r !== region.id));
                                                                } else {
                                                                  field.onChange([...currentRegions, region.id]);
                                                                }
                                                              }}
                                                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:border-theme-primary ${
                                                                field.value?.includes(region.id) 
                                                                  ? 'bg-theme-primary-light border-theme-primary text-white' 
                                                                  : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                                                              }`}
                                                            >
                                                              <input
                                                                type="checkbox"
                                                                checked={field.value?.includes(region.id) || false}
                                                                onChange={() => {}} // تعامل مع التغيير في onClick
                                                                className="w-4 h-4 pointer-events-none"
                                                              />
                                                              <span className="text-sm font-medium">{region.name}</span>
                                                            </button>
                                                          ))}
                                                        </div>
                                                      </div>
                                                      <FormDescription>اختر ولاية أو أكثر للاستهداف</FormDescription>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              )}
                                              
                                              {/* Major Cities Selection - Show only when cities radio is selected */}
                                              {showCitiesSection && (
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="targeting.geoLocations.cities"
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <div className="flex items-center justify-between mb-3">
                                                        <FormLabel className="text-theme-primary">اختر المدن العراقية</FormLabel>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const allCities = ["Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", "Kirkuk", "Najaf", "Karbala", "Hillah", "Nasiriyah", "Amarah", "Diwaniyah", "Samawah", "Kut", "Tikrit", "Ramadi", "Fallujah", "Baqubah", "Dohuk", "Samarra", "Haditha", "Zakho", "Khalis"];
                                                            const currentCities = field.value || [];
                                                            if (currentCities.length === allCities.length) {
                                                              field.onChange([]);
                                                            } else {
                                                              field.onChange(allCities);
                                                            }
                                                          }}
                                                          className="px-3 py-1 text-xs bg-theme-primary hover:bg-theme-primary-light text-white rounded-md transition-colors"
                                                        >
                                                          {(field.value || []).length === 23 ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                                        </button>
                                                      </div>
                                                      <div className="max-h-60 overflow-y-auto border rounded-md p-3 theme-border bg-gray-900/30">
                                                        <div className="grid grid-cols-4 gap-2">
                                                          {[
                                                            { id: "Baghdad", name: "بغداد", province: "بغداد" },
                                                            { id: "Basra", name: "البصرة", province: "البصرة" },
                                                            { id: "Mosul", name: "الموصل", province: "نينوى" },
                                                            { id: "Erbil", name: "أربيل", province: "أربيل" },
                                                            { id: "Sulaymaniyah", name: "السليمانية", province: "السليمانية" },
                                                            { id: "Kirkuk", name: "كركوك", province: "كركوك" },
                                                            { id: "Najaf", name: "النجف", province: "النجف" },
                                                            { id: "Karbala", name: "كربلاء", province: "كربلاء" },
                                                            { id: "Hillah", name: "الحلة", province: "بابل" },
                                                            { id: "Nasiriyah", name: "الناصرية", province: "ذي قار" },
                                                            { id: "Amarah", name: "العمارة", province: "ميسان" },
                                                            { id: "Diwaniyah", name: "الديوانية", province: "القادسية" },
                                                            { id: "Samawah", name: "السماوة", province: "المثنى" },
                                                            { id: "Kut", name: "الكوت", province: "واسط" },
                                                            { id: "Tikrit", name: "تكريت", province: "صلاح الدين" },
                                                            { id: "Ramadi", name: "الرمادي", province: "الأنبار" },
                                                            { id: "Fallujah", name: "الفلوجة", province: "الأنبار" },
                                                            { id: "Baqubah", name: "بعقوبة", province: "ديالى" },
                                                            { id: "Dohuk", name: "دهوك", province: "دهوك" },
                                                            { id: "Samarra", name: "سامراء", province: "صلاح الدين" },
                                                            { id: "Haditha", name: "حديثة", province: "الأنبار" },
                                                            { id: "Zakho", name: "زاخو", province: "دهوك" },
                                                            { id: "Khalis", name: "خالص", province: "ديالى" }
                                                          ].map((city) => (
                                                            <button
                                                              key={city.id}
                                                              type="button"
                                                              onClick={() => {
                                                                const currentCities = field.value || [];
                                                                const isSelected = currentCities.includes(city.id);
                                                                if (isSelected) {
                                                                  field.onChange(currentCities.filter(c => c !== city.id));
                                                                } else {
                                                                  field.onChange([...currentCities, city.id]);
                                                                }
                                                              }}
                                                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:border-theme-primary ${
                                                                field.value?.includes(city.id) 
                                                                  ? 'bg-theme-primary-light border-theme-primary text-white' 
                                                                  : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                                                              }`}
                                                            >
                                                              <input
                                                                type="checkbox"
                                                                checked={field.value?.includes(city.id) || false}
                                                                onChange={() => {}} // تعامل مع التغيير في onClick
                                                                className="w-4 h-4 pointer-events-none"
                                                              />
                                                              <div className="text-right">
                                                                <span className="text-sm font-medium">{city.name}</span>
                                                                <span className="block text-xs text-gray-400">({city.province})</span>
                                                              </div>
                                                            </button>
                                                          ))}
                                                        </div>
                                                      </div>
                                                      <FormDescription>اختر مدينة أو أكثر للاستهداف الدقيق</FormDescription>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              )}
                                            </div>
                                            
                                            {/* واضع الإعلان - قوئم منسدلة في سطر احد */}
                                            <div className="space-y-4">
                                              <h4 className="text-sm font-medium text-theme-primary mb-2">المواضع والمنصات</h4>
                                              <div className="grid grid-cols-4 gap-3">
                                                {/* الأجهزة امستهدفة */}
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="placements.devicePlatforms"
                                                  render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                      <FormLabel className="text-theme-primary block">الأجهزة المستهدة</FormLabel>
                                                      <FormControl>
                                                        <Popover>
                                                          <PopoverTrigger asChild>
                                                            <Button
                                                              variant="outline"
                                                              role="combobox"
                                                              className="theme-input justify-between"
                                                            >
                                                              <span className="truncate">
                                                                {field.value?.length === 0 ? "اختر الأجهزة" :
                                                                 field.value?.length === 1 && field.value.includes('mobile') ? "📱 محمول" :
                                                                 field.value?.length === 1 && field.value.includes('desktop') ? "🖥️ كمبيوتر" :
                                                                 field.value?.length === 1 && field.value.includes('tablet') ? "📱 لوحي" :
                                                                 `${field.value?.length || 0} حدد`}
                                                              </span>
                                                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-[200px] p-0 bg-black border-gray-700" align="start">
                                                            <div className="p-2 space-y-2">
                                                              {[
                                                                { value: "mobile" as const, label: "📱 الأجهزة المحمولة" },
                                                                { value: "desktop" as const, label: "🖥️ أجهزة الكمبيوتر" },
                                                                { value: "tablet" as const, label: "📱 الأجهزة اللوحية" }
                                                              ].map((device) => (
                                                                <label
                                                                  key={device.value}
                                                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded"
                                                                >
                                                                  <input
                                                                    type="checkbox"
                                                                    className="ml-2"
                                                                    checked={field.value?.includes(device.value) || false}
                                                                    onChange={(e) => {
                                                                      const current = field.value || [];
                                                                      if (e.target.checked) {
                                                                        field.onChange([...current.filter(v => v !== device.value), device.value]);
                                                                      } else {
                                                                        field.onChange(current.filter(v => v !== device.value));
                                                                      }
                                                                    }}
                                                                  />
                                                                  <span className="text-gray-200">{device.label}</span>
                                                                </label>
                                                              ))}
                                                            </div>
                                                          </PopoverContent>
                                                        </Popover>
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                                
                                                {/* المنصات */}
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="placements.publisherPlatforms"
                                                  render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                      <FormLabel className="text-theme-primary block">المنصات</FormLabel>
                                                      <FormControl>
                                                        <Popover>
                                                          <PopoverTrigger asChild>
                                                            <Button
                                                              variant="outline"
                                                              role="combobox"
                                                              className="theme-input justify-between"
                                                            >
                                                              <span className="truncate">
                                                                {field.value?.length === 0 ? "اختر المنصات" :
                                                                 field.value?.length === 1 && field.value.includes('facebook') ? "🔵 Facebook" :
                                                                 field.value?.length === 1 && field.value.includes('instagram') ? "🔴 Instagram" :
                                                                 field.value?.length === 1 && field.value.includes('audience_network') ? "🌐 Audience Network" :
                                                                 field.value?.length === 1 && field.value.includes('messenger') ? "💬 Messenger" :
                                                                 field.value?.length === 1 && field.value.includes('threads') ? "🧵 Threads" :
                                                                 field.value?.length === 5 ? "🔵🔴🌐💬🧵 جميع المنصات" :
                                                                 `${field.value?.length || 0} محدد`}
                                                              </span>
                                                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-[250px] p-0 bg-black border-gray-700" align="start">
                                                            <div className="p-2 space-y-2">
                                                              {[
                                                                { value: "facebook" as const, label: "🔵 Facebook" },
                                                                { value: "instagram" as const, label: "🔴 Instagram" },
                                                                { value: "audience_network" as const, label: "🌐 Audience Network" },
                                                                { value: "messenger" as const, label: "💬 Messenger" },
                                                                { value: "threads" as const, label: "🧵 Threads", warning: true }
                                                              ].map((platform) => (
                                                                <label
                                                                  key={platform.value}
                                                                  className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded ${
                                                                    platform.warning ? 'bg-orange-900/20 border border-orange-700/30' : ''
                                                                  }`}
                                                                >
                                                                  <input
                                                                    type="checkbox"
                                                                    className="ml-2"
                                                                    checked={field.value?.includes(platform.value) || false}
                                                                    onChange={(e) => {
                                                                      const current = field.value || [];
                                                                      if (e.target.checked) {
                                                                        field.onChange([...current.filter(v => v !== platform.value), platform.value]);
                                                                      } else {
                                                                        field.onChange(current.filter(v => v !== platform.value));
                                                                      }
                                                                    }}
                                                                  />
                                                                  <span className="text-gray-200">{platform.label}</span>
                                                                </label>
                                                              ))}
                                                            </div>
                                                          </PopoverContent>
                                                        </Popover>
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                                
                                                {/* أنظمة التشغيل */}
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="placements.operatingSystems"
                                                  render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                      <FormLabel className="text-theme-primary block">أنظمة التشغيل</FormLabel>
                                                      <FormControl>
                                                        <Popover>
                                                          <PopoverTrigger asChild>
                                                            <Button
                                                              variant="outline"
                                                              role="combobox"
                                                              className="theme-input justify-between"
                                                            >
                                                              <span className="truncate">
                                                                {field.value?.length === 0 ? "اختر الأنظمة" :
                                                                 field.value?.length === 1 && field.value.includes('iOS') ? "🍎 iOS" :
                                                                 field.value?.length === 1 && field.value.includes('Android') ? "🤖 Android" :
                                                                 field.value?.length === 2 ? "🍎🤖 جميع الأنظمة" :
                                                                 `${field.value?.length || 0} محدد`}
                                                              </span>
                                                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-[200px] p-0 bg-black border-gray-700" align="start">
                                                            <div className="p-2 space-y-2">
                                                              {[
                                                                { value: "iOS" as const, label: "🍎 iOS" },
                                                                { value: "Android" as const, label: "🤖 Android" }
                                                              ].map((os) => (
                                                                <label
                                                                  key={os.value}
                                                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded"
                                                                >
                                                                  <input
                                                                    type="checkbox"
                                                                    className="ml-2"
                                                                    checked={field.value?.includes(os.value) || false}
                                                                    onChange={(e) => {
                                                                      const current = field.value || [];
                                                                      if (e.target.checked) {
                                                                        field.onChange([...current.filter(v => v !== os.value), os.value]);
                                                                      } else {
                                                                        field.onChange(current.filter(v => v !== os.value));
                                                                      }
                                                                    }}
                                                                  />
                                                                  <span className="text-gray-200">{os.label}</span>
                                                                </label>
                                                              ))}
                                                            </div>
                                                          </PopoverContent>
                                                        </Popover>
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                                
                                                {/* نوع ااتصال */}
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="placements.connectionTypes"
                                                  render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                      <FormLabel className="text-theme-primary block">نوع الاتصال</FormLabel>
                                                      <FormControl>
                                                        <Popover>
                                                          <PopoverTrigger asChild>
                                                            <Button
                                                              variant="outline"
                                                              role="combobox"
                                                              className="theme-input justify-between"
                                                            >
                                                              <span className="truncate">
                                                                {field.value?.length === 0 ? "جميع الاتصالات" :
                                                                 field.value?.length === 1 && field.value.includes('wifi') ? "📶 Wi-Fi" :
                                                                 field.value?.length === 1 && field.value.includes('cellular') ? "📱 بيانات الجوال" :
                                                                 field.value?.length === 2 ? "📶📱 جميع الاتصالات" :
                                                                 `${field.value?.length || 0} محدد`}
                                                              </span>
                                                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-[200px] p-0 bg-black border-gray-700" align="start">
                                                            <div className="p-2 space-y-2">
                                                              {[
                                                                { value: "wifi" as const, label: "📶 Wi-Fi" },
                                                                { value: "cellular" as const, label: "📱 بيانات الجوال" }
                                                              ].map((connection) => (
                                                                <label
                                                                  key={connection.value}
                                                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800/50 p-2 rounded"
                                                                >
                                                                  <input
                                                                    type="checkbox"
                                                                    className="ml-2"
                                                                    checked={field.value?.includes(connection.value) || false}
                                                                    onChange={(e) => {
                                                                      const current = field.value || [];
                                                                      if (e.target.checked) {
                                                                        field.onChange([...current.filter(v => v !== connection.value), connection.value]);
                                                                      } else {
                                                                        field.onChange(current.filter(v => v !== connection.value));
                                                                      }
                                                                    }}
                                                                  />
                                                                  <span className="text-gray-200">{connection.label}</span>
                                                                </label>
                                                              ))}
                                                            </div>
                                                          </PopoverContent>
                                                        </Popover>
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </div>
                                              
                                              {/* مواضع المنصات المحددة */}
                                              <div className="grid grid-cols-2 gap-4 mt-4">
                                                {/* مواضع Facebook - يظهر فقط عند اخيار Facebook */}
                                                {completeCampaignForm.watch('placements.publisherPlatforms')?.includes('facebook') && (
                                                  <FormField
                                                    control={completeCampaignForm.control}
                                                    name="placements.facebookPlacements"
                                                    render={({ field }) => (
                                                      <FormItem>
                                                        <FormLabel className="text-theme-primary">مواضع Facebook</FormLabel>
                                                        <FormControl>
                                                          <Popover>
                                                            <PopoverTrigger asChild>
                                                              <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="theme-input justify-between w-full"
                                                              >
                                                                <span className="truncate">
                                                                  {field.value?.length === 0 ? "اختر مواع Facebook" :
                                                                   field.value?.length === 1 ? `📱 ${field.value[0] === 'feed' ? 'الخلاصة' : field.value[0] === 'right_hand_column' ? 'العمود اجانبي' : field.value[0] === 'marketplace' ? 'Marketplace' : field.value[0] === 'instant_article' ? 'المقالات الورية' : field.value[0]}` :
                                                                   `${field.value?.length || 0} موضع محدد`}
                                                                </span>
                                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                              </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[280px] p-0 bg-black border-gray-700" align="start">
                                                              <div className="p-2 space-y-2">
                                                                {[
                                                                  { value: "feed" as const, label: "📱 خلاصة Facebook", desc: "الموضع الأساسي" },
                                                                  { value: "right_hand_column" as const, label: "➡️ العمود الجانبي", desc: "فقط على الكمبيوت" },
                                                                  { value: "marketplace" as const, label: "🛍️ Marketplace", desc: "في منطقة التسوق" },
                                                                  { value: "instant_article" as const, label: "📰 المقالات الفورية", desc: "داخل المقالات" },
                                                                  { value: "in_stream_video" as const, label: "📺 فيديوهات البث", desc: "أثناء مشاهدة الفيديو" },
                                                                  { value: "search" as const, label: "🔍 نتائج البحث", desc: "في صفحة البحث" },
                                                                  { value: "story" as const, label: "📸 قصص Facebook", desc: "بين القصص" },
                                                                  { value: "reels" as const, label: "🎬 Facebook Reels", desc: "فيديوهات قصيرة" }
                                                                ].map((position) => (
                                                                  <label
                                                                    key={position.value}
                                                                    className="flex flex-col cursor-pointer hover:bg-gray-800/50 p-2 rounded"
                                                                  >
                                                                    <div className="flex items-center space-x-2">
                                                                      <input
                                                                        type="checkbox"
                                                                        className="ml-2"
                                                                        checked={field.value?.includes(position.value) || false}
                                                                        onChange={(e) => {
                                                                          const current = field.value || [];
                                                                          if (e.target.checked) {
                                                                            field.onChange([...current.filter(v => v !== position.value), position.value]);
                                                                          } else {
                                                                            field.onChange(current.filter(v => v !== position.value));
                                                                          }
                                                                        }}
                                                                      />
                                                                      <span className="text-gray-200 font-medium">{position.label}</span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-400 mr-6">{position.desc}</span>
                                                                  </label>
                                                                ))}
                                                              </div>
                                                            </PopoverContent>
                                                          </Popover>
                                                        </FormControl>
                                                        <FormMessage />
                                                      </FormItem>
                                                    )}
                                                  />
                                                )}

                                                {/* مواضع Instagram - يظهر فقط عند اختيار Instagram */}
                                                {completeCampaignForm.watch('placements.publisherPlatforms')?.includes('instagram') && (
                                                  <FormField
                                                    control={completeCampaignForm.control}
                                                    name="placements.instagramPlacements"
                                                    render={({ field }) => (
                                                      <FormItem>
                                                        <FormLabel className="text-theme-primary">مواضع Instagram</FormLabel>
                                                        <FormControl>
                                                          <Popover>
                                                            <PopoverTrigger asChild>
                                                              <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="theme-input justify-between w-full"
                                                              >
                                                                <span className="truncate">
                                                                  {field.value?.length === 0 ? "اختر مواضع Instagram" :
                                                                   field.value?.length === 1 ? `📱 ${field.value[0] === 'stream' ? 'الخلاصة' : field.value[0] === 'story' ? 'القصص' : field.value[0] === 'reels' ? 'Reels' : field.value[0] === 'explore' ? 'الاستكشاف' : field.value[0]}` :
                                                                   `${field.value?.length || 0} موضع محدد`}
                                                                </span>
                                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                              </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[280px] p-0 bg-black border-gray-700" align="start">
                                                              <div className="p-2 space-y-2">
                                                                {[
                                                                  { value: "stream" as const, label: "📱 خلاصة Instagram", desc: "الموضع الأساسي" },
                                                                  { value: "story" as const, label: "📸 قصص Instagram", desc: "بين القصص" },
                                                                  { value: "reels" as const, label: "🎬 Instagram Reels", desc: "فيديوهات قصيرة" },
                                                                  { value: "explore" as const, label: "🔍 صفحة الاستكشاف", desc: "منطقة البحث" },
                                                                  { value: "profile_feed" as const, label: "👤 خلاصة الملف الشخصي", desc: "في الملفات الشخصية" },
                                                                  { value: "search" as const, label: "🔍 نتائج البحث", desc: "في صفحة البحث" }
                                                                ].map((position) => (
                                                                  <label
                                                                    key={position.value}
                                                                    className="flex flex-col cursor-pointer hover:bg-gray-800/50 p-2 rounded"
                                                                  >
                                                                    <div className="flex items-center space-x-2">
                                                                      <input
                                                                        type="checkbox"
                                                                        className="ml-2"
                                                                        checked={field.value?.includes(position.value) || false}
                                                                        onChange={(e) => {
                                                                          const current = field.value || [];
                                                                          if (e.target.checked) {
                                                                            field.onChange([...current.filter(v => v !== position.value), position.value]);
                                                                          } else {
                                                                            field.onChange(current.filter(v => v !== position.value));
                                                                          }
                                                                        }}
                                                                      />
                                                                      <span className="font-medium text-gray-200">
                                                                        {position.label}
                                                                      </span>
                                                                    </div>
                                                                    <span className="text-xs mr-6 text-gray-400">
                                                                      {position.desc}
                                                                    </span>
                                                                  </label>
                                                                ))}
                                                              </div>
                                                            </PopoverContent>
                                                          </Popover>
                                                        </FormControl>
                                                        <FormMessage />
                                                      </FormItem>
                                                    )}
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      
                                      {/* قسم بيانات الإعلان */}
                                      <div className="form-section bg-theme-primary-light border theme-border rounded-lg mt-4">
                                        <h3 
                                          className={`text-base font-medium mb-2 flex items-center justify-between cursor-pointer hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm p-2 rounded transition-colors ${
                                            adCompleted 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-theme-primary'
                                          }`}
                                          onClick={() => handleSectionClick('ad')}
                                        >
                                          {adSectionCollapsed ? 
                                            <ChevronDown className="h-4 w-4" /> : 
                                            <ChevronUp className="h-4 w-4" />
                                          }
                                          <div className="flex items-center">
                                            {adCompleted ? (
                                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                3
                                              </span>
                                            ) : (
                                              <span className="bg-theme-gradient text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">3</span>
                                            )}
                                            بيانات الإعلان
                                            {adCompleted && (
                                              <CheckCircle className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                                            )}
                                          </div>
                                        </h3>
                                        
                                        {!adSectionCollapsed && (
                                          <div className="space-y-4">
                                            {/* Ad Name & Display Name */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="adName"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">اسم الإعلان</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        placeholder="الإعلان الأساسي" 
                                                        className="theme-input"
                                                      />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="displayName"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">اسم العرض</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        {...field}
                                                        placeholder="اكتشف منتجنا الجديد" 
                                                        className="theme-input"
                                                        maxLength={40}
                                                      />
                                                    </FormControl>
                                                    <FormDescription>حتى 40 حرف</FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            
                                            
                                            {/* انتهاء قسم الإعلان - آخر حقل نص الإعلان */}
                                            {/* Ad Text */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="adText"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">نص الإعلان</FormLabel>
                                                    <FormControl>
                                                      <Textarea 
                                                        {...field}
                                                        placeholder="نص إعلاني جذاب يشرح المنتج..." 
                                                        className="theme-input"
                                                        maxLength={125}
                                                        rows={3}
                                                      />
                                                    </FormControl>
                                                    <FormDescription>حتى 125 حرف</FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="adDescription"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">وصف الإعلا</FormLabel>
                                                    <FormControl>
                                                      <Textarea 
                                                        {...field}
                                                        placeholder="وصف مختصر (7 كلمات فقط)" 
                                                        className="theme-input"
                                                        rows={3}
                                                      />
                                                    </FormControl>
                                                    <FormDescription className="text-orange-500 font-medium">
                                                      ⚠️ 7 كمات كحد أقصى (اختاري)
                                                    </FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            
                                            {/* Call to Action & Landing Page URL */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={completeCampaignForm.control}
                                                name="callToAction"
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-theme-primary">إجرء نقر الزبون</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} defaultValue="BOOK_NOW">
                                                      <FormControl>
                                                        <SelectTrigger className="theme-input">
                                                          <SelectValue placeholder="اختر إجراء النقر" />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent className="bg-black border-gray-700">
                                                        {completeCampaignForm.watch('objective') === 'OUTCOME_TRAFFIC' ? (
                                                          <>
                                                            <SelectItem value="MESSAGE_PAGE">إرسال رسالة</SelectItem>
                                                            <SelectItem value="CONTACT_US">تواصل معنا</SelectItem>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <SelectItem value="SHOP_NOW">تسوق الآن</SelectItem>
                                                            <SelectItem value="LEARN_MORE">اعرف المزيد</SelectItem>
                                                            <SelectItem value="BOOK_TRAVEL">حجز الآن</SelectItem>
                                                            <SelectItem value="SIGN_UP">سجل اآن</SelectItem>
                                                            <SelectItem value="CONTACT_US">اتصل بنا</SelectItem>
                                                          </>
                                                        )}
                                                      </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              {/* حقل رابط الصفحة - فقط لحملات التحويلات */}
                                              {completeCampaignForm.watch('objective') === 'OUTCOME_SALES' && (
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="landingPageUrl"
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormLabel className="text-theme-primary">رابط الصحة *</FormLabel>
                                                      <FormControl>
                                                        <Input 
                                                          {...field}
                                                          type="url"
                                                          placeholder="https://your-landing-page.com" 
                                                          className="theme-input"
                                                        />
                                                      </FormControl>
                                                      <FormDescription>الرابط الذي سيتوجه إليه المستخدمون</FormDescription>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              )}
                                              
                                              {/* Pixel ID & Page ID fields */}
                                              <div className="grid grid-cols-8 gap-4">
                                                {/* البكسل - فقط لحملات التحويلات */}
                                                {completeCampaignForm.watch('objective') === 'OUTCOME_SALES' && (
                                                  <FormField
                                                    control={completeCampaignForm.control}
                                                    name="pixelId"
                                                    render={({ field }) => (
                                                      <FormItem className="col-span-3">
                                                        <FormLabel className="text-theme-primary">
                                                          اختر البكسل *
                                                        </FormLabel>
                                                        <Select 
                                                          onValueChange={field.onChange} 
                                                          value={field.value || ""}
                                                          disabled={pixelsLoading || !selectedAccount}
                                                        >
                                                          <FormControl>
                                                            <SelectTrigger className="theme-input">
                                                              <SelectValue 
                                                                placeholder={
                                                                  pixelsLoading 
                                                                    ? "جاري تحميل البكسلات..." 
                                                                    : !selectedAccount 
                                                                      ? "اختر حساب إعلاني أولاً"
                                                                      : "اختر البكسل"
                                                                } 
                                                              />
                                                            </SelectTrigger>
                                                          </FormControl>
                                                          <SelectContent className="w-full max-w-none">
                                                            {pixels?.pixels?.map((pixel: any) => (
                                                              <SelectItem key={pixel.id} value={pixel.id} className="whitespace-normal">
                                                                <div className="w-full text-right">
                                                                  <div className="font-medium">{pixel.name}</div>
                                                                  <div className="text-xs text-gray-500 mt-1">ID: {pixel.id}</div>
                                                                </div>
                                                              </SelectItem>
                                                            ))}
                                                          </SelectContent>
                                                        </Select>
                                                        <FormDescription>مطلوب لحملات التحويلات</FormDescription>
                                                        <FormMessage />
                                                      </FormItem>
                                                    )}
                                                  />
                                                )}
                                                
                                                {/* الصفحة - مطلوبة دائماً لكن أهم في حملات الرسائل */}
                                                <FormField
                                                  control={completeCampaignForm.control}
                                                  name="pageId"
                                                  render={({ field }) => (
                                                    <FormItem className={completeCampaignForm.watch('objective') === 'OUTCOME_SALES' ? "col-span-5" : "col-span-8"}>
                                                      <FormLabel className="text-theme-primary">
                                                        اختر الصفحة {completeCampaignForm.watch("objective") === "OUTCOME_TRAFFIC" && "*"}
                                                      </FormLabel>
                                                      <Select 
                                                        onValueChange={field.onChange} 
                                                        value={field.value || ""}
                                                        disabled={pagesLoading}
                                                      >
                                                        <FormControl>
                                                          <SelectTrigger className="theme-input">
                                                            <SelectValue 
                                                              placeholder={
                                                                pagesLoading 
                                                                  ? "جاري تحميل الصفحات..." 
                                                                  : "اختر الصفحة"
                                                              }
                                                            >
                                                              {field.value && pages?.pages && (() => {
                                                                const selectedPage = pages.pages.find((p: any) => p.id === field.value);
                                                                if (selectedPage) {
                                                                  return (
                                                                    <div className="flex items-center justify-between w-full">
                                                                      <div className="text-right space-y-1">
                                                                        <div className="font-medium text-sm">
                                                                          {selectedPage.name}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                          <span className="flex items-center gap-1 text-blue-600">
                                                                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                            FB: @{selectedPage.username || selectedPage.id.slice(-8)}
                                                                          </span>
                                                                          {selectedPage.instagram_business_account && (
                                                                            <span className="flex items-center gap-1 text-pink-600 font-medium">
                                                                              <span className="inline-block w-2 h-2 bg-pink-500 rounded-full"></span>
                                                                              IG: @{selectedPage.instagram_business_account.username}
                                                                            </span>
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                      <div className="flex items-center gap-1">
                                                                        {selectedPage.instagram_business_account?.profile_picture_url && (
                                                                          <img 
                                                                            src={selectedPage.instagram_business_account.profile_picture_url} 
                                                                            alt="IG"
                                                                            className="w-5 h-5 rounded-full object-cover"
                                                                          />
                                                                        )}
                                                                        {selectedPage.picture && (
                                                                          <img 
                                                                            src={selectedPage.picture.data.url} 
                                                                            alt="FB"
                                                                            className="w-6 h-6 rounded-full object-cover border border-gray-300"
                                                                          />
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  );
                                                                }
                                                                return null;
                                                              })()}
                                                            </SelectValue>
                                                          </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="w-full max-w-none">
                                                          {pages?.pages?.map((page: any) => (
                                                            <SelectItem key={page.id} value={page.id} className="whitespace-nowrap p-2 min-w-full">
                                                              <div className="w-full flex items-center justify-between gap-2">
                                                                {/* المحتوى الني على اليمين */}
                                                                <div className="flex-grow text-right overflow-hidden">
                                                                  <div className="space-y-1">
                                                                    <span className="font-medium text-sm block truncate">
                                                                      {page.name}
                                                                    </span>
                                                                    <div className="flex items-center justify-end gap-3 text-xs text-gray-600 dark:text-gray-400">
                                                                      <span className="flex items-center gap-1">
                                                                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                        FB: @{page.username || page.id.slice(-8)}
                                                                      </span>
                                                                      {page.instagram_business_account && (
                                                                        <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium">
                                                                          <span className="inline-block w-2 h-2 bg-pink-500 rounded-full"></span>
                                                                          IG: @{page.instagram_business_account.username}
                                                                        </span>
                                                                      )}
                                                                      {!page.instagram_business_account && (
                                                                        <span className="text-gray-400 italic">
                                                                          (بدون Instagram)
                                                                        </span>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                                
                                                                {/* الصور على اليسار */}
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                  {/* صورة اانستجرام */}
                                                                  {page.instagram_business_account?.profile_picture_url && (
                                                                    <img 
                                                                      src={page.instagram_business_account.profile_picture_url} 
                                                                      alt="IG"
                                                                      className="w-6 h-6 rounded-full object-cover"
                                                                      onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                      }}
                                                                    />
                                                                  )}
                                                                  {/* صورة الصفحة */}
                                                                  {page.picture && (
                                                                    <img 
                                                                      src={page.picture.data.url} 
                                                                      alt="FB"
                                                                      className="w-8 h-8 rounded-full object-cover border border-gray-300"
                                                                      onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                      }}
                                                                    />
                                                                  )}
                                                                </div>
                                                              </div>
                                                            </SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                      <FormDescription>مطلب لحملات الرسائل</FormDescription>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </div>
                                            </div>
                                            
                                            {/* وجهات الرسائل - فقط في حملات الرسائل */}
                                            {completeCampaignForm.watch("objective") === "OUTCOME_TRAFFIC" && (
                                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                                <div className="space-y-2">
                                                  <div className="text-center space-y-1">
                                                    <div className="flex items-center justify-center gap-1">
                                                      <MessageCircle className="h-4 w-4 text-theme-primary" />
                                                      <h3 className="text-sm font-bold text-theme-primary">وجهات ارسائل</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                                                      اختر التطبيقات التي تريد استقبال ارسائل من خلالها
                                                    </p>
                                                  </div>
                                                  
                                                  <FormField
                                                    control={completeCampaignForm.control}
                                                    name="messageDestinations"
                                                    render={({ field }) => (
                                                      <FormItem>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                          {/* Messenger */}
                                                          <div 
                                                            className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all duration-300 hover:shadow-md ${
                                                              field.value?.includes("MESSENGER") 
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
                                                            }`}
                                                            onClick={() => {
                                                              const destinations = field.value || [];
                                                              if (destinations.includes("MESSENGER")) {
                                                                field.onChange(destinations.filter(d => d !== "MESSENGER"));
                                                              } else {
                                                                field.onChange([...destinations, "MESSENGER"]);
                                                              }
                                                            }}
                                                          >
                                                            <div className="flex flex-col items-center text-center space-y-1">
                                                              <div className="relative">
                                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                                  <MessageCircle className="h-4 w-4 text-white" />
                                                                </div>
                                                                {field.value?.includes("MESSENGER") && (
                                                                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <Check className="h-2 w-2 text-white" />
                                                                  </div>
                                                                )}
                                                              </div>
                                                              <div>
                                                                <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Messenger</h4>
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">رسائل Facebook</p>
                                                              </div>
                                                            </div>
                                                          </div>
                                                          
                                                          {/* Instagram */}
                                                          <div 
                                                            className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all duration-300 hover:shadow-md ${
                                                              field.value?.includes("INSTAGRAM") 
                                                                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-sm' 
                                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-pink-300'
                                                            }`}
                                                            onClick={() => {
                                                              const destinations = field.value || [];
                                                              if (destinations.includes("INSTAGRAM")) {
                                                                field.onChange(destinations.filter(d => d !== "INSTAGRAM"));
                                                              } else {
                                                                field.onChange([...destinations, "INSTAGRAM"]);
                                                              }
                                                            }}
                                                          >
                                                            <div className="flex flex-col items-center text-center space-y-1">
                                                              <div className="relative">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-full flex items-center justify-center">
                                                                  <Camera className="h-4 w-4 text-white" />
                                                                </div>
                                                                {field.value?.includes("INSTAGRAM") && (
                                                                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <Check className="h-2 w-2 text-white" />
                                                                  </div>
                                                                )}
                                                              </div>
                                                              <div>
                                                                <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">Instagram</h4>
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">رسائل Instagram</p>
                                                              </div>
                                                            </div>
                                                          </div>
                                                          
                                                        </div>
                                                        <FormMessage />
                                                      </FormItem>
                                                    )}
                                                  />
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Multiple Videos Upload */}
                                            <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                <FormLabel className="text-theme-primary text-lg font-semibold">
                                                  🎬 فيديوهات الإعلانات ({uploadedVideos.length})
                                                </FormLabel>
                                                <Badge variant="outline" className="text-xs">
                                                  {uploadedVideos.length === 0 ? 'لا توجد فيديوهات' : 
                                                   uploadedVideos.length === 1 ? 'إعلان واحد' : 
                                                   `${uploadedVideos.length} إعلانات`}
                                                </Badge>
                                              </div>
                                              
                                              <input
                                                ref={videoInputRef}
                                                type="file"
                                                accept="video/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                  const files = e.target.files;
                                                  if (files && files.length > 0) {
                                                    handleMultipleVideoUpload(files);
                                                  }
                                                }}
                                              />
                                              
                                              <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => videoInputRef.current?.click()}
                                                disabled={uploading}
                                                className="w-full theme-border hover:bg-theme-primary-light h-12"
                                              >
                                                {uploading ? (
                                                  <div className="flex items-center">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-theme-primary ml-2"></div>
                                                    جاري رفع الفيديوهات...
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center">
                                                    <Upload className="h-5 w-5 ml-2" />
                                                    <div className="text-right">
                                                      <div className="font-medium">اختر فيديوهات متعددة</div>
                                                      <div className="text-xs opacity-70">يمكنك اختيار عدة فيديوهات لإنشاء عدة إعلانات</div>
                                                    </div>
                                                  </div>
                                                )}
                                              </Button>
                                              
                                              {/* عرض الفيديوهات المرفوعة */}
                                              {uploadedVideos.length > 0 && (
                                                <div className="space-y-3">
                                                  <div className="text-sm font-medium text-theme-primary">الفيديوهات المرفوعة:</div>
                                                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                                    {uploadedVideos.map((video, index) => (
                                                      <div key={video.id} className="relative group">
                                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border theme-border">
                                                          <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0">
                                                              <div className="text-sm font-medium text-theme-primary truncate">
                                                                إعلان {index + 1}
                                                              </div>
                                                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                {video.fileName}
                                                              </div>
                                                            </div>
                                                            <Button
                                                              type="button"
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => removeVideo(video.id)}
                                                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                              <X className="h-3 w-3" />
                                                            </Button>
                                                          </div>
                                                          
                                                          {/* Thumbnail preview */}
                                                          {video.thumbnailUrl ? (
                                                            <div className="aspect-video bg-black rounded overflow-hidden mb-2 relative">
                                                              <img 
                                                                src={video.thumbnailUrl} 
                                                                alt={`معاينة ${video.fileName}`}
                                                                className="w-full h-full object-cover"
                                                              />
                                                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                                                                  <Play className="h-4 w-4 text-gray-800 ml-0.5" />
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ) : (
                                                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mb-2">
                                                              <Video className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                          )}
                                                          
                                                          <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                                                            {video.duration && (
                                                              <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                  
                                                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                                    <div className="flex items-start">
                                                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 ml-2 flex-shrink-0" />
                                                      <div className="text-sm text-blue-800 dark:text-blue-200">
                                                        <div className="font-medium mb-1">سيتم إنشاء {uploadedVideos.length} إعلان</div>
                                                        <div className="text-xs opacity-90">
                                                          جميع الإعلانات ستكون في نفس المجموعة الإعلانية مع نفس الاستهداف والميزانية
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* أزرار الإجراءات */}
                                      <div className="flex justify-between mt-6">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => setCreateCampaignOpen(false)}
                                          className="theme-border hover:bg-theme-primary-light"
                                        >
                                          إلغاء
                                        </Button>
                                        <Button
                                          type="submit"
                                          disabled={createCompleteCampaignMutation.isPending || !selectedAccount}
                                          className="bg-theme-gradient hover:opacity-90 text-white theme-shadow min-w-[120px]"
                                        >
                                          {createCompleteCampaignMutation.isPending ? (
                                            <div className="flex items-center">
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                                              إنشاء...
                                            </div>
                                          ) : (
                                            "إنشاء الحملة الكاملة"
                                          )}
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="grid w-full grid-cols-4 gap-2 p-1 bg-theme-primary-lighter theme-border rounded-lg">
                      <button
                        onClick={() => setActiveTab("campaigns")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "campaigns"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <TrendingUp className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الحملات</span>
                        <span className="text-xs opacity-75">({filteredCampaigns.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("adsets")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "adsets"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Target className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">المجموعات</span>
                        <span className="text-xs opacity-75">({filteredAdSets.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("ads")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "ads"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Video className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الإعلانات</span>
                        <span className="text-xs opacity-75">({filteredAds.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "analytics"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <BarChart3 className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">التحليلات</span>
                        <span className="text-xs opacity-75">📊</span>
                      </button>
                    </div>

                    {/* Table Container - منفصل ومع ترير أفقي */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-0">
                        {campaignsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل الحملات...</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border rounded-lg">
                            <Table className="bg-white dark:bg-gray-800 text-sm w-[1400px]">
                              <TableHeader className="bg-theme-primary-light">
                                <TableRow className="border-theme-primary/20 hover:bg-theme-primary-light">
                                  <TableHead className="w-12 pr-4 text-theme-primary font-semibold">
                                    <div className="flex justify-start pr-2">
                                      <Checkbox
                                        checked={selectedCampaigns.size > 0 && selectedCampaigns.size === filteredCampaigns.length}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            // Select all filtered campaigns and their children
                                            const allCampaignIds = new Set(filteredCampaigns.map((c: any) => c.id));
                                            setSelectedCampaigns(allCampaignIds as Set<string>);
                                            
                                            // Select all ad sets belonging to these campaigns
                                            const allAdSetIds = new Set();
                                            adSets?.adGroups?.forEach((ag: any) => {
                                              if (allCampaignIds.has(ag.campaign_id)) {
                                                allAdSetIds.add(ag.id);
                                              }
                                            });
                                            setSelectedAdSets(allAdSetIds as Set<string>);
                                            
                                            // Select all ads belonging to these ad sets
                                            const allAdIds = new Set();
                                            ads?.ads?.forEach((ad: any) => {
                                              const adSet = adSets?.adGroups?.find((ag: any) => ag.id === ad.adset?.id);
                                              if (adSet && allCampaignIds.has(adSet.campaign_id)) {
                                                allAdIds.add(ad.id);
                                              }
                                            });
                                            setSelectedAds(allAdIds as Set<string>);
                                          } else {
                                            // Deselect all
                                            setSelectedCampaigns(new Set());
                                            setSelectedAdSets(new Set());
                                            setSelectedAds(new Set());
                                          }
                                        }}
                                      />
                                    </div>
                                  </TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">الحالة</TableHead>
                                  <TableHead className="text-right theme-border-b text-theme-primary font-semibold px-3 py-2 min-w-[140px]">اسم الحملة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[90px]">الهدف</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">النتائج</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[110px]">التكلفة لكل نتيجة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">المبلغ المُنفق</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">تاريخ الإنشاء</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[120px]">الميزانية اليومية</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[120px]">إجمالي الميزانية</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCampaigns.length === 0 ? (
                                  <TableRow className="hover:bg-theme-primary-light/50">
                                    <TableCell colSpan={11} className="text-center py-8">
                                      <div className="flex flex-col items-center gap-2">
                                        <TrendingUp className="h-12 w-12 text-theme-primary/60" />
                                        <p className="text-theme-primary">
                                          {campaigns?.campaigns?.length === 0 ? 'لا توجد حملات في هذا الحساب' : 'لا توجد حملات مطابقة لمعايير البحث'}
                                        </p>
                                        <p className="text-sm text-theme-primary/60">قم بإنشاء حملة إعلانية أولاً</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredCampaigns.map((campaign: any) => (
                                    <TableRow key={campaign.id} className="border-theme-primary/20 hover:bg-theme-primary-light/50 transition-colors duration-200">
                                      <TableCell className="pr-4">
                                        <div className="flex justify-start pr-2">
                                          <Checkbox
                                            checked={selectedCampaigns.has(campaign.id)}
                                            onCheckedChange={(checked) => {
                                              handleCampaignSelection(campaign.id, !!checked);
                                            }}
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col items-center gap-1">
                                          <button
                                            onClick={() => {
                                              const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                                              toggleCampaignStatus(campaign.id, newStatus);
                                            }}
                                            disabled={toggleCampaignStatusMutation.isPending}
                                            className={`
                                              relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1
                                              ${campaign.status === 'ACTIVE' 
                                                ? 'bg-[#25d9d6] shadow-sm focus:ring-[#25d9d6]/30' 
                                                : 'bg-gray-200 focus:ring-gray-300'
                                              }
                                              ${toggleCampaignStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                          >
                                            <span
                                              className={`
                                                inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                                ${campaign.status === 'ACTIVE' ? 'left-4' : 'left-0.5'}
                                              `}
                                            />
                                          </button>
                                          <span className={`text-xs font-medium ${
                                            campaign.status === 'ACTIVE' ? 'text-[#25d9d6]' : 'text-gray-500'
                                          }`}>
                                            {campaign.status === 'ACTIVE' ? 'نشطة' : 'متوقفة'}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium text-theme-primary">
                                        {campaign.name}
                                      </TableCell>
                                      <TableCell className="text-theme-primary/80">
                                        {(() => {
                                          const obj = campaign.objective;
                                          if (obj === 'OUTCOME_SALES') return 'حملة شراء';
                                          if (obj === 'OUTCOME_TRAFFIC' || obj === 'LEAD_GENERATION') return 'حملة رسائل';
                                          if (obj === 'LINK_CLICKS') return 'النقرات';
                                          if (obj === 'POST_ENGAGEMENT') return 'التفاعل';
                                          if (obj === 'PAGE_LIKES') return 'الإعجابات';
                                          if (obj === 'REACH') return 'الوصول';
                                          if (obj === 'VIDEO_VIEWS') return 'مشاهدة الفيديو';
                                          if (obj === 'BRAND_AWARENESS') return 'الوعي بالعلامة';
                                          return obj || 'غير محدد';
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-center text-theme-primary font-medium">
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="text-sm">
                                            {(() => {
                                              const insights = campaignInsights?.[campaign.id] || {};
                                              
                                              // حساب النتائج بناءً على نوع الحملة
                                              if (campaign.objective === 'OUTCOME_SALES') {
                                                const purchases = getActionValue(insights, 'purchase') || 0;
                                                return ` ${formatNumber(purchases)}`;
                                              } else if (campaign.objective === 'OUTCOME_TRAFFIC' || campaign.objective === 'LEAD_GENERATION') {
                                                const messaging = getActionValue(insights, 'onsite_conversion.messaging_conversation_started_7d') || 0;
                                                return `💬 ${formatNumber(messaging)}`;
                                              } else {
                                                const linkClicks = getActionValue(insights, 'link_click') || 0;
                                                return `👆 ${formatNumber(linkClicks)}`;
                                              }
                                            })()} 
                                          </span>
                                          <span className="text-xs text-theme-primary/60">
                                            {campaign.objective === 'OUTCOME_SALES' ? 'مبيعات' : campaign.objective === 'OUTCOME_TRAFFIC' ? 'رسائل' : 'نقرات'}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center text-theme-primary font-medium">
                                        <span className="text-sm">
                                          {(() => {
                                            const insights = campaignInsights?.[campaign.id] || {};
                                            
                                            // حساب التكلفة لكل نتيجة بناءً على نوع الحملة
                                            let resultCount = 0;
                                            if (campaign.objective === 'OUTCOME_SALES') {
                                              resultCount = getActionValue(insights, 'purchase') || 0;
                                            } else if (campaign.objective === 'OUTCOME_TRAFFIC' || campaign.objective === 'LEAD_GENERATION') {
                                              resultCount = getActionValue(insights, 'onsite_conversion.messaging_conversation_started_7d') || 0;
                                            } else {
                                              resultCount = getActionValue(insights, 'link_click') || 0;
                                            }
                                            
                                            return insights.spend && resultCount > 0
                                              ? formatCurrency(parseFloat(insights.spend) / resultCount)
                                              : '$0.00';
                                          })()}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center text-theme-primary font-medium">
                                        <span className="text-sm font-semibold">
                                          {(() => {
                                            const insights = campaignInsights?.[campaign.id] || {};
                                            return formatCurrency(insights.spend || 0);
                                          })()}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-theme-primary/80">
                                        {new Date(campaign.created_time).toLocaleDateString('en-US')}
                                      </TableCell>
                                      <TableCell className="text-theme-primary font-medium">
                                        {campaign.daily_budget ? formatCurrency(campaign.daily_budget / 100) : '-'}
                                      </TableCell>
                                      <TableCell className="text-theme-primary font-medium">
                                        {campaign.lifetime_budget ? formatCurrency(campaign.lifetime_budget / 100) : '-'}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="theme-border hover:bg-theme-primary-light"
                                            title="تحرير الحملة"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="theme-border hover:bg-theme-primary-light"
                                            title="نسخ الحملة"
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="theme-border hover:bg-theme-primary-light"
                                            title="عرض اإحصائيات"
                                          >
                                            <BarChart3 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Ad Sets Tab */}
                  <TabsContent value="adsets" className="space-y-3">
                    {/* Control Panel - مفصل عن الجدول */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold text-theme-primary">
                              المجموعات الإعلانية ({filteredAdSets.length})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="البحث في المجموعت..."
                                value={adSetSearchTerm}
                                onChange={(e) => setAdSetSearchTerm(e.target.value)}
                                className="pr-10 theme-border text-right w-40 text-sm"
                              />
                            </div>
                            {/* Status Filter */}
                            <Select value={adSetStatusFilter} onValueChange={setAdSetStatusFilter}>
                              <SelectTrigger className="w-32 theme-border text-right text-sm">
                                <SelectValue placeholder="الة المجموعة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">جميع الجموعات</SelectItem>
                                <SelectItem value="active">نشطة</SelectItem>
                                <SelectItem value="paused">متوقفة</SelectItem>
                                <SelectItem value="archived">مؤرشفة</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="bg-theme-gradient hover:bg-theme-gradient/80 text-white border-0 text-sm px-3"
                            >
                              <Plus className="h-3 w-3 ml-1" />
                              إنشاء مجموعة
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="grid w-full grid-cols-4 gap-2 p-1 bg-theme-primary-lighter theme-border rounded-lg">
                      <button
                        onClick={() => setActiveTab("campaigns")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "campaigns"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <TrendingUp className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الحملات</span>
                        <span className="text-xs opacity-75">({filteredCampaigns.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("adsets")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "adsets"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Target className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">المجموعا</span>
                        <span className="text-xs opacity-75">({filteredAdSets.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("ads")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "ads"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Video className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الإعلانات</span>
                        <span className="text-xs opacity-75">({filteredAds.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "analytics"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <BarChart3 className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">التحليلات</span>
                        <span className="text-xs opacity-75">📊</span>
                      </button>
                    </div>

                    {/* Table Container - منفص ومع تمرير أفقي */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-0">
                        {adSetsError && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>
                              {
                                (adSetsError as any)?.message?.includes('User request limit reached') ||
                                (adSetsError as any)?.message?.includes('يحتوي الساب الإعلاني')
                                  ? 'تم تجاوز حد الطلبت'
                                  : 'خطأ في جلب ابيانات'
                              }
                            </AlertTitle>
                            <AlertDescription>
                              {
                                (adSetsError as any)?.message?.includes('User request limit reached') ||
                                (adSetsError as any)?.message?.includes('يحتوي الحساب الإعلاني')
                                  ? 'تم الوصول إلى حد طلبات Facebook API. النظام يحاول تلقئياً إعادة المحالة. الرجاء الانتظار قليلاً.'
                                  : (adSetsError as any)?.message || 'فشل في جلب المجموعات الإعلانية'
                              }
                            </AlertDescription>
                          </Alert>
                        )}

                        {adSetsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل المجموعات الإعلانية...</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border rounded-lg">
                            <Table className="bg-white dark:bg-gray-800 text-sm w-[1600px]">
                              <TableHeader className="bg-theme-primary-light">
                                <TableRow className="border-theme-primary/20 hover:bg-theme-primary-light">
                                  <TableHead className="w-12 pr-4 text-theme-primary font-semibold">
                                    <div className="flex justify-start pr-2">
                                      <Checkbox
                                        checked={selectedAdSets.size > 0 && selectedAdSets.size === getFilteredAdSets().length}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            // Select all filtered ad sets
                                            const allFilteredAdSetIds = new Set<string>(getFilteredAdSets().map((as: any) => as.id as string));
                                            setSelectedAdSets(allFilteredAdSetIds);
                                            
                                            // Auto-select their parent campaigns
                                            const campaignIds = new Set<string>();
                                            getFilteredAdSets().forEach((as: any) => campaignIds.add(as.campaign_id as string));
                                            setSelectedCampaigns(prev => new Set([...Array.from(prev), ...Array.from(campaignIds)]));
                                            
                                            // Select all ads belonging to these ad sets
                                            const allAdIds = new Set<string>();
                                            ads?.ads?.forEach((ad: any) => {
                                              if (allFilteredAdSetIds.has(ad.adset?.id)) {
                                                allAdIds.add(ad.id as string);
                                              }
                                            });
                                            setSelectedAds(allAdIds);
                                          } else {
                                            // Deselect all ad sets and related ads
                                            setSelectedAdSets(new Set());
                                            setSelectedAds(new Set());
                                          }
                                        }}
                                      />
                                    </div>
                                  </TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">الحالة</TableHead>
                                  <TableHead className="text-right theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[120px]">اسم المجموعة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">النتائج</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">الوصول</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">مرات الظهور</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">التكلفة لكل نتيجة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">المبلغ المُنفق</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">استراتيجية المزايدة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">الميزانية</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">آخر تعديل</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">تاريخ الانتهاء</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">الجدول الزمني</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">جهات الاتصال</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">جهات اتصال جدية</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">عمليات الشراء</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">تكلفة الشراء</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredAdSets.length === 0 ? (
                                  <TableRow className="hover:bg-theme-primary-light/50">
                                    <TableCell colSpan={14} className="text-center py-8">
                                      <div className="flex flex-col items-center gap-2">
                                        <Target className="h-12 w-12 text-theme-primary/60" />
                                        <p className="text-theme-primary">لا توجد مجموعات إعلانية</p>
                                        <p className="text-sm text-theme-primary/60">
                                          {!selectedAccount ? 'يرجى اختيار حساب إعلاني أولاً' : 'لا توجد مجموعات إعلانية في هذا الحساب'}
                                        </p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredAdSets.map((adSet: any) => {
                                    const insights = adSetInsights?.[adSet.id] || {};
                                    const purchases = getActionValue(insights, 'purchase');
                                    const costPerPurchase = getCostPerAction(insights, 'purchase');
                                    const linkClicks = getActionValue(insights, 'link_click');
                                    const pageEngagement = getActionValue(insights, 'page_engagement');
                                    
                                    return (
                                      <TableRow key={adSet.id} className="border-theme-primary/20 hover:bg-theme-primary-light/50 transition-colors duration-200">
                                        <TableCell className="pr-4">
                                          <div className="flex justify-start pr-2">
                                            <Checkbox
                                              checked={selectedAdSets.has(adSet.id)}
                                              onCheckedChange={(checked) => {
                                                handleAdSetSelection(adSet.id, adSet.campaign_id, !!checked);
                                              }}
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="relative">
                                              <button
                                                onClick={() => {
                                                  toggleAdSetStatus(adSet.id, adSet.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
                                                }}
                                                disabled={toggleAdSetStatusMutation.isPending}
                                                className={`
                                                  w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                                  ${adSet.status === 'ACTIVE' ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                                  ${toggleAdSetStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                              >
                                                <span
                                                  className={`
                                                    inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                                    ${adSet.status === 'ACTIVE' ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                                  `}
                                                />
                                              </button>
                                            </div>
                                            <span className={`text-xs font-medium ${
                                              adSet.status === 'ACTIVE' ? 'text-theme-primary' : 'text-theme-primary/60'
                                            }`}>
                                              {adSet.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-theme-primary">{adSet.name}</TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          <div className="flex flex-col">
                                            <span className="font-semibold">
                                              {(() => {
                                                const leads = getLeadsValue(insights);
                                                const conversions = getConversionsValue(insights);
                                                
                                                // عرض عمليات الشراء أولاً (الافتراض أن معظم الحملات شراء)
                                                const purchases = getActionValue(insights, 'purchase') || 0;
                                                const messaging = getActionValue(insights, 'onsite_conversion.messaging_conversation_started_7d') || 0;
                                                
                                                // عرض عمليات الشراء إذا وجدت
                                                if (purchases > 0) {
                                                  return formatNumber(purchases);
                                                } 
                                                // وإلا عرض المحادثات إذا وجدت
                                                else if (messaging > 0) {
                                                  return formatNumber(messaging);
                                                }
                                                // لا يوجد بيانات
                                                else {
                                                  return formatNumber(0);
                                                }
                                              })()} 
                                            </span>
                                            <span className="text-xs text-theme-primary/60 mt-1">
                                              {(() => {
                                                const leads = getLeadsValue(insights);
                                                const conversions = getConversionsValue(insights);
                                                
                                                // عرض تسمية عمليات الشراء أولاً
                                                const purchases = getActionValue(insights, 'purchase') || 0;
                                                const messaging = getActionValue(insights, 'onsite_conversion.messaging_conversation_started_7d') || 0;
                                                
                                                // عرض شراء إذا ود
                                                if (purchases > 0) {
                                                  return 'شراء عبر الويب';
                                                } 
                                                // وإلا عرض محادثات إذا وجدت
                                                else if (messaging > 0) {
                                                  return 'محاثات';
                                                } 
                                                // لا يوجد بيانات
                                                else {
                                                  return '-';
                                                }
                                              })()} 
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">{formatNumber(insights.reach || 0)}</TableCell>
                                        <TableCell className="text-theme-primary font-medium">{formatNumber(insights.impressions || 0)}</TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {(() => {
                                            // استخدام نفس منق عرض النتائج
                                            const purchases = getActionValue(insights, 'purchase') || 0;
                                            const messaging = getActionValue(insights, 'onsite_conversion.messaging_conversation_started_7d') || 0;
                                            let resultCount = 0;
                                            
                                            // حساب اتكلفة بناءً على نوع النتيجة المعروضة
                                            if (purchases > 0) {
                                              resultCount = purchases;
                                            } else if (messaging > 0) {
                                              resultCount = messaging;
                                            }
                                            
                                            return insights.spend && resultCount > 0
                                              ? formatCurrency(parseFloat(insights.spend) / resultCount)
                                              : '$0.00';
                                          })()} 
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-semibold">{formatCurrency(insights.spend || 0)}</TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {(() => {
                                            const strategy = adSet.bid_strategy;
                                            if (strategy === 'LOWEST_COST_WITHOUT_CAP') return 'أقل تكلفة بدون حد أقصى';
                                            if (strategy === 'LOWEST_COST_WITH_BID_CAP') return 'أقل تكلفة ع حد أقصى';
                                            if (strategy === 'TARGET_COST') return 'التكلفة المسهدفة';
                                            if (strategy === 'BID_CAP') return 'حد أقصى للمزايدة';
                                            if (strategy === 'COST_CAP') return 'حد أقصى للتكلفة';
                                            if (strategy === 'LOWEST_COST') return 'أقل تكلفة';
                                            return strategy || 'تلقائ';
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {adSet.daily_budget 
                                            ? `${formatCurrency(parseFloat(adSet.daily_budget) / 100)} / يومي`
                                            : adSet.lifetime_budget 
                                            ? `${formatCurrency(parseFloat(adSet.lifetime_budget) / 100)} / إجمالي`
                                            : 'ير محدد'
                                          }
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {new Date(adSet.updated_time).toLocaleDateString('en-US')}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {adSet.end_time ? new Date(adSet.end_time).toLocaleDateString('en-US') : 'مستمر'}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {adSet.start_time ? new Date(adSet.start_time).toLocaleDateString('en-US') : 'غي محدد'}
                                          {adSet.end_time && (
                                            <div className="text-xs text-theme-primary/60">
                                              إلى {new Date(adSet.end_time).toLocaleDateString('en-US')}
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {formatNumber(getActionValue(insights, 'link_click') || 0)}
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {formatNumber(getActionValue(insights, 'onsite_conversion') || 0)}
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {formatNumber(getActionValue(insights, 'purchase') || 0)}
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {getCostPerAction(insights, 'purchase') > 0 ? formatCurrency(getCostPerAction(insights, 'purchase')) : '0.00 $'}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="theme-border hover:bg-theme-primary-light"
                                              title="نسخ المجموعة الإعلانية"
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="theme-border hover:bg-theme-primary-light">
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="theme-border hover:bg-theme-primary-light">
                                              <BarChart3 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Ads Tab */}
                  <TabsContent value="ads" className="space-y-3">
                    {/* Control Panel */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold text-theme-primary">
                              الإعلانات ({filteredAds.length})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="البحث في الإعلانات..."
                                value={adSearchTerm}
                                onChange={(e) => setAdSearchTerm(e.target.value)}
                                className="pr-10 theme-border text-right w-40 text-sm"
                              />
                            </div>
                            {/* Status Filter */}
                            <Select value={adStatusFilter} onValueChange={setAdStatusFilter}>
                              <SelectTrigger className="w-32 theme-border text-right text-sm">
                                <SelectValue placeholder="حالة الإعلان" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">جميع الإعلانات</SelectItem>
                                <SelectItem value="active">نشطة</SelectItem>
                                <SelectItem value="paused">متوقفة</SelectItem>
                                <SelectItem value="archived">مؤرشفة</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="bg-theme-gradient hover:bg-theme-gradient/80 text-white border-0 text-sm px-3"
                            >
                              <Plus className="h-3 w-3 ml-1" />
                              إنشاء إعلان
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Navigation Buttons */}
                    <div className="grid w-full grid-cols-4 gap-2 p-1 bg-theme-primary-lighter theme-border rounded-lg">
                      <button
                        onClick={() => setActiveTab("campaigns")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "campaigns"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <TrendingUp className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الحملات</span>
                        <span className="text-xs opacity-75">({filteredCampaigns.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("adsets")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "adsets"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Target className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">المجموعات</span>
                        <span className="text-xs opacity-75">({filteredAdSets.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("ads")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "ads"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Video className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الإعلانات</span>
                        <span className="text-xs opacity-75">({filteredAds.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "analytics"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <BarChart3 className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">التحليلات</span>
                        <span className="text-xs opacity-75">📊</span>
                      </button>
                    </div>

                    {/* Table Container */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-0">
                        {adsError && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>
                              {
                                (adsError as any)?.message?.includes('User request limit reached')
                                  ? 'تم تجاوز حد الطلبات'
                                  : 'خطأ في جلب البيانات'
                              }
                            </AlertTitle>
                            <AlertDescription>
                              {
                                (adsError as any)?.message?.includes('User request limit reached')
                                  ? 'تم الوصول إل حد طلبات Facebook API. النظام يحاول تلقائياً إعادة المحاولة. الرجاء الانتظر قليلاً.'
                                  : (adsError as any)?.message || 'فشل ف جلب الإعلانات'
                              }
                            </AlertDescription>
                          </Alert>
                        )}

                        {adsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل الإعلانات...</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border rounded-lg">
                            <Table className="bg-white dark:bg-gray-800 text-sm w-[1800px]">
                              <TableHeader className="bg-theme-primary-light">
                                <TableRow className="border-theme-primary/20 hover:bg-theme-primary-light">
                                  <TableHead className="w-12 pr-4 text-theme-primary font-semibold">
                                    <div className="flex justify-start pr-2">
                                      <Checkbox
                                        checked={selectedAds.size > 0 && selectedAds.size === getFilteredAds().length}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            // Select all filtered ads
                                            const allFilteredAdIds = new Set<string>(getFilteredAds().map((ad: any) => ad.id as string));
                                            setSelectedAds(allFilteredAdIds);
                                            
                                            // Auto-select their parent ad sets and campaigns
                                            const adSetIds = new Set<string>();
                                            const campaignIds = new Set<string>();
                                            getFilteredAds().forEach((ad: any) => {
                                              if (ad.adset?.id) adSetIds.add(ad.adset.id as string);
                                              const adSet = adSets?.adGroups?.find((ag: any) => ag.id === ad.adset?.id);
                                              if (adSet?.campaign_id) campaignIds.add(adSet.campaign_id as string);
                                            });
                                            setSelectedAdSets(prev => new Set([...Array.from(prev), ...Array.from(adSetIds)]));
                                            setSelectedCampaigns(prev => new Set([...Array.from(prev), ...Array.from(campaignIds)]));
                                          } else {
                                            // Deselect all ads
                                            setSelectedAds(new Set());
                                          }
                                        }}
                                      />
                                    </div>
                                  </TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">تشغيل/إيقاف</TableHead>
                                  <TableHead className="text-right theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[140px]">اسم الإعلان</TableHead>
                                  <TableHead className="text-right theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[120px]">اسم مجموعة الإعلان</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[120px]">استراتيجية المزايدة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[80px]">الوصول</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">تصنيف الجودة</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">تصنيف معدل التفاعل</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">تصنيف معدل التحويل</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">المبلغ المنفق</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">الفيديو</TableHead>
                                  <TableHead className="text-center theme-border-b text-theme-primary font-semibold px-2 py-2 min-w-[100px]">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredAds.length === 0 ? (
                                  <TableRow className="hover:bg-theme-primary-light/50">
                                    <TableCell colSpan={11} className="text-center py-8">
                                      <div className="flex flex-col items-center gap-2">
                                        <Video className="h-12 w-12 text-theme-primary/60" />
                                        <h3 className="text-lg font-semibold text-theme-primary">لا توجد إعلانات</h3>
                                        <p className="text-sm text-theme-primary/60">قم بإنشاء إعلانك الأول</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredAds.map((ad: any) => {
                                    const insights = adInsights?.[ad.id] || {};
                                    
                                    return (
                                      <TableRow key={ad.id} className="border-theme-primary/20 hover:bg-theme-primary-light/50 transition-colors duration-200">
                                        <TableCell className="pr-4">
                                          <div className="flex justify-start pr-2">
                                            <Checkbox
                                              checked={selectedAds.has(ad.id)}
                                              onCheckedChange={(checked) => {
                                                const adSet = adSets?.adGroups?.find((ag: any) => ag.id === ad.adset?.id);
                                                const campaignId = adSet?.campaign_id;
                                                if (campaignId) {
                                                  handleAdSelection(ad.id, ad.adset?.id, campaignId, !!checked);
                                                }
                                              }}
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex flex-col items-center gap-1">
                                            <button
                                              onClick={() => {
                                                const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                                                toggleAdStatusMutation.mutate({ adId: ad.id, status: newStatus });
                                              }}
                                              disabled={toggleAdStatusMutation.isPending}
                                              className={`
                                                relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1
                                                ${ad.status === 'ACTIVE' 
                                                  ? 'bg-[#25d9d6] shadow-sm focus:ring-[#25d9d6]/30' 
                                                  : 'bg-gray-200 focus:ring-gray-300'
                                                }
                                                ${toggleAdStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                              `}
                                            >
                                              <span
                                                className={`
                                                  inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                                  ${ad.status === 'ACTIVE' ? 'left-4' : 'left-0.5'}
                                                `}
                                              />
                                            </button>
                                            <span className={`text-xs font-medium ${
                                              ad.status === 'ACTIVE' ? 'text-[#25d9d6]' : 'text-gray-500'
                                            }`}>
                                              {ad.status === 'ACTIVE' ? 'نشط' : 'متوقف'}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium text-right">
                                          {ad.name}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80 text-right">
                                          {ad.adset?.name || 'غير محدد'}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {ad.bid_type === 'CPC' ? 'تكلفة لكل نقرة' : 
                                           ad.bid_type === 'CPM' ? 'تكلفة لكل 1000 ظهور' :
                                           ad.bid_type === 'OCPM' ? 'تكلفة محسّنة لكل ظهور' :
                                           ad.bid_type === 'ABSOLUTE_OCPM' ? 'تكلفة محسّنة مطلقة لكل ظهور' :
                                           ad.bid_type || 'تلقائي'}
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {formatNumber(insights.reach || 0)}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {(() => {
                                            const ranking = insights.quality_ranking;
                                            if (!ranking || ranking === 'UNKNOWN') return 'غير متاح';
                                            if (ranking === 'ABOVE_AVERAGE' || ranking.startsWith('ABOVE_AVERAGE')) return 'أعلى من المتوسط';
                                            if (ranking === 'AVERAGE' || ranking.startsWith('AVERAGE')) return 'متوسط';
                                            if (ranking === 'BELOW_AVERAGE' || ranking.startsWith('BELOW_AVERAGE')) return 'أقل من المتوسط';
                                            return ranking;
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {(() => {
                                            const ranking = insights.engagement_rate_ranking;
                                            if (!ranking || ranking === 'UNKNOWN') return 'غير متاح';
                                            if (ranking === 'ABOVE_AVERAGE' || ranking.startsWith('ABOVE_AVERAGE')) return 'أعلى من المتوسط';
                                            if (ranking === 'AVERAGE' || ranking.startsWith('AVERAGE')) return 'متوسط';
                                            if (ranking === 'BELOW_AVERAGE' || ranking.startsWith('BELOW_AVERAGE')) return 'أقل من المتوسط';
                                            return ranking;
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-theme-primary/80">
                                          {(() => {
                                            const ranking = insights.conversion_rate_ranking;
                                            if (!ranking || ranking === 'UNKNOWN') return 'غير متاح';
                                            if (ranking === 'ABOVE_AVERAGE' || ranking.startsWith('ABOVE_AVERAGE')) return 'أعلى من المتوسط';
                                            if (ranking === 'AVERAGE' || ranking.startsWith('AVERAGE')) return 'متوسط';
                                            if (ranking === 'BELOW_AVERAGE' || ranking.startsWith('BELOW_AVERAGE')) return 'أقل من المتوسط';
                                            return ranking;
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-theme-primary font-medium">
                                          {insights.spend ? formatCurrency(parseFloat(insights.spend)) : '$0.00'}
                                        </TableCell>
                                        <TableCell>
                                          {ad.creative?.video_id ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="theme-border hover:bg-theme-primary-light"
                                              onClick={() => {
                                                const videoId = ad.creative?.object_story_spec?.video_data?.video_id || ad.creative.video_id;
                                                if (videoId) {
                                                  window.open(`https://www.facebook.com/watch/?v=${videoId}`, '_blank');
                                                }
                                              }}
                                              title="عرض الفيديو"
                                            >
                                              <Play className="h-4 w-4" />
                                            </Button>
                                          ) : ad.creative?.image_url ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="theme-border hover:bg-theme-primary-light"
                                              title="صورة"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          ) : (
                                            <span className="text-gray-400 text-sm">لا توجد وسائط</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="theme-border hover:bg-theme-primary-light"
                                              title="تحرير الإعلان"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="theme-border hover:bg-theme-primary-light"
                                              title="نسخ الإعلان"
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="theme-border hover:bg-theme-primary-light"
                                              title="عرض الإحصائيات"
                                            >
                                              <BarChart3 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-3">
                    {/* Navigation Buttons */}
                    <div className="grid w-full grid-cols-4 gap-2 p-1 bg-theme-primary-lighter theme-border rounded-lg">
                      <button
                        onClick={() => setActiveTab("campaigns")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "campaigns"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <TrendingUp className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الحملات</span>
                        <span className="text-xs opacity-75">({filteredCampaigns.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("adsets")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "adsets"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Target className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">المجموعات</span>
                        <span className="text-xs opacity-75">({filteredAdSets.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("ads")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "ads"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <Video className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">الإعلانات</span>
                        <span className="text-xs opacity-75">({filteredAds.length})</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-200 hover:scale-102 hover:shadow-sm",
                          activeTab === "analytics"
                            ? "bg-theme-gradient text-white border-theme-primary theme-shadow scale-102"
                            : "bg-white dark:bg-gray-800 text-theme-primary border-theme-primary/30 hover:bg-theme-primary-light hover:border-theme-primary"
                        )}
                      >
                        <BarChart3 className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">التحليلات</span>
                        <span className="text-xs opacity-75"></span>
                      </button>
                    </div>
                    
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardContent className="p-8 text-center">
                        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">التحليلات</h3>
                        <p className="text-gray-600 dark:text-gray-400">قريباً... تحليلات الأداء المفصلة</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-lg bg-black text-center border-none">
          <div className="flex flex-col items-center justify-center space-y-6 p-8">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            
            {/* Success Message */}
            <div className="text-center space-y-3">
              <DialogTitle className="text-3xl font-bold text-white text-center leading-relaxed">
                ✅ تم إنشاء الحملة بنجاح!
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-xl text-center leading-relaxed max-w-md mx-auto">
                تم إنشاء حملة Meta كاملة مع المجموعة الإعلانية والإعلان
              </DialogDescription>
            </div>
            
            {/* Loading Message */}
            <div className="text-gray-400 text-base text-center">
              سيتم تحديث الصفحة خلال 3 ثواني...
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
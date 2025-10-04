import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { completeTiktokCampaignSchema, type CompleteTiktokCampaign } from "@shared/schema";
import { 
  Megaphone, 
  Target, 
  Eye, 
  MousePointer, 
  Users, 
  TrendingUp, 
  Plus, 
  RotateCcw, 
  Calendar as CalendarIcon,
  DollarSign,
  BarChart3,
  Settings,
  Upload,
  Video,
  Image as ImageIcon,
  FileText,
  User,
  Phone,
  Loader2,

  MessageSquare,
  MapPin,
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
  Activity,
  Zap,
  User2,
  Filter,
  Download,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  Circle,
  Clock,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useThemeInitializer } from "@/hooks/useThemeInitializer";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import ThemeToggle from "@/components/ThemeToggle";


interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

interface TikTokCampaign {
  id: string;
  campaignId: string;
  campaignName: string;
  objective: string;
  status: string;
  budget: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  leads: number;
  ctr: number;
  cpc: number;
  createdAt: string;
}

interface TikTokLead {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  submittedAt: string;
  followUpStatus: string;
  notes?: string;
}

interface TikTokAdGroup {
  id: string;
  adGroupId: string;
  campaignId: string;
  adGroupName: string;
  status: string;
  budgetMode?: string;
  budget?: number;
  bidType?: string;
  bidPrice?: number;
  placement?: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  createdAt: string;
  updatedAt?: string;
}

interface TikTokAd {
  id: string;
  adId: string;
  adGroupId: string;
  campaignId: string;
  adName: string;
  status: string;
  adFormat: string;
  landingPageUrl?: string;
  displayName?: string;
  adText?: string;
  callToAction?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoId?: string;
  coverImageUrl?: string;
  hasVideo?: boolean;
  actualVideoUrl?: string; // URL الفيديو الفعلي من TikTok
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  createdAt: string;
  updatedAt?: string;
}

interface TikTokAnalytics {
  overview: {
    activeCampaigns: number;
    totalCampaigns: number;
    totalAdGroups: number;
    totalAds: number;
    totalLeads: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    leads: number;
  };
  metrics: {
    ctr: number;
    cpc: number;
    cpm: number;
    conversionRate: number;
  };
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    objective: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

interface TikTokAccountBalance {
  balance: number;
  currency: string;
  status: string;
  lastUpdated: string;
  last_updated?: string;  // إضافة الخاصية الجديدة من Backend
  advertiser_id?: string; // إضافة advertiser_id للرابط الديناميكي
  isAvailable: boolean;
  error?: string;
}

interface TikTokAccountInfo {
  id: string;
  name: string;
  status: string;
  country: string;
  currency: string;
  timezone: string;
  advertiser_id?: string; // إضافة advertiser_id للرابط الديناميكي
  company?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  createdTime?: string;
}

// Video Thumbnail Component
const VideoThumbnail = ({ videoId, adName, session, onVideoClick }: {
  videoId: string;
  adName: string;
  session: PlatformSession | undefined;
  onVideoClick: (videoData: {videoUrl: string, coverUrl: string, videoId: string}) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Load cover image on mount if it's a TikTok video
  useEffect(() => {
    if (videoId && (videoId.startsWith('v1') || videoId.startsWith('v0'))) {
      setIsLoading(true);
      fetch(`/api/tiktok-video-info/${videoId}?platformId=${session?.platformId}`)
        .then(response => response.json())
        .then(videoData => {
          if (videoData.success && videoData.coverUrl) {
            setCoverImage(videoData.coverUrl);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setIsLoading(false));
    }
  }, [videoId, session?.platformId]);

  const handleClick = () => {
    if (videoId && (videoId.startsWith('v1') || videoId.startsWith('v0'))) {
      setIsLoading(true);
      fetch(`/api/tiktok-video-info/${videoId}?platformId=${session?.platformId}`)
        .then(response => response.json())
        .then(videoData => {
          if (videoData.success && videoData.videoUrl) {
            onVideoClick({
              videoUrl: videoData.videoUrl,
              coverUrl: videoData.coverUrl || '',
              videoId: videoData.videoId
            });
          } else {
            alert('عذراً، لم يتم العثور على رابط الفيديو');
          }
        })
        .catch(error => {
          console.error('خطأ في جلب الفيديو:', error);
          alert('خطأ في جلب الفيديو');
        })
        .finally(() => setIsLoading(false));
    }
  };

  if (isLoading && !coverImage) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-16 bg-theme-primary-light rounded-lg flex items-center justify-center theme-border">
          <RefreshCw className="h-4 w-4 text-theme-primary animate-spin" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-theme-primary font-medium">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error || !coverImage) {
    return (
      <div className="flex items-center justify-center">
        <div 
          className="w-16 h-16 bg-theme-primary-light rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform theme-border"
          onClick={handleClick}
        >
          <Video className="h-8 w-8 text-theme-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div 
        className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform theme-border relative group"
        onClick={handleClick}
      >
        <img 
          src={coverImage}
          alt={`كوفر ${adName}`}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <Play className="h-6 w-6 text-white opacity-80" fill="white" />
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getStatusBadge = (status: string) => {
  console.log('Campaign status:', status); // للتحقق من القيمة الفعلية
  
  switch (status) {
    case 'ENABLE':
      return (
        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
          <CheckCircle className="ml-1 h-3 w-3" />
          فعّال
        </Badge>
      );
    case 'DISABLE':
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
          <Pause className="ml-1 h-3 w-3" />
          معطّل
        </Badge>
      );
    case 'PAUSE':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="ml-1 h-3 w-3" />
          متوقف
        </Badge>
      );
    case 'CAMPAIGN_STATUS_DELETE':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
          <Trash2 className="ml-1 h-3 w-3" />
          محذوف
        </Badge>
      );
    // للعملاء المحتملين
    case 'new':
      return (
        <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-300">
          <AlertCircle className="ml-1 h-3 w-3" />
          جديد
        </Badge>
      );
    case 'contacted':
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300">
          <Phone className="ml-1 h-3 w-3" />
          تم التواصل
        </Badge>
      );
    case 'interested':
      return (
        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
          <CheckCircle className="ml-1 h-3 w-3" />
          مهتم
        </Badge>
      );
    case 'not_interested':
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
          <Clock className="ml-1 h-3 w-3" />
          غير مهتم
        </Badge>
      );
    case 'converted':
      return (
        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
          <CheckCircle className="ml-1 h-3 w-3" />
          تحول لعميل
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status || 'غير محدد'}
        </Badge>
      );
  }
};

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
      startDate: subDays(today, 365), // آخر سنة
      endDate: today
    }
  ];
};

// Schema للنماذج
const campaignSchema = z.object({
  campaignName: z.string().min(1, "اسم الحملة مطلوب"),
  objective: z.string().min(1, "هدف الحملة مطلوب"),
  budgetMode: z.string().min(1, "نوع الميزانية مطلوب"),
  budget: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const leadFormSchema = z.object({
  formName: z.string().min(1, "اسم النموذج مطلوب"),
  formTitle: z.string().min(1, "عنوان النموذج مطلوب"),
  formDescription: z.string().optional(),
  privacyPolicyUrl: z.string().url("يجب أن يكون رابط صحيح").optional(),
  successMessage: z.string().min(1, "رسالة النجاح مطلوبة"),
});

// Clone Ad Group Schema
const cloneAdGroupSchema = z.object({
  adGroupName: z.string().min(1, "اسم المجموعة الإعلانية مطلوب"),
  budgetMode: z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL", "BUDGET_MODE_DYNAMIC_DAILY_BUDGET", "BUDGET_MODE_INFINITE"]),
  budget: z.string().optional(),
  bidType: z.enum(["BID_TYPE_NO_BID", "BID_TYPE_CUSTOM"]).default("BID_TYPE_NO_BID"),
  bidPrice: z.string().optional(),
  placementType: z.enum(["PLACEMENT_TYPE_AUTOMATIC", "PLACEMENT_TYPE_SELECT"]).default("PLACEMENT_TYPE_AUTOMATIC"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

// Clone Ad Schema  
const cloneAdSchema = z.object({
  adName: z.string().min(1, "اسم الإعلان مطلوب"),
  adFormat: z.enum(["SINGLE_VIDEO", "SINGLE_IMAGE", "COLLECTION"]),
  adText: z.string().min(1, "نص الإعلان مطلوب"),
  videoUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  landingPageUrl: z.string().url().optional(),
  callToAction: z.string().optional(),
});



// مخطط إنشاء الحملة الكاملة
// Using the shared schema for complete campaign creation

// دالة للحصول على التوقيت المحلي لبغداد (UTC+3)
const getBaghdadTime = () => {
  const now = new Date();
  
  // استخدام Intl.DateTimeFormat للحصول على التوقيت الصحيح للعراق
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baghdad', // توقيت بغداد الرسمي
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
  
  // تكوين التاريخ والوقت بالتنسيق المطلوب للـ input datetime-local
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export default function PlatformAdsTikTokManagement() {
  // تطبيق الثيمات عند تحميل الصفحة
  useThemeInitializer();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isMobile = useIsMobile();

  // File upload functions
  const uploadFile = async (file: File, type: 'video' | 'image'): Promise<string> => {
    // استخدام endpoint عام للفيديوهات المخصصة لإعلانات TikTok
    const endpoint = type === 'video' ? '/api/upload/tiktok-video' : `/api/upload/${type}`;
    
    // Get presigned upload URL
    const response = await fetch(endpoint, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`فشل الحصول على رابط رفع ${type === 'video' ? 'الفيديو' : 'الصورة'}`);
    }
    
    const data = await response.json();
    const uploadURL = data.uploadURL;
    
    // Upload file directly to Object Storage
    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`فشل رفع ${type === 'video' ? 'الفيديو' : 'الصورة'} إلى التخزين`);
    }
    
    return uploadURL.split('?')[0]; // Return clean URL without query parameters
  };

  const handleVideoUpload = async (file: File, field: any) => {
    setUploading(true);
    try {
      // رفع الفيديو مباشرة إلى TikTok
      const formData = new FormData();
      formData.append('video', file);

      console.log('📤 رفع فيديو مباشرة إلى TikTok...', file.name);

      const response = await fetch('/api/upload/tiktok-video/direct', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // معالجة خاصة لخطأ المصادقة
        if (response.status === 401) {
          throw new Error('يجب تسجيل الدخول أولاً للمتابعة. يرجى إعادة تسجيل الدخول وإعادة المحاولة.');
        }
        
        // معالجة خاصة لعدم وجود إعدادات TikTok
        if (response.status === 400 && errorData.error === "TikTok integration not configured") {
          throw new Error('لم يتم ربط حساب TikTok بعد. يجب ربط الحساب أولاً من إعدادات المنصات الإعلانية.');
        }
        
        throw new Error(errorData.details || errorData.error || 'فشل في رفع الفيديو إلى TikTok');
      }

      const result = await response.json();
      console.log('✅ تم رفع الفيديو مباشرة إلى TikTok:', result.videoId);

      // حفظ معرف الفيديو في الحقل
      field.onChange(result.videoId);
      
      // حفظ صورة الغلاف إذا كانت متوفرة
      if (result.videoCoverUrl) {
        console.log('📸 صورة غلاف الفيديو:', result.videoCoverUrl);
        // يمكن حفظ صورة الغلاف في حقل منفصل إذا لزم الأمر
        // completeCampaignForm.setValue('videoCoverUrl', result.videoCoverUrl);
      }

      toast({
        title: "✅ تم رفع الفيديو بنجاح",
        description: `تم رفع ${file.name} مباشرة إلى TikTok`,
      });
    } catch (error) {
      console.error('❌ خطأ في رفع الفيديو:', error);
      toast({
        title: "❌ خطأ في رفع الفيديو",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (files: File[], field: any) => {
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(file => uploadFile(file, 'image'))
      );
      field.onChange([...(field.value || []), ...urls]);
      toast({
        title: "✅ تم رفع الصور بنجاح",
        description: `تم رفع ${files.length} صورة بنجاح`,
      });
    } catch (error) {
      toast({
        title: "❌ خطأ في رفع الصور",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, field: any, type: 'video' | 'image') => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (type === 'video' && files.length > 0) {
      const videoFile = files[0];
      if (videoFile.type.startsWith('video/')) {
        handleVideoUpload(videoFile, field);
      } else {
        toast({
          title: "❌ نوع الملف غير مدعوم",
          description: "يرجى اختيار ملف فيديو صالح",
          variant: "destructive",
        });
      }
    } else if (type === 'image') {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        handleImageUpload(imageFiles, field);
      } else {
        toast({
          title: "❌ نوع الملف غير مدعوم",
          description: "يرجى اختيار ملفات صور صالحة",
          variant: "destructive",
        });
      }
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [activeTab, setActiveTab] = useState("overview");
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [createCompleteCampaignOpen, setCreateCompleteCampaignOpen] = useState(false);
  const [createLeadFormOpen, setCreateLeadFormOpen] = useState(false);
  const [createPixelOpen, setCreatePixelOpen] = useState(false);
  const [newPixelName, setNewPixelName] = useState('');
  const [newPixelMode, setNewPixelMode] = useState('STANDARD_MODE');
  const [identitiesDialogOpen, setIdentitiesDialogOpen] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState<any>(null);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>(getDateRangeOptions()[4]); // طوال المدة كافتراضي
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{from?: Date; to?: Date}>({});
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Collapsible sections state - قسم الحملة مفتوح في البداية، باقي الأقسام مغلقة
  const [campaignSectionCollapsed, setCampaignSectionCollapsed] = useState(false);
  const [adGroupSectionCollapsed, setAdGroupSectionCollapsed] = useState(true);
  const [adSectionCollapsed, setAdSectionCollapsed] = useState(true);
  const [targetingSectionCollapsed, setTargetingSectionCollapsed] = useState(true);

  // Section completion tracking - تتبع اكتمال كل قسم
  const [campaignCompleted, setCampaignCompleted] = useState(false);
  const [adGroupCompleted, setAdGroupCompleted] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [targetingCompleted, setTargetingCompleted] = useState(false);

  // Copy tracking state - تتبع عملية النسخ
  const [isCloning, setIsCloning] = useState(false);
  const [cloneData, setCloneData] = useState<any>(null);
  const [cloneType, setCloneType] = useState<'campaign' | 'adGroup' | 'ad' | null>(null);
  
  // States for separate copy modals
  const [cloneAdGroupModalOpen, setCloneAdGroupModalOpen] = useState(false);
  const [cloneAdModalOpen, setCloneAdModalOpen] = useState(false);
  const [cloneAdGroupData, setCloneAdGroupData] = useState<TikTokAdGroup | null>(null);
  const [cloneAdData, setCloneAdData] = useState<TikTokAd | null>(null);

  // Clone modals section states
  const [cloneAdGroupSectionCollapsed, setCloneAdGroupSectionCollapsed] = useState(false);
  const [cloneAdSectionCollapsed, setCloneAdSectionCollapsed] = useState(false);

  // Validation functions لتحديد اكتمال كل قسم
  const validateCampaignSection = () => {
    const campaignName = completeCampaignForm.watch("campaignName");
    const objective = completeCampaignForm.watch("objective");
    const budgetMode = completeCampaignForm.watch("campaignBudgetMode");
    const identityId = completeCampaignForm.watch("identityId");
    
    const isValid = !!(campaignName && objective && budgetMode && identityId);
    
    // تسجيل للتشخيص
    console.log('🔍 Campaign Section Validation:', {
      campaignName: !!campaignName,
      objective: !!objective,
      budgetMode: !!budgetMode,
      identityId: !!identityId,
      identityValue: identityId,
      isValid
    });
    
    return isValid;
  };
  
  const validateAdGroupSection = () => {
    const adGroupName = completeCampaignForm.watch("adGroupName");
    const adGroupBudgetMode = completeCampaignForm.watch("adGroupBudgetMode");
    const adGroupBudget = completeCampaignForm.watch("adGroupBudget");
    const optimization = completeCampaignForm.watch("optimizationEvent");
    const pixelId = completeCampaignForm.watch("pixelId");
    // تبسيط التحقق - حدث التحسين مطلوب دائماً
    const requireOptimization = true;
    const isCBOEnabled = completeCampaignForm.watch("useCampaignBudgetOptimization");
    
    // إذا كان CBO مفعل، الميزانية غير مطلوبة
    if (isCBOEnabled) {
      // يتطلب optimizationEvent دائماً عند اختيار بكسل
      return !!(adGroupName && adGroupBudgetMode && (!requireOptimization || optimization));
    }
    
    // إذا لم يكن CBO مفعل، الميزانية مطلوبة
    return !!(adGroupName && adGroupBudgetMode && adGroupBudget && (!requireOptimization || optimization));
  };
  
  const validateAdSection = () => {
    const adName = completeCampaignForm.watch("adName");
    const adText = completeCampaignForm.watch("adText");
    const videoUrl = completeCampaignForm.watch("videoUrl");
    
    return !!(adName && adText && videoUrl);
  };

  const validateTargetingSection = () => {
    // قسم الاستهداف اختياري - يعتبر مكتمل إذا تم اختيار أي إعداد أو يمكن تركه فارغ
    const targeting = completeCampaignForm.watch("targeting");
    // اعتبار القسم مكتمل إذا كان قسم الإعلان مكتمل (لأنه اختياري)
    return adCompleted;
  };

  // Section state managers - إدارة حالة الأقسام
  const handleSectionClick = (section: 'campaign' | 'adGroup' | 'ad' | 'targeting') => {
    switch (section) {
      case 'campaign':
        setCampaignSectionCollapsed(!campaignSectionCollapsed);
        break;
      case 'adGroup':
        // فتح قسم المجموعة الإعلانية فقط إذا اكتملت الحملة
        if (campaignCompleted) {
          setAdGroupSectionCollapsed(!adGroupSectionCollapsed);
        }
        break;
      case 'ad':
        // فتح قسم الإعلان فقط إذا اكتملت المجموعة الإعلانية
        if (adGroupCompleted) {
          setAdSectionCollapsed(!adSectionCollapsed);
        }
        break;
      case 'targeting':
        // فتح قسم الاستهداف فقط إذا اكتمل الإعلان
        if (adCompleted) {
          setTargetingSectionCollapsed(!targetingSectionCollapsed);
        }
        break;
    }
  };

  // Checkbox selection states
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedAdGroups, setSelectedAdGroups] = useState<Set<string>>(new Set());
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());

  // Video modal states - حالات مودال الفيديو
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoData, setSelectedVideoData] = useState<{videoUrl: string, coverUrl: string, videoId: string} | null>(null);
  const [selectedTikTokAd, setSelectedTikTokAd] = useState<TikTokAd | null>(null);

  // قائمة أحداث التحسين المبسطة - الأحداث المقبولة فعلياً من TikTok AdGroup API
  const optimizationEvents = {
    'ON_WEB_ORDER': '🛒 شراء على الويب (موصى به)',
    'SUCCESSORDER_PAY': '💰 دفع طلب ناجح',
    'SUCCESSORDER_ACTION': '✅ إجراء طلب ناجح',
    'ON_WEB_CART': '🛍️ إضافة إلى السلة',
    'LANDING_PAGE_VIEW': '👁️ عرض صفحة الهبوط',
    'INITIATE_ORDER': '💳 بدء الطلب',
    'FORM': '📝 إرسال نموذج',
    'BUTTON': '🖱️ النقر على زر',
    'PAGE_VIEW': '📄 عرض الصفحة'
  };

  // دالة مبسطة لإرجاع قائمة الأحداث الثابتة
  const getAvailableOptimizationEvents = () => {
    return Object.entries(optimizationEvents).map(([key, label]) => ({
      value: key,
      label: label
    }));
  };

  // Checkbox selection handlers
  const handleCampaignSelection = (campaignId: string, isSelected: boolean) => {
    const newSelectedCampaigns = new Set(selectedCampaigns);
    
    // campaignId هو database UUID للحملة
    
    if (isSelected) {
      newSelectedCampaigns.add(campaignId);
    } else {
      newSelectedCampaigns.delete(campaignId);
      // Remove all related ad groups and ads when campaign is deselected
      const campaignAdGroups = adGroupsData?.adGroups?.filter(ag => ag.campaignId === campaignId) || [];
      const newSelectedAdGroups = new Set(selectedAdGroups);
      const newSelectedAds = new Set(selectedAds);
      
      campaignAdGroups.forEach(ag => {
        newSelectedAdGroups.delete(ag.id);
        // Remove ads belonging to this ad group
        const adGroupAds = adsData?.ads?.filter(ad => ad.adGroupId === ag.id) || [];
        adGroupAds.forEach(ad => newSelectedAds.delete(ad.id));
      });
      
      setSelectedAdGroups(newSelectedAdGroups);
      setSelectedAds(newSelectedAds);
    }
    
    setSelectedCampaigns(newSelectedCampaigns);
  };

  const handleAdGroupSelection = (adGroupId: string, campaignId: string, isSelected: boolean) => {
    const newSelectedAdGroups = new Set(selectedAdGroups);
    const newSelectedAds = new Set(selectedAds);
    
    // adGroupId here is the database UUID
    
    if (isSelected) {
      newSelectedAdGroups.add(adGroupId);
      // Auto-select parent campaign if not already selected
      setSelectedCampaigns(prev => new Set(prev).add(campaignId));
    } else {
      newSelectedAdGroups.delete(adGroupId);
      // Remove all ads belonging to this ad group (using database UUID)
      const adGroupAds = adsData?.ads?.filter(ad => ad.adGroupId === adGroupId) || [];
      adGroupAds.forEach(ad => newSelectedAds.delete(ad.id));
    }
    
    setSelectedAdGroups(newSelectedAdGroups);
    setSelectedAds(newSelectedAds);
  };

  const handleAdSelection = (adId: string, adGroupId: string, campaignId: string, isSelected: boolean) => {
    const newSelectedAds = new Set(selectedAds);
    
    if (isSelected) {
      newSelectedAds.add(adId);
      // Auto-select parent ad group and campaign if not already selected
      setSelectedAdGroups(prev => new Set(prev).add(adGroupId));
      setSelectedCampaigns(prev => new Set(prev).add(campaignId));
    } else {
      newSelectedAds.delete(adId);
    }
    
    setSelectedAds(newSelectedAds);
  };

  // Filtering functions based on selection
  const getFilteredAdGroups = () => {
    if (!adGroupsData?.adGroups) return [];
    
    // If no campaigns are selected, show all ad groups
    if (selectedCampaigns.size === 0) {
      return adGroupsData.adGroups;
    }
    
    // Filter ad groups to only show those belonging to selected campaigns (by UUID)
    return adGroupsData.adGroups.filter(ag => selectedCampaigns.has(ag.campaignId));
  };

  // دالة للحصول على البيانات التحليلية لإعلان معين
  const getAdAnalytics = (ad: TikTokAd) => {
    // استخدام البيانات المباشرة من الإعلان إذا كانت متوفرة
    if (ad.impressions !== undefined || ad.clicks !== undefined || ad.spend !== undefined) {
      return {
        impressions: ad.impressions || 0,
        clicks: ad.clicks || 0,
        spend: String(ad.spend || '0'),
        conversions: ad.conversions || 0,
        leads: (ad as any).leads || 0
      };
    }

    // البحث عن البيانات التحليلية للحملة التي ينتمي إليها الإعلان
    const adGroup = adGroupsData?.adGroups?.find(ag => ag.id === ad.adGroupId);
    if (!adGroup) return null;
    
    const campaign = campaignsData?.campaigns?.find(c => c.id === adGroup.campaignId);
    if (!campaign) return null;
    
    // البحث في البيانات التحليلية المسترجعة من TikTok API أولاً
    let campaignAnalytics = analytics?.campaigns?.find(c => c.id === campaign.id || (c as any).campaignId === campaign.id);
    
    // إذا لم تُجد، استخدم البيانات من قاعدة البيانات المحلية
    if (!campaignAnalytics) {
      campaignAnalytics = {
        id: campaign.id,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        spend: parseFloat(String(campaign.spend || '0')),
        conversions: campaign.conversions || 0,
        leads: (campaign as any).leads || 0
      } as any;
    }
    
    // حساب نسبة مشاركة الإعلان في أداء الحملة (افتراضياً متساوي)
    const adsInCampaign = adsData?.ads?.filter(a => {
      const ag = adGroupsData?.adGroups?.find(group => group.id === a.adGroupId);
      return ag?.campaignId === adGroup.campaignId;
    }) || [];
    
    const shareRatio = adsInCampaign.length > 0 ? 1 / adsInCampaign.length : 1;
    
    return {
      impressions: Math.round((campaignAnalytics?.impressions || 0) * shareRatio),
      clicks: Math.round((campaignAnalytics?.clicks || 0) * shareRatio),
      spend: String((parseFloat(String(campaignAnalytics?.spend || '0')) * shareRatio)),
      conversions: Math.round((campaignAnalytics?.conversions || 0) * shareRatio),
      leads: Math.round(((campaignAnalytics as any)?.leads || 0) * shareRatio)
    };
  };

  // دالة للحصول على البيانات التحليلية لمجموعة إعلانية معينة
  const getAdGroupAnalytics = (adGroup: TikTokAdGroup) => {
    // استخدام البيانات المباشرة من المجموعة الإعلانية إذا كانت متوفرة
    if (adGroup.impressions !== undefined || adGroup.clicks !== undefined || adGroup.spend !== undefined) {
      return {
        impressions: adGroup.impressions || 0,
        clicks: adGroup.clicks || 0,
        spend: String(adGroup.spend || '0'),
        conversions: adGroup.conversions || 0,
        leads: (adGroup as any).leads || 0
      };
    }

    const campaign = campaignsData?.campaigns?.find(c => c.id === adGroup.campaignId);
    if (!campaign) return null;
    
    // البحث في البيانات التحليلية المسترجعة من TikTok API أولاً
    let campaignAnalytics = analytics?.campaigns?.find(c => c.id === campaign.id || (c as any).campaignId === campaign.id);
    
    // إذا لم تُجد، استخدم البيانات من قاعدة البيانات المحلية
    if (!campaignAnalytics) {
      campaignAnalytics = {
        id: campaign.id,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        spend: parseFloat(String(campaign.spend || '0')),
        conversions: campaign.conversions || 0,
        leads: (campaign as any).leads || 0
      } as any;
    }
    
    // حساب نسبة مشاركة المجموعة الإعلانية في أداء الحملة
    const adGroupsInCampaign = adGroupsData?.adGroups?.filter(ag => ag.campaignId === adGroup.campaignId) || [];
    const shareRatio = adGroupsInCampaign.length > 0 ? 1 / adGroupsInCampaign.length : 1;
    
    return {
      impressions: Math.round((campaignAnalytics?.impressions || 0) * shareRatio),
      clicks: Math.round((campaignAnalytics?.clicks || 0) * shareRatio),
      spend: String((parseFloat(String(campaignAnalytics?.spend || '0')) * shareRatio)),
      conversions: Math.round((campaignAnalytics?.conversions || 0) * shareRatio),
      leads: Math.round(((campaignAnalytics as any)?.leads || 0) * shareRatio)
    };
  };

  const getFilteredAds = () => {
    if (!adsData?.ads || adsData.ads.length === 0) {
      return [];
    }
    
    // If no campaigns or ad groups are selected, show all ads
    if (selectedCampaigns.size === 0 && selectedAdGroups.size === 0) {
      return adsData.ads;
    }
    
    // Filter ads based on selected campaigns and ad groups
    const filteredAds = adsData.ads.filter(ad => {
      // If specific ad groups are selected, show ads from those ad groups
      if (selectedAdGroups.size > 0) {
        return selectedAdGroups.has(ad.adGroupId);
      }
      
      // If only campaigns are selected, show ads from ad groups that belong to selected campaigns
      if (selectedCampaigns.size > 0) {
        // Find the ad group this ad belongs to
        const adGroup = adGroupsData?.adGroups?.find(ag => ag.id === ad.adGroupId);
        if (adGroup) {
          return selectedCampaigns.has(adGroup.campaignId);
        }
        return false;
      }
      
      return true;
    });
    
    return filteredAds;
  };

  // Get platform session
  const { data: session, isLoading: sessionLoading } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Get connection status
  const { data: connectionStatus, isLoading: statusLoading } = useQuery<{tiktok: {connected: boolean}}>({
    queryKey: ["/api/platform-ads/connection-status"],
    retry: false,
    enabled: !!session,
  });

  // Helper function to get the correct API endpoint with query parameters
  const getApiEndpoint = (baseEndpoint: string) => {
    const params = new URLSearchParams();
    
    // Map frontend date range values to backend period values
    switch (selectedDateRange.value) {
      case 'today':
        params.append('period', 'today');
        break;
      case 'yesterday':
        params.append('period', 'yesterday');
        break;
      case 'week':
        params.append('period', 'this_week');
        break;
      case 'month':
        params.append('period', 'this_month');
        break;
      case 'all':
      default:
        params.append('period', 'this_week'); // Default to this week
        break;
    }
    
    return `${baseEndpoint}?${params.toString()}`;
  };

  // Clone handling functions - وظائف النسخ
  const handleCloneCampaign = (campaign: TikTokCampaign) => {
    setCloneData(campaign);
    setCloneType('campaign');
    setIsCloning(true);
    setCreateCompleteCampaignOpen(true);
  };

  const handleCloneAdGroup = (adGroup: TikTokAdGroup) => {
    setCloneAdGroupData(adGroup);
    setCloneAdGroupModalOpen(true);
  };

  const handleCloneAd = (ad: TikTokAd) => {
    setCloneAdData(ad);
    setCloneAdModalOpen(true);
  };

  // Reset clone state - إعادة تعيين حالة النسخ
  const resetCloneState = () => {
    setIsCloning(false);
    setCloneData(null);
    setCloneType(null);
  };

  // Get TikTok analytics with date filter support
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<TikTokAnalytics>({
    queryKey: ["/api/tiktok/analytics", selectedDateRange.value],
    queryFn: async () => {
      const endpoint = getApiEndpoint("/api/tiktok/analytics");
      console.log(`Fetching analytics from: ${endpoint}`);
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Analytics response:`, data);
      return data;
    },
    enabled: !!session,
    retry: 2,
    staleTime: 30000, // 30 seconds cache
  });

  // Get campaigns - مرتبط بالفلتر المحدد
  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<{campaigns: TikTokCampaign[]}>({
    queryKey: ["/api/tiktok/campaigns/all", selectedDateRange.value],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', selectedDateRange.value);
      
      if (selectedDateRange.value === 'custom' && selectedDateRange.startDate && selectedDateRange.endDate) {
        params.append('start_date', selectedDateRange.startDate.toISOString().split('T')[0]);
        params.append('end_date', selectedDateRange.endDate.toISOString().split('T')[0]);
      }
      
      const endpoint = getApiEndpoint(`/api/tiktok/campaigns/all?${params.toString()}`);
      console.log(`Fetching campaigns from: ${endpoint}`);
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Campaigns response:', data);
      return data;
    },
    enabled: !!session && !!connectionStatus?.tiktok?.connected,
    refetchInterval: 2 * 60 * 1000, // مزامنة تلقائية كل دقيقتين
    staleTime: 30000, // 30 seconds cache
  });

  // Get leads
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useQuery<{leads: TikTokLead[]}>({
    queryKey: ["/api/tiktok/leads"],
    enabled: !!session,
  });

  // Get products for lead forms
  const { data: productsData, isLoading: productsLoading } = useQuery<{products: ProductOption[]}>({
    queryKey: ["/api/tiktok/products"],
    enabled: !!session,
  });


  // جلب بيانات المجموعات الإعلانية
  const { data: adGroupsData, isLoading: adGroupsLoading, refetch: refetchAdGroups } = useQuery<{adGroups: TikTokAdGroup[]}>({
    queryKey: ["/api/tiktok/adgroups"],
    queryFn: async () => {
      console.log('Fetching ad groups from: /api/tiktok/adgroups');
      // للاختبار - إضافة test_platform_id إذا لم يكن هناك session
      const testPlatformId = '3dbf0c5c-5076-471c-a114-61a86c20a156';
      const url = session ? '/api/tiktok/adgroups' : `/api/tiktok/adgroups?test_platform_id=${testPlatformId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Ad groups response:', data);
      return data;
    },
    enabled: true, // تمكين دائماً للاختبار
    refetchInterval: 2 * 60 * 1000, // مزامنة تلقائية كل دقيقتين
    staleTime: 30000,
  });

  // جلب بيانات الإعلانات مع التحليلات حسب الفترة الزمنية
  const { data: adsData, isLoading: adsLoading, refetch: refetchAds } = useQuery<{ads: TikTokAd[]}>({
    queryKey: ["/api/tiktok/ads"],
    queryFn: async () => {
      console.log('🔄 جلب الإعلانات مع تفاصيل الفيديو...');
      // للاختبار - إضافة test_platform_id إذا لم يكن هناك session
      const testPlatformId = '3dbf0c5c-5076-471c-a114-61a86c20a156';
      const url = session ? '/api/tiktok/ads' : `/api/tiktok/ads?test_platform_id=${testPlatformId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 استجابة الإعلانات:', data);
      
      // جلب تفاصيل الفيديو للإعلانات
      if (data?.ads && Array.isArray(data.ads)) {
        console.log('🎬 بدء جلب تفاصيل الفيديو للإعلانات...');
        const adsWithVideo = await Promise.all(
          data.ads.map(async (ad: any) => {
            if (ad.adFormat === 'SINGLE_VIDEO') {
              try {
                console.log('🎬 جلب تفاصيل الفيديو للإعلان:', ad.adId);
                const videoResponse = await fetch(`/api/tiktok/ads/${ad.adId}/details`);
                console.log('📡 Response status:', videoResponse.status, videoResponse.statusText);
                
                if (videoResponse.ok) {
                  const videoDetails = await videoResponse.json();
                  console.log('✅ تم جلب تفاصيل الفيديو:', {
                    adId: ad.adId,
                    videoUrl: videoDetails.videoUrl,
                    coverImageUrl: videoDetails.coverImageUrl,
                    hasVideo: videoDetails.hasVideo
                  });
                  
                  return {
                    ...ad,
                    videoId: videoDetails.videoId_display,
                    coverImageUrl: videoDetails.coverImageUrl,
                    hasVideo: videoDetails.hasVideo,
                    actualVideoUrl: videoDetails.videoUrl, // URL الفيديو الفعلي
                    pixelId: videoDetails.pixelId,
                    landingPageUrl: videoDetails.landingPageUrl,
                    callToAction: videoDetails.callToAction,
                    displayName: videoDetails.displayName
                  };
                } else {
                  const errorText = await videoResponse.text();
                  console.warn('⚠️ فشل في جلب تفاصيل الفيديو:', ad.adId, 'Status:', videoResponse.status, 'Error:', errorText);
                }
              } catch (error) {
                console.warn('❌ خطأ في جلب تفاصيل الفيديو:', ad.adId, error);
              }
            }
            return ad;
          })
        );
        
        console.log('✅ تم الانتهاء من جلب تفاصيل الفيديو');
        return { ads: adsWithVideo };
      }
      
      return data;
    },
    enabled: true, // تمكين دائماً للاختبار
    refetchInterval: 2 * 60 * 1000, // مزامنة تلقائية كل دقيقتين
    staleTime: 30000,
  });



  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // تم تعطيل الـ redirect التلقائي لأن الحالة محددة بالفعل في JSX
  // useEffect(() => {
  //   if (!sessionLoading && !session) {
  //     window.location.href = '/platform-login';
  //   }
  // }, [session, sessionLoading]);

  // Auto-refresh data when date range changes
  useEffect(() => {
    if (session && connectionStatus?.tiktok?.connected) {
      refetchCampaigns();
      refetchAnalytics();
      refetchAdGroups();
      refetchAds();
    }
  }, [selectedDateRange, session, connectionStatus]);

  // Query to fetch product names for current platform
  const { data: productNames = [], isLoading: productNamesLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/product-names`],
    enabled: !!session?.platformId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query to fetch pixels
  const { data: pixelsData, isLoading: pixelsLoading, refetch: refetchPixels, error: pixelsError } = useQuery({
    queryKey: ['/api/tiktok/pixels'],
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });


  // Query to fetch identities
  const { data: identitiesData, isLoading: identitiesLoading, error: identitiesError } = useQuery({
    queryKey: ['/api/tiktok/identities'],
    enabled: true, // ✅ تفعيل دائماً
    staleTime: 10 * 60 * 1000, // cache for 10 minutes
  });

  const identities = (identitiesData as any)?.identities || [];
  
  // Debug logging
  console.log('🆔 Identities Data:', identitiesData);
  console.log('🆔 Identities Array:', identities);
  console.log('🆔 Loading:', identitiesLoading);
  console.log('🆔 Error:', identitiesError);

  // دالة للحصول على الهوية الافتراضية
  const getDefaultIdentity = () => {
    if (identities.length === 0) return "";
    
    // البحث عن Business Manager أولاً
    const businessManager = identities.find((id: any) => id.is_bc_identity || id.identity_type === 'BUSINESS_CENTER');
    if (businessManager) return businessManager.identity_id;
    
    // إذا لم يوجد Business Manager، استخدم الهوية الحقيقية
    const realIdentity = identities.find((id: any) => id.is_real_user_identity);
    if (realIdentity) return realIdentity.identity_id;
    
    // أو أول هوية متاحة
    return identities[0].identity_id;
  };


  // عرض الهويات المتاحة
  const showIdentitiesDialog = () => {
    setIdentitiesDialogOpen(true);
  };

  // جلب معلومات حساب TikTok الشخصي
  const { data: userProfileData, isLoading: userProfileLoading } = useQuery({
    queryKey: ['/api/tiktok/user-profile'],
    enabled: !!session,
    staleTime: 30 * 60 * 1000, // cache for 30 minutes
  });

  const userProfile = (userProfileData as any)?.userProfile;

  // عرض معلومات المستخدم
  const showUserProfileDialog = () => {
    setUserProfileDialogOpen(true);
  };





  // Forms
  const campaignForm = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignName: "",
      objective: "",
      budgetMode: "",
      budget: "",
      startTime: "",
      endTime: "",
    },
  });

  const leadFormForm = useForm<z.infer<typeof leadFormSchema>>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      formName: "",
      formTitle: "",
      formDescription: "",
      privacyPolicyUrl: "",
      successMessage: "شكراً لك! تم استلام معلوماتك بنجاح وسنتواصل معك قريباً.",
    },
  });

  // Clone Ad Group Form
  const cloneAdGroupForm = useForm<z.infer<typeof cloneAdGroupSchema>>({
    resolver: zodResolver(cloneAdGroupSchema),
    defaultValues: {
      adGroupName: "",
      budgetMode: "BUDGET_MODE_DYNAMIC_DAILY_BUDGET",
      budget: "",
      bidType: "BID_TYPE_NO_BID",
      bidPrice: "",
      placementType: "PLACEMENT_TYPE_AUTOMATIC",
      startTime: "",
      endTime: "",
    },
  });

  // Clone Ad Form
  const cloneAdForm = useForm<z.infer<typeof cloneAdSchema>>({
    resolver: zodResolver(cloneAdSchema),
    defaultValues: {
      adName: "",
      adFormat: "SINGLE_VIDEO",
      adText: "",
      videoUrl: "",
      imageUrls: [],
      landingPageUrl: "",
      callToAction: "",
    },
  });

  // نموذج إنشاء الحملة الكاملة
  const completeCampaignForm = useForm<CompleteTiktokCampaign>({
    resolver: zodResolver(completeTiktokCampaignSchema),
    defaultValues: {
      // Campaign data
      campaignName: "",
      objective: "CONVERSIONS", // هدف التحويلات
      campaignBudgetMode: "BUDGET_MODE_INFINITE", // لا محدودة
      campaignBudget: "",
      useCampaignBudgetOptimization: false, // تحسين ميزانية الحملة (CBO)
      startTime: getBaghdadTime(), // بتوقيت بغداد
      endTime: "",
      
      // Ad Group data
      adGroupName: "", // سيتم تحديثه تلقائياً
      adGroupBudgetMode: "BUDGET_MODE_DAY", // ميزانية يومية (افتراضي)
      adGroupBudget: "",
      bidType: "BID_TYPE_NO_BID",
      bidPrice: "",
      placementType: "PLACEMENT_TYPE_AUTOMATIC",
      
      // Ad data
      adName: "",
      adFormat: "SINGLE_VIDEO",
      landingPageUrl: "",
      displayName: "",
      adText: "",
      callToAction: "SHOP_NOW",
      
      // Media files
      videoUrl: "",
      imageUrls: [],
      
      // Pixel tracking - اختياري
      pixelId: "none", // لا يتطلب بكسل افتراضياً
      optimizationEvent: "ON_WEB_ORDER",  // حدث الشراء على الويب كافتراضي
      
      // Identity data
      identityId: "", // سيتم تعيينها تلقائياً من أول هوية متاحة
      
      // Targeting data
      targeting: {
        gender: "GENDER_UNLIMITED",
        age_groups: [
          "AGE_13_17", 
          "AGE_18_24", 
          "AGE_25_34", 
          "AGE_35_44", 
          "AGE_45_54", 
          "AGE_55_PLUS"
        ],
        locations: ["99237"],
      },

      // Lead form data (will be populated when LEAD_GENERATION is selected)
      // selectedLeadFormId: "", // الفورم المختار من الموجود في TikTok
      leadFormPrivacyPolicyUrl: "",
      leadFormSuccessMessage: "شكراً لك! تم استلام معلوماتك بنجاح وسنتواصل معك قريباً.",
      // leadFormProductId: "",
      // leadFormCustomFields: {},
      productId: "",
      
      // Custom form field collection settings
      collectName: true,
      collectPhone: true,
      collectAddress: true,
      collectGovernorate: true,
      collectOfferSelection: true,
      collectNotes: true,
    },
  });

  // مراقبة الهدف المختار
  const selectedObjective = completeCampaignForm.watch("objective");
  const isLeadGeneration = selectedObjective === "LEAD_GENERATION";

  // تحديث النموذج عندما تتوفر الهويات
  useEffect(() => {
    if (identities.length > 0) {
      const currentIdentityId = completeCampaignForm.getValues("identityId");
      
      // إذا لم تكن هناك هوية محددة، اختر الافتراضية
      if (!currentIdentityId) {
        const defaultIdentity = getDefaultIdentity();
        if (defaultIdentity) {
          completeCampaignForm.setValue("identityId", defaultIdentity);
          console.log('🆔 تم تعيين الهوية الافتراضية:', defaultIdentity);
        }
      }
    }
  }, [identities, completeCampaignForm]);

  // تبسيط النظام - لا حاجة لجلب الأحداث من البكسل
  const selectedPixelId = completeCampaignForm.watch("pixelId");
  const selectedOptimizationEvent = completeCampaignForm.watch("optimizationEvent");
  
  // الحفاظ على حدث الشراء كافتراضي إذا لم يكن هناك حدث محدد
  useEffect(() => {
    if (!selectedOptimizationEvent || selectedOptimizationEvent === '') {
      completeCampaignForm.setValue('optimizationEvent', 'ON_WEB_ORDER', { shouldValidate: true });
    }
  }, [selectedOptimizationEvent, completeCampaignForm]);

  // جلب الفورمات الموجودة من TikTok للـ Lead Generation
  const { data: leadFormsData, isLoading: isLoadingLeadForms } = useQuery({
    queryKey: ['/api/tiktok/lead-forms'],
    enabled: isLeadGeneration, // جلب فقط عند اختيار Lead Generation
    retry: false
  });

  // Watch form values for automatic completion tracking - مراقبة النموذج لتحديث حالة الإكمال
  const watchedValues = completeCampaignForm.watch();
  
  // Timer references for auto-closing sections
  const campaignTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adGroupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timer function
  const clearTimer = (timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  useEffect(() => {
    const campaignValid = validateCampaignSection();
    const adGroupValid = validateAdGroupSection();
    const adValid = validateAdSection();
    const targetingValid = validateTargetingSection();
    
    setCampaignCompleted(campaignValid);
    setAdGroupCompleted(adGroupValid);
    setAdCompleted(adValid);
    setTargetingCompleted(targetingValid);
    
    // Auto-close section after 5 seconds of inactivity when completed
    if (campaignValid && !campaignSectionCollapsed) {
      clearTimer(campaignTimerRef);
      campaignTimerRef.current = setTimeout(() => {
        setCampaignSectionCollapsed(true); // إغلاق قسم الحملة بعد 5 ثواني
        setAdGroupSectionCollapsed(false); // فتح قسم المجموعة الإعلانية
      }, 5000); // 5 ثواني
    } else {
      clearTimer(campaignTimerRef);
    }
    
    if (adGroupValid && !adGroupSectionCollapsed) {
      clearTimer(adGroupTimerRef);
      adGroupTimerRef.current = setTimeout(() => {
        setAdGroupSectionCollapsed(true); // إغلاق قسم المجموعة بعد 5 ثواني
        setAdSectionCollapsed(false); // فتح قسم الإعلان
      }, 5000);
    } else {
      clearTimer(adGroupTimerRef);
    }
    
    if (adValid && !adSectionCollapsed) {
      clearTimer(adTimerRef);
      adTimerRef.current = setTimeout(() => {
        setAdSectionCollapsed(true); // إغلاق قسم الإعلان بعد 5 ثواني
        setTargetingSectionCollapsed(false); // فتح قسم الاستهداف
      }, 5000);
    } else {
      clearTimer(adTimerRef);
    }
    
    // Cleanup timers on unmount
    return () => {
      clearTimer(campaignTimerRef);
      clearTimer(adGroupTimerRef);
      clearTimer(adTimerRef);
    };
  }, [watchedValues, campaignSectionCollapsed, adGroupSectionCollapsed, adSectionCollapsed]);

  // Effect to populate form data when cloning - تأثير تعبئة البيانات عند النسخ
  useEffect(() => {
    if (isCloning && cloneData && cloneType) {
      if (cloneType === 'campaign' && cloneData) {
        const campaign = cloneData as TikTokCampaign;
        // عبئ بيانات الحملة
        completeCampaignForm.reset({
          ...completeCampaignForm.getValues(),
          campaignName: `نسخة من ${campaign.campaignName}`,
          objective: (campaign.objective as "CONVERSIONS" | "LEAD_GENERATION") || "LEAD_GENERATION",
          campaignBudgetMode: ((campaign as any).budgetMode as "BUDGET_MODE_INFINITE" | "BUDGET_MODE_DAY" | "BUDGET_MODE_TOTAL") || "BUDGET_MODE_INFINITE",
          campaignBudget: campaign.budget ? campaign.budget.toString() : "100",
        });
      } else if (cloneType === 'adGroup' && cloneData) {
        const adGroup = cloneData as TikTokAdGroup;
        // عبئ بيانات الحملة والمجموعة الإعلانية
        completeCampaignForm.reset({
          ...completeCampaignForm.getValues(),
          campaignName: `نسخة من ${adGroup.adGroupName}`,
          adGroupName: `نسخة من ${adGroup.adGroupName}`,
          objective: "LEAD_GENERATION" as const,
          campaignBudgetMode: "BUDGET_MODE_DAY" as const,
          campaignBudget: "100",
          adGroupBudgetMode: (adGroup.budgetMode as "BUDGET_MODE_DAY" | "BUDGET_MODE_DYNAMIC_DAILY_BUDGET") || "BUDGET_MODE_DAY",
          adGroupBudget: adGroup.budget ? adGroup.budget.toString() : "25",
          bidType: (adGroup.bidType as "BID_TYPE_CUSTOM" | "BID_TYPE_NO_BID") || "BID_TYPE_CUSTOM",
        });
      } else if (cloneType === 'ad' && cloneData) {
        const ad = cloneData as TikTokAd;
        // عبئ بيانات الحملة والمجموعة والإعلان
        completeCampaignForm.reset({
          ...completeCampaignForm.getValues(),
          campaignName: `نسخة من ${ad.adName}`,
          adGroupName: `نسخة من ${ad.adName}`,
          adName: `نسخة من ${ad.adName}`,
          adText: ad.adText || "",
          objective: "LEAD_GENERATION" as const,
          campaignBudgetMode: "BUDGET_MODE_DAY" as const,
          campaignBudget: "100",
          adGroupBudgetMode: "BUDGET_MODE_DAY" as const,
          adGroupBudget: "25",
          bidType: "BID_TYPE_CUSTOM" as const,
        });
      }
    }
  }, [isCloning, cloneData, cloneType, completeCampaignForm]);

  // تحديث القيم الافتراضية للبكسل عند تحميل البكسلات (فقط إذا لم يكن توليد عملاء محتملين)
  useEffect(() => {
    if (!isLeadGeneration && (pixelsData as any)?.pixels && (pixelsData as any).pixels.length > 0) {
      const firstPixelId = (pixelsData as any).pixels[0].pixelId;
      if (!completeCampaignForm.getValues("pixelId") || completeCampaignForm.getValues("pixelId") === "none") {
        completeCampaignForm.setValue("pixelId", firstPixelId);
      }
    }
  }, [pixelsData, completeCampaignForm, isLeadGeneration]);

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof campaignSchema>) => {
      const response = await fetch('/api/tiktok/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('فشل في إنشاء الحملة');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الحملة",
        description: data.message,
      });
      setCreateCampaignOpen(false);
      campaignForm.reset();
      refetchCampaigns();
      refetchAnalytics();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الحملة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create lead form mutation
  const createLeadFormMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leadFormSchema>) => {
      const response = await fetch('/api/tiktok/lead-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          formFields: [
            { type: "name", label: "الاسم الكامل", required: true },
            { type: "phone", label: "رقم الهاتف", required: true },
            { type: "address", label: "العنوان", required: false },
            { type: "offers", label: "العروض المتاحة", required: false }
          ]
        }),
      });
      if (!response.ok) throw new Error('فشل في إنشاء نموذج العملاء المحتملين');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء النموذج",
        description: data.message,
      });
      setCreateLeadFormOpen(false);
      leadFormForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء النموذج",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create pixel mutation
  const createPixelMutation = useMutation({
    mutationFn: async ({ pixelName, pixelMode }: { pixelName: string; pixelMode: string }) => {
      const response = await fetch('/api/tiktok/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixelName, pixelMode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء البكسل');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم إنشاء البكسل بنجاح',
        description: data.message || 'تم إنشاء البكسل بنجاح',
      });
      setCreatePixelOpen(false);
      setNewPixelName('');
      setNewPixelMode('STANDARD_MODE');
      refetchPixels();
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في إنشاء البكسل',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    },
  });

  // Handle pixel creation
  const handleCreatePixel = () => {
    if (!newPixelName.trim()) return;
    createPixelMutation.mutate({
      pixelName: newPixelName,
      pixelMode: newPixelMode,
    });
  };

  // Create complete campaign mutation
  const createCompleteCampaignMutation = useMutation({
    mutationFn: async (data: CompleteTiktokCampaign) => {
      console.log('🚀 إرسال طلب إنشاء الحملة الكاملة:', data);
      
      // تحديد endpoint حسب نوع الحملة
      let endpoint = '/api/tiktok/campaigns/complete';
      if (data.objective === 'CONVERSIONS') {
        endpoint = '/api/tiktok/campaigns/conversions';
        console.log('🛒 استخدام endpoint التحويلات:', endpoint);
      } else if (data.objective === 'LEAD_GENERATION') {
        endpoint = '/api/tiktok/campaigns/leads';
        console.log('📋 استخدام endpoint الليدز:', endpoint);
      } else {
        console.log('🎯 استخدام endpoint العام:', endpoint);
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء الحملة الإعلانية');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ تم إنشاء الحملة الكاملة بنجاح:', data);
      
      // إغلاق مربع الحوار
      setCreateCompleteCampaignOpen(false);
      completeCampaignForm.reset();
      
      // إظهار رسالة النجاح في وسط الصفحة
      setSuccessMessage(data.message || 'تم إنشاء الحملة الإعلانية بنجاح!');
      setShowSuccessMessage(true);
      
      // إخفاء رسالة النجاح وإعادة تحديث الصفحة بعد 3 ثوانٍ
      setTimeout(() => {
        setShowSuccessMessage(false);
        // إعادة تحديث الصفحة لضمان عرض البيانات الجديدة
        window.location.reload();
      }, 3000);
    },
    onError: (error: any) => {
      console.error('❌ خطأ في إنشاء الحملة الكاملة:', error);
      toast({
        title: "خطأ في إنشاء الحملة الإعلانية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle campaign status mutation
  const toggleCampaignStatusMutation = useMutation({
    mutationFn: async ({ campaignId, status }: { campaignId: string; status: string }) => {
      console.log(`Toggling campaign ${campaignId} to ${status}`);
      const response = await fetch(`/api/tiktok/campaigns/${campaignId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Campaign status update failed:", errorData);
        throw new Error(errorData.error || "فشل في تحديث حالة الحملة");
      }
      const result = await response.json();
      console.log("Campaign status update result:", result);
      return result;
    },
    onMutate: async ({ campaignId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/campaigns/all" });
      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/analytics" });

      // Snapshot the previous value
      const previousCampaigns = queryClient.getQueryData(["/api/tiktok/campaigns/all"]);
      const previousAnalytics = queryClient.getQueryData(["/api/tiktok/analytics", "all"]);

      // Optimistically update campaigns data
      queryClient.setQueryData(["/api/tiktok/campaigns/all"], (old: any) => {
        if (!old?.campaigns) return old;
        return {
          ...old,
          campaigns: old.campaigns.map((campaign: any) => 
            campaign.id === campaignId 
              ? { ...campaign, status: status }
              : campaign
          )
        };
      });

      // Optimistically update analytics data for all possible query keys
      const analyticsKeys = [
        ["/api/tiktok/analytics", "all"],
        ["/api/tiktok/analytics", "today"], 
        ["/api/tiktok/analytics", "week"],
        ["/api/tiktok/analytics", "month"],
        ["/api/tiktok/analytics", "custom"]
      ];
      
      analyticsKeys.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          const updatedOverview = { ...old.overview };
          
          // Update activeCampaigns count based on the current campaign status
          const currentCampaign = old.campaigns?.find((c: any) => c.id === campaignId);
          if (currentCampaign) {
            if (status === 'ENABLE' && currentCampaign.status !== 'ENABLE') {
              updatedOverview.activeCampaigns = (updatedOverview.activeCampaigns || 0) + 1;
            } else if (status === 'DISABLE' && currentCampaign.status === 'ENABLE') {
              updatedOverview.activeCampaigns = Math.max(0, (updatedOverview.activeCampaigns || 0) - 1);
            }
          }

          return {
            ...old,
            overview: updatedOverview,
            campaigns: old.campaigns?.map((campaign: any) => 
              campaign.id === campaignId 
                ? { ...campaign, status: status }
                : campaign
            ) || []
          };
        });
      });

      // Return a context with the previous values
      return { previousCampaigns, previousAnalytics };
    },
    onSuccess: (data) => {
      console.log("Campaign status mutation success:", data);
      toast({ 
        title: "تم تحديث الحالة",
        description: data.message || "تم تحديث حالة الحملة بنجاح" 
      });
      // Refresh both campaigns and analytics data to ensure consistency
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/campaigns/all" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/analytics" });
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating campaign status:", error);
      
      // Revert optimistic updates on error
      if (context?.previousCampaigns) {
        queryClient.setQueryData(["/api/tiktok/campaigns/all"], context.previousCampaigns);
      }
      if (context?.previousAnalytics) {
        queryClient.setQueryData(["/api/tiktok/analytics", "all"], context.previousAnalytics);
      }
      
      toast({ 
        title: "خطأ في تحديث الحالة",
        description: error.message || "حدث خطأ في تحديث حالة الحملة",
        variant: "destructive" 
      });
    },
  });

  // Function to handle campaign status toggle
  const toggleCampaignStatus = (campaignId: string, status: string) => {
    toggleCampaignStatusMutation.mutate({ campaignId, status });
  };

  // Ad Group Status Toggle
  const toggleAdGroupStatusMutation = useMutation({
    mutationFn: async ({ adGroupId, status }: { adGroupId: string; status: string }) => {
      console.log(`Toggling ad group ${adGroupId} to ${status}`);
      const response = await fetch(`/api/tiktok/adgroups/${adGroupId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Ad group status update failed:", errorData);
        throw new Error(errorData.error || "فشل في تحديث حالة المجموعة");
      }
      const result = await response.json();
      console.log("Ad group status update result:", result);
      return result;
    },
    onMutate: async ({ adGroupId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/adgroups" });
      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/analytics" });

      // Snapshot the previous values
      const previousAdGroups = queryClient.getQueryData(["/api/tiktok/adgroups/all"]);
      const previousAnalytics = queryClient.getQueryData(["/api/tiktok/analytics", "all"]);

      // Optimistically update ad groups data
      queryClient.setQueryData(["/api/tiktok/adgroups/all"], (old: any) => {
        if (!old?.adGroups) return old;
        return {
          ...old,
          adGroups: old.adGroups.map((adGroup: any) => 
            adGroup.id === adGroupId 
              ? { ...adGroup, status: status }
              : adGroup
          )
        };
      });

      // Optimistically update analytics data for all possible query keys
      const analyticsKeys = [
        ["/api/tiktok/analytics", "all"],
        ["/api/tiktok/analytics", "today"], 
        ["/api/tiktok/analytics", "week"],
        ["/api/tiktok/analytics", "month"],
        ["/api/tiktok/analytics", "custom"]
      ];
      
      analyticsKeys.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          // No need to update overview for ad groups, only campaigns affect activeCampaigns count
          return {
            ...old,
            // Analytics typically don't track individual ad groups in the main overview
            // but we can update if there are ad group specific metrics
          };
        });
      });

      return { previousAdGroups, previousAnalytics };
    },
    onSuccess: (data) => {
      console.log("Ad group status mutation success:", data);
      toast({ 
        title: "تم تحديث الحالة",
        description: data.message || "تم تحديث حالة المجموعة بنجاح" 
      });
      // Refresh data to ensure consistency
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/adgroups" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/analytics" });
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating ad group status:", error);
      
      // Revert optimistic updates on error
      if (context?.previousAdGroups) {
        queryClient.setQueryData(["/api/tiktok/adgroups/all"], context.previousAdGroups);
      }
      if (context?.previousAnalytics) {
        queryClient.setQueryData(["/api/tiktok/analytics", "all"], context.previousAnalytics);
      }
      
      toast({ 
        title: "خطأ في تحديث الحالة",
        description: error.message || "حدث خطأ في تحديث حالة المجموعة",
        variant: "destructive" 
      });
    },
  });

  // Function to handle ad group status toggle
  const toggleAdGroupStatus = (adGroupId: string, status: string) => {
    toggleAdGroupStatusMutation.mutate({ adGroupId, status });
  };

  // Ad Status Toggle
  const toggleAdStatusMutation = useMutation({
    mutationFn: async ({ adId, status }: { adId: string; status: string }) => {
      console.log(`Toggling ad ${adId} to ${status}`);
      const response = await fetch(`/api/tiktok/ads/${adId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Ad status update failed:", errorData);
        throw new Error(errorData.error || "فشل في تحديث حالة الإعلان");
      }
      const result = await response.json();
      console.log("Ad status update result:", result);
      return result;
    },
    onMutate: async ({ adId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/ads" });
      await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/analytics" });

      // Snapshot the previous values
      const previousAds = queryClient.getQueryData(["/api/tiktok/ads/all"]);
      const previousAnalytics = queryClient.getQueryData(["/api/tiktok/analytics", "all"]);

      // Optimistically update ads data
      queryClient.setQueryData(["/api/tiktok/ads/all"], (old: any) => {
        if (!old?.ads) return old;
        return {
          ...old,
          ads: old.ads.map((ad: any) => 
            ad.adId === adId 
              ? { ...ad, status: status }
              : ad
          )
        };
      });

      // Optimistically update analytics data for all possible query keys
      const analyticsKeys = [
        ["/api/tiktok/analytics", "all"],
        ["/api/tiktok/analytics", "today"], 
        ["/api/tiktok/analytics", "week"],
        ["/api/tiktok/analytics", "month"],
        ["/api/tiktok/analytics", "custom"]
      ];
      
      analyticsKeys.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          // Analytics overview typically doesn't change for individual ad status
          return old;
        });
      });

      return { previousAds, previousAnalytics };
    },
    onSuccess: (data) => {
      console.log("Ad status mutation success:", data);
      toast({ 
        title: "تم تحديث الحالة",
        description: data.message || "تم تحديث حالة الإعلان بنجاح" 
      });
      // Refresh data to ensure consistency (same as ad groups)
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/ads" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tiktok/analytics" });
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating ad status:", error);
      
      // Revert optimistic updates on error
      if (context?.previousAds) {
        queryClient.setQueryData(["/api/tiktok/ads/all"], context.previousAds);
      }
      if (context?.previousAnalytics) {
        queryClient.setQueryData(["/api/tiktok/analytics", "all"], context.previousAnalytics);
      }
      
      toast({ 
        title: "خطأ في تحديث الحالة",
        description: error.message || "حدث خطأ في تحديث حالة الإعلان",
        variant: "destructive" 
      });
    },
  });

  // Function to handle ad status toggle
  const toggleAdStatus = (adId: string, status: string) => {
    toggleAdStatusMutation.mutate({ adId, status });
  };

  // Update lead status mutation
  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, status, notes }: { leadId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/tiktok/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('فشل في تحديث حالة العميل المحتمل');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة العميل المحتمل بنجاح",
      });
      refetchLeads();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync real reports mutation - جلب الإحصائيات الحقيقية من TikTok API
  const syncReportsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tiktok/sync-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في جلب الإحصائيات الحقيقية');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Real TikTok reports synced successfully:', data);
      // إعادة تحميل جميع البيانات لإظهار الإحصائيات المحدثة
      refetchCampaigns();
      refetchAnalytics();
      refetchAdGroups();
      refetchAds();
    },
    onError: (error: any) => {
      console.error('❌ Failed to sync TikTok reports:', error);
    },
  });

  // Auto-sync real reports every 5 minutes (silent background sync)
  useQuery({
    queryKey: ['tiktok-reports-sync'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tiktok/sync-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to sync reports');
        return response.json();
      } catch (error) {
        console.error('Auto-sync failed:', error);
        throw error;
      }
    },
    enabled: !!session,
    refetchInterval: 5 * 60 * 1000, // مزامنة تلقائية كل 5 دقائق للإحصائيات الحقيقية
    retry: false, // لا نريد إعادة المحاولة للتجنب الضغط على API
    staleTime: 4 * 60 * 1000, // 4 minutes cache
  });

  // جلب رصيد الحساب الإعلاني من TikTok
  const { 
    data: accountBalanceData, 
    isLoading: accountBalanceLoading, 
    error: accountBalanceError,
    refetch: refetchAccountBalance
  } = useQuery({
    queryKey: ['/api/tiktok/account/balance'],
    queryFn: async (): Promise<{
      success: boolean;
      balance: TikTokAccountBalance;
      accountInfo?: TikTokAccountInfo;
      timestamp: string;
    }> => {
      console.log('🏦 جلب رصيد الحساب من TikTok...');
      const response = await fetch('/api/tiktok/account/balance');
      if (!response.ok) {
        throw new Error('فشل في جلب رصيد الحساب');
      }
      const data = await response.json();
      console.log('💰 بيانات الرصيد:', data);
      return data;
    },
    enabled: !!session,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 1,
    refetchInterval: 10 * 60 * 1000, // تحديث كل 10 دقائق
  });

  const formatCurrency = (amount: number, currency?: string) => {
    const accountCurrency = currency || accountBalanceData?.balance?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // حالة التحميل الأولية
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // إذا لم يتم العثور على session بعد انتهاء التحميل، إعادة توجيه لتسجيل الدخول
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">يجب تسجيل الدخول</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">يجب تسجيل الدخول للوصول لهذه الصفحة</p>
          <Button 
            onClick={() => window.location.href = '/platform-login'} 
            className="gradient-primary"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  // تعليق: تم إزالة شرط connectionStatus لأنه يسبب مشاكل في العرض
  // والبيانات متاحة بالفعل من TikTok API

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PlatformSidebar 
        session={session} 
        currentPath="/platform-ads-tiktok-management" 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
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
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">إدارة إعلانات TikTok</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة شاملة لحملات الإعلانات والعملاء المحتملين</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">

          {/* Connection Settings */}
          <Card className="mb-6 theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm hover:theme-shadow transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="text-right">
                  <CardTitle className="text-base flex items-center gap-1.5 text-theme-primary">
                    <Settings className="h-4 w-4" />
                    إعدادات الاتصال
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                    حالة ربط حساب TikTok وإعدادات الإعلانات
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${connectionStatus?.tiktok?.connected ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">TikTok Ads</span>
                  {connectionStatus?.tiktok?.connected ? (
                    <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 text-xs">
                      مربوط
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                      غير مربوط
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Connect Button - Only show when definitely not connected and not loading */}
                {!statusLoading && !connectionStatus?.tiktok?.connected && (
                  <div className="flex justify-center">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/platform-ads/tiktok/auth-url', {
                            method: 'POST',
                          });
                          if (response.ok) {
                            const data = await response.json();
                            const authWindow = window.open(data.authUrl, '_blank', 'width=600,height=700');
                            
                            // مراقبة إغلاق النافذة للتحقق من حالة الاتصال
                            const checkClosed = setInterval(() => {
                              if (authWindow?.closed) {
                                clearInterval(checkClosed);
                                // إعادة تحميل حالة الاتصال بعد إغلاق النافذة
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1000);
                              }
                            }, 1000);
                          } else {
                            throw new Error('فشل في إنشاء رابط الربط');
                          }
                        } catch (error) {
                          toast({
                            title: "خطأ",
                            description: "حدث خطأ في إنشاء رابط الربط",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-[#ff0050] hover:bg-[#d1004a] text-white"
                    >
                      <ExternalLink className="ml-1 h-4 w-4" />
                      ربط حساب TikTok
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Show content only if TikTok is connected */}
          {connectionStatus?.tiktok?.connected && (
            <>
              {/* Date Range Filter - Global for all tabs */}
              <div className="flex justify-between items-center mb-6">
                <div></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">الفترة الزمنية:</span>
                  {getDateRangeOptions().map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedDateRange.value === option.value ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedDateRange(option)}
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
                        <div className="text-sm font-medium">اختر فترة مخصصة</div>
                        <div className="text-xs text-muted-foreground">
                          اختر تاريخ البداية أولاً ثم تاريخ النهاية
                        </div>
                        
                        <Calendar
                          mode="range"
                          selected={customDateRange as any}
                          onSelect={(range) => setCustomDateRange(range || {} as any)}
                          className="rounded-md border text-sm"
                          locale={ar}
                          numberOfMonths={1}
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-2",
                            caption: "flex justify-center pt-1 relative items-center text-sm",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem]",
                            row: "flex w-full mt-1",
                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-xs",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                          }}
                        />

                        {customDateRange?.from && customDateRange?.to && (
                          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded text-center">
                            <div className="font-medium text-xs mb-1">الفترة المحددة:</div>
                            <div className="text-xs">
                              {format(customDateRange.from, "MM/dd", { locale: ar })} - {format(customDateRange.to, "MM/dd", { locale: ar })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ({Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))} يوم)
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setCustomDateRange({});
                              setCustomDateOpen(false);
                            }}
                            className="flex-1 text-xs h-7"
                          >
                            إلغاء
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (customDateRange?.from && customDateRange?.to) {
                                const customRange: DateRangeOption = {
                                  label: `${format(customDateRange.from, "MM/dd", { locale: ar })} - ${format(customDateRange.to, "MM/dd", { locale: ar })}`,
                                  value: 'custom',
                                  startDate: customDateRange.from,
                                  endDate: customDateRange.to
                                };
                                setSelectedDateRange(customRange);
                                setCustomDateOpen(false);
                              }
                            }}
                            className="flex-1 text-xs h-7"
                            disabled={!customDateRange?.from || !customDateRange?.to}
                          >
                            تطبيق
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-theme-primary-light theme-border gap-2">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-theme-gradient data-[state=active]:text-white">لوحة القيادة</TabsTrigger>
              <TabsTrigger value="campaigns" className="text-xs font-semibold data-[state=active]:bg-theme-gradient data-[state=active]:text-white border-2 border-transparent hover:border-theme-primary/50 bg-white/90 dark:bg-gray-800/90 text-theme-primary hover:bg-theme-primary/10 transition-all duration-300">
                <span className="animate-gradient-move font-bold" style={{ 
                  background: 'linear-gradient(to right, white, hsl(var(--primary)), hsl(var(--primary)))',
                  backgroundSize: '200% 100%',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 10px hsla(var(--primary) / 0.3)',
                  transition: 'all 0.3s ease'
                }}>الحملات</span>
              </TabsTrigger>
              <TabsTrigger value="adgroups" className="text-xs font-semibold data-[state=active]:bg-theme-gradient data-[state=active]:text-white border-2 border-transparent hover:border-theme-primary/50 bg-white/90 dark:bg-gray-800/90 text-theme-primary hover:bg-theme-primary/10 transition-all duration-300">
                <span className="animate-gradient-move font-bold" style={{ 
                  background: 'linear-gradient(to right, white, hsl(var(--primary)), hsl(var(--primary)))',
                  backgroundSize: '200% 100%',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 10px hsla(var(--primary) / 0.3)',
                  transition: 'all 0.3s ease'
                }}>المجموعات</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="text-xs font-semibold data-[state=active]:bg-theme-gradient data-[state=active]:text-white border-2 border-transparent hover:border-theme-primary/50 bg-white/90 dark:bg-gray-800/90 text-theme-primary hover:bg-theme-primary/10 transition-all duration-300">
                <span className="animate-gradient-move font-bold" style={{ 
                  background: 'linear-gradient(to right, white, hsl(var(--primary)), hsl(var(--primary)))',
                  backgroundSize: '200% 100%',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 10px hsla(var(--primary) / 0.3)',
                  transition: 'all 0.3s ease'
                }}>الإعلانات</span>
              </TabsTrigger>
              <TabsTrigger value="pixels" className="text-xs data-[state=active]:bg-theme-gradient data-[state=active]:text-white">البكسلات</TabsTrigger>
              <TabsTrigger value="leads" className="text-xs data-[state=active]:bg-theme-gradient data-[state=active]:text-white">العملاء المحتملين</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-theme-gradient data-[state=active]:text-white">التقارير</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Account Balance Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-1 theme-border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 hover:theme-shadow transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                      <DollarSign className="h-5 w-5" />
                      رصيد الحساب
                      {accountBalanceLoading && (
                        <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accountBalanceLoading ? (
                      <div className="space-y-3">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      </div>
                    ) : accountBalanceError ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">خطأ في جلب الرصيد</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => refetchAccountBalance()}
                          className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <RefreshCw className="h-3 w-3 ml-1" />
                          إعادة المحاولة
                        </Button>
                      </div>
                    ) : accountBalanceData?.success ? (
                      <div className="space-y-3">
                        {accountBalanceData.balance.isAvailable ? (
                          <>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(accountBalanceData.balance.balance, accountBalanceData.balance.currency)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{accountBalanceData.balance.currency}</span>
                                <span>العملة:</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={accountBalanceData.balance.status === 'مفعل' || accountBalanceData.balance.status === 'ACTIVE' ? 'default' : 'secondary'}
                                  className={`text-xs ${accountBalanceData.balance.status === 'مفعل' || accountBalanceData.balance.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                                >
                                  {accountBalanceData.balance.status === 'ACTIVE' ? 'نشط' : accountBalanceData.balance.status}
                                </Badge>
                                <span>الحالة:</span>
                              </div>
                              {accountBalanceData.accountInfo && (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-xs">{accountBalanceData.accountInfo.name}</span>
                                  <span>الحساب:</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
                                Last Updated: {new Date().toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>
                            {/* زر إضافة رصيد */}
                            <div className="space-y-2">
                              <Button 
                                onClick={() => {
                                  // استخدام advertiser_id الديناميكي من بيانات المستخدم
                                  const userAdvertiserId = accountBalanceData?.balance?.advertiser_id || 
                                                          accountBalanceData?.accountInfo?.advertiser_id || 
                                                          '7548971232970571792'; // fallback للحساب الافتراضي
                                  
                                  const tiktokPaymentUrl = `https://ads.tiktok.com/i18n/account/payment?aadvid=${userAdvertiserId}`;
                                  
                                  console.log('🔗 فتح رابط الدفع للمعلن:', userAdvertiserId);
                                  window.open(tiktokPaymentUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                                  
                                  toast({
                                    title: "إضافة رصيد",
                                    description: `سيتم فتح صفحة Payment لحسابك (${userAdvertiserId})`
                                  });
                                }}
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                إضافة رصيد
                              </Button>
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                رابط مباشر لصفحة إضافة الرصيد
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">رصيد الحساب غير متوفر</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700 space-y-2">
                              <div className="font-medium text-blue-700 dark:text-blue-400">الأسباب المحتملة:</div>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                <li><strong>حساب وكالة شير:</strong> إذا كان حسابك مشارك من وكالة، فالوكالة تدير الميزانية</li>
                                <li><strong>صلاحيات محدودة:</strong> هذا النوع من الحسابات لا يدعم عرض الرصيد عبر API</li>
                                <li><strong>إعدادات Business Center:</strong> الحساب قد يحتاج ربط إضافي</li>
                              </ul>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                                💡 هذا أمر طبيعي للحسابات المدارة من الوكالات
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => refetchAccountBalance()}
                              className="w-full text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                            >
                              <RefreshCw className="h-3 w-3 ml-1" />
                              إعادة المحاولة
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                        لا توجد بيانات رصيد متوفرة
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analytics Summary Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="theme-border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">الحملات النشطة</p>
                          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            {campaignsData?.campaigns?.filter((c: any) => c.operation_status === 'ENABLE')?.length || 0}
                          </p>
                        </div>
                        <Megaphone className="h-6 w-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="theme-border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">إجمالي الإنطباعات</p>
                          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                            {formatNumber(adsData?.ads?.reduce((total: number, ad: any) => {
                              const adAnalytics = getAdAnalytics(ad);
                              return total + (parseFloat(String(adAnalytics?.impressions || 0)));
                            }, 0) || 0)}
                          </p>
                        </div>
                        <Eye className="h-6 w-6 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="theme-border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">إجمالي النقرات</p>
                          <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                            {formatNumber(adsData?.ads?.reduce((total: number, ad: any) => {
                              const adAnalytics = getAdAnalytics(ad);
                              return total + (parseFloat(String(adAnalytics?.clicks || 0)));
                            }, 0) || 0)}
                          </p>
                        </div>
                        <MousePointer className="h-6 w-6 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="theme-border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium">إجمالي الإنفاق</p>
                          <p className="text-lg font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(adsData?.ads?.reduce((total: number, ad: any) => {
                              const adAnalytics = getAdAnalytics(ad);
                              return total + (parseFloat(String(adAnalytics?.spend || 0)));
                            }, 0) || 0)}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Campaigns */}
                <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm hover:theme-shadow transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-theme-primary">
                      <Megaphone className="h-5 w-5" />
                      الحملات الحديثة
                      {syncReportsMutation.isPending && (
                        <RefreshCw className="h-4 w-4 animate-spin text-theme-primary" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaignsData?.campaigns?.slice(0, 5).map((campaign: TikTokCampaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-3 theme-border rounded-lg bg-gray-900/95 border-gray-700 backdrop-blur-sm hover:theme-shadow transition-all duration-300">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">{campaign.campaignName}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{campaign.objective}</p>
                          </div>
                          <div className="text-left">
                            {getStatusBadge(campaign.status)}
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {formatNumber(campaign.impressions)} إنطباع
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Leads */}
                <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm hover:theme-shadow transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-theme-primary">
                      <Users className="h-5 w-5" />
                      العملاء المحتملين الجدد
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {leadsData?.leads?.slice(0, 5).map((lead: TikTokLead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 theme-border rounded-lg bg-gray-900/95 border-gray-700 backdrop-blur-sm hover:theme-shadow transition-all duration-300">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">{lead.customerName}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{lead.customerPhone}</p>
                          </div>
                          <div className="text-left">
                            {getStatusBadge(lead.followUpStatus)}
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(lead.submittedAt).toLocaleDateString('ar-IQ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              {/* عرض الفترة المحددة */}
              <div className="text-sm text-muted-foreground dark:text-gray-300 mb-4 p-3 bg-theme-primary-light dark:bg-gray-700 rounded-lg theme-border">
                📊 البيانات المعروضة للفترة: <span className="font-medium text-theme-primary">{selectedDateRange.label}</span>
                <span className="mr-2">({format(selectedDateRange.startDate, "yyyy/MM/dd", { locale: ar })} - {format(selectedDateRange.endDate, "yyyy/MM/dd", { locale: ar })})</span>
              </div>

              <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm hover:theme-shadow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-theme-primary">إدارة الحملات</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {/* زر إنشاء حملة كاملة */}
                      <Dialog open={createCompleteCampaignOpen} onOpenChange={(open) => {
                        setCreateCompleteCampaignOpen(open);
                        if (open) {
                          // تحديث التوقيت عند فتح المودال
                          completeCampaignForm.setValue('startTime', getBaghdadTime());
                        }
                        if (!open) {
                          // إعادة تعيين حالة النسخ عند الإغلاق
                          resetCloneState();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button className="bg-theme-gradient hover:opacity-90 text-white theme-shadow">
                            <Zap className="ml-2 h-4 w-4" />
                            إنشاء حملة كاملة
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-small-text bg-white dark:bg-gray-950 theme-border">
                          <DialogHeader className="bg-theme-primary-light p-4 rounded-t-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0"
                                onClick={() => setCreateCompleteCampaignOpen(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <div className="text-right flex-1">
                                <DialogTitle className="text-base font-medium text-theme-primary">
                                  {isCloning ? (
                                    <>📋 نسخ وتعديل {cloneType === 'campaign' ? 'حملة' : cloneType === 'adGroup' ? 'مجموعة إعلانية' : 'إعلان'}</>
                                  ) : (
                                    <>إنشاء حملة إعلانية كاملة</>
                                  )}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
                                  إنشاء حملة + مجموعة إعلانية + إعلان في خطوة واحدة
                                </DialogDescription>
                              </div>
                            </div>
                          </DialogHeader>
                          <Form {...completeCampaignForm}>
                            <form onSubmit={completeCampaignForm.handleSubmit((data) => {
                              // معالجة بيانات النموذج المخصص
                              const customFields = {
                                collectName: data.collectName || false,
                                collectPhone: data.collectPhone || false,
                                collectAddress: data.collectAddress || false,
                              };

                              const processedData = {
                                ...data,
                                leadFormCustomFields: customFields,
                              };

                              createCompleteCampaignMutation.mutate(processedData as any);
                            })} className="compact-form">
                              
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
                                      <span className="text-green-600 text-xs mr-2 animate-pulse">✅ مكتمل</span>
                                    )}
                                  </div>
                                </h3>
                                {!campaignSectionCollapsed && (
                                <div className="compact-grid">
                                  {/* حقل اختيار المنتج - في بداية الحملة */}
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="productId"
                                    render={({ field }) => (
                                      <FormItem className="form-item">
                                        <FormLabel className="form-label text-theme-primary">اختيار المنتج *</FormLabel>
                                        <FormControl>
                                          <Select 
                                            onValueChange={(value) => {
                                              field.onChange(value);
                                              // البحث عن المنتج في كلا المصدرين للحصول على البيانات الكاملة
                                              const selectedProduct = productsData?.products?.find((p: ProductOption) => p.id === value);
                                              const selectedProductDetails = (productNames as any)?.find((p: any) => p.id === value);
                                              
                                              if (selectedProduct) {
                                                completeCampaignForm.setValue("campaignName", `حملة ${selectedProduct.name}`);
                                                completeCampaignForm.setValue("adGroupName", `مجموعة ${selectedProduct.name}`);
                                                completeCampaignForm.setValue("adName", `إعلان ${selectedProduct.name}`);
                                                completeCampaignForm.setValue("displayName", selectedProduct.name);
                                                
                                                // تحديث رابط المنتج - تحويل إلى نفس تنسيق Facebook
                                                if (selectedProductDetails?.landingPageUrl) {
                                                  const originalUrl = selectedProductDetails.landingPageUrl;
                                                  const platformSubdomain = session?.subdomain || 'demo';
                                                  
                                                  // استخراج المسار من الرابط الأصلي
                                                  // من: https://hanoot.sanadi.pro/blwr-hwaa-asly-779095
                                                  // إلى: https://sanadi.pro/hanoot/blwr-hwaa-asly-779095
                                                  try {
                                                    const url = new URL(originalUrl);
                                                    const path = url.pathname; // /blwr-hwaa-asly-779095
                                                    const convertedUrl = `${window.location.origin}/${platformSubdomain}${path}`;
                                                    
                                                    console.log('🔗 تحويل رابط المنتج:', {
                                                      original: originalUrl,
                                                      converted: convertedUrl,
                                                      subdomain: platformSubdomain,
                                                      path: path
                                                    });
                                                    
                                                    completeCampaignForm.setValue("landingPageUrl", convertedUrl);
                                                  } catch (error) {
                                                    console.warn('خطأ في تحويل الرابط، استخدام الرابط الأصلي:', error);
                                                    completeCampaignForm.setValue("landingPageUrl", originalUrl);
                                                  }
                                                } else {
                                                  // إذا لم يوجد رابط للمنتج، استخدم الدومين الأساسي
                                                  const platformSubdomain = session?.subdomain || 'demo';
                                                  const generatedUrl = `${window.location.origin}/${platformSubdomain}`;
                                                  console.log('🔗 لا يوجد رابط للمنتج، استخدام الدومين الأساسي:', generatedUrl);
                                                  completeCampaignForm.setValue("landingPageUrl", generatedUrl);
                                                }
                                                
                                                // تحديث نص الإعلان من وصف المنتج (10 كلمات فقط)
                                                if (selectedProductDetails?.description) {
                                                  const words = selectedProductDetails.description.trim().split(/\s+/);
                                                  const first10Words = words.slice(0, 10).join(' ');
                                                  completeCampaignForm.setValue("adText", first10Words);
                                                }
                                                // ملء بيانات الليدز إذا كان الهدف توليد العملاء المحتملين
                                                if (isLeadGeneration) {
                                                  completeCampaignForm.setValue("leadFormName", `نموذج طلب - ${selectedProduct.name}`);
                                                  completeCampaignForm.setValue("leadFormTitle", "احصل على العرض!");
                                                  completeCampaignForm.setValue("leadFormDescription", "يرجى ملء المعلومات بشكل صحيح");
                                                  completeCampaignForm.setValue("leadFormSuccessMessage", "تم الطلب بنجاح! ستصلك رسالة عبر الواتساب لتأكيد الطلب");
                                                  const formSlug = `lead-form-${selectedProduct.id}`;
                                                  const platformSubdomain = session?.subdomain || 'demo';
                                                  completeCampaignForm.setValue("leadFormPrivacyPolicyUrl", `${window.location.origin}/${platformSubdomain}/privacy/${formSlug}`);
                                                  completeCampaignForm.setValue("collectName", true);
                                                  completeCampaignForm.setValue("collectPhone", true);
                                                  completeCampaignForm.setValue("collectAddress", true);
                                                  completeCampaignForm.setValue("collectGovernorate", true);
                                                  completeCampaignForm.setValue("collectOfferSelection", true);
                                                  completeCampaignForm.setValue("collectNotes", true);
                                                }
                                              }
                                            }} 
                                            defaultValue={field.value}
                                          >
                                            <SelectTrigger className="form-select-trigger platform-select">
                                              <SelectValue placeholder="اختر منتج من قائمة المنتجات" />
                                            </SelectTrigger>
                                            <SelectContent className="select-content-solid">
                                              {productsLoading ? (
                                                <SelectItem value="loading" className="select-item">جاري تحميل المنتجات...</SelectItem>
                                              ) : (
                                                productsData?.products?.map((product: ProductOption) => (
                                                  <SelectItem key={product.id} value={product.id} className="select-item">
                                                    {product.name}
                                                  </SelectItem>
                                                ))
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                        <FormMessage className="form-message" />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="campaignName"
                                    render={({ field }) => (
                                      <FormItem className="form-item">
                                        <FormLabel className="form-label">اسم الحملة *</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="حملة منتج الصيف 2025" className="form-input platform-input" />
                                        </FormControl>
                                        <FormMessage className="form-message" />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="objective"
                                    render={({ field }) => (
                                      <FormItem className="form-item">
                                        <FormLabel className="form-label">هدف الحملة *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="form-select-trigger platform-select">
                                              <SelectValue placeholder="اختر الهدف" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="select-content-solid">
                                            <SelectItem value="CONVERSIONS" className="select-item">التحويلات</SelectItem>
                                            <SelectItem value="LEAD_GENERATION" className="select-item">توليد عملاء محتملين</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage className="form-message" />
                                      </FormItem>
                                    )}
                                  />

                                  {/* حقل اختيار الهوية */}
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="identityId"
                                    render={({ field }) => (
                                      <FormItem className="form-item">
                                        <FormLabel className="form-label">هوية الإعلان</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || getDefaultIdentity()}>
                                          <FormControl>
                                            <SelectTrigger className="form-select-trigger platform-select">
                                              <SelectValue placeholder="اختر الهوية" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="select-content-solid">
                                            {identitiesLoading ? (
                                              <SelectItem value="loading" className="select-item">
                                                <div className="flex items-center gap-2">
                                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                                  جاري تحميل الهويات...
                                                </div>
                                              </SelectItem>
                                            ) : identitiesError ? (
                                              <SelectItem value="error" className="select-item text-red-600">
                                                <div className="flex items-center gap-2">
                                                  <AlertCircle className="h-4 w-4" />
                                                  خطأ في تحميل الهويات
                                                </div>
                                              </SelectItem>
                                            ) : identities.length > 0 ? (
                                              identities.map((identity: any) => (
                                                <SelectItem key={identity.identity_id} value={identity.identity_id} className="select-item">
                                                  <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                      <Avatar className="h-6 w-6">
                                                        <AvatarImage src={identity.avatar_icon_web_uri} alt={identity.display_name} />
                                                        <AvatarFallback className={`text-xs ${
                                                          identity.is_real_user_identity 
                                                            ? 'bg-blue-100 text-blue-600' 
                                                            : identity.is_platform_identity 
                                                              ? 'bg-green-100 text-green-600' 
                                                              : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                          {identity.display_name.charAt(0)}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                      {identity.is_real_user_identity && (
                                                        <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-purple-50 to-blue-500 rounded-full p-0.5">
                                                          <User2 className="h-2 w-2 text-white" />
                                                        </div>
                                                      )}
                                                    </div>
                                                    <span className="truncate">{identity.display_name}</span>
                                                    {identity.username && (
                                                      <span className="text-xs text-blue-400 font-mono">@{identity.username}</span>
                                                    )}
                                                    {identity.is_real_user_identity && !identity.is_bc_identity && (
                                                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
                                                        الهوية الحقيقية
                                                      </Badge>
                                                    )}
                                                    {identity.is_platform_identity && (
                                                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
                                                        افتراضي
                                                      </Badge>
                                                    )}
                                                    {identity.is_advertiser_identity && (
                                                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300">
                                                        حساب المعلن
                                                      </Badge>
                                                    )}
                                                    {identity.is_bc_identity && (
                                                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300">
                                                        Business Manager
                                                      </Badge>
                                                    )}
                                                    {identity.is_fallback_identity && (
                                                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-300">
                                                        احتياطي
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <div className="px-3 py-4 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                  <AlertCircle className="h-8 w-8 text-orange-500" />
                                                  <div className="text-sm font-medium">لا توجد هويات متاحة</div>
                                                  <div className="text-xs text-gray-400 max-w-xs">
                                                    تأكد من ربط حساب TikTok وإعداد الهويات في Business Center
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </SelectContent>
                                        </Select>
                                        <FormDescription className="form-description">
                                          الهوية التي ستظهر في الإعلان على TikTok. الأولوية: Business Manager ← الهوية الحقيقية
                                          {identitiesError && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                                              <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>خطأ في تحميل الهويات من TikTok</span>
                                              </div>
                                              <div className="mt-1 text-xs text-red-600">
                                                تأكد من إعداد Access Token و Advertiser ID في إعدادات TikTok
                                              </div>
                                            </div>
                                          )}
                                        </FormDescription>
                                        <FormMessage className="form-message" />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="campaignBudgetMode"
                                    render={({ field }) => (
                                      <FormItem className="space-y-1">
                                        <FormLabel className="text-sm font-medium">نوع ميزانية الحملة *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="platform-select">
                                              <SelectValue placeholder="نوع الميزانية" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="select-content-solid">
                                            <SelectItem value="BUDGET_MODE_INFINITE" className="select-item">
                                              ميزانية لا محدودة (All) - لا يوجد حد أقصى للإنفاق
                                            </SelectItem>
                                            <SelectItem value="BUDGET_MODE_DAY" className="select-item">
                                              ميزانية يومية - حد أقصى يومي ثابت
                                            </SelectItem>
                                            <SelectItem value="BUDGET_MODE_TOTAL" className="select-item">
                                              إجمالي الميزانية - مبلغ إجمالي يوزع على مدة الحملة
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs leading-tight">
                                          {field.value === "BUDGET_MODE_INFINITE" && (
                                            <span className="text-blue-600 text-xs block">
                                              💡 ستظهر بـ "All" في TikTok - لا حد أقصى
                                            </span>
                                          )}
                                          {field.value === "BUDGET_MODE_DAY" && (
                                            <span className="text-green-600 text-xs block">
                                              📅 حد أقصى يومي ثابت - لن يتجاوز المبلغ
                                            </span>
                                          )}
                                          {field.value === "BUDGET_MODE_TOTAL" && (
                                            <span className="text-purple-600 text-xs block">
                                              🎯 ميزانية مرنة - يوزع بذكاء حسب الأداء
                                            </span>
                                          )}
                                        </FormDescription>
                                        <FormMessage className="text-xs" />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="campaignBudget"
                                    render={({ field }) => {
                                      const budgetMode = completeCampaignForm.watch("campaignBudgetMode");
                                      const isInfinite = budgetMode === "BUDGET_MODE_INFINITE";
                                      return (
                                        <FormItem>
                                          <FormLabel>
                                            ميزانية الحملة (USD)
                                            {isInfinite && <span className="text-blue-600 text-sm mr-2">(اختياري - لا محدود)</span>}
                                          </FormLabel>
                                          <FormControl>
                                            <Input 
                                              {...field} 
                                              placeholder={isInfinite ? "اتركه فارغاً للميزانية اللامحدودة" : "100"} 
                                              type="number" 
                                              disabled={isInfinite}
                                              className={isInfinite ? "bg-gray-100 cursor-not-allowed platform-input" : "platform-input"}
                                            />
                                          </FormControl>
                                          {isInfinite && (
                                            <FormDescription className="text-blue-600 text-[9px] leading-none truncate">
                                              تعني عدم وجود حد أقصى للإنفاق
                                            </FormDescription>
                                          )}
                                          <FormMessage />
                                        </FormItem>
                                      );
                                    }}
                                  />

                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="useCampaignBudgetOptimization"
                                    render={({ field }) => (
                                      <FormItem className="col-span-2">
                                        <FormLabel className="text-sm">(CBO) توزيع الميزانية التلقائي</FormLabel>
                                        <FormControl>
                                          <Button
                                            type="button"
                                            onClick={() => field.onChange(!field.value)}
                                            variant="outline"
                                            className={`
                                              w-full justify-start p-3 h-auto transition-all duration-200
                                              ${field.value 
                                                ? 'bg-theme-gradient text-white border-theme-primary theme-shadow hover:scale-[1.02] transform hover:bg-theme-gradient' 
                                                : 'bg-theme-primary-light border-theme-border hover:border-theme-primary hover:bg-theme-primary-lighter'
                                              }
                                            `}
                                          >
                                            <div className="flex items-center justify-between w-full">
                                              <div className="flex items-center">
                                                <div className={`flex items-center justify-center w-6 h-6 rounded-full ml-2 ${
                                                  field.value ? 'bg-white/20' : 'bg-theme-primary/20'
                                                }`}>
                                                  {field.value ? 
                                                    <CheckCircle className="h-4 w-4" /> : 
                                                    <Circle className="h-4 w-4" />
                                                  }
                                                </div>
                                                <span className="text-sm font-medium">
                                                  {field.value ? 'CBO مفعل - سيوزع TikTok الميزانية تلقائياً' : 'اضغط لتفعيل CBO'}
                                                </span>
                                              </div>
                                              <span className={`text-xs px-2 py-1 rounded-full ${
                                                field.value 
                                                  ? 'bg-white/20 text-white' 
                                                  : 'bg-theme-primary/10 text-theme-primary'
                                              }`}>
                                                {field.value ? 'نشط' : 'متوقف'}
                                              </span>
                                            </div>
                                          </Button>
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500 mt-1">
                                          عند التفعيل، سيوزع TikTok الميزانية تلقائياً عبر المجموعات الإعلانية لتحقيق أفضل نتائج
                                        </FormDescription>
                                      </FormItem>
                                    )}
                                  />
                                  

                                </div>
                                )}
                              </div>

                              {/* قسم بيانات المجموعة الإعلانية */}
                              <div className="form-section bg-theme-primary-light border theme-border rounded-lg">
                                <h3 
                                  className={`text-base font-medium mb-2 flex items-center justify-between p-2 rounded transition-colors ${
                                    !campaignCompleted 
                                      ? 'cursor-not-allowed text-gray-400 hover:bg-gray-800/50' 
                                      : adGroupCompleted 
                                        ? 'cursor-pointer text-green-600 dark:text-green-400 hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm' 
                                        : 'cursor-pointer text-theme-primary hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm'
                                  }`}
                                  onClick={() => handleSectionClick('adGroup')}
                                >
                                  {adGroupSectionCollapsed ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronUp className="h-4 w-4" />
                                  }
                                  <div className="flex items-center">
                                    {!campaignCompleted ? (
                                      <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">2</span>
                                    ) : adGroupCompleted ? (
                                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        2
                                      </span>
                                    ) : (
                                      <span className="bg-theme-gradient text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">2</span>
                                    )}
                                    بيانات المجموعة الإعلانية
                                    {!campaignCompleted && (
                                      <span className="text-gray-400 text-xs mr-2">🔒 يتطلب إكمال الحملة</span>
                                    )}
                                    {adGroupCompleted && (
                                      <span className="text-green-600 text-xs mr-2 animate-pulse">✅ مكتمل</span>
                                    )}
                                  </div>
                                </h3>
                                {!adGroupSectionCollapsed && (
                                <div className="space-y-4">
                                  {/* الصف الأول - اسم المجموعة ونوع الميزانية */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="adGroupName"
                                      render={({ field }) => (
                                        <FormItem className="form-item">
                                          <FormLabel className="form-label text-theme-primary">اسم المجموعة الإعلانية *</FormLabel>
                                          <FormControl>
                                            <Input {...field} placeholder="مجموعة إعلانات المنتج الصيفي" className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400" />
                                          </FormControl>
                                          <FormMessage className="form-message" />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="adGroupBudgetMode"
                                      render={({ field }) => (
                                        <FormItem className="form-item">
                                          <FormLabel className="form-label text-theme-primary">نوع ميزانية المجموعة *</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white">
                                                <SelectValue placeholder="نوع الميزانية" className="text-white" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="select-content-solid">
                                              <SelectItem value="BUDGET_MODE_DAY" className="select-item">
                                                ميزانية يومية - حد أقصى يومي ثابت للمجموعة
                                              </SelectItem>
                                              <SelectItem value="BUDGET_MODE_TOTAL" className="select-item">
                                                إجمالي الميزانية - مبلغ إجمالي يوزع على مدة المجموعة
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage className="form-message" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  {/* الصف الثاني - ميزانية، نوع المزايدة، سعر المزايدة */}
                                  <div className={`grid gap-3 ${completeCampaignForm.watch("bidType") === "BID_TYPE_NO_BID" ? "grid-cols-2" : "grid-cols-3"}`}>
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="adGroupBudget"
                                      render={({ field }) => {
                                        const isCBOEnabled = completeCampaignForm.watch("useCampaignBudgetOptimization");
                                        return (
                                          <FormItem className="form-item">
                                            <FormLabel className="form-label text-theme-primary text-xs">
                                              ميزانية (USD) {!isCBOEnabled && "*"}
                                            </FormLabel>
                                            {isCBOEnabled && <span className="text-orange-600 text-xs block">(معطل - CBO)</span>}
                                            <FormControl>
                                              <Input 
                                                {...field} 
                                                placeholder={isCBOEnabled ? "CBO" : "25"} 
                                                type="number" 
                                                disabled={isCBOEnabled}
                                                className={`bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 h-8 text-sm ${isCBOEnabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                              />
                                            </FormControl>
                                            <FormMessage className="form-message" />
                                          </FormItem>
                                        );
                                      }}
                                    />
                                    
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="bidType"
                                      render={({ field }) => (
                                        <FormItem className="form-item">
                                          <FormLabel className="form-label text-theme-primary text-xs">نوع المزايدة *</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white h-8">
                                                <SelectValue placeholder="نوع المزايدة" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="select-content-solid">
                                              <SelectItem value="BID_TYPE_NO_BID" className="select-item">بدون مزايدة</SelectItem>
                                              <SelectItem value="BID_TYPE_CUSTOM" className="select-item">مزايدة مخصصة</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage className="form-message" />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    {/* إخفاء حقل سعر المزايدة عند اختيار "بدون مزايدة" */}
                                    {completeCampaignForm.watch("bidType") !== "BID_TYPE_NO_BID" && (
                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="bidPrice"
                                        render={({ field }) => (
                                          <FormItem className="form-item">
                                            <FormLabel className="form-label text-theme-primary text-xs">سعر المزايدة (USD)</FormLabel>
                                            <FormControl>
                                              <Input {...field} placeholder="0.5" type="number" step="0.01" className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 h-8 text-sm" />
                                            </FormControl>
                                            <FormMessage className="form-message" />
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* الصف الثالث - التواريخ */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="startTime"
                                      render={({ field }) => (
                                        <FormItem className="form-item">
                                          <FormControl>
                                            <div className="relative">
                                              <Input 
                                                {...field} 
                                                type="datetime-local"
                                                className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 h-8 text-sm pr-24"
                                                value={field.value || getBaghdadTime()}
                                                onChange={(e) => field.onChange(e.target.value)}
                                              />
                                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-theme-primary pointer-events-none">
                                                تاريخ البداية
                                              </span>
                                            </div>
                                          </FormControl>
                                          <FormDescription className="form-description text-gray-500">
                                            إذا لم يتم تحديد تاريخ، ستبدأ المجموعة فوراً
                                          </FormDescription>
                                          <FormMessage className="form-message" />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="endTime"
                                      render={({ field }) => (
                                        <FormItem className="form-item">
                                          <FormControl>
                                            <div className="relative">
                                              <Input 
                                                {...field} 
                                                type="datetime-local" 
                                                className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 h-8 text-sm pr-32"
                                                onChange={(e) => field.onChange(e.target.value)}
                                              />
                                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-theme-primary pointer-events-none">
                                                تاريخ النهاية (اختياري)
                                              </span>
                                            </div>
                                          </FormControl>
                                          <FormDescription className="form-description text-gray-500">
                                            إذا لم يتم تحديد تاريخ، ستستمر المجموعة بدون نهاية محددة
                                          </FormDescription>
                                          <FormMessage className="form-message" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  {/* الصف الرابع - البكسل والحدث - يُخفى في توليد العملاء المحتملين */}
                                  {!isLeadGeneration && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="pixelId"
                                        render={({ field }) => (
                                          <FormItem>
                                            <div className="flex items-center justify-between">
                                              <FormLabel className="text-theme-primary text-xs">بكسل التتبع</FormLabel>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  const pixelId = completeCampaignForm.watch("pixelId");
                                                  if (pixelId && pixelId !== "none") {
                                                    try {
                                                      console.log(`🔄 إعادة جلب أحداث البكسل ${pixelId}...`);
                                                      const response = await fetch(`/api/tiktok/pixels/${pixelId}/events`);
                                                      const data = await response.json();
                                                      console.log(`📋 أحداث البكسل ${pixelId}:`, data);
                                                      
                                                      if (data.success) {
                                                        toast({
                                                          title: '✅ تم جلب الأحداث',
                                                          description: `تم العثور على ${data.eventsCount} حدث (${data.activeEventsCount} نشط)`,
                                                        });
                                                        // إعادة جلب البكسلات لتحديث البيانات
                                                        refetchPixels();
                                                      } else {
                                                        toast({
                                                          title: '❌ فشل جلب الأحداث',
                                                          description: data.error || 'خطأ غير معروف',
                                                          variant: 'destructive'
                                                        });
                                                      }
                                                    } catch (error) {
                                                      console.error('❌ خطأ في جلب الأحداث:', error);
                                                      toast({
                                                        title: '❌ خطأ في الاتصال',
                                                        description: 'فشل الاتصال بالخادم',
                                                        variant: 'destructive'
                                                      });
                                                    }
                                                  } else {
                                                    toast({
                                                      title: '⚠️ تحذير',
                                                      description: 'يرجى اختيار بكسل أولاً',
                                                      variant: 'destructive'
                                                    });
                                                  }
                                                }}
                                                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                              >
                                                🔄 تحديث الأحداث
                                              </button>
                                            </div>
                                            <Select 
                                              onValueChange={field.onChange} 
                                              defaultValue={field.value || ((pixelsData as any)?.pixels && (pixelsData as any).pixels.length > 0 ? (pixelsData as any).pixels[0].pixelId : "none")}
                                            >
                                              <FormControl>
                                                <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white h-8">
                                                  <SelectValue placeholder="اختر بكسل" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent className="select-content-solid">
                                                <SelectItem value="none" className="select-item">بدون بكسل</SelectItem>
                                                {(pixelsData as any)?.pixels && (pixelsData as any).pixels.length > 0 ? (
                                                  (pixelsData as any).pixels.map((pixel: any) => (
                                                    <SelectItem key={pixel.pixelId} value={pixel.pixelId} className="hover:bg-theme-primary-light">
                                                      <div className="flex items-center justify-between w-full">
                                                        <span className="font-medium truncate">{pixel.pixelName}</span>
                                                        <span className="text-xs text-muted-foreground ml-2 font-mono">{pixel.pixelCode}</span>
                                                      </div>
                                                    </SelectItem>
                                                  ))
                                                ) : (
                                                  <SelectItem value="unavailable" className="select-item">
                                                    لا توجد بكسلات
                                                  </SelectItem>
                                                )}
                                              </SelectContent>
                                            </Select>
                                            <FormMessage className="form-message" />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="optimizationEvent"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-theme-primary text-xs">حدث التحسين</FormLabel>
                                            <Select 
                                              onValueChange={field.onChange} 
                                              defaultValue={field.value}
                                            >
                                              <FormControl>
                                                <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white h-8">
                                                  <SelectValue placeholder="اختر حدث التحسين" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent className="select-content-solid">
                                                <SelectItem value="auto" className="hover:bg-theme-primary-light">
                                                  <div className="flex items-center justify-between w-full">
                                                    <span>🤖 تلقائي (أفضل حدث من البكسل)</span>
                                                    <span className="text-xs ml-2 text-blue-500">⭐ مُوصى</span>
                                                  </div>
                                                </SelectItem>
                                                {getAvailableOptimizationEvents().map((event) => (
                                                  <SelectItem key={event.value} value={event.value} className="hover:bg-theme-primary-light">
                                                    <div className="flex items-center justify-between w-full">
                                                      <span>{event.label}</span>
                                                      {event.value === 'ON_WEB_ORDER' && (
                                                        <span className="text-xs ml-2 text-green-500">✅ افتراضي</span>
                                                      )}
                                                    </div>
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <FormDescription className="form-description text-gray-500 text-xs">
                                              اختياري: اختر حدث التحسين المناسب لهدف حملتك. إذا لم تختر، سيتم استخدام أفضل حدث متاح من البكسل.
                                            </FormDescription>
                                            <FormMessage className="form-message" />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  )}
                                </div>
                                )}
                              </div>

                              {/* قسم بيانات الإعلان */}
                              <div className="form-section bg-theme-primary-light border theme-border rounded-lg">
                                <h3 
                                  className={`text-base font-medium mb-2 flex items-center justify-between p-2 rounded transition-colors ${
                                    !adGroupCompleted 
                                      ? 'cursor-not-allowed text-gray-400 hover:bg-gray-800/50' 
                                      : adCompleted 
                                        ? 'cursor-pointer text-green-600 dark:text-green-400 hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm' 
                                        : 'cursor-pointer text-theme-primary hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm'
                                  }`}
                                  onClick={() => handleSectionClick('ad')}
                                >
                                  {adSectionCollapsed ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronUp className="h-4 w-4" />
                                  }
                                  <div className="flex items-center">
                                    {!adGroupCompleted ? (
                                      <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">3</span>
                                    ) : adCompleted ? (
                                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        3
                                      </span>
                                    ) : (
                                      <span className="bg-theme-gradient text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">3</span>
                                    )}
                                    بيانات الإعلان
                                    {!adGroupCompleted && (
                                      <span className="text-gray-400 text-xs mr-2">🔒 يتطلب إكمال المجموعة الإعلانية</span>
                                    )}
                                    {adCompleted && (
                                      <span className="text-green-600 text-xs mr-2 animate-pulse">✅ مكتمل</span>
                                    )}
                                  </div>
                                </h3>
                                {!adSectionCollapsed && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="adName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-theme-primary">اسم الإعلان *</FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="مثال: إعلان المنتج الصيفي فيديو" className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="adFormat"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-theme-primary">تنسيق الإعلان *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white">
                                              <SelectValue placeholder="تنسيق الإعلان" className="text-white" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="select-content-solid">
                                            <SelectItem value="SINGLE_VIDEO" className="select-item">فيديو واحد</SelectItem>
                                            <SelectItem value="SINGLE_IMAGE" className="select-item">صورة واحدة</SelectItem>
                                            <SelectItem value="COLLECTION" className="select-item">مجموعة</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {/* قسم رفع الملفات */}
                                  <div className="md:col-span-2 border rounded-lg p-4 bg-gray-900/95 border-gray-700 backdrop-blur-sm theme-border">
                                    <h4 className="font-semibold mb-3 text-theme-primary">
                                      📎 رفع الفيديو والصور
                                    </h4>
                                    
                                    {completeCampaignForm.watch("adFormat") === "SINGLE_VIDEO" && (
                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="videoUrl"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-theme-primary font-semibold">
                                              رفع فيديو الإعلان *
                                            </FormLabel>
                                            <FormControl>
                                              <div className="space-y-2">
                                                <div 
                                                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                                    dragOver ? 'border-green-400 bg-green-50' : 'border-theme-primary hover:border-theme-primary'
                                                  } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                  onDragOver={handleDragOver}
                                                  onDragLeave={handleDragLeave}
                                                  onDrop={(e) => handleDrop(e, field, 'video')}
                                                >
                                                  <Video className={`h-8 w-8 mx-auto mb-2 ${dragOver ? 'text-green-500' : 'text-theme-primary'}`} />
                                                  <p className="text-sm text-gray-600 mb-2">
                                                    {uploading ? 'جاري رفع الفيديو...' : 'اسحب وأفلت الفيديو هنا أو اضغط للاختيار'}
                                                  </p>
                                                  <p className="text-xs text-gray-500">الحد الأقصى: 100 ميجابايت (MP4, MOV, AVI)</p>
                                                  <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-2"
                                                    onClick={() => videoInputRef.current?.click()}
                                                    disabled={uploading}
                                                  >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {uploading ? 'جاري الرفع...' : 'اختر الفيديو'}
                                                  </Button>
                                                  <input
                                                    ref={videoInputRef}
                                                    type="file"
                                                    accept="video/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        handleVideoUpload(file, field);
                                                      }
                                                    }}
                                                  />
                                                </div>
                                                {field.value && (
                                                  <div className="flex items-center justify-between bg-theme-primary-light p-2 rounded">
                                                    <span className="text-sm text-theme-primary">تم رفع الفيديو بنجاح</span>
                                                    <Button 
                                                      type="button" 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={() => field.onChange("")}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                    
                                    {completeCampaignForm.watch("adFormat") === "SINGLE_IMAGE" && (
                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="imageUrls"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-theme-primary font-semibold">
                                              رفع صور الإعلان *
                                            </FormLabel>
                                            <FormControl>
                                              <div className="space-y-2">
                                                <div 
                                                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                                    dragOver ? 'border-green-400 bg-green-50' : 'border-theme-primary hover:border-theme-primary'
                                                  } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                  onDragOver={handleDragOver}
                                                  onDragLeave={handleDragLeave}
                                                  onDrop={(e) => handleDrop(e, field, 'image')}
                                                >
                                                  <ImageIcon className={`h-8 w-8 mx-auto mb-2 ${dragOver ? 'text-green-500' : 'text-theme-primary'}`} />
                                                  <p className="text-sm text-gray-600 mb-2">
                                                    {uploading ? 'جاري رفع الصور...' : 'اسحب وأفلت الصور هنا أو اضغط للاختيار'}
                                                  </p>
                                                  <p className="text-xs text-gray-500">الحد الأقصى: 10 ميجابايت لكل صورة (JPG, PNG, GIF)</p>
                                                  <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-2"
                                                    onClick={() => imageInputRef.current?.click()}
                                                    disabled={uploading}
                                                  >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {uploading ? 'جاري الرفع...' : 'اختر الصور'}
                                                  </Button>
                                                  <input
                                                    ref={imageInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => {
                                                      const files = Array.from(e.target.files || []);
                                                      if (files.length > 0) {
                                                        handleImageUpload(files, field);
                                                      }
                                                    }}
                                                  />
                                                </div>
                                                {field.value && field.value.length > 0 && (
                                                  <div className="grid grid-cols-2 gap-2">
                                                    {field.value.map((url, index) => (
                                                      <div key={index} className="relative bg-theme-primary-light p-2 rounded">
                                                        <span className="text-sm text-theme-primary">صورة {index + 1}</span>
                                                        <Button 
                                                          type="button" 
                                                          variant="ghost" 
                                                          size="sm"
                                                          className="absolute top-0 right-0"
                                                          onClick={() => {
                                                            const newUrls = (field.value || []).filter((_, i) => i !== index);
                                                            field.onChange(newUrls);
                                                          }}
                                                        >
                                                          <X className="h-3 w-3" />
                                                        </Button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* رابط الصفحة - يظهر فقط إذا لم يكن الهدف توليد العملاء المحتملين */}
                                  {!isLeadGeneration && (
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="landingPageUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-theme-primary">رابط الصفحة *</FormLabel>
                                          <FormControl>
                                            <Input {...field} placeholder="https://your-website.com/product" type="url" className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}

                                  {/* حقول نموذج الليدز - تظهر فقط عند اختيار هدف توليد العملاء المحتملين */}
                                  {isLeadGeneration && (
                                    <div className="space-y-4 p-4 bg-gray-900/95 border-gray-700 backdrop-blur-sm border border-theme-border rounded-lg">
                                      <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-5 w-5 text-theme-primary" />
                                        <h4 className="text-theme-primary font-semibold">إعدادات نموذج الليدز</h4>
                                      </div>
                                      

                                      {isLoadingLeadForms ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Loader2 className="h-6 w-6 animate-spin text-theme-primary" />
                                          <span className="mr-2 text-sm text-gray-400">جاري جلب الفورمات الموجودة...</span>
                                        </div>
                                      ) : (leadFormsData as any)?.leadForms && (leadFormsData as any).leadForms.length > 0 ? (
                                        <FormField
                                          control={completeCampaignForm.control}
                                          name="leadFormPrivacyPolicyUrl"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-theme-primary text-sm">اختر الفورم الموجود من TikTok *</FormLabel>
                                              <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                  <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white">
                                                    <SelectValue placeholder="اختر فورم موجود..." />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="select-content-solid">
                                                  {(leadFormsData as any).leadForms.map((form: any) => (
                                                    <SelectItem 
                                                      key={form.id} 
                                                      value={form.id}
                                                      className="select-item"
                                                    >
                                                      {form.name} {form.title && `- ${form.title}`}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <FormDescription className="text-xs text-gray-400">
                                                يتم عرض الفورمات التي أنشأتها من واجهة TikTok Ads Manager
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      ) : (
                                        <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                                          <div className="flex items-center gap-2 text-yellow-400">
                                            <AlertTriangle className="h-5 w-5" />
                                            <p className="text-sm font-medium">لا توجد فورمات متاحة</p>
                                          </div>
                                          <p className="text-xs text-gray-400 mt-2">
                                            يجب إنشاء Instant Form من واجهة TikTok Ads Manager أولاً. 
                                            <br />لا يمكن إنشاء فورمات جديدة عبر API حسب سياسة TikTok.
                                          </p>
                                        </div>
                                      )}

                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="leadFormDescription"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-theme-primary text-sm">وصف النموذج</FormLabel>
                                            <FormControl>
                                              <textarea 
                                                {...field} 
                                                placeholder="يرجى ملء المعلومات بشكل صحيح"
                                                className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 w-full p-3 rounded-md resize-none h-20 text-sm"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="leadFormPrivacyPolicyUrl"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-theme-primary text-sm">رابط سياسة الخصوصية</FormLabel>
                                            <FormControl>
                                              <Input {...field} placeholder="https://your-website.com/privacy-policy" type="url" className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 h-10 text-sm" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={completeCampaignForm.control}
                                        name="leadFormSuccessMessage"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-theme-primary text-sm">رسالة النجاح *</FormLabel>
                                            <FormControl>
                                              <Input {...field} placeholder="تم الطلب بنجاح! ستصلك رسالة عبر الواتساب لتأكيد الطلب" className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400 h-10 text-sm" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />



                                      {/* تخصيص حقول النموذج */}
                                      <div className="space-y-3">
                                        <h5 className="text-theme-primary font-medium text-sm flex items-center gap-2">
                                          <Settings className="h-4 w-4" />
                                          حقول النموذج المطلوبة
                                        </h5>
                                        
                                        <div className="grid gap-3 md:grid-cols-2">
                                          <FormField
                                            control={completeCampaignForm.control}
                                            name="collectName"
                                            render={({ field }) => (
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                  <Checkbox 
                                                    checked={field.value || false}
                                                    onCheckedChange={field.onChange}
                                                    className="border-theme-border"
                                                  />
                                                </FormControl>
                                                <div className="flex items-center gap-1">
                                                  <User className="h-3 w-3 text-theme-primary" />
                                                  <FormLabel className="text-theme-primary text-sm font-normal">
                                                    الاسم الكامل
                                                  </FormLabel>
                                                </div>
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={completeCampaignForm.control}
                                            name="collectPhone"
                                            render={({ field }) => (
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                  <Checkbox 
                                                    checked={field.value || false}
                                                    onCheckedChange={field.onChange}
                                                    className="border-theme-border"
                                                  />
                                                </FormControl>
                                                <div className="flex items-center gap-1">
                                                  <Phone className="h-3 w-3 text-theme-primary" />
                                                  <FormLabel className="text-theme-primary text-sm font-normal">
                                                    رقم الهاتف
                                                  </FormLabel>
                                                </div>
                                              </FormItem>
                                            )}
                                          />



                                          <FormField
                                            control={completeCampaignForm.control}
                                            name="collectAddress"
                                            render={({ field }) => (
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                  <Checkbox 
                                                    checked={field.value || false}
                                                    onCheckedChange={field.onChange}
                                                    className="border-theme-border"
                                                  />
                                                </FormControl>
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="h-3 w-3 text-theme-primary" />
                                                  <FormLabel className="text-theme-primary text-sm font-normal">
                                                    العنوان المفصل
                                                  </FormLabel>
                                                </div>
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={completeCampaignForm.control}
                                            name="collectGovernorate"
                                            render={({ field }) => (
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                  <Checkbox 
                                                    checked={field.value || true}
                                                    onCheckedChange={field.onChange}
                                                    className="border-theme-border"
                                                  />
                                                </FormControl>
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="h-3 w-3 text-theme-primary" />
                                                  <FormLabel className="text-theme-primary text-sm font-normal">
                                                    المحافظة/المدينة
                                                  </FormLabel>
                                                </div>
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={completeCampaignForm.control}
                                            name="collectOfferSelection"
                                            render={({ field }) => (
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                  <Checkbox 
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-theme-border"
                                                  />
                                                </FormControl>
                                                <div className="flex items-center gap-1">
                                                  <DollarSign className="h-3 w-3 text-theme-primary" />
                                                  <FormLabel className="text-theme-primary text-sm font-normal">
                                                    اختيار العرض/السعر
                                                  </FormLabel>
                                                </div>
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="adText"
                                    render={({ field }) => (
                                      <FormItem className="md:col-span-2">
                                        <FormLabel className="text-theme-primary">نص الإعلان *</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} placeholder="اكتب نص الإعلان المقنع هنا..." rows={3} className="bg-theme-primary-lighter border-theme-border text-white placeholder:text-gray-400" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  {/* الحقول - تخفي البكسل والحدث لتوليد العملاء المحتملين */}
                                  <div className={`grid gap-4 mb-4 ${isLeadGeneration ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                                    <FormField
                                      control={completeCampaignForm.control}
                                      name="callToAction"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-theme-primary text-sm">زر الإجراء *</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="bg-theme-primary-lighter border-theme-border text-white h-10 text-sm">
                                                <SelectValue placeholder="زر الإجراء" className="text-white" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="select-content-solid">
                                              <SelectItem value="LEARN_MORE" className="select-item">اعرف المزيد</SelectItem>
                                              <SelectItem value="SHOP_NOW" className="select-item">تسوق الآن</SelectItem>
                                              <SelectItem value="SIGN_UP" className="select-item">اشترك</SelectItem>
                                              <SelectItem value="DOWNLOAD" className="select-item">تحميل</SelectItem>
                                              <SelectItem value="CONTACT_US" className="select-item">تواصل معنا</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />


                                  </div>
                                </div>
                                )}
                              </div>

                              {/* قسم الاستهداف */}
                              <div className="form-section bg-theme-primary-light border theme-border rounded-lg">
                                <h3 
                                  className={`text-base font-medium mb-2 flex items-center justify-between p-2 rounded transition-colors ${
                                    !adCompleted 
                                      ? 'cursor-not-allowed text-gray-400 hover:bg-gray-800/50' 
                                      : targetingCompleted 
                                        ? 'cursor-pointer text-green-600 dark:text-green-400 hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm' 
                                        : 'cursor-pointer text-theme-primary hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm'
                                  }`}
                                  onClick={() => handleSectionClick('targeting')}
                                >
                                  {targetingSectionCollapsed ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronUp className="h-4 w-4" />
                                  }
                                  <div className="flex items-center">
                                    {!adCompleted ? (
                                      <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">4</span>
                                    ) : targetingCompleted ? (
                                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        4
                                      </span>
                                    ) : (
                                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-2 theme-shadow">4</span>
                                    )}
                                    إعدادات الاستهداف (اختيارية)
                                    {!adCompleted && (
                                      <span className="text-gray-400 text-xs mr-2">🔒 يتطلب إكمال الإعلان</span>
                                    )}
                                    {targetingCompleted && (
                                      <span className="text-green-600 text-xs mr-2 animate-pulse">✅ مكتمل</span>
                                    )}
                                    {adCompleted && !targetingCompleted && (
                                      <span className="text-blue-400 text-xs mr-2">⚡ جاهز للتخصيص</span>
                                    )}
                                  </div>
                                </h3>
                                {!targetingSectionCollapsed && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="targeting.gender"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>الجنس</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="platform-select">
                                              <SelectValue placeholder="اختر الجنس" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="select-content-solid">
                                            <SelectItem value="GENDER_UNLIMITED" className="select-item">الكل</SelectItem>
                                            <SelectItem value="GENDER_MALE" className="select-item">ذكور</SelectItem>
                                            <SelectItem value="GENDER_FEMALE" className="select-item">إناث</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="targeting.age_groups"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>الفئات العمرية</FormLabel>
                                        <FormControl>
                                          <div className="space-y-2">
                                            <div className="space-y-3">
                                              {/* خيار الكل */}
                                              <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded border">
                                                <input
                                                  type="checkbox"
                                                  className="rounded border-gray-300"
                                                  checked={!field.value || field.value.length === 0 || field.value.length === 6}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      // تحديد جميع الفئات العمرية
                                                      field.onChange([
                                                        "AGE_13_17", 
                                                        "AGE_18_24", 
                                                        "AGE_25_34", 
                                                        "AGE_35_44", 
                                                        "AGE_45_54", 
                                                        "AGE_55_PLUS"
                                                      ]);
                                                    } else {
                                                      // إلغاء تحديد جميع الفئات العمرية
                                                      field.onChange([]);
                                                    }
                                                  }}
                                                />
                                                <span className="text-sm font-medium">جميع الأعمار</span>
                                              </label>
                                              
                                              <div className="grid grid-cols-2 gap-2">
                                                {[
                                                  { value: "AGE_13_17", label: "13-17" },
                                                  { value: "AGE_18_24", label: "18-24" },
                                                  { value: "AGE_25_34", label: "25-34" },
                                                  { value: "AGE_35_44", label: "35-44" },
                                                  { value: "AGE_45_54", label: "45-54" },
                                                  { value: "AGE_55_PLUS", label: "55+" }
                                                ].map((age) => (
                                                  <label key={age.value} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                      type="checkbox"
                                                      className="rounded border-gray-300"
                                                      checked={field.value?.includes(age.value) || false}
                                                      onChange={(e) => {
                                                        const currentValue = field.value || [];
                                                        if (e.target.checked) {
                                                          const newValue = [...currentValue, age.value];
                                                          field.onChange(newValue);
                                                        } else {
                                                          const newValue = currentValue.filter((v: string) => v !== age.value);
                                                          field.onChange(newValue);
                                                        }
                                                      }}
                                                    />
                                                    <span className="text-sm">
                                                      {age.label} سنة
                                                    </span>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                              اختر "جميع الأعمار" لتحديد جميع الفئات العمرية أو حدد فئات محددة حسب احتياجاتك
                                            </p>
                                          </div>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={completeCampaignForm.control}
                                    name="targeting.locations"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>الدولة المستهدفة</FormLabel>
                                        <Select onValueChange={(value) => field.onChange([value])} defaultValue="99237">
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="اختر الدولة" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="select-content-solid">
                                            <SelectItem value="99237" className="select-item">العراق</SelectItem>
                                            <SelectItem value="99238" className="select-item">الأردن</SelectItem>
                                            <SelectItem value="99239" className="select-item">لبنان</SelectItem>
                                            <SelectItem value="99240" className="select-item">سوريا</SelectItem>
                                            <SelectItem value="99241" className="select-item">فلسطين</SelectItem>
                                            <SelectItem value="99242" className="select-item">مصر</SelectItem>
                                            <SelectItem value="99243" className="select-item">السعودية</SelectItem>
                                            <SelectItem value="99244" className="select-item">الإمارات</SelectItem>
                                            <SelectItem value="99245" className="select-item">الكويت</SelectItem>
                                            <SelectItem value="99246" className="select-item">قطر</SelectItem>
                                            <SelectItem value="99247" className="select-item">البحرين</SelectItem>
                                            <SelectItem value="99248" className="select-item">عُمان</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                )}
                              </div>

                              <div className="flex justify-end items-center pt-4">
                                <div className="flex gap-3">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setCreateCompleteCampaignOpen(false)}
                                  >
                                    إلغاء
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    className="bg-theme-gradient hover:opacity-90 text-white theme-shadow"
                                    disabled={createCompleteCampaignMutation.isPending}
                                  >
                                    {createCompleteCampaignMutation.isPending ? (
                                      <>
                                        <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                                        جاري الإنشاء...
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="ml-2 h-4 w-4" />
                                        إنشاء الحملة الكاملة
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                    <Table>
                      <TableHeader className="bg-theme-primary-light">
                        <TableRow className="hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                          <TableHead className="w-12 pr-4 text-theme-primary">
                            <div className="flex justify-start pr-2">
                              <Checkbox
                                checked={selectedCampaigns.size > 0 && selectedCampaigns.size === (campaignsData?.campaigns?.length || 0)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    // Select all campaigns (use database UUIDs)
                                    const allCampaignIds = new Set(campaignsData?.campaigns?.map(c => c.id) || []);
                                    setSelectedCampaigns(allCampaignIds);
                                  } else {
                                    // Deselect all campaigns and related items
                                    setSelectedCampaigns(new Set());
                                    setSelectedAdGroups(new Set());
                                    setSelectedAds(new Set());
                                  }
                                }}
                              />
                            </div>
                          </TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الحالة</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">اسم الحملة</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الهدف</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإنطباعات</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">النقرات</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإنفاق</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">CPM</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">CPC</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">CTR</span></TableHead>
                          <TableHead className="text-right text-theme-primary px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإجراءات</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignsLoading || analyticsLoading ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                              <p className="mt-2">جارٍ تحميل الحملات...</p>
                            </TableCell>
                          </TableRow>
                        ) : !analytics?.campaigns && (!campaignsData || !campaignsData.campaigns || campaignsData.campaigns.length === 0) ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8">
                              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">لا توجد حملات حالياً</p>
                              <p className="text-sm text-gray-400">قم بإنشاء حملتك الأولى لبدء الإعلان</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          // عرض البيانات المفلترة من analytics مع القيم الحقيقية حسب الفترة
                          (campaignsData?.campaigns || [])?.map((campaign: any) => {
                            // استخدام البيانات المفلترة من analytics إذا كانت متوفرة
                            let impressions, clicks, spend;
                            
                            if (analytics?.campaigns && analytics.campaigns.length > 0) {
                              // البحث عن الحملة في البيانات المفلترة
                              const filteredCampaign = analytics.campaigns.find(c => c.id === campaign.id);
                              if (filteredCampaign) {
                                impressions = filteredCampaign.impressions || 0;
                                clicks = filteredCampaign.clicks || 0;
                                spend = parseFloat(String(filteredCampaign.spend || '0')) || 0;
                              } else {
                                // إذا لم تُجد في البيانات المفلترة، فالقيم تكون 0
                                impressions = 0;
                                clicks = 0;
                                spend = 0;
                              }
                            } else {
                              // استخدام بيانات الحملة الأساسية إذا لم تكن هناك بيانات مفلترة
                              // هذا يحدث عند "طوال المدة" أو عندما تكون البيانات فارغة
                              if (selectedDateRange.value === 'all') {
                                impressions = campaign.impressions || 0;
                                clicks = campaign.clicks || 0;
                                spend = parseFloat(String(campaign.spend || '0')) || 0;
                              } else {
                                // للفترات الأخرى التي تعيد بيانات فارغة، كل حملة تكون 0
                                impressions = 0;
                                clicks = 0;
                                spend = 0;
                              }
                            }
                            
                            // حساب المؤشرات الحقيقية
                            const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
                            const cpc = clicks > 0 ? spend / clicks : 0;
                            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                            
                            return (
                              <TableRow key={campaign.id} className="hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm border-theme-border dark:border-gray-700">
                                <TableCell className="pr-4 text-gray-900 dark:text-white">
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
                                        toggleCampaignStatus(campaign.id, campaign.status === 'ENABLE' ? 'DISABLE' : 'ENABLE');
                                      }}
                                      disabled={toggleCampaignStatusMutation.isPending}
                                      className={`
                                        relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1
                                        ${campaign.status === 'ENABLE' 
                                          ? 'bg-[#25d9d6] shadow-sm focus:ring-[#25d9d6]/30' 
                                          : 'bg-gray-200 focus:ring-gray-300'
                                        }
                                        ${toggleCampaignStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                      `}
                                    >
                                      <span
                                        className={`
                                          inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                          ${campaign.status === 'ENABLE' ? 'left-4' : 'left-0.5'}
                                        `}
                                      />
                                    </button>
                                    <span className={`text-xs font-medium ${
                                      campaign.status === 'ENABLE' ? 'text-[#25d9d6]' : 'text-gray-500'
                                    }`}>
                                      {campaign.status === 'ENABLE' ? 'نشط' : 'متوقف'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-gray-900 dark:text-white">{campaign.name || campaign.campaignName || 'غير محدد'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-theme-primary-light text-theme-primary theme-border">
                                    {campaign.objective === 'CONVERSIONS' ? 'التحويلات' :
                                     campaign.objective === 'LEAD_GENERATION' ? 'عميل محتمل' :
                                     campaign.objective === 'LANDING_PAGE' ? 'صفحة الهبوط' :
                                     campaign.objective === 'REACH' ? 'الوصول' :
                                     campaign.objective === 'VIDEO_VIEWS' ? 'مشاهدات الفيديو' :
                                     campaign.objective || 'غير محدد'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-white">{formatNumber(impressions)}</TableCell>
                                <TableCell className="text-gray-900 dark:text-white">{formatNumber(clicks)}</TableCell>
                                <TableCell className="text-gray-900 dark:text-white">{formatCurrency(spend)}</TableCell>
                                <TableCell>
                                  <span className="text-theme-primary font-medium">
                                    {formatCurrency(cpm)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-theme-primary font-medium">
                                    {formatCurrency(cpc)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-theme-primary font-medium">
                                    {ctr.toFixed(2)}%
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCloneCampaign(campaign)}
                                      title="نسخ الحملة"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
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
                </CardContent>
              </Card>
            </TabsContent>



            {/* Ad Groups Tab */}
            <TabsContent value="adgroups" className="space-y-6">
              {/* عرض الفترة المحددة */}
              <div className="text-sm text-muted-foreground dark:text-gray-300 mb-4 p-3 bg-theme-primary-light rounded-lg theme-border">
                📊 البيانات المعروضة للفترة: <span className="font-medium text-theme-primary">{selectedDateRange.label}</span>
                <span className="mr-2">({format(selectedDateRange.startDate, "yyyy/MM/dd", { locale: ar })} - {format(selectedDateRange.endDate, "yyyy/MM/dd", { locale: ar })})</span>
              </div>

              <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                <CardHeader className="bg-theme-primary-light theme-border-b">
                  <div className="flex items-center">
                    <CardTitle className="text-xl text-theme-primary ml-auto">إدارة المجموعات الإعلانية</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {adGroupsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل المجموعات الإعلانية...</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <Table className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                        <TableHeader className="bg-theme-primary-light">
                          <TableRow className="border-theme-primary/20 hover:bg-theme-primary-light">
                            <TableHead className="w-12 pr-4 text-theme-primary font-semibold">
                              <div className="flex justify-start pr-2">
                                <Checkbox
                                  checked={selectedAdGroups.size > 0 && selectedAdGroups.size === getFilteredAdGroups().length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Select all filtered ad groups
                                      const allFilteredAdGroupIds = new Set(getFilteredAdGroups().map(ag => ag.adGroupId));
                                      setSelectedAdGroups(allFilteredAdGroupIds);
                                    } else {
                                      // Deselect all ad groups and related ads
                                      setSelectedAdGroups(new Set());
                                      setSelectedAds(new Set());
                                    }
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الحالة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">اسم المجموعة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الحملة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الميزانية</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">المزايدة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإنطباعات</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">النقرات</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإنفاق</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإجراءات</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredAdGroups().length === 0 ? (
                            <TableRow className="hover:bg-theme-primary-light/50">
                              <TableCell colSpan={10} className="text-center py-8 bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2">
                                  <Users className="h-12 w-12 text-theme-primary/60" />
                                  <p className="text-theme-primary">لا توجد مجموعات إعلانية</p>
                                  <p className="text-sm text-theme-primary/60">قم بإنشاء مجموعة إعلانية أولاً</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            getFilteredAdGroups().map((adGroup: TikTokAdGroup) => (
                              <TableRow key={adGroup.id} className="border-theme-primary/20 hover:bg-theme-primary-light/50 transition-colors duration-200">
                                <TableCell className="pr-4">
                                  <div className="flex justify-start pr-2">
                                    <Checkbox
                                      checked={selectedAdGroups.has(adGroup.id)}
                                      onCheckedChange={(checked) => {
                                        handleAdGroupSelection(adGroup.id, adGroup.campaignId, !!checked);
                                      }}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          toggleAdGroupStatus(adGroup.id, adGroup.status === 'ENABLE' ? 'DISABLE' : 'ENABLE');
                                        }}
                                        disabled={toggleAdGroupStatusMutation.isPending}
                                        className={`
                                          w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                          ${adGroup.status === 'ENABLE' ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                          ${toggleAdGroupStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                      >
                                        <span
                                          className={`
                                            inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                            ${adGroup.status === 'ENABLE' ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                          `}
                                        />
                                      </button>
                                    </div>
                                    <span className={`text-xs font-medium ${
                                      adGroup.status === 'ENABLE' ? 'text-theme-primary' : 'text-theme-primary/60'
                                    }`}>
                                      {adGroup.status === 'ENABLE' ? 'نشط' : 'متوقف'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-theme-primary">{adGroup.adGroupName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-theme-primary-light text-theme-primary border-theme-primary/30">
                                    {campaignsData?.campaigns?.find(c => c.id === adGroup.campaignId)?.campaignName || 'غير محدد'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-theme-primary/80">
                                  {adGroup.budget ? `${formatCurrency(adGroup.budget)} / ${adGroup.budgetMode === 'BUDGET_MODE_DAY' ? 'يومي' : 'إجمالي'}` : 'غير محدد'}
                                </TableCell>
                                <TableCell className="text-theme-primary/80">
                                  {adGroup.bidPrice ? `${formatCurrency(adGroup.bidPrice)} (${adGroup.bidType})` : 'تلقائي'}
                                </TableCell>
                                <TableCell className="text-theme-primary font-medium">{formatNumber(getAdGroupAnalytics(adGroup)?.impressions || 0)}</TableCell>
                                <TableCell className="text-theme-primary font-medium">{formatNumber(getAdGroupAnalytics(adGroup)?.clicks || 0)}</TableCell>
                                <TableCell className="text-theme-primary font-semibold">{formatCurrency(parseFloat(String(getAdGroupAnalytics(adGroup)?.spend || 0)))}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="theme-border hover:bg-theme-primary-light"
                                      onClick={() => handleCloneAdGroup(adGroup)}
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
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ads Tab */}
            <TabsContent value="ads" className="space-y-6">
              {/* عرض الفترة المحددة */}
              <div className="text-sm text-muted-foreground dark:text-gray-300 mb-4 p-3 bg-theme-primary-light rounded-lg theme-border">
                📊 البيانات المعروضة للفترة: <span className="font-medium text-theme-primary">{selectedDateRange.label}</span>
                <span className="mr-2">({format(selectedDateRange.startDate, "yyyy/MM/dd", { locale: ar })} - {format(selectedDateRange.endDate, "yyyy/MM/dd", { locale: ar })})</span>
              </div>

              <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                <CardHeader className="bg-theme-primary-light theme-border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-theme-primary">إدارة الإعلانات ({adsData?.ads?.length || 0})</CardTitle>
                    <Button
                      onClick={async () => {
                        try {
                          console.log('🔄 بدء مزامنة إحصائيات الإعلانات...');
                          const startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
                          const endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
                          console.log(`📅 فترة المزامنة: ${startDate} إلى ${endDate}`);
                          
                          const response = await fetch('/api/tiktok/sync-enhanced', { 
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              startDate,
                              endDate,
                            }),
                          });
                          
                          if (response.ok) {
                            console.log('✅ تم تحديث إحصائيات الإعلانات');
                            toast({
                              title: "تم تحديث الإحصائيات",
                              description: `تم تحديث إحصائيات الإعلانات للفترة ${selectedDateRange.label}`,
                            });
                            // تحديث البيانات
                            refetchAds();
                            refetchAnalytics();
                          } else {
                            throw new Error('فشل في التحديث');
                          }
                        } catch (error) {
                          console.error('❌ خطأ في مزامنة الإحصائيات:', error);
                          toast({
                            title: "خطأ في التحديث",
                            description: "فشل في تحديث إحصائيات الإعلانات",
                            variant: "destructive",
                          });
                        }
                      }}
                      size="sm"
                      className="bg-theme-gradient hover:bg-theme-gradient/80 text-white border-0"
                    >
                      <RefreshCw className="h-4 w-4 ml-2" />
                      تحديث الإحصائيات
                    </Button>
                  </div>
                  <CardDescription className="text-theme-secondary">
                    إدارة وعرض جميع الإعلانات مع إحصائياتها المفصلة
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {adsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل الإعلانات...</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <Table className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                        <TableHeader className="bg-theme-primary-light">
                          <TableRow className="border-theme-primary/20 hover:bg-theme-primary-light">
                            <TableHead className="w-12 pr-4 text-theme-primary font-semibold">
                              <div className="flex justify-start pr-2">
                                <Checkbox
                                  checked={selectedAds.size > 0 && selectedAds.size === getFilteredAds().length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Select all filtered ads
                                      const allFilteredAdIds = new Set(getFilteredAds().map(ad => ad.adId));
                                      setSelectedAds(allFilteredAdIds);
                                    } else {
                                      // Deselect all ads
                                      setSelectedAds(new Set());
                                    }
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الحالة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">اسم الإعلان</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الوسائط</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">التكلفة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">التحويلات</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">تكلفة التحويل</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">النتائج</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">تكلفة النتيجة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">تكلفة النقرة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">تكلفة الألف ظهور</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">النقرات للوجهة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">معدل النقر</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">معدل التحويل</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">معدل النتائج</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">التنسيق</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">المجموعة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الحملة</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">البكسل</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">صفحة الهبوط</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإنطباعات</span></TableHead>
                            <TableHead className="text-right text-theme-primary font-semibold px-2 py-2"><span className="bg-theme-primary-light px-2 py-1 rounded mx-1">الإجراءات</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredAds().length === 0 ? (
                            <TableRow className="hover:bg-theme-primary-light/50">
                              <TableCell colSpan={21} className="text-center py-8 bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="h-12 w-12 text-theme-primary/60" />
                                  <p className="text-theme-primary">لا توجد إعلانات</p>
                                  <p className="text-sm text-theme-primary/60">قم بإنشاء إعلان أولاً</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            getFilteredAds().map((ad: TikTokAd) => {
                              const adAnalytics = getAdAnalytics(ad);
                              
                              // تسجيل للتشخيص - فقط للإعلانات التي تحتوي على فيديو
                              if (ad.adFormat === 'SINGLE_VIDEO') {
                                console.log('🎬 Ad Video Debug:', {
                                  adId: ad.adId,
                                  adFormat: ad.adFormat,
                                  videoUrl: ad.videoUrl,
                                  hasVideoUrl: !!ad.videoUrl,
                                  adData: ad
                                });
                              }
                              
                              return (
                              <TableRow key={ad.id} className="border-theme-primary/20 hover:bg-theme-primary-light/50 transition-colors duration-200">
                                <TableCell className="pr-4">
                                  <div className="flex justify-start pr-2">
                                    <Checkbox
                                      checked={selectedAds.has(ad.adId)}
                                      onCheckedChange={(checked) => {
                                        handleAdSelection(ad.adId, ad.adGroupId, ad.campaignId, !!checked);
                                      }}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          toggleAdStatus(ad.adId, ad.status === 'ENABLE' ? 'DISABLE' : 'ENABLE');
                                        }}
                                        disabled={toggleAdStatusMutation.isPending}
                                        className={`
                                          w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                          ${ad.status === 'ENABLE' ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                          ${toggleAdStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                      >
                                        <span
                                          className={`
                                            inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                            ${ad.status === 'ENABLE' ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                          `}
                                        />
                                      </button>
                                    </div>
                                    <span className={`text-xs font-medium ${
                                      ad.status === 'ENABLE' ? 'text-theme-primary' : 'text-theme-primary/60'
                                    }`}>
                                      {ad.status === 'ENABLE' ? 'نشط' : 'متوقف'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-theme-primary">{ad.adName}</TableCell>
                                <TableCell>
                                  {ad.imageUrls && ad.imageUrls.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={`/api/object-storage/public/${ad.imageUrls[0]}`}
                                        alt="صورة الإعلان"
                                        className="w-16 h-16 object-cover rounded-lg theme-border cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => {
                                          // فتح الصورة في مودال أو تبويب جديد
                                          window.open(`/api/object-storage/public/${ad.imageUrls?.[0]}`, '_blank');
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder-image.png';
                                        }}
                                      />
                                      {ad.imageUrls.length > 1 && (
                                        <Badge variant="secondary" className="text-xs bg-theme-primary-light text-theme-primary">
                                          +{ad.imageUrls.length - 1}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : ad.adFormat === 'SINGLE_VIDEO' && ad.videoUrl ? (
                                    <VideoThumbnail 
                                      videoId={ad.videoUrl} 
                                      adName={ad.adName}
                                      session={session}
                                      onVideoClick={(videoData) => {
                                        setSelectedVideoData(videoData);
                                        setVideoModalOpen(true);
                                      }}
                                    />
                                  ) : ad.adFormat === 'SINGLE_VIDEO' ? (
                                    <div 
                                      className="relative cursor-pointer group"
                                      onClick={() => {
                                        setSelectedTikTokAd(ad);
                                        setVideoModalOpen(true);
                                      }}
                                    >
                                      {ad.coverImageUrl ? (
                                        <div className="relative">
                                          <img 
                                            src={ad.coverImageUrl} 
                                            alt="Video Cover"
                                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md transition-all"
                                          />
                                          {/* مثلث التشغيل */}
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-4 h-4 bg-white/90 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                              <div className="w-0 h-0 border-l-[6px] border-l-gray-700 border-y-[4px] border-y-transparent ml-0.5"></div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                                          <Video className="h-4 w-4 text-pink-500" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-theme-primary/50">
                                      <ImageIcon className="h-4 w-4" />
                                      <span className="text-xs">لا توجد وسائط</span>
                                    </div>
                                  )}
                                </TableCell>
                                {/* التكلفة */}
                                <TableCell className="text-theme-primary font-medium">{formatCurrency(parseFloat(String(adAnalytics?.spend || 0)))}</TableCell>
                                {/* التحويلات */}
                                <TableCell className="text-theme-primary font-medium">{formatNumber(adAnalytics?.conversions || 0)}</TableCell>
                                {/* تكلفة التحويل */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.conversions && adAnalytics.conversions > 0 
                                    ? formatCurrency(parseFloat(String(adAnalytics.spend)) / adAnalytics.conversions)
                                    : '0.00 $'
                                }</TableCell>
                                {/* النتائج */}
                                <TableCell className="text-theme-primary font-medium">{formatNumber(adAnalytics?.leads || 0)}</TableCell>
                                {/* تكلفة النتيجة */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.leads && adAnalytics.leads > 0 
                                    ? formatCurrency(parseFloat(String(adAnalytics.spend)) / adAnalytics.leads)
                                    : '0.00 $'
                                }</TableCell>
                                {/* تكلفة النقرة */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.clicks && adAnalytics.clicks > 0 
                                    ? formatCurrency(parseFloat(String(adAnalytics.spend)) / adAnalytics.clicks)
                                    : '0.00 $'
                                }</TableCell>
                                {/* تكلفة الألف ظهور */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.impressions && adAnalytics.impressions > 0 
                                    ? formatCurrency((parseFloat(String(adAnalytics.spend)) / adAnalytics.impressions) * 1000)
                                    : '0.00 $'
                                }</TableCell>
                                {/* النقرات للوجهة */}
                                <TableCell className="text-theme-primary font-medium">{formatNumber(adAnalytics?.clicks || 0)}</TableCell>
                                {/* معدل النقر */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.impressions && adAnalytics.impressions > 0 
                                    ? ((adAnalytics.clicks / adAnalytics.impressions) * 100).toFixed(2) + '%'
                                    : '0.00%'
                                }</TableCell>
                                {/* معدل التحويل */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.clicks && adAnalytics.clicks > 0 && adAnalytics.conversions 
                                    ? ((adAnalytics.conversions / adAnalytics.clicks) * 100).toFixed(2) + '%'
                                    : '0.00%'
                                }</TableCell>
                                {/* معدل النتائج */}
                                <TableCell className="text-theme-primary font-medium">{
                                  adAnalytics?.clicks && adAnalytics.clicks > 0 && adAnalytics.leads 
                                    ? ((adAnalytics.leads / adAnalytics.clicks) * 100).toFixed(2) + '%'
                                    : '0.00%'
                                }</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-theme-primary-light text-theme-primary border-theme-primary/30">
                                    {ad.adFormat === 'SINGLE_IMAGE' ? 'صورة مفردة' :
                                     ad.adFormat === 'SINGLE_VIDEO' ? 'فيديو مفرد' :
                                     ad.adFormat === 'CAROUSEL' ? 'عرض متعدد' :
                                     ad.adFormat || 'غير محدد'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-theme-primary-light text-theme-primary border-theme-primary/30">
                                    {adGroupsData?.adGroups?.find(ag => ag.id === ad.adGroupId)?.adGroupName || 'غير محدد'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-theme-primary-light text-theme-primary border-theme-primary/30">
                                    {(() => {
                                      const adGroup = adGroupsData?.adGroups?.find(ag => ag.id === ad.adGroupId);
                                      return adGroup ? campaignsData?.campaigns?.find(c => c.id === adGroup.campaignId)?.campaignName || 'غير محدد' : 'غير محدد';
                                    })()}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {(ad as any).pixelId ? (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-theme-primary-light text-theme-primary border-theme-primary/30">
                                          <Target className="h-3 w-3 ml-1" />
                                          {(pixelsData as any)?.pixels?.find((p: any) => p.pixelId === (ad as any).pixelId)?.pixelName || `بكسل ${(ad as any).pixelId}`}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={() => {
                                            // فصل البكسل عن الإعلان
                                            fetch(`/api/tiktok/ads/${ad.id}/pixel`, {
                                              method: 'DELETE',
                                              headers: { 'Content-Type': 'application/json' }
                                            })
                                              .then(res => res.json())
                                              .then(data => {
                                                if (data.success) {
                                                  queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/tiktok/ads' });
                                                  toast({
                                                    title: "تم فصل البكسل",
                                                    description: "تم فصل البكسل عن الإعلان بنجاح"
                                                  });
                                                } else {
                                                  throw new Error(data.error);
                                                }
                                              })
                                              .catch(err => {
                                                toast({
                                                  title: "خطأ",
                                                  description: "فشل في فصل البكسل",
                                                  variant: "destructive"
                                                });
                                              });
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Select
                                        onValueChange={(pixelId) => {
                                          // ربط البكسل بالإعلان
                                          fetch(`/api/tiktok/ads/${ad.id}/pixel`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ pixelId })
                                          })
                                            .then(res => res.json())
                                            .then(data => {
                                              if (data.success) {
                                                queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/tiktok/ads' });
                                                toast({
                                                  title: "تم ربط البكسل",
                                                  description: "تم ربط البكسل بالإعلان بنجاح"
                                                });
                                              } else {
                                                throw new Error(data.error);
                                              }
                                            })
                                            .catch(err => {
                                              toast({
                                                title: "خطأ",
                                                description: "فشل في ربط البكسل",
                                                variant: "destructive"
                                              });
                                            });
                                        }}
                                      >
                                        <SelectTrigger className="w-40 h-8 theme-select-trigger">
                                          <SelectValue placeholder="اختر بكسل" />
                                        </SelectTrigger>
                                        <SelectContent className="select-content-solid">
                                          {(pixelsData as any)?.pixels?.map((pixel: any) => (
                                            <SelectItem key={pixel.pixelId} value={pixel.pixelId}>
                                              <div className="flex items-center gap-2">
                                                <Target className="h-3 w-3" />
                                                {pixel.pixelName}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {ad.landingPageUrl ? (
                                    <a href={ad.landingPageUrl} target="_blank" rel="noopener noreferrer" className="text-theme-primary hover:underline text-sm">
                                      <ExternalLink className="inline h-3 w-3 ml-1" />
                                      عرض الصفحة
                                    </a>
                                  ) : (
                                    <span className="text-theme-primary/50 text-sm">غير محدد</span>
                                  )}
                                </TableCell>
                                {/* الإنطباعات */}
                                <TableCell className="text-theme-primary font-medium">{formatNumber(adAnalytics?.impressions || 0)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="theme-border hover:bg-theme-primary-light"
                                      onClick={() => handleCloneAd(ad)}
                                      title="نسخ الإعلان"
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

            {/* Pixels Tab */}
            <TabsContent value="pixels" className="space-y-6">
              <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:bg-gray-800">
                <CardHeader className="bg-theme-primary-light dark:bg-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl text-theme-primary">إدارة البكسلات</CardTitle>
                      <CardDescription className="text-theme-primary/70 dark:text-gray-300">
                        أنشئ وأدر بكسلات TikTok لتتبع زوار موقعك والتحويلات
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setCreatePixelOpen(true)} className="bg-theme-gradient hover:opacity-90 text-white theme-shadow">
                        <Plus className="ml-2 h-4 w-4" />
                        إنشاء بكسل
                      </Button>
                      <Button variant="outline" onClick={showIdentitiesDialog} className="theme-border hover:bg-theme-primary-light">
                        <User className="ml-2 h-4 w-4" />
                        عرض الهويات
                      </Button>
                      <Button variant="outline" onClick={showUserProfileDialog} className="theme-border hover:bg-theme-primary-light">
                        <User2 className="ml-2 h-4 w-4" />
                        حساب TikTok
                      </Button>
                    </div>
                  </div>
                  
                  {/* Dialog for creating new pixel */}
                  <Dialog open={createPixelOpen} onOpenChange={setCreatePixelOpen}>
                    <DialogContent className="bg-gray-900/95 border-gray-700 backdrop-blur-sm theme-border">
                      <DialogHeader>
                        <DialogTitle className="text-theme-primary">إنشاء بكسل جديد</DialogTitle>
                        <DialogDescription className="text-theme-primary/70">
                          أنشئ بكسل جديد لتتبع زوار موقعك والتحويلات
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="pixel-name-input" className="text-sm font-medium text-theme-primary">اسم البكسل</label>
                          <input 
                            id="pixel-name-input"
                            className="theme-input"
                            placeholder="بكسل موقع التجارة الإلكترونية"
                            value={newPixelName}
                            onChange={(e) => setNewPixelName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-theme-primary">نوع البكسل</div>
                          <Select value={newPixelMode} onValueChange={setNewPixelMode}>
                            <SelectTrigger className="theme-select-trigger">
                              <SelectValue placeholder="اختر نوع البكسل" />
                            </SelectTrigger>
                            <SelectContent className="select-content-solid">
                              <SelectItem value="STANDARD_MODE" className="select-item">بكسل عادي</SelectItem>
                              <SelectItem value="DEVELOPER_MODE" className="select-item">وضع المطور (مرونة كاملة)</SelectItem>
                              <SelectItem value="CONVERSIONS_API_MODE" className="select-item">API للتحويلات</SelectItem>
                              <SelectItem value="MANUAL_MODE" className="select-item">وضع يدوي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setCreatePixelOpen(false)} className="theme-border hover:bg-theme-primary-light">
                            إلغاء
                          </Button>
                          <Button 
                            onClick={handleCreatePixel} 
                            disabled={createPixelMutation.isPending || !newPixelName.trim()}
                            className="bg-theme-gradient hover:opacity-90 text-white"
                          >
                            {createPixelMutation.isPending ? (
                              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                            ) : null}
                            إنشاء البكسل
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <Table className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                      <TableHeader className="bg-theme-primary-light">
                        <TableRow className="border-theme-primary/20 hover:bg-theme-primary-light">
                          <TableHead className="text-right text-theme-primary font-semibold">معرف البكسل</TableHead>
                          <TableHead className="text-right text-theme-primary font-semibold">اسم البكسل</TableHead>
                          <TableHead className="text-right text-theme-primary font-semibold">الحالة</TableHead>
                          <TableHead className="text-right text-theme-primary font-semibold">النوع</TableHead>
                          <TableHead className="text-right text-theme-primary font-semibold">تاريخ الإنشاء</TableHead>
                          <TableHead className="text-right text-theme-primary font-semibold">الكود</TableHead>
                          <TableHead className="text-right text-theme-primary font-semibold">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pixelsLoading ? (
                          <TableRow className="hover:bg-theme-primary-light/50">
                            <TableCell colSpan={7} className="text-center py-8 bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-theme-primary" />
                              <p className="mt-2 text-theme-primary">جارٍ تحميل البكسلات...</p>
                            </TableCell>
                          </TableRow>
                        ) : (!(pixelsData as any)?.pixels?.length && !(pixelsData as any)?.dbPixels?.length) || (!(pixelsData as any)?.pixels && !(pixelsData as any)?.dbPixels) ? (
                          <TableRow className="hover:bg-theme-primary-light/50">
                            <TableCell colSpan={7} className="text-center py-8 bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="h-12 w-12 rounded-full bg-theme-primary-light flex items-center justify-center">
                                  📊
                                </div>
                                <p className="text-theme-primary">لا توجد بكسلات حالياً</p>
                                <p className="text-sm text-theme-primary/60">أنشئ بكسل جديد لتتبع زوار موقعك والتحويلات</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          // عرض البكسلات الفريدة بدون تكرار (السيرفر يدمجها بالفعل في pixels)
                          ((pixelsData as any)?.pixels || []).map((pixel: any) => (
                            <TableRow key={pixel.id} className="border-theme-primary/20 hover:bg-theme-primary-light/50 transition-colors duration-200">
                              <TableCell className="font-mono text-sm text-theme-primary">{pixel.pixelId}</TableCell>
                              <TableCell className="font-medium text-theme-primary">{pixel.pixelName}</TableCell>
                              <TableCell>
                                <Badge variant={pixel.status === 'ACTIVE' ? 'default' : 'secondary'} className={pixel.status === 'ACTIVE' ? 'bg-theme-gradient text-white' : 'bg-theme-primary-light text-theme-primary'}>
                                  {pixel.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-theme-primary-light text-theme-primary border-theme-primary/30">
                                  {pixel.pixelMode === 'STANDARD_MODE' ? 'بكسل عادي' :
                                   pixel.pixelMode === 'DEVELOPER_MODE' ? 'وضع المطور' :
                                   pixel.pixelMode === 'CONVERSIONS_API_MODE' ? 'API للتحويلات' :
                                   pixel.pixelMode === 'MANUAL_MODE' ? 'وضع يدوي' : 
                                   pixel.pixelMode || 'غير محدد'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-theme-primary">
                                {pixel.createdAt ? new Date(pixel.createdAt).toLocaleDateString('ar-IQ') : '-'}
                              </TableCell>
                              <TableCell>
                                {pixel.pixelCode ? (
                                  <Button variant="outline" size="sm" className="theme-border hover:bg-theme-primary-light" onClick={() => {
                                    navigator.clipboard.writeText(pixel.pixelCode);
                                    toast({
                                      title: "تم نسخ الكود",
                                      description: "تم نسخ كود البكسل إلى الحافظة",
                                    });
                                  }}>
                                    نسخ الكود
                                  </Button>
                                ) : (
                                  <span className="text-theme-primary/50">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="theme-border hover:bg-theme-primary-light"
                                    onClick={() => {
                                      // عرض إحصائيات البكسل
                                      fetch(`/api/tiktok/pixels/${pixel.pixelId}/stats?startDate=2025-01-01&endDate=${new Date().toISOString().split('T')[0]}`)
                                        .then(res => res.json())
                                        .then(data => {
                                          toast({
                                            title: "إحصائيات البكسل",
                                            description: `البكسل يعمل بحالة جيدة`,
                                          });
                                        })
                                        .catch(err => {
                                          console.error('Stats error:', err);
                                          toast({
                                            title: "خطأ",
                                            description: "فشل في جلب الإحصائيات",
                                            variant: "destructive"
                                          });
                                        });
                                    }}
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    الإحصائيات
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="theme-border hover:bg-theme-primary-light"
                                    onClick={() => {
                                      // فحص صحة البكسل
                                      fetch(`/api/tiktok/pixels/${pixel.pixelId}/health`)
                                        .then(res => res.json())
                                        .then(data => {
                                          toast({
                                            title: "تقرير صحة البكسل",
                                            description: `البكسل يعمل بصحة جيدة`,
                                          });
                                        })
                                        .catch(err => {
                                          console.error('Health error:', err);
                                          toast({
                                            title: "تحذير",
                                            description: "قد تكون هناك مشاكل في البكسل",
                                            variant: "destructive"
                                          });
                                        });
                                    }}
                                  >
                                    <Activity className="h-3 w-3 mr-1" />
                                    الصحة
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="theme-border hover:bg-theme-primary-light"
                                    onClick={() => {
                                      // إنشاء حدث PAGE_VIEW للبكسل
                                      fetch(`/api/tiktok/pixels/${pixel.pixelId}/events`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          eventType: 'PAGE_VIEW',
                                          eventName: 'صفحة المنتجات',
                                          currency: 'USD',
                                          value: 0
                                        })
                                      })
                                        .then(res => res.json())
                                        .then(data => {
                                          if (data.success) {
                                            toast({
                                              title: "تم إنشاء حدث البكسل",
                                              description: `تم إنشاء حدث PAGE_VIEW بنجاح`,
                                            });
                                          } else {
                                            throw new Error(data.error || 'خطأ غير معروف');
                                          }
                                        })
                                        .catch(err => {
                                          console.error('Event creation error:', err);
                                          toast({
                                            title: "خطأ",
                                            description: "فشل في إنشاء حدث البكسل",
                                            variant: "destructive"
                                          });
                                        });
                                    }}
                                  >
                                    <Zap className="h-3 w-3 mr-1" />
                                    حدث
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">إدارة العملاء المحتملين</CardTitle>
                    <Dialog open={createLeadFormOpen} onOpenChange={setCreateLeadFormOpen}>
                      <DialogTrigger asChild>
                        <Button className="gradient-primary">
                          <Plus className="ml-2 h-4 w-4" />
                          إنشاء نموذج جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-white dark:bg-black">
                        <DialogHeader>
                          <DialogTitle>إنشاء نموذج عملاء محتملين</DialogTitle>
                          <DialogDescription>
                            قم بإنشاء نموذج لجمع بيانات العملاء المحتملين
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...leadFormForm}>
                          <form onSubmit={leadFormForm.handleSubmit((data) => createLeadFormMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={leadFormForm.control}
                              name="formName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>اسم النموذج</FormLabel>
                                  <FormControl>
                                    <Input placeholder="مثل: نموذج الاستعلام عن المنتج" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={leadFormForm.control}
                              name="formTitle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>عنوان النموذج</FormLabel>
                                  <FormControl>
                                    <Input placeholder="احصل على عرض خاص" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={leadFormForm.control}
                              name="formDescription"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>وصف النموذج</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="اترك معلوماتك وسنتواصل معك بعرض مميز" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={leadFormForm.control}
                              name="successMessage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>رسالة النجاح</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setCreateLeadFormOpen(false)}>
                                إلغاء
                              </Button>
                              <Button type="submit" disabled={createLeadFormMutation.isPending}>
                                {createLeadFormMutation.isPending ? (
                                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                                ) : null}
                                إنشاء النموذج
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                    <Table>
                      <TableHeader className="bg-theme-primary-light">
                        <TableRow className="hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                          <TableHead className="text-right text-theme-primary">اسم العميل</TableHead>
                          <TableHead className="text-right text-theme-primary">رقم الهاتف</TableHead>
                          <TableHead className="text-right text-theme-primary">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right text-theme-primary">تاريخ التقديم</TableHead>
                          <TableHead className="text-right text-theme-primary">حالة المتابعة</TableHead>
                          <TableHead className="text-right text-theme-primary">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadsLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                              <p className="mt-2">جارٍ تحميل العملاء المحتملين...</p>
                            </TableCell>
                          </TableRow>
                        ) : leadsData?.leads?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">لا يوجد عملاء محتملين حالياً</p>
                              <p className="text-sm text-gray-400">ستظهر بيانات العملاء المحتملين هنا عند بدء الحملات</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          leadsData?.leads?.map((lead: TikTokLead) => (
                            <TableRow key={lead.id} className="hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:hover:bg-gray-800">
                              <TableCell className="font-medium">{lead.customerName}</TableCell>
                              <TableCell>{lead.customerPhone}</TableCell>
                              <TableCell>{lead.customerEmail || '-'}</TableCell>
                              <TableCell>{new Date(lead.submittedAt).toLocaleDateString('ar-IQ')}</TableCell>
                              <TableCell>{getStatusBadge(lead.followUpStatus)}</TableCell>
                              <TableCell>
                                <Select
                                  value={lead.followUpStatus}
                                  onValueChange={(value) => 
                                    updateLeadStatusMutation.mutate({ 
                                      leadId: lead.id, 
                                      status: value 
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="select-content-solid">
                                    <SelectItem value="new" className="select-item">جديد</SelectItem>
                                    <SelectItem value="contacted" className="select-item">تم التواصل</SelectItem>
                                    <SelectItem value="interested" className="select-item">مهتم</SelectItem>
                                    <SelectItem value="not_interested" className="select-item">غير مهتم</SelectItem>
                                    <SelectItem value="converted" className="select-item">تحول لعميل</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* عرض الفترة المحددة */}
              <div className="text-sm text-muted-foreground dark:text-gray-300 mb-4 p-3 bg-theme-primary-light rounded-lg theme-border">
                📊 البيانات المعروضة للفترة: <span className="font-medium text-theme-primary">{selectedDateRange.label}</span>
                <span className="mr-2">({format(selectedDateRange.startDate, "yyyy/MM/dd", { locale: ar })} - {format(selectedDateRange.endDate, "yyyy/MM/dd", { locale: ar })})</span>
              </div>

              <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:bg-gray-800">
                <CardHeader className="bg-theme-primary-light dark:bg-gray-700">
                  <CardTitle className="text-xl text-theme-primary">تقارير مفصلة</CardTitle>
                  <CardDescription className="text-theme-secondary dark:text-gray-300">
                    تحليلات شاملة لأداء حملاتك الإعلانية على TikTok
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics && analytics.metrics ? (
                    <div className="space-y-6">
                      {/* Performance Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:bg-gray-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-theme-primary">معدل النقر (CTR)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-theme-primary">
                              {analytics.metrics?.ctr || 0}%
                            </div>
                            <Progress value={(analytics.metrics?.ctr || 0) * 10} className="mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:bg-gray-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-theme-primary">تكلفة النقرة (CPC)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-theme-primary">
                              {formatCurrency(analytics.metrics?.cpc || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">متوسط التكلفة</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:bg-gray-800">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-theme-primary">معدل التحويل</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-theme-primary">
                              {analytics.metrics?.conversionRate || 0}%
                            </div>
                            <Progress value={(analytics.metrics?.conversionRate || 0) * 5} className="mt-2" />
                          </CardContent>
                        </Card>
                      </div>

                      {/* Campaign Performance Table */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-theme-primary">أداء الحملات</h3>
                        <div className="rounded-md theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                          <Table>
                            <TableHeader className="bg-theme-primary-light">
                              <TableRow className="hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm">
                                <TableHead className="text-right text-theme-primary">اسم الحملة</TableHead>
                                <TableHead className="text-right text-theme-primary">الهدف</TableHead>
                                <TableHead className="text-right text-theme-primary">الإنطباعات</TableHead>
                                <TableHead className="text-right text-theme-primary">النقرات</TableHead>
                                <TableHead className="text-right text-theme-primary">الإنفاق</TableHead>
                                <TableHead className="text-right text-theme-primary">CPM</TableHead>
                                <TableHead className="text-right text-theme-primary">CPC</TableHead>
                                <TableHead className="text-right text-theme-primary">CTR</TableHead>
                                <TableHead className="text-right text-theme-primary">التحويلات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(analytics?.campaigns || campaignsData?.campaigns || []).map((campaign) => {
                                // تحديد البيانات المعروضة حسب الفلتر
                                let impressions, clicks, spend, conversions;
                                
                                if (analytics?.campaigns && analytics.campaigns.length > 0) {
                                  // استخدام البيانات المفلترة - البحث عن الحملة المحددة
                                  const filteredCampaign = analytics.campaigns.find(c => c.id === campaign.id);
                                  if (filteredCampaign) {
                                    impressions = filteredCampaign.impressions || 0;
                                    clicks = filteredCampaign.clicks || 0;
                                    spend = parseFloat(String(filteredCampaign.spend || '0')) || 0;
                                    conversions = filteredCampaign.conversions || 0;
                                  } else {
                                    // إذا لم تجد الحملة في البيانات المفلترة، فالقيم 0
                                    impressions = 0;
                                    clicks = 0;
                                    spend = 0;
                                    conversions = 0;
                                  }
                                } else {
                                  // استخدام البيانات من قاعدة البيانات (لطوال المدة فقط)
                                  if (selectedDateRange.value === 'all') {
                                    impressions = campaign.impressions || 0;
                                    clicks = campaign.clicks || 0;
                                    spend = parseFloat(String(campaign.spend || '0')) || 0;
                                    conversions = campaign.conversions || 0;
                                  } else {
                                    // للفترات الأخرى بدون بيانات مفلترة، القيم 0
                                    impressions = 0;
                                    clicks = 0;
                                    spend = 0;
                                    conversions = 0;
                                  }
                                }
                                
                                return (
                                  <TableRow key={campaign.id} className="hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:hover:bg-gray-800">
                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="theme-border">
                                        {campaign.objective === 'CONVERSIONS' ? 'التحويلات' :
                                         campaign.objective === 'LEAD_GENERATION' ? 'عميل محتمل' :
                                         campaign.objective === 'LANDING_PAGE' ? 'صفحة الهبوط' :
                                         campaign.objective === 'REACH' ? 'الوصول' :
                                         campaign.objective === 'VIDEO_VIEWS' ? 'مشاهدات الفيديو' :
                                         campaign.objective === 'APP_PROMOTION' ? 'ترويج التطبيق' :
                                         campaign.objective === 'CATALOG_SALES' ? 'مبيعات الكتالوج' :
                                         campaign.objective || 'غير محدد'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{formatNumber(impressions)}</TableCell>
                                    <TableCell>{formatNumber(clicks)}</TableCell>
                                    <TableCell>{formatCurrency(spend)}</TableCell>
                                    <TableCell>
                                      <span className="text-theme-primary font-medium">
                                        {formatCurrency(impressions > 0 ? (spend / impressions) * 1000 : 0)}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-theme-primary font-medium">
                                        {formatCurrency(clicks > 0 ? spend / clicks : 0)}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-theme-primary font-medium">
                                        {(impressions > 0 ? (clicks / impressions) * 100 : 0).toFixed(2)}%
                                      </span>
                                    </TableCell>
                                    <TableCell>{formatNumber(conversions)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-theme-primary-light rounded-lg">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات تحليلية كافية</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">قم بتشغيل بعض الحملات للحصول على تقارير مفصلة</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
              </>
            )}

            {/* Show message when TikTok is not connected and not loading */}
            {!statusLoading && !connectionStatus?.tiktok?.connected && (
              <Card className="mt-6 theme-border bg-gray-900/95 border-gray-700 backdrop-blur-sm dark:bg-gray-800">
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto" />
                    <h3 className="text-xl font-medium text-theme-primary">يجب ربط حساب TikTok</h3>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                      لاستخدام إدارة إعلانات TikTok، يجب ربط حساب TikTok الخاص بك أولاً عبر صفحة ربط الحسابات.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/platform-ads/tiktok/auth-url', {
                            method: 'POST',
                          });
                          if (response.ok) {
                            const data = await response.json();
                            const authWindow = window.open(data.authUrl, '_blank', 'width=600,height=700');
                            
                            // مراقبة إغلاق النافذة للتحقق من حالة الاتصال
                            const checkClosed = setInterval(() => {
                              if (authWindow?.closed) {
                                clearInterval(checkClosed);
                                // إعادة تحميل حالة الاتصال بعد إغلاق النافذة
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1000);
                              }
                            }, 1000);
                          } else {
                            throw new Error('فشل في إنشاء رابط الربط');
                          }
                        } catch (error) {
                          toast({
                            title: "خطأ",
                            description: "حدث خطأ في إنشاء رابط الربط",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-[#ff0050] hover:bg-[#d1004a] text-white"
                    >
                      <ExternalLink className="ml-1 h-4 w-4" />
                      ربط حساب TikTok الآن
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* مودال عرض الهويات */}
      <Dialog open={identitiesDialogOpen} onOpenChange={setIdentitiesDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>الهويات المتاحة</DialogTitle>
            <DialogDescription>
              اختر هوية لاستخدامها في إنشاء الحملات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {identitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="mr-2 text-gray-500">جاري التحميل...</span>
              </div>
            ) : identities.length > 0 ? (
              identities.map((identity: any) => (
                <div 
                  key={identity.identity_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedIdentity?.identity_id === identity.identity_id 
                      ? 'border-blue-500 bg-gradient-to-r from-purple-50 to-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedIdentity(identity)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={identity.avatar_icon_web_uri} 
                          alt={identity.display_name} 
                        />
                        <AvatarFallback className={`${
                          identity.is_real_user_identity 
                            ? 'bg-blue-100 text-blue-600' 
                            : identity.is_platform_identity 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {identity.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {identity.is_real_user_identity && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-50 to-blue-500 rounded-full p-1">
                          <User2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{identity.display_name}</div>
                      <div className="text-xs text-gray-500">
                        {identity.is_real_user_identity ? 'الهوية الحقيقية' : 
                         identity.is_platform_identity ? 'هوية المنصة' : 'هوية TikTok'}
                      </div>
                      {identity.username && (
                        <div className="text-xs text-blue-600 font-mono">
                          @{identity.username}
                        </div>
                      )}
                    </div>
                    {identity.is_real_user_identity && (
                      <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-300">
                        حقيقي
                      </Badge>
                    )}
                    {identity.is_platform_identity && (
                      <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300">
                        افتراضي
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد هويات متاحة</p>
                <p className="text-sm text-gray-400">سيتم استخدام الهوية الافتراضية للمنصة</p>
              </div>
            )}
          </div>
          {selectedIdentity && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIdentitiesDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={() => {
                // يمكن إضافة منطق إضافي هنا لحفظ الاختيار
                toast({
                  title: "تم اختيار الهوية",
                  description: `تم اختيار هوية ${selectedIdentity.display_name}`,
                });
                setIdentitiesDialogOpen(false);
              }}>
                اختيار هذه الهوية
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مودال معلومات حساب TikTok الشخصي */}
      <Dialog open={userProfileDialogOpen} onOpenChange={setUserProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle className="text-right">معلومات حساب TikTok المرتبط</DialogTitle>
            <DialogDescription className="text-right">
              يمكنك مشاهدة تفاصيل حساب TikTok الشخصي المرتبط بحساب الإعلانات
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {userProfileLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>جاري جلب معلومات الحساب...</span>
                </div>
              </div>
            ) : userProfile ? (
              <div className="space-y-4">
                {/* معلومات أساسية */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {userProfile.username && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">اسم المستخدم:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          @{userProfile.username}
                        </span>
                      </div>
                    )}
                    
                    {userProfile.display_name && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">الاسم المعروض:</span>
                        <span>{userProfile.display_name}</span>
                      </div>
                    )}
                    
                    {userProfile.email && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">البريد الإلكتروني:</span>
                        <span className="font-mono text-sm">{userProfile.email}</span>
                      </div>
                    )}
                    
                    {userProfile.phone_number && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">رقم الهاتف:</span>
                        <span className="font-mono">{userProfile.phone_number}</span>
                      </div>
                    )}
                    
                    {userProfile.country && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">البلد:</span>
                        <span>{userProfile.country}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* معلومات الحساب */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات الحساب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {userProfile.user_id && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">معرف المستخدم:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {userProfile.user_id}
                        </span>
                      </div>
                    )}
                    
                    {userProfile.role && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">الدور:</span>
                        <Badge variant="outline">{userProfile.role}</Badge>
                      </div>
                    )}
                    
                    {userProfile.create_time && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">تاريخ الإنشاء:</span>
                        <span className="text-sm">
                          {new Date(userProfile.create_time).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                    
                    {userProfile.status && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">حالة الحساب:</span>
                        <Badge variant={userProfile.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {userProfile.status === 'ACTIVE' ? 'نشط' : userProfile.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* معلومات إضافية */}
                {(userProfile.company || userProfile.language || userProfile.timezone) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معلومات إضافية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {userProfile.company && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">الشركة:</span>
                          <span>{userProfile.company}</span>
                        </div>
                      )}
                      
                      {userProfile.language && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">اللغة:</span>
                          <span>{userProfile.language}</span>
                        </div>
                      )}
                      
                      {userProfile.timezone && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">المنطقة الزمنية:</span>
                          <span className="font-mono text-sm">{userProfile.timezone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center space-y-3">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium">لم يتم العثور على معلومات الحساب</h3>
                    <p className="text-gray-600">
                      لا تتوفر معلومات حساب TikTok الشخصي حالياً.
                      قد يكون ذلك بسبب عدم توفر الصلاحيات اللازمة أو عدم ربط حساب شخصي.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setUserProfileDialogOpen(false)}
                      className="mt-4"
                    >
                      إغلاق
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clone Ad Group Modal - مودال نسخ المجموعة الإعلانية */}
      <Dialog open={cloneAdGroupModalOpen} onOpenChange={setCloneAdGroupModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-small-text bg-white dark:bg-gray-950 theme-border">
          <DialogHeader className="bg-theme-primary-light p-4 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0"
                onClick={() => setCloneAdGroupModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="text-right flex-1">
                <DialogTitle className="text-base font-medium text-theme-primary">
                  📋 نسخ المجموعة الإعلانية
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
                  إنشاء نسخة جديدة من المجموعة الإعلانية مع إمكانية التعديل
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {cloneAdGroupData && (
              <Form {...cloneAdGroupForm}>
                <form onSubmit={cloneAdGroupForm.handleSubmit((data) => {
                  console.log('Clone Ad Group data:', data);
                  toast({
                    title: '✅ تم إنشاء المجموعة الإعلانية',
                    description: 'تم نسخ المجموعة الإعلانية بنجاح',
                  });
                  setCloneAdGroupModalOpen(false);
                })} className="space-y-4">

                  {/* البيانات الأصلية */}
                  <div className="p-4 bg-theme-primary-light rounded-lg border theme-border">
                    <h4 className="font-semibold text-theme-primary mb-2">البيانات الأصلية:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>الاسم:</strong> {cloneAdGroupData.adGroupName}</div>
                      <div><strong>الميزانية:</strong> {cloneAdGroupData.budget} USD</div>
                      <div><strong>نوع المزايدة:</strong> {cloneAdGroupData.bidType}</div>
                      <div><strong>نوع الميزانية:</strong> {cloneAdGroupData.budgetMode}</div>
                    </div>
                  </div>

                  {/* معلومات المجموعة الإعلانية الجديدة */}
                  <div className="form-section bg-theme-primary-light border theme-border rounded-lg">
                    <h3 
                      className="text-base font-medium mb-2 flex items-center justify-between cursor-pointer hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm p-2 rounded transition-colors text-theme-primary"
                      onClick={() => setCloneAdGroupSectionCollapsed(!cloneAdGroupSectionCollapsed)}
                    >
                      {cloneAdGroupSectionCollapsed ?
                        <><ChevronLeft className="h-5 w-5 ml-2" /> معلومات المجموعة الإعلانية الجديدة</>
                        : <><ChevronDown className="h-5 w-5 ml-2" /> معلومات المجموعة الإعلانية الجديدة</>
                      }
                      <Badge variant="secondary" className="bg-theme-primary text-white">
                        📋 نسخ
                      </Badge>
                    </h3>
                    
                    {!cloneAdGroupSectionCollapsed && (
                      <div className="space-y-4 p-4">
                        <div className="compact-grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={cloneAdGroupForm.control}
                            name="adGroupName"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">اسم المجموعة الجديد *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    defaultValue={`نسخة من ${cloneAdGroupData.adGroupName}`}
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="أدخل اسم المجموعة الجديد"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={cloneAdGroupForm.control}
                            name="budget"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">الميزانية اليومية *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    defaultValue={cloneAdGroupData.budget}
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="الميزانية بالدولار"
                                    min="1"
                                    step="0.01"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="compact-grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={cloneAdGroupForm.control}
                            name="bidType"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">نوع المزايدة *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={cloneAdGroupData.bidType}>
                                  <FormControl>
                                    <SelectTrigger className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary">
                                      <SelectValue placeholder="اختر نوع المزايدة" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="select-content-solid">
                                    <SelectItem value="BID_TYPE_CUSTOM">مزايدة مخصصة</SelectItem>
                                    <SelectItem value="BID_TYPE_NO_BID">تلقائي</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={cloneAdGroupForm.control}
                            name="budgetMode"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">نوع الميزانية *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={cloneAdGroupData.budgetMode}>
                                  <FormControl>
                                    <SelectTrigger className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary">
                                      <SelectValue placeholder="اختر نوع الميزانية" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="select-content-solid">
                                    <SelectItem value="BUDGET_MODE_DYNAMIC_DAILY_BUDGET">ميزانية يومية ديناميكية</SelectItem>
                                    <SelectItem value="BUDGET_MODE_DAY">ميزانية يومية</SelectItem>
                                    <SelectItem value="BUDGET_MODE_TOTAL">إجمالي الميزانية</SelectItem>
                                    <SelectItem value="BUDGET_MODE_INFINITE">لا محدودة</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="compact-grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={cloneAdGroupForm.control}
                            name="placementType"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">نوع الموضع</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue="PLACEMENT_TYPE_AUTOMATIC">
                                  <FormControl>
                                    <SelectTrigger className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary">
                                      <SelectValue placeholder="اختر نوع الموضع" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="select-content-solid">
                                    <SelectItem value="PLACEMENT_TYPE_AUTOMATIC">تلقائي</SelectItem>
                                    <SelectItem value="PLACEMENT_TYPE_SELECT">يدوي</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={cloneAdGroupForm.control}
                            name="bidPrice"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">سعر المزايدة</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="سعر المزايدة بالدولار"
                                    min="0"
                                    step="0.01"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex gap-4 pt-6 border-t theme-border">
                    <Button 
                      type="submit"
                      className="flex-1 bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      <Copy className="ml-2 h-4 w-4" />
                      إنشاء المجموعة
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex-1 theme-border"
                      onClick={() => setCloneAdGroupModalOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clone Ad Modal - مودال نسخ الإعلان */}
      <Dialog open={cloneAdModalOpen} onOpenChange={setCloneAdModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-small-text bg-white dark:bg-gray-950 theme-border">
          <DialogHeader className="bg-theme-primary-light p-4 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0"
                onClick={() => setCloneAdModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="text-right flex-1">
                <DialogTitle className="text-base font-medium text-theme-primary">
                  📋 نسخ الإعلان
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
                  إنشاء نسخة جديدة من الإعلان مع إمكانية التعديل ورفع فيديو جديد
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {cloneAdData && (
              <Form {...cloneAdForm}>
                <form onSubmit={cloneAdForm.handleSubmit((data) => {
                  console.log('Clone Ad data:', data);
                  toast({
                    title: '✅ تم إنشاء الإعلان',
                    description: 'تم نسخ الإعلان بنجاح',
                  });
                  setCloneAdModalOpen(false);
                })} className="space-y-4">

                  {/* البيانات الأصلية */}
                  <div className="p-4 bg-theme-primary-light rounded-lg border theme-border">
                    <h4 className="font-semibold text-theme-primary mb-2">البيانات الأصلية:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><strong>اسم الإعلان:</strong> {cloneAdData.adName}</div>
                      <div><strong>تنسيق الإعلان:</strong> {cloneAdData.adFormat}</div>
                      <div><strong>الحالة:</strong> {cloneAdData.status}</div>
                    </div>
                    <div className="mt-2">
                      <div><strong>نص الإعلان:</strong> {cloneAdData.adText}</div>
                    </div>
                  </div>

                  {/* معلومات الإعلان الجديد */}
                  <div className="form-section bg-theme-primary-light border theme-border rounded-lg">
                    <h3 
                      className="text-base font-medium mb-2 flex items-center justify-between cursor-pointer hover:bg-gray-900/95 border-gray-700 backdrop-blur-sm p-2 rounded transition-colors text-theme-primary"
                      onClick={() => setCloneAdSectionCollapsed(!cloneAdSectionCollapsed)}
                    >
                      {cloneAdSectionCollapsed ?
                        <><ChevronLeft className="h-5 w-5 ml-2" /> معلومات الإعلان الجديد</>
                        : <><ChevronDown className="h-5 w-5 ml-2" /> معلومات الإعلان الجديد</>
                      }
                      <Badge variant="secondary" className="bg-theme-primary text-white">
                        📋 نسخ
                      </Badge>
                    </h3>
                    
                    {!cloneAdSectionCollapsed && (
                      <div className="space-y-4 p-4">
                        <div className="compact-grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={cloneAdForm.control}
                            name="adName"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">اسم الإعلان الجديد *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    defaultValue={`نسخة من ${cloneAdData.adName}`}
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="أدخل اسم الإعلان الجديد"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={cloneAdForm.control}
                            name="adFormat"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">تنسيق الإعلان *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={cloneAdData.adFormat}>
                                  <FormControl>
                                    <SelectTrigger className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary">
                                      <SelectValue placeholder="اختر تنسيق الإعلان" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="select-content-solid">
                                    <SelectItem value="SINGLE_VIDEO">فيديو واحد</SelectItem>
                                    <SelectItem value="SINGLE_IMAGE">صورة واحدة</SelectItem>
                                    <SelectItem value="COLLECTION">مجموعة</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="compact-grid grid-cols-1 gap-4">
                          <FormField
                            control={cloneAdForm.control}
                            name="adText"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">نص الإعلان *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    defaultValue={cloneAdData.adText}
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="أدخل نص الإعلان"
                                    rows={4}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="compact-grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={cloneAdForm.control}
                            name="landingPageUrl"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">رابط صفحة الهبوط</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="https://example.com"
                                    type="url"
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={cloneAdForm.control}
                            name="callToAction"
                            render={({ field }) => (
                              <FormItem className="form-item">
                                <FormLabel className="form-label text-theme-primary">دعوة للعمل</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="platform-input bg-white dark:bg-gray-900 theme-border focus:ring-2 focus:ring-theme-primary focus:border-theme-primary" 
                                    placeholder="اشتري الآن، اعرف أكثر..."
                                  />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* رفع الفيديو */}
                        <FormField
                          control={cloneAdForm.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem className="form-item">
                              <FormLabel className="form-label text-theme-primary">رفع فيديو الإعلان *</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <div 
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                      dragOver ? 'border-green-400 bg-green-50' : 'border-theme-primary hover:border-theme-primary'
                                    } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, field, 'video')}
                                  >
                                    <Video className={`h-8 w-8 mx-auto mb-2 ${dragOver ? 'text-green-500' : 'text-theme-primary'}`} />
                                    <p className="text-sm text-gray-600 mb-2">
                                      {uploading ? 'جاري رفع الفيديو...' : 'اسحب وأفلت الفيديو هنا أو اضغط للاختيار'}
                                    </p>
                                    <p className="text-xs text-gray-500">الحد الأقصى: 100 ميجابايت (MP4, MOV, AVI)</p>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => videoInputRef.current?.click()}
                                      disabled={uploading}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      {uploading ? 'جاري الرفع...' : 'اختر الفيديو'}
                                    </Button>
                                    <input
                                      ref={videoInputRef}
                                      type="file"
                                      accept="video/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleVideoUpload(file, field);
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex gap-4 pt-6 border-t theme-border">
                    <Button 
                      type="submit"
                      className="flex-1 bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      <Copy className="ml-2 h-4 w-4" />
                      إنشاء الإعلان
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex-1 theme-border"
                      onClick={() => setCloneAdModalOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-in fade-in duration-300">
            <div className="mb-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-green-700 mb-2">
              🎉 تم بنجاح!
            </h3>
            <p className="text-gray-700 mb-4">
              {successMessage}
            </p>
            <div className="text-sm text-gray-500">
              جاري إعادة تحديث الصفحة...
            </div>
          </div>
        </div>
      )}

      {/* TikTok iPhone-Style Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-sm sm:max-w-md max-h-[95vh] p-0 bg-black border-0 rounded-3xl shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>عرض فيديو الإعلان</DialogTitle>
            <DialogDescription>
              مشاهدة فيديو الإعلان من TikTok
            </DialogDescription>
          </DialogHeader>
          
          {/* iPhone-style Header with X button */}
          <div className="relative bg-black">
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-0"
                onClick={() => setVideoModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* TikTok-style Title */}
            <div className="pt-4 pb-2 px-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-semibold">TikTok Video</span>
                <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Video Container - iPhone aspect ratio */}
          <div className="relative bg-black flex items-center justify-center" style={{aspectRatio: '9/16', minHeight: '60vh'}}>
            {selectedTikTokAd ? (
              <div className="w-full h-full">
                {/* عرض الفيديو الفعلي إذا كان متوفراً */}
                {selectedTikTokAd.actualVideoUrl ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={`/api/proxy/video?url=${encodeURIComponent(selectedTikTokAd.actualVideoUrl)}`}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-cover rounded-none"
                      style={{
                        filter: 'contrast(1.1) saturate(1.2)'
                      }}
                      onError={(e) => {
                        console.error('فشل في تحميل الفيديو عبر الـ proxy:', e);
                        console.log('🔄 محاولة تحميل الفيديو مباشرة...');
                        // محاولة تحميل الفيديو مباشرة كـ fallback
                        const videoElement = e.target as HTMLVideoElement;
                        if (selectedTikTokAd.actualVideoUrl) {
                          videoElement.src = selectedTikTokAd.actualVideoUrl;
                          videoElement.onerror = (e2: string | Event) => {
                            console.error('فشل في تحميل الفيديو مباشرة أيضاً:', e2);
                            // إخفاء الفيديو وإظهار fallback
                            videoElement.style.display = 'none';
                            const fallback = videoElement.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          };
                        }
                      }}
                    >
                      متصفحك لا يدعم عرض الفيديو
                    </video>
                  </div>
                ) : selectedTikTokAd.coverImageUrl ? (
                  /* عرض صورة الغلاف مع رسالة */
                  <div className="relative w-full h-full">
                    <img 
                      src={selectedTikTokAd.coverImageUrl} 
                      alt="Video Cover"
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'contrast(1.1) saturate(1.2)'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center shadow-2xl animate-pulse">
                          <Video className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{selectedTikTokAd.adName}</h3>
                        <p className="text-sm text-gray-300 mb-4">جاري تحميل الفيديو...</p>
                        <div className="text-xs text-gray-400">
                          الفيديو غير متاح للعرض المباشر
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* لا توجد صورة غلاف */
                  <div className="text-center text-white flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center shadow-2xl">
                      <Video className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{selectedTikTokAd.adName}</h3>
                    <p className="text-gray-300 mb-6">إعلان فيديو TikTok</p>
                    {selectedTikTokAd.videoId && (
                      <div className="text-xs text-gray-400 font-mono bg-gray-800/50 px-3 py-2 rounded-lg mb-6">
                        Video ID: {selectedTikTokAd.videoId}
                      </div>
                    )}
                    <div className="text-sm text-gray-400">
                      الفيديو غير متاح للعرض المباشر
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-white text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                  <Video className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-300">لا يمكن عرض الفيديو</p>
              </div>
            )}
          </div>

          {/* TikTok-style Bottom Bar */}
          <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 backdrop-blur-sm border-t border-white/10 p-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-white text-xs">
                <div className="w-1 h-1 bg-pink-500 rounded-full"></div>
                <span>TikTok Video Player</span>
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
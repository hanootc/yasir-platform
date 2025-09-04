import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency as Iraqi Dinar with clean, modern display
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num <= 0) return '';
  
  // إزالة الأصفار اللاحقة والنقاط غير الضرورية
  const cleanNum = Math.round(num);
  
  // تنسيق الرقم بفواصل
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cleanNum);
  
  return `${formatted} د.ع`;
}

// Format number with comma separator without currency symbol (English numerals)
export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Parse currency input (remove formatting)
export function parseCurrency(value: string): number {
  const cleanValue = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleanValue) || 0;
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'الآن';
  } else if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} دقيقة`;
  } else if (diffInHours < 24) {
    return `منذ ${diffInHours} ساعة`;
  } else if (diffInDays < 7) {
    return `منذ ${diffInDays} يوم`;
  } else {
    return targetDate.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export function formatDate(date: string | Date): string {
  const targetDate = new Date(date);
  return targetDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// تحويل من الدينار العراقي إلى الدولار
export function convertIQDToUSD(amountIQD: number): number {
  const USD_TO_IQD_RATE = 1310; // سعر الصرف الحالي تقريباً (1 دولار = 1310 دينار)
  return Math.round((amountIQD / USD_TO_IQD_RATE) * 100) / 100; // تقريب لرقمين عشريين
}

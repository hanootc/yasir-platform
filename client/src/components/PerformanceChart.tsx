import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  data: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    campaignInsights?: any;
    adInsights?: any;
  };
  type?: 'line' | 'bar';
  title?: string;
  accountId?: string;
  adId?: string;
  useRealData?: boolean;
  datePreset?: string;
  since?: string;
  until?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  type = 'line',
  title = 'أداء الحملات',
  accountId,
  adId,
  useRealData = false,
  datePreset = 'last_7d',
  since,
  until
}) => {
  const [dailyData, setDailyData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  // جلب البيانات اليومية الحقيقية
  React.useEffect(() => {
    if (useRealData && (accountId || adId)) {
      setLoading(true);
      setDailyData(null); // مسح البيانات السابقة
      
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      if (adId) params.append('adId', adId);
      params.append('datePreset', datePreset);
      if (since) params.append('since', since);
      if (until) params.append('until', until);

      fetch(`/api/platform-ads/meta/daily-insights?${params}`)
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            setDailyData(result.dailyInsights);
            console.log('📊 تم تحميل البيانات اليومية:', {
              period: result.period,
              daysWithData: Object.keys(result.dailyInsights).length,
              dailyData: result.dailyInsights
            });
          } else {
            console.error('❌ فشل في جلب البيانات:', result);
            setDailyData({});
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('❌ خطأ في جلب البيانات اليومية:', error);
          setDailyData({});
          setLoading(false);
        });
    }
  }, [useRealData, accountId, adId, datePreset, since, until]);

  const generateChartData = () => {
    if (useRealData && dailyData !== null) {
      // إنشاء قائمة كاملة بجميع الأيام في الفترة المحددة
      const generateDateRange = () => {
        const dates = [];
        let startDate: Date, endDate: Date;
        const today = new Date();
        
        // تحديد الفترة بناءً على datePreset
        switch (datePreset) {
          case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
          case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(startDate);
            break;
          case 'last_7d':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 6);
            endDate = new Date(today);
            break;
          case 'last_14d':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 13);
            endDate = new Date(today);
            break;
          case 'last_30d':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 29);
            endDate = new Date(today);
            break;
          case 'this_month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today);
            break;
          case 'last_month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
          case 'lifetime':
            // للحد الأقصى، نبدأ من تاريخ بعيد جداً (مثل 2020)
            startDate = new Date('2020-01-01');
            endDate = new Date(today);
            break;
          default:
            if (since && until) {
              startDate = new Date(since);
              endDate = new Date(until);
            } else {
              startDate = new Date(today);
              startDate.setDate(startDate.getDate() - 6);
              endDate = new Date(today);
            }
        }
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
      };

      const allDates = generateDateRange();
      
      // إنشاء التسميات للمخطط
      const labels = allDates.map(date => {
        const d = new Date(date);
        const today = new Date();
        const diffTime = today.getTime() - d.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'اليوم';
        if (diffDays === 1) return 'أمس';
        if (diffDays <= 7) return `منذ ${diffDays} أيام`;
        
        // للفترات الطويلة (lifetime)، اعرض الشهر والسنة
        if (datePreset === 'lifetime' && allDates.length > 90) {
          return d.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' });
        }
        
        // للتواريخ الأقدم، اعرض التاريخ
        return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      });

      // إنشاء البيانات لكل يوم (صفر إذا لم توجد بيانات)
      const impressionsData = allDates.map(date => {
        return dailyData[date] ? parseInt(dailyData[date].impressions || '0') : 0;
      });
      
      const clicksData = allDates.map(date => {
        return dailyData[date] ? parseInt(dailyData[date].clicks || '0') : 0;
      });
      
      const spendData = allDates.map(date => {
        return dailyData[date] ? parseFloat(dailyData[date].spend || '0') : 0;
      });

      // التحقق من وجود بيانات حقيقية في أي يوم
      const hasRealData = impressionsData.some(val => val > 0) || 
                         clicksData.some(val => val > 0) || 
                         spendData.some(val => val > 0);

      console.log('🔍 تحليل البيانات للمخطط:', {
        allDates: allDates.length,
        daysWithData: Object.keys(dailyData).length,
        impressionsTotal: impressionsData.reduce((a, b) => a + b, 0),
        clicksTotal: clicksData.reduce((a, b) => a + b, 0),
        spendTotal: spendData.reduce((a, b) => a + b, 0),
        hasRealData,
        datePreset,
        accountId,
        adId
      });

      if (!hasRealData) {
        console.log('❌ لا توجد بيانات حقيقية للعرض');
        return null; // لا توجد بيانات حقيقية في الفترة كاملة
      }

      return {
        labels,
        datasets: [
          {
            label: 'مرات الظهور',
            data: impressionsData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'النقرات',
            data: clicksData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'الإنفاق ($)',
            data: spendData,
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            fill: false,
          },
        ],
      };
    } else {
      // لا نعرض بيانات تقديرية - فقط البيانات الحقيقية
      return null;
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Cairo, sans-serif',
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          family: 'Cairo, sans-serif',
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 2) { // الإنفاق
              label += '$' + context.parsed.y.toFixed(2);
            } else {
              label += context.parsed.y.toLocaleString('ar-IQ');
            }
            return label;
          },
          afterBody: function(tooltipItems: any[]) {
            const date = tooltipItems[0]?.label;
            if (date && (date.includes('منذ') || date === 'اليوم' || date === 'أمس')) {
              return '';
            }
            return '';
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'الفترة الزمنية',
          font: {
            family: 'Cairo, sans-serif',
            size: 12,
          },
        },
        ticks: {
          font: {
            family: 'Cairo, sans-serif',
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'مرات الظهور / النقرات',
          font: {
            family: 'Cairo, sans-serif',
            size: 12,
          },
        },
        ticks: {
          font: {
            family: 'Cairo, sans-serif',
            size: 11,
          },
          callback: function(value: any) {
            return Number(value).toLocaleString('ar-IQ');
          },
          beginAtZero: true,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'الإنفاق ($)',
          font: {
            family: 'Cairo, sans-serif',
            size: 12,
          },
        },
        ticks: {
          font: {
            family: 'Cairo, sans-serif',
            size: 11,
          },
          callback: function(value: any) {
            return '$' + Number(value).toFixed(2);
          },
          beginAtZero: true,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const chartData = generateChartData();

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-blue-600 font-medium">جاري تحميل البيانات الحقيقية...</p>
          <p className="text-sm text-gray-400 mt-1">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // إذا لم توجد بيانات حقيقية أو كانت فارغة
  if (!chartData) {
    // إذا كنا نستخدم البيانات الحقيقية وتم تحميلها لكن لا توجد بيانات
    if (useRealData && dailyData !== null) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">لا توجد بيانات حقيقية للفترة المحددة</p>
            <div className="text-sm text-gray-400 mt-2 space-y-1">
              <p>• لم يتم تشغيل إعلانات في هذه الفترة</p>
              <p>• جرب تغيير الفترة الزمنية أعلاه</p>
              <p>• أو ابدأ حملة إعلانية جديدة</p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p><strong>تشخيص:</strong></p>
                  <p>• الفترة: {datePreset}</p>
                  <p>• الحساب: {accountId}</p>
                  <p>• الإعلان: {adId || 'جميع الإعلانات'}</p>
                  <p>• أيام البيانات: {dailyData ? Object.keys(dailyData).length : 0}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (!useRealData && data.totalImpressions === 0 && data.totalSpend === 0) {
      // إذا لم نكن نستخدم البيانات الحقيقية ولا توجد بيانات إجمالية
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">لا توجد بيانات للمخطط</p>
            <p className="text-sm text-gray-400 mt-1">ابدأ حملة إعلانية لرؤية المخطط التفاعلي</p>
          </div>
        </div>
      );
    }
    
    // إذا كنا ننتظر تحميل البيانات الحقيقية
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-blue-600 font-medium">جاري التحقق من البيانات...</p>
          <p className="text-sm text-gray-400 mt-1">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      {type === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default PerformanceChart;

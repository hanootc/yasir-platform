import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AudienceChartProps {
  data: {
    totalClicks: number;
    totalConversions: number;
    totalImpressions: number;
  };
}

export const AudienceChart: React.FC<AudienceChartProps> = ({ data }) => {
  const generateAudienceData = () => {
    // حساب معدلات التفاعل
    const clickRate = data.totalImpressions > 0 ? (data.totalClicks / data.totalImpressions) * 100 : 0;
    const conversionRate = data.totalClicks > 0 ? (data.totalConversions / data.totalClicks) * 100 : 0;
    const viewOnlyRate = 100 - clickRate;

    return {
      labels: ['مشاهدة فقط', 'نقرات', 'تحويلات'],
      datasets: [
        {
          data: [
            Math.max(0, viewOnlyRate),
            Math.max(0, clickRate),
            Math.max(0, conversionRate * 0.1) // تصغير نسبة التحويلات للعرض
          ],
          backgroundColor: [
            'rgba(156, 163, 175, 0.8)', // رمادي للمشاهدة فقط
            'rgba(59, 130, 246, 0.8)',  // أزرق للنقرات
            'rgba(16, 185, 129, 0.8)',  // أخضر للتحويلات
          ],
          borderColor: [
            'rgba(156, 163, 175, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
          ],
          borderWidth: 2,
          hoverBackgroundColor: [
            'rgba(156, 163, 175, 0.9)',
            'rgba(59, 130, 246, 0.9)',
            'rgba(16, 185, 129, 0.9)',
          ],
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Cairo, sans-serif',
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            
            if (context.dataIndex === 0) { // مشاهدة فقط
              return `${label}: ${data.totalImpressions.toLocaleString('ar-IQ')} (${value.toFixed(1)}%)`;
            } else if (context.dataIndex === 1) { // نقرات
              return `${label}: ${data.totalClicks.toLocaleString('ar-IQ')} (${value.toFixed(1)}%)`;
            } else { // تحويلات
              return `${label}: ${data.totalConversions.toLocaleString('ar-IQ')}`;
            }
          }
        }
      },
    },
    cutout: '60%', // لجعله دائرة مفرغة (doughnut)
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  };

  if (data.totalImpressions === 0 && data.totalClicks === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">لا توجد بيانات جمهور</p>
          <p className="text-sm text-gray-400 mt-1">ابدأ حملة إعلانية لرؤية تحليل الجمهور</p>
        </div>
      </div>
    );
  }

  const chartData = generateAudienceData();

  return (
    <div className="h-64 w-full relative">
      <Doughnut data={chartData} options={options} />
      
      {/* إحصائيات في المنتصف */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {((data.totalClicks / data.totalImpressions) * 100 || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">معدل النقر</div>
        </div>
      </div>
    </div>
  );
};

export default AudienceChart;

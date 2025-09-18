import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, BarChart3, Activity, Calendar } from "lucide-react";

type ChartPeriod = 'daily' | 'weekly' | 'monthly';
type ChartType = 'line' | 'area' | 'bar';

export default function SalesChart() {
  const [period, setPeriod] = useState<ChartPeriod>('monthly');
  const [chartType, setChartType] = useState<ChartType>('area');
  
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/sales-chart', period],
    enabled: false, // Disable automatic loading
  });

  const chartData = Array.isArray(salesData) ? salesData : [];

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-theme-primary border-t-transparent mx-auto mb-3"></div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">جارٍ تحميل البيانات...</p>
          </div>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-theme-primary-light dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
              <TrendingUp className="text-theme-primary h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-theme-primary mb-2">لا توجد بيانات مبيعات</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm">
              ابدأ بإضافة منتجات وإنشاء طلبات لرؤية إحصائيات المبيعات هنا
            </p>
          </div>
        </div>
      );
    }

    const chartHeight = 320;
    const chartMargin = { top: 20, right: 30, left: 20, bottom: 20 };
    
    const commonProps = {
      data: chartData,
      margin: chartMargin,
    };

    const tooltipStyle = {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      direction: 'rtl' as const,
      backdropFilter: 'blur(8px)',
    };

    const renderChartComponent = () => {
      if (chartType === 'area') {
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06d6a0" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${Math.round(value / 1000)}ك`}
            />
            <Tooltip 
              contentStyle={tooltipStyle}
              formatter={(value: any, name: string) => [
                name === 'sales' ? formatCurrency(value) : `${value} طلب`,
                name === 'sales' ? 'المبيعات' : 'الطلبات'
              ]}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 3, fill: 'white' }}
            />
            <Area 
              type="monotone" 
              dataKey="orders" 
              stroke="#06d6a0" 
              strokeWidth={2}
              fill="url(#ordersGradient)"
              dot={{ fill: '#06d6a0', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#06d6a0', strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        );
      }
      
      if (chartType === 'line') {
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${Math.round(value / 1000)}ك`}
            />
            <Tooltip 
              contentStyle={tooltipStyle}
              formatter={(value: any, name: string) => [
                name === 'sales' ? formatCurrency(value) : `${value} طلب`,
                name === 'sales' ? 'المبيعات' : 'الطلبات'
              ]}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#8b5cf6" 
              strokeWidth={4}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 3, fill: 'white' }}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#06d6a0" 
              strokeWidth={3}
              dot={{ fill: '#06d6a0', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 7, stroke: '#06d6a0', strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        );
      }
      
      if (chartType === 'bar') {
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${Math.round(value / 1000)}ك`}
            />
            <Tooltip 
              contentStyle={tooltipStyle}
              formatter={(value: any, name: string) => [
                name === 'sales' ? formatCurrency(value) : `${value} طلب`,
                name === 'sales' ? 'المبيعات' : 'الطلبات'
              ]}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Bar 
              dataKey="sales" 
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Bar 
              dataKey="orders" 
              fill="#06d6a0"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        );
      }
      
      return <div />;
    };

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartComponent()}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="lg:col-span-2">
      <Card className="theme-border bg-theme-primary-lighter">
        <CardHeader className="bg-theme-primary-light border-b border-theme-primary pb-3">
          <div className="flex items-center justify-between">
            {/* Chart Type Selector */}
            <div className="flex items-center space-x-1">
              <Button 
                size="sm" 
                variant={chartType === 'area' ? 'default' : 'ghost'}
                onClick={() => setChartType('area')}
                className={`${chartType === 'area' ? 'bg-theme-gradient text-white theme-shadow' : 'text-gray-500 hover:bg-theme-primary-light'} transition-all px-2 py-1 text-xs`}
              >
                <Activity className="w-3 h-3 mr-1" />
                منطقة
              </Button>
              <Button 
                size="sm" 
                variant={chartType === 'line' ? 'default' : 'ghost'}
                onClick={() => setChartType('line')}
                className={`${chartType === 'line' ? 'bg-theme-gradient text-white theme-shadow' : 'text-gray-500 hover:bg-theme-primary-light'} transition-all px-2 py-1 text-xs`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                خطي
              </Button>
              <Button 
                size="sm" 
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                onClick={() => setChartType('bar')}
                className={`${chartType === 'bar' ? 'bg-theme-gradient text-white theme-shadow' : 'text-gray-500 hover:bg-theme-primary-light'} transition-all px-2 py-1 text-xs`}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                أعمدة
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <CardTitle className="text-lg font-bold text-theme-primary flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                إحصائيات المبيعات
              </CardTitle>
              
              {/* Period Selector */}
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-md p-0.5">
                <Button 
                  size="sm" 
                  variant={period === 'monthly' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('monthly')}
                  className={`${period === 'monthly' ? 'bg-theme-gradient text-white theme-shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'} text-xs px-2 py-1 h-auto transition-all`}
                >
                  شهري
                </Button>
                <Button 
                  size="sm" 
                  variant={period === 'weekly' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('weekly')}
                  className={`${period === 'weekly' ? 'bg-theme-gradient text-white theme-shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'} text-xs px-2 py-1 h-auto transition-all`}
                >
                  أسبوعي
                </Button>
                <Button 
                  size="sm" 
                  variant={period === 'daily' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('daily')}
                  className={`${period === 'daily' ? 'bg-theme-gradient text-white theme-shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'} text-xs px-2 py-1 h-auto transition-all`}
                >
                  يومي
                </Button>
              </div>
            </div>
          </div>
          
          {/* Summary Stats */}
          {chartData.length > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme-primary">
              <div className="flex space-x-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                  <p className="text-sm font-bold text-theme-primary">
                    {formatCurrency(chartData.reduce((sum, item) => sum + (item.sales || 0), 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                  <p className="text-sm font-bold text-theme-primary">
                    {chartData.reduce((sum, item) => sum + (item.orders || 0), 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">متوسط الطلب</p>
                  <p className="text-sm font-bold text-theme-primary">
                    {formatCurrency(
                      chartData.reduce((sum, item) => sum + (item.sales || 0), 0) / 
                      Math.max(1, chartData.reduce((sum, item) => sum + (item.orders || 0), 0))
                    )}
                  </p>
                </div>
              </div>
              
              <Badge className="bg-theme-gradient text-white text-xs px-2 py-0.5">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +12.5%
              </Badge>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4">
          {renderChart()}
          
          {/* Enhanced Chart Legend */}
          {chartData.length > 0 && (
            <div className="flex items-center justify-center space-x-6 mt-4 pt-3 border-t border-theme-primary">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-theme-gradient rounded-full shadow-sm"></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">المبيعات (د.ع)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">عدد الطلبات</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
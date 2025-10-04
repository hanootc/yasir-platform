#!/bin/bash

echo "🔍 استخراج الطلبات الفاشلة من الـ logs..."
echo "=================================="

# البحث في جميع ملفات الـ logs
for logfile in /root/.pm2/logs/sanadi-app-out*.log /root/.pm2/logs/sanadi-app-error*.log; do
    if [ -f "$logfile" ]; then
        echo "📁 فحص ملف: $logfile"
        
        # البحث عن الطلبات الفاشلة مع بيانات العملاء
        grep -B 50 "invalid input value for enum order_source" "$logfile" | \
        grep -E "(customerName|customerPhone|customerAddress|productName|About to create order|orderSource)" | \
        head -20
        
        echo "---"
    fi
done

echo ""
echo "🔍 البحث عن بيانات JSON للطلبات الفاشلة..."
echo "============================================"

# البحث عن JSON objects قبل الأخطاء
for logfile in /root/.pm2/logs/sanadi-app-out*.log; do
    if [ -f "$logfile" ]; then
        # البحث عن JSON objects التي تحتوي على fb_paid أو ig_paid
        grep -E "(fb_paid|ig_paid)" "$logfile" | head -10
    fi
done

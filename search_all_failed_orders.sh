#!/bin/bash

echo "🔍 البحث الشامل عن جميع الطلبات الفاشلة في آخر أسبوعين..."
echo "=============================================================="

# ملف مؤقت لحفظ النتائج
all_customers="/tmp/all_failed_customers.txt"
> "$all_customers"

echo "📊 تحليل ملف الـ log الكامل..."
echo "حجم الملف: $(wc -l /root/.pm2/logs/sanadi-app-out.log | cut -d' ' -f1) سطر"

# البحث عن جميع المراجع
echo ""
echo "🔍 البحث عن جميع مراجع fb_paid و ig_paid..."
total_refs=$(grep -c "fb_paid\|ig_paid" /root/.pm2/logs/sanadi-app-out.log)
echo "إجمالي المراجع: $total_refs"

# استخراج أرقام الأسطر للـ orderSource فقط
echo ""
echo "📋 استخراج بيانات العملاء..."
order_source_lines=$(grep -n '"orderSource": ".*_paid_' /root/.pm2/logs/sanadi-app-out.log | cut -d: -f1)

customer_count=0
declare -A seen_phones
declare -A seen_names

echo "معالجة $(echo "$order_source_lines" | wc -l) مرجع orderSource..."
echo ""

for line_num in $order_source_lines; do
    # استخراج البيانات من المنطقة المحيطة
    start_line=$((line_num - 40))
    end_line=$((line_num + 10))
    
    if [ $start_line -lt 1 ]; then
        start_line=1
    fi
    
    # استخراج بيانات العميل
    customer_section=$(sed -n "${start_line},${end_line}p" /root/.pm2/logs/sanadi-app-out.log)
    
    # البحث عن بيانات العميل
    name=$(echo "$customer_section" | grep -E '"customerName"' | head -1 | sed 's/.*"customerName"[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    phone=$(echo "$customer_section" | grep -E '"customerPhone"' | head -1 | sed 's/.*"customerPhone"[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    address=$(echo "$customer_section" | grep -E '"customerAddress"' | head -1 | sed 's/.*"customerAddress"[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    gov=$(echo "$customer_section" | grep -E '"customerGovernorate"' | head -1 | sed 's/.*"customerGovernorate"[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    product=$(echo "$customer_section" | grep -E '"productName"' | head -1 | sed 's/.*"productName"[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    
    # التحقق من وجود بيانات صالحة وعدم التكرار
    if [[ -n "$name" && -n "$phone" && -z "${seen_phones[$phone]}" ]]; then
        # تنظيف رقم الهاتف
        clean_phone=$(echo "$phone" | sed 's/[^0-9+]//g')
        
        if [[ -n "$clean_phone" && -z "${seen_phones[$clean_phone]}" ]]; then
            seen_phones[$clean_phone]=1
            customer_count=$((customer_count + 1))
            
            echo "العميل #$customer_count:"
            echo "────────────────────"
            echo "👤 الاسم: $name"
            echo "📱 الهاتف: $clean_phone"
            echo "🏠 العنوان: $address"
            echo "🌍 المحافظة: $gov"
            echo "🛍️ المنتج: $product"
            echo ""
            
            # حفظ في الملف
            echo "$customer_count|$name|$clean_phone|$address|$gov|$product" >> "$all_customers"
        fi
    fi
done

echo "═══════════════════════════════════════════════════════"
echo "📊 النتائج النهائية:"
echo "إجمالي العملاء الفريدين المفقودين: $customer_count"
echo ""

if [ $customer_count -gt 0 ]; then
    echo "📞 قائمة الاتصال الكاملة:"
    echo "──────────────────────────────"
    
    while IFS='|' read -r num name phone address gov product; do
        echo "$num. $name - $phone ($gov)"
    done < "$all_customers"
    
    echo ""
    echo "💰 تقدير الخسائر:"
    estimated_loss=$((customer_count * 25000))
    echo "القيمة المتوقعة المفقودة: $(printf "%'d" $estimated_loss) د.ع"
    echo ""
    echo "🎯 التوصية: اتصل بجميع هؤلاء العملاء فوراً!"
else
    echo "لم يتم العثور على عملاء إضافيين"
fi

# تنظيف
rm -f "$all_customers"

#!/bin/bash

echo "🔍 استخراج جميع العملاء الفريدين من الطلبات الفاشلة..."
echo "=================================================="

# ملف مؤقت لحفظ النتائج
customers_file="/tmp/unique_customers.txt"
> "$customers_file"

echo "📊 البحث في جميع مراجع fb_paid و ig_paid..."

# الحصول على جميع أرقام الأسطر التي تحتوي على orderSource
line_numbers=$(grep -n '"orderSource": ".*_paid_' /root/.pm2/logs/sanadi-app-out.log | cut -d: -f1)

echo "📋 تم العثور على $(echo "$line_numbers" | wc -l) مرجع"
echo ""

customer_count=0
declare -A seen_phones

for line_num in $line_numbers; do
    # استخراج البيانات من 30 سطر قبل وبعد
    start_line=$((line_num - 30))
    end_line=$((line_num + 5))
    
    # استخراج بيانات العميل
    customer_data=$(sed -n "${start_line},${end_line}p" /root/.pm2/logs/sanadi-app-out.log | \
                   grep -E "(customerName|customerPhone|customerAddress|customerGovernorate|productName)" | \
                   head -5)
    
    if [[ -n "$customer_data" ]]; then
        # استخراج رقم الهاتف للتحقق من التكرار
        phone=$(echo "$customer_data" | grep "customerPhone" | head -1 | sed 's/.*customerPhone[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | tr -d ' ')
        
        if [[ -n "$phone" && -z "${seen_phones[$phone]}" ]]; then
            seen_phones[$phone]=1
            customer_count=$((customer_count + 1))
            
            echo "العميل #$customer_count:"
            echo "────────────────────"
            
            # استخراج وعرض البيانات
            name=$(echo "$customer_data" | grep "customerName" | head -1 | sed 's/.*customerName[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//')
            address=$(echo "$customer_data" | grep "customerAddress" | head -1 | sed 's/.*customerAddress[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//')
            gov=$(echo "$customer_data" | grep "customerGovernorate" | head -1 | sed 's/.*customerGovernorate[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//')
            product=$(echo "$customer_data" | grep "productName" | head -1 | sed 's/.*productName[": ]*["]*\([^",]*\).*/\1/' | tr -d '",' | sed 's/^[[:space:]]*//')
            
            echo "👤 الاسم: $name"
            echo "📱 الهاتف: $phone"
            echo "🏠 العنوان: $address"
            echo "🌍 المحافظة: $gov"
            echo "🛍️ المنتج: $product"
            echo ""
            
            # حفظ في الملف
            echo "$customer_count|$name|$phone|$address|$gov|$product" >> "$customers_file"
        fi
    fi
done

echo "═══════════════════════════════════════"
echo "📊 إجمالي العملاء الفريدين: $customer_count"
echo ""
echo "📞 قائمة سريعة للاتصال:"
echo "────────────────────────────"

# عرض قائمة سريعة
while IFS='|' read -r num name phone address gov product; do
    echo "$num. $name - $phone ($gov)"
done < "$customers_file"

echo ""
echo "💡 ملاحظة: هؤلاء جميع العملاء الفريدين الذين فشلت طلباتهم"
echo "📞 يمكن الاتصال بهم لاسترداد المبيعات"

# تنظيف
rm -f "$customers_file"

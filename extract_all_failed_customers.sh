#!/bin/bash

echo "🔍 استخراج جميع العملاء الذين فشلت طلباتهم خلال الأسبوع الماضي..."
echo "=================================================================="

# ملف مؤقت لحفظ النتائج
temp_file="/tmp/failed_customers.txt"
> "$temp_file"

echo "📊 البحث في الـ logs الكبيرة..."

# البحث في آخر 200,000 سطر من الـ log الرئيسي
tail -200000 /root/.pm2/logs/sanadi-app-out.log | \
grep -B 30 "About to create order" | \
grep -A 30 -B 30 "fb_paid\|ig_paid" | \
grep -E "(customerName|customerPhone|customerAddress|customerGovernorate|productName)" | \
sed 's/^[[:space:]]*//' | \
sed 's/[",]//g' | \
sort | uniq >> "$temp_file"

echo ""
echo "📋 العملاء المستخرجون:"
echo "======================"

# تنظيم البيانات وعرضها
current_customer=""
customer_count=0

while IFS= read -r line; do
    if [[ $line == *"customerName"* ]]; then
        if [[ -n $current_customer ]]; then
            echo "────────────────────────────────"
        fi
        customer_count=$((customer_count + 1))
        echo "العميل #$customer_count:"
        name=$(echo "$line" | sed 's/.*customerName: //' | sed 's/[",]//g')
        echo "👤 الاسم: $name"
        current_customer="$name"
    elif [[ $line == *"customerPhone"* ]]; then
        phone=$(echo "$line" | sed 's/.*customerPhone: //' | sed 's/[",]//g')
        echo "📱 الهاتف: $phone"
    elif [[ $line == *"customerAddress"* ]]; then
        address=$(echo "$line" | sed 's/.*customerAddress: //' | sed 's/[",]//g')
        echo "🏠 العنوان: $address"
    elif [[ $line == *"customerGovernorate"* ]]; then
        gov=$(echo "$line" | sed 's/.*customerGovernorate: //' | sed 's/[",]//g')
        echo "🌍 المحافظة: $gov"
    elif [[ $line == *"productName"* ]]; then
        product=$(echo "$line" | sed 's/.*productName: //' | sed 's/[",]//g')
        echo "🛍️ المنتج: $product"
        echo ""
    fi
done < "$temp_file"

echo "────────────────────────────────"
echo "📊 إجمالي العملاء المفقودين: $customer_count"
echo ""
echo "💡 ملاحظة: هؤلاء العملاء أتوا من إعلانات مدفوعة ولم تُحفظ طلباتهم"
echo "📞 يمكن الاتصال بهم لإعادة إتمام الطلبات"

# تنظيف الملف المؤقت
rm -f "$temp_file"

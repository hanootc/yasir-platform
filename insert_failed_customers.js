#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema.ts';

// بيانات العملاء المفقودين
const failedCustomers = [
  {
    name: "ميزان الحق الحق",
    phone: "07508475587",
    address: "طريق بغداد حي عدن",
    governorate: "كركوك",
    product: "بلور هواء اصلي",
    productId: "7a842774-1b8a-460a-b97d-662ccc587ecd",
    price: 29000,
    source: "instagram_ad"
  },
  {
    name: "Ahmad Husen",
    phone: "07700358666", 
    address: "رحیم اوە",
    governorate: "كركوك",
    product: "بلور هواء اصلي",
    productId: "7a842774-1b8a-460a-b97d-662ccc587ecd",
    price: 29000,
    source: "instagram_ad"
  },
  {
    name: "ابو كميل",
    phone: "07725549998",
    address: "بصره ابي الخصيب حمدان جامع الشهيد", 
    governorate: "البصرة",
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00",
    price: 25000,
    source: "facebook_ad"
  },
  {
    name: "عمر محمود عاصي",
    phone: "07777000758",
    address: "الدورة / حي دجلة",
    governorate: "بغداد", 
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00",
    price: 25000,
    source: "facebook_ad"
  },
  {
    name: "احمد",
    phone: "07705623325",
    address: "تكريت",
    governorate: "صلاح الدين",
    product: "مشبك صرف صحي روله ومربع", 
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00",
    price: 25000,
    source: "instagram_ad"
  },
  {
    name: "وهبي احمد",
    phone: "07503022300",
    address: "New erbil",
    governorate: "أربيل",
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00", 
    price: 25000,
    source: "instagram_ad"
  },
  {
    name: "نهاد",
    phone: "07824754723", 
    address: "زاخو",
    governorate: "دهوك",
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00",
    price: 25000,
    source: "facebook_ad"
  }
];

const platformId = "3dbf0c5c-5076-471c-a114-61a86c20a156";

async function insertFailedCustomers() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🔄 بدء إدراج العملاء المفقودين في قاعدة البيانات...");
  console.log(`📋 عدد العملاء: ${failedCustomers.length}`);
  console.log("");

  let successCount = 0;
  let errorCount = 0;

  for (const [index, customer] of failedCustomers.entries()) {
    try {
      console.log(`📝 إدراج العميل ${index + 1}: ${customer.name}`);
      
      const orderData = {
        platformId: platformId,
        productId: customer.productId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerGovernorate: customer.governorate,
        customerAddress: customer.address,
        offer: `قطعة - ${customer.price.toLocaleString()} د.ع`,
        quantity: 1,
        notes: "طلب مسترد من الطلبات الفاشلة - تم إدراجه يدوياً",
        productName: customer.product,
        productImageUrls: [],
        selectedColorIds: [],
        selectedShapeIds: [],
        selectedSizeIds: [],
        status: "pending",
        subtotal: customer.price.toString(),
        totalAmount: customer.price.toString(),
        discountAmount: "0",
        deliveryFee: "0",
        orderSource: customer.source,
        sourceDetails: JSON.stringify({
          recovery_reason: "طلب فاشل بسبب خطأ order_source enum",
          original_error: "invalid input value for enum order_source",
          recovery_date: new Date().toISOString(),
          manual_insertion: true
        })
      };

      const [newOrder] = await db
        .insert(schema.landingPageOrders)
        .values(orderData)
        .returning();

      console.log(`✅ تم إدراج الطلب رقم: ${newOrder.orderNumber}`);
      console.log(`   العميل: ${customer.name} - ${customer.phone}`);
      console.log(`   المنتج: ${customer.product}`);
      console.log(`   القيمة: ${customer.price.toLocaleString()} د.ع`);
      console.log("");
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ خطأ في إدراج العميل ${customer.name}:`, error.message);
      errorCount++;
    }
  }

  await pool.end();

  console.log("═══════════════════════════════════════");
  console.log("📊 ملخص العملية:");
  console.log(`✅ تم إدراج بنجاح: ${successCount} عميل`);
  console.log(`❌ فشل في الإدراج: ${errorCount} عميل`);
  console.log(`📋 إجمالي العملاء: ${failedCustomers.length}`);
  console.log("");
  console.log("🎯 النتيجة:");
  if (successCount > 0) {
    console.log(`✅ تم إضافة ${successCount} طلب في حالة "pending" إلى المنصة`);
    console.log("📱 يمكنك الآن رؤيتهم في: platform/hanoot/orders");
    console.log("📞 اتصل بهم لإتمام الطلبات!");
  }
  
  if (errorCount > 0) {
    console.log(`⚠️ ${errorCount} عميل لم يتم إدراجه - تحقق من الأخطاء أعلاه`);
  }
}

// تشغيل الدالة
insertFailedCustomers().catch(console.error);

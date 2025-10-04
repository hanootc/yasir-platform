#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { sql } = require('drizzle-orm');

// بيانات العملاء المفقودين مع البيانات الصحيحة
const failedCustomersCorrect = [
  {
    name: "ميزان الحق الحق",
    phone: "07508475587",
    address: "طريق بغداد حي عدن",
    governorate: "كركوك",
    product: "بلور هواء اصلي",
    productId: "7a842774-1b8a-460a-b97d-662ccc587ecd",
    offer: "قطعة - توصيل مجاني - 29,000 د.ع",
    quantity: 1,
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
    offer: "قطعة - توصيل مجاني - 29,000 د.ع",
    quantity: 1,
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
    offer: "2 رولة + 100 مربع - 35,000 د.ع",
    quantity: 102, // 2 رولة + 100 مربع
    price: 35000,
    source: "facebook_ad"
  },
  {
    name: "عمر محمود عاصي",
    phone: "07777000758",
    address: "الدورة / حي دجلة",
    governorate: "بغداد", 
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00",
    offer: "رولة + 20 مربع - 25,000 د.ع",
    quantity: 21, // رولة + 20 مربع
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
    offer: "20 قطعة مربع - 15,000 د.ع",
    quantity: 20,
    price: 15000,
    source: "instagram_ad"
  },
  {
    name: "وهبي احمد",
    phone: "07503022300",
    address: "New erbil",
    governorate: "أربيل",
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00", 
    offer: "قطعة رولة 6 متر - 15,000 د.ع",
    quantity: 1,
    price: 15000,
    source: "instagram_ad"
  },
  {
    name: "نهاد",
    phone: "07824754723", 
    address: "زاخو",
    governorate: "دهوك",
    product: "مشبك صرف صحي روله ومربع",
    productId: "7f0710ac-0099-4647-beea-01a4703f3f00",
    offer: "قطعة رولة 6 متر - 15,000 د.ع",
    quantity: 1,
    price: 15000,
    source: "facebook_ad"
  }
];

const platformId = "3dbf0c5c-5076-471c-a114-61a86c20a156";

async function updateFailedCustomers() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("🔄 حذف الطلبات الخاطئة وإدراج البيانات الصحيحة...");
  console.log("");

  try {
    // حذف الطلبات الخاطئة أولاً
    console.log("🗑️ حذف الطلبات الخاطئة...");
    const deleteQuery = sql`
      DELETE FROM landing_page_orders 
      WHERE notes = 'طلب مسترد من الطلبات الفاشلة - تم إدراجه يدوياً'
      AND platform_id = ${platformId}
    `;
    
    const deleteResult = await db.execute(deleteQuery);
    console.log(`✅ تم حذف ${deleteResult.rowCount || 0} طلب خاطئ`);
    console.log("");

    // إدراج البيانات الصحيحة
    console.log("📝 إدراج البيانات الصحيحة...");
    let successCount = 0;

    for (const [index, customer] of failedCustomersCorrect.entries()) {
      try {
        console.log(`📝 إدراج العميل ${index + 1}: ${customer.name}`);
        
        // توليد رقم طلب فريد
        const orderNumber = `R${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10);
        
        const insertQuery = sql`
          INSERT INTO landing_page_orders (
            order_number,
            platform_id,
            product_id,
            customer_name,
            customer_phone,
            customer_governorate,
            customer_address,
            offer,
            quantity,
            notes,
            product_name,
            product_image_urls,
            selected_color_ids,
            selected_shape_ids,
            selected_size_ids,
            status,
            subtotal,
            total_amount,
            discount_amount,
            delivery_fee,
            order_source,
            source_details
          ) VALUES (
            ${orderNumber},
            ${platformId},
            ${customer.productId},
            ${customer.name},
            ${customer.phone},
            ${customer.governorate},
            ${customer.address},
            ${customer.offer},
            ${customer.quantity},
            ${'طلب مسترد من الطلبات الفاشلة - البيانات الصحيحة'},
            ${customer.product},
            ${JSON.stringify([])},
            ${JSON.stringify([])},
            ${JSON.stringify([])},
            ${JSON.stringify([])},
            ${'pending'},
            ${customer.price},
            ${customer.price},
            ${0},
            ${0},
            ${customer.source},
            ${JSON.stringify({
              recovery_reason: "طلب فاشل بسبب خطأ order_source enum",
              original_error: "invalid input value for enum order_source",
              recovery_date: new Date().toISOString(),
              manual_insertion: true,
              correct_data: true
            })}
          )
          RETURNING order_number, id
        `;

        const result = await db.execute(insertQuery);
        const newOrder = result.rows[0];

        console.log(`✅ تم إدراج الطلب رقم: ${newOrder.order_number}`);
        console.log(`   العميل: ${customer.name} - ${customer.phone}`);
        console.log(`   العرض: ${customer.offer}`);
        console.log(`   الكمية: ${customer.quantity}`);
        console.log(`   القيمة: ${customer.price.toLocaleString()} د.ع`);
        console.log("");
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ خطأ في إدراج العميل ${customer.name}:`, error.message);
      }
    }

    console.log("═══════════════════════════════════════");
    console.log("📊 ملخص العملية:");
    console.log(`✅ تم إدراج بنجاح: ${successCount} عميل`);
    console.log(`📋 إجمالي العملاء: ${failedCustomersCorrect.length}`);
    console.log("");
    console.log("🎯 البيانات الصحيحة:");
    failedCustomersCorrect.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} - ${customer.offer} - ${customer.quantity} قطعة`);
    });
    console.log("");
    console.log("✅ تم تحديث البيانات بالمعلومات الصحيحة!");
    console.log("📱 يمكنك الآن رؤيتهم في: platform/hanoot/orders");

  } catch (error) {
    console.error("❌ خطأ في العملية:", error.message);
  } finally {
    await pool.end();
  }
}

// تشغيل الدالة
updateFailedCustomers().catch(console.error);

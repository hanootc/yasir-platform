import OpenAI from "openai";

let openai: OpenAI | null = null;
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function generateProductDescription(productName: string): Promise<string> {
  try {
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `أنت خبير تسويق إلكتروني متخصص في كتابة أوصاف المنتجات باللغة العربية للسوق العراقي والعربي. 

مهمتك إنشاء وصف منتج:
- جذاب ومقنع يحفز على الشراء الفوري
- يركز على الفوائد والمميزات العملية  
- يخاطب احتياجات العميل العربي
- يستخدم كلمات عاطفية محفزة
- يتضمن دعوة واضحة للعمل
- بين 40-60 كلمة عربية
- يناسب التجارة الإلكترونية

اكتب بأسلوب حديث وودود يناسب شريحة واسعة من العملاء.`
        },
        {
          role: "user",
          content: `اكتب وصف تسويقي مقنع لهذا المنتج:

المنتج: ${productName}

اكتب الوصف مباشرة بدون مقدمات أو شرح:`
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    });

    const description = response.choices[0].message.content?.trim() || "";
    return description;
  } catch (error: any) {
    console.error("Error generating product description:", error);
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      throw new Error("تم تجاوز الحد المسموح لاستخدام الذكاء الاصطناعي. يرجى التحقق من رصيد حساب OpenAI أو المحاولة لاحقاً.");
    } else if (error.status === 401) {
      throw new Error("مفتاح OpenAI API غير صحيح. يرجى التحقق من إعدادات الحساب.");
    } else if (error.status === 403) {
      throw new Error("ليس لديك صلاحية لاستخدام هذه الخدمة. يرجى التحقق من حساب OpenAI.");
    } else {
      throw new Error("فشل في إنشاء وصف المنتج. يرجى المحاولة مرة أخرى لاحقاً.");
    }
  }
}
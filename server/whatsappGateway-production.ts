import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qr from 'qrcode';
import fs from 'fs';
import path from 'path';

// Map لحفظ جلسات WhatsApp لكل منصة
const whatsappClients = new Map<string, any>();
const sessionStates = new Map<string, {
  platformId: string;
  phoneNumber: string;
  businessName: string;
  status: 'disconnected' | 'connecting' | 'connected';
  qrCode?: string;
  isReady?: boolean;
  isConnected?: boolean;
}>();

// حفظ حالة الجلسات في ملف محلي
const SESSION_FILE = path.join(process.cwd(), 'whatsapp_sessions.json');

// حفظ الجلسات
function saveSessions() {
  try {
    const sessions: any = {};
    for (const [platformId, state] of Array.from(sessionStates.entries())) {
      sessions[platformId] = {
        phoneNumber: state.phoneNumber,
        businessName: state.businessName,
        status: state.status,
        isReady: state.isReady,
        isConnected: state.isConnected
      };
    }
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

// تحميل الجلسات
function loadSessions() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const sessions = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      for (const [platformId, state] of Object.entries(sessions as Record<string, any>)) {
        sessionStates.set(platformId, {
          platformId,
          phoneNumber: state.phoneNumber,
          businessName: state.businessName,
          status: state.status,
          isReady: state.isReady,
          isConnected: state.isConnected
        });
      }
      console.log('WhatsApp sessions loaded from file');
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
}

// البحث عن Chromium على AlmaLinux 9
function findChromiumPath(): string {
  const possiblePaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/bin/chromium-browser',
    '/bin/chromium',
    '/opt/google/chrome/chrome'
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      console.log(`✅ Found Chromium at: ${path}`);
      return path;
    }
  }

  // إذا لم نجد، نستخدم المسار الافتراضي ونأمل أن يكون موجود
  console.log('⚠️ Chromium path not found, using default');
  return '/usr/bin/chromium-browser';
}

export class WhatsAppGateway {
  
  constructor() {
    // تحميل الجلسات عند بدء التطبيق
    loadSessions();
    this.restoreActiveSessions();
  }

  // استرداد الجلسات النشطة عند بدء التطبيق
  async restoreActiveSessions() {
    console.log(`🔄 Starting session restoration process...`);
    
    for (const [platformId, state] of sessionStates) {
      // تأخير بسيط لتجنب محاولات الاستعادة المتزامنة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // محاولة استعادة أي جلسة لها ملف محفوظ
      const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session_${platformId}`);
      if (fs.existsSync(sessionPath)) {
        console.log(`📱 Found session data for platform ${platformId} (${state.businessName}), attempting restore...`);
        
        // تحديث الحالة إلى connecting أثناء المحاولة
        sessionStates.set(platformId, {
          ...state,
          status: 'connecting',
          isReady: false,
          isConnected: false
        });
        saveSessions();
        
        try {
          // محاولة استرداد الجلسة مع انتظار أطول (في الخلفية)
          this.reconnectSession(platformId).then(restored => {
            const currentState = sessionStates.get(platformId);
            if (restored && currentState) {
              console.log(`✅ Successfully restored session for platform ${platformId}`);
              sessionStates.set(platformId, {
                ...currentState,
                status: 'connected',
                isReady: true,
                isConnected: true
              });
            } else {
              console.log(`⚠️ Could not restore session for ${platformId}, will need re-authentication`);
              sessionStates.set(platformId, {
                ...currentState,
                status: 'disconnected',
                isReady: false,
                isConnected: false
              });
            }
            saveSessions();
          }).catch(error => {
            console.error(`💥 Failed to restore session for ${platformId}:`, error);
            const currentState = sessionStates.get(platformId);
            if (currentState) {
              sessionStates.set(platformId, {
                ...currentState,
                status: 'disconnected',
                isReady: false,
                isConnected: false
              });
              saveSessions();
            }
          });
        } catch (error) {
          console.error(`💥 Immediate error restoring session for ${platformId}:`, error);
          sessionStates.set(platformId, {
            ...state,
            status: 'disconnected',
            isReady: false,
            isConnected: false
          });
          saveSessions();
        }
      } else {
        console.log(`❌ No session files found for platform ${platformId}`);
      }
    }
    
    console.log(`✅ Session restoration process started for all platforms`);
  }

  async createSession(platformId: string, phoneNumber: string, businessName: string): Promise<{
    sessionId: string;
    qrCode?: string;
    status: string;
  }> {
    
    // إنهاء الجلسة القديمة إن وجدت
    if (whatsappClients.has(platformId)) {
      await this.destroySession(platformId);
    }

    // إعداد مجلد حفظ الجلسة
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session_${platformId}`);
    
    // العثور على مسار Chromium الصحيح لـ AlmaLinux
    const chromiumPath = findChromiumPath();
    
    // إنشاء عميل WhatsApp جديد مع إعدادات AlmaLinux
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: platformId,
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        executablePath: chromiumPath, // مسار محدث لـ AlmaLinux
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // مهم للخوادم ذات الذاكرة المحدودة
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--user-data-dir=/tmp/whatsapp-session-' + platformId, // مجلد مؤقت فريد لكل جلسة
        ]
      }
    });

    // حفظ العميل في الخريطة
    whatsappClients.set(platformId, client);
    
    // تحديث حالة الجلسة وحفظها فوراً
    sessionStates.set(platformId, {
      platformId,
      phoneNumber,
      businessName,
      status: 'connecting',
      isReady: false,
      isConnected: false
    });
    saveSessions(); // حفظ فوري للجلسة الجديدة

    return new Promise((resolve, reject) => {
      let isResolved = false;
      
      console.log(`✅ Starting WhatsApp client initialization for platform ${platformId}`);
      
      // معالج QR Code
      client.on('qr', async (qrData) => {
        try {
          console.log(`🔳 QR Code generated for platform ${platformId}`);
          console.log(`🔳 QR Data length: ${qrData?.length || 'undefined'}`);
          
          // تحويل QR إلى Base64
          const qrCodeDataURL = await qr.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          console.log(`🔳 QR Code converted to DataURL for platform ${platformId}`);

          // تحديث حالة الجلسة مع QR Code
          const currentState = sessionStates.get(platformId);
          if (currentState) {
            sessionStates.set(platformId, {
              ...currentState,
              qrCode: qrCodeDataURL,
              status: 'connecting'
            });
            saveSessions();
          }

          // إرجاع QR Code للعميل إذا لم يتم الحل مسبقاً
          if (!isResolved) {
            isResolved = true;
            resolve({
              sessionId: platformId,
              qrCode: qrCodeDataURL,
              status: 'connecting'
            });
          }
        } catch (error) {
          console.error(`💥 Error generating QR code for platform ${platformId}:`, error);
          if (!isResolved) {
            isResolved = true;
            reject(error);
          }
        }
      });

      // معالج الاتصال الناجح
      client.on('authenticated', (session) => {
        console.log(`✅ Authentication successful for platform ${platformId}`);
        
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'connecting', // ما زال في طور الاتصال
            qrCode: undefined
          });
          saveSessions();
        }
      });

      // معالج الجاهزية
      client.on('ready', () => {
        console.log(`🚀 WhatsApp client ready for platform ${platformId}`);
        
        // إعداد معالجات الرسائل
        this.setupMessageHandlers(client, platformId);
        
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'connected',
            isReady: true,
            isConnected: true,
            qrCode: undefined
          });
          saveSessions();
        }
        
        console.log(`✅ WhatsApp gateway ready for platform ${platformId}`);
      });

      // معالج فشل المصادقة
      client.on('auth_failure', (message) => {
        console.error(`💥 Authentication failed for platform ${platformId}:`, message);
        
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'disconnected',
            isReady: false,
            isConnected: false,
            qrCode: undefined
          });
          saveSessions();
        }
        
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`Authentication failed: ${message}`));
        }
      });

      // معالج قطع الاتصال
      client.on('disconnected', (reason) => {
        console.log(`🔌 WhatsApp disconnected for platform ${platformId}, reason: ${reason}`);
        
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'disconnected',
            isReady: false,
            isConnected: false
          });
          saveSessions();
        }
      });

      // بدء العميل
      client.initialize().catch(error => {
        console.error(`💥 Failed to initialize WhatsApp client for platform ${platformId}:`, error);
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });

      // انتظار أقصى 60 ثانية للمصادقة
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.log(`⏰ Timeout waiting for QR code for platform ${platformId}`);
          resolve({
            sessionId: platformId,
            status: 'connecting'
          });
        }
      }, 60000);
    });
  }

  // باقي الدوال تبقى كما هي...
  async destroySession(platformId: string): Promise<boolean> {
    try {
      const client = whatsappClients.get(platformId);
      if (client) {
        console.log(`🗑️ Destroying WhatsApp session for platform ${platformId}`);
        await client.destroy();
        whatsappClients.delete(platformId);
        
        // حذف مجلد الجلسة
        const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session_${platformId}`);
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(`🗂️ Session folder deleted for platform ${platformId}`);
        }
      }
      
      // حذف من حالة الجلسات وحفظ
      sessionStates.delete(platformId);
      saveSessions();
      
      return true;
    } catch (error) {
      console.error(`💥 Error destroying session for platform ${platformId}:`, error);
      return false;
    }
  }

  async sendMessage(platformId: string, phoneNumber: string, message: string): Promise<boolean> {
    const client = whatsappClients.get(platformId);
    const state = sessionStates.get(platformId);
    
    if (!client || !state?.isReady) {
      throw new Error('WhatsApp client not ready');
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('Invalid phone number provided');
    }

    try {
      // تنسيق رقم الهاتف
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (formattedNumber.startsWith('964')) {
        formattedNumber = formattedNumber.substring(3);
      }
      if (formattedNumber.startsWith('0')) {
        formattedNumber = formattedNumber.substring(1);
      }
      formattedNumber = `964${formattedNumber}@c.us`;

      console.log(`📤 Sending message to ${formattedNumber}: ${message}`);
      await client.sendMessage(formattedNumber, message);
      console.log(`✅ Message sent successfully to ${formattedNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  getSessionStatus(platformId: string): any {
    const state = sessionStates.get(platformId);
    return state ? {
      platformId: state.platformId,
      phoneNumber: state.phoneNumber,
      businessName: state.businessName,
      status: state.status,
      isConnected: state.isConnected || false,
      isReady: state.isReady || false,
      qrCode: state.qrCode
    } : null;
  }

  private setupMessageHandlers(client: any, platformId: string) {
    // معالج الرسائل الواردة
    client.on('message', (message: any) => {
      console.log(`📨 رسالة جديدة للمنصة ${platformId}:`, {
        من: message.from,
        المحتوى: message.body,
        مني: message.fromMe,
        الوقت: message.timestamp,
        النوع: message.type
      });
    });
  }
}

export const whatsappGateway = new WhatsAppGateway();
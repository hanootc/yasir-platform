import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
type WhatsAppClient = InstanceType<typeof Client>;
import qr from 'qrcode';
import fs from 'fs';
import path from 'path';

// Map لحفظ جلسات WhatsApp لكل منصة
const whatsappClients = new Map<string, WhatsAppClient>();
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
    for (const [platformId, state] of sessionStates.entries()) {
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
      for (const [platformId, stateData] of Object.entries(sessions as any)) {
        const state = stateData as {
          phoneNumber: string;
          businessName: string;
          status: 'disconnected' | 'connecting' | 'connected';
          isReady?: boolean;
          isConnected?: boolean;
        };
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

export class WhatsAppGateway {
  
  constructor() {
    // تحميل الجلسات عند بدء التطبيق
    loadSessions();
    this.restoreActiveSessions();
  }

  // استرداد الجلسات النشطة عند بدء التطبيق
  async restoreActiveSessions() {
    console.log(`🔄 Starting session restoration process...`);
    
    for (const [platformId, state] of sessionStates.entries()) {
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
                platformId: currentState?.platformId || platformId,
                phoneNumber: currentState?.phoneNumber || '',
                businessName: currentState?.businessName || '',
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
                platformId: currentState.platformId,
                phoneNumber: currentState.phoneNumber,
                businessName: currentState.businessName,
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
        sessionStates.set(platformId, {
          ...state,
          status: 'disconnected',
          isReady: false,
          isConnected: false
        });
        saveSessions();
      }
    }
    console.log(`✅ Session restoration process started for all platforms`);
  }

  // إعادة الاتصال بجلسة موجودة
  async reconnectSession(platformId: string): Promise<boolean> {
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session_${platformId}`);
    
    if (!fs.existsSync(sessionPath)) {
      console.log(`❌ No session file found for platform ${platformId}`);
      return false;
    }

    // التحقق من وجود عميل نشط وتنظيفه
    const existingClient = whatsappClients.get(platformId);
    if (existingClient) {
      console.log(`🧹 Cleaning up existing client for platform ${platformId}`);
      try {
        await existingClient.destroy();
      } catch (error) {
        console.log('Error destroying existing client during reconnect:', (error as Error).message);
      }
      whatsappClients.delete(platformId);
    }

    console.log(`🔄 Attempting to reconnect session for platform ${platformId}...`);

    // التحقق من سلامة ملفات الجلسة
    try {
      const sessionFiles = fs.readdirSync(sessionPath);
      if (sessionFiles.length === 0) {
        console.log(`❌ Session directory is empty for platform ${platformId}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Cannot read session directory for platform ${platformId}:`, (error as Error).message);
      return false;
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: platformId,
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-web-security',
          '--memory-pressure-off'
        ],
        timeout: 60000
      }
    });

    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.log(`⏰ Reconnection timeout for platform ${platformId} - Session may be expired`);
          resolved = true;
          
          // تنظيف العميل والجلسة التالفة
          client.destroy().catch(() => {});
          this.cleanupExpiredSession(platformId);
          resolve(false);
        }
      }, 45000); // 45 second timeout للجلسات المحفوظة

      client.on('ready', async () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        
        console.log(`✅ WhatsApp session successfully restored for platform ${platformId}`);
        whatsappClients.set(platformId, client);
        
        // إعداد معالجات الرسائل
        this.setupMessageHandlers(client, platformId);
        
        // التحقق من صحة الاتصال
        try {
          const info = await client.info;
          console.log(`📱 Connected device info:`, {
            platform: info.platform,
            phone: info.wid.user,
            pushname: info.pushname
          });
        } catch (error) {
          console.log('Could not get device info');
        }
        
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'connected',
            isReady: true,
            isConnected: true
          });
          saveSessions();
        }
        resolve(true);
      });

      client.on('auth_failure', (msg) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        console.error(`❌ Auth failure during restoration for platform ${platformId}:`, msg);
        resolve(false);
      });

      client.on('disconnected', (reason) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        console.log(`⚠️ WhatsApp disconnected for platform ${platformId}:`, reason);
        
        // تحديث حالة الجلسة
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
        resolve(false);
      });

      client.on('loading_screen', (percent, message) => {
        console.log(`Loading ${percent}% - ${message}`);
      });

      client.initialize().catch((error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        console.error(`💥 Failed to initialize client for platform ${platformId}:`, error);
        resolve(false);
      });
    });
  }

  // تنظيف الجلسات المنتهية الصلاحية
  cleanupExpiredSession(platformId: string) {
    console.log(`🧹 Cleaning up expired session for platform ${platformId}`);
    
    try {
      const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session_${platformId}`);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`✅ Deleted expired session files for platform ${platformId}`);
      }
      
      // تحديث حالة الجلسة
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
      
    } catch (error) {
      console.error(`Error cleaning up session for platform ${platformId}:`, error);
    }
  }
  
  // إنشاء جلسة WhatsApp جديدة
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
    
    // إنشاء عميل WhatsApp جديد
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: platformId,
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-web-security',
          '--memory-pressure-off'
        ],
        timeout: 60000
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
            console.log(`🔳 Session state updated with QR code for platform ${platformId}`);
          } else {
            console.error(`❌ No current state found for platform ${platformId}`);
          }

          if (!isResolved) {
            isResolved = true;
            resolve({
              sessionId: platformId,
              qrCode: qrCodeDataURL,
              status: 'connecting'
            });
          }
        } catch (error) {
          console.error('❌ Error generating QR code:', error);
          if (!isResolved) {
            isResolved = true;
            reject(error);
          }
        }
      });

      // معالج الاستعداد
      client.on('ready', () => {
        console.log(`WhatsApp client ready for platform ${platformId}!`);
        
        // التأكد من أن العميل متصل فعلياً
        setTimeout(async () => {
          try {
            const info = await client.info;
            console.log(`WhatsApp info for platform ${platformId}:`, info);
            
            const currentState = sessionStates.get(platformId);
            if (currentState) {
              sessionStates.set(platformId, {
                ...currentState,
                status: 'connected',
                isReady: true,
                isConnected: true,
                qrCode: undefined // إزالة QR Code بعد النجاح
              });
              console.log(`Session state CONFIRMED for platform ${platformId}`);
            }
          } catch (error) {
            console.error(`Error confirming WhatsApp connection for platform ${platformId}:`, error);
            console.log(`Error message: ${(error as Error).message || 'Unknown error'}`);
          }
        }, 1000);
        
        // إعداد معالجات الرسائل
        this.setupMessageHandlers(client, platformId);
        
        // حفظ الجلسة عند الاتصال الناجح
        saveSessions();
      });

      // معالج الاتصال المُعاد
      client.on('authenticated', () => {
        console.log(`WhatsApp authenticated for platform ${platformId}`);
        
        // تحديث حالة الجلسة عند المصادقة
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'connecting' // في حالة اتصال
          });
        }
      });

      // معالج فقدان الاتصال - لا نغير الجلسة إلا عند logout صريح
      client.on('disconnected', (reason) => {
        console.log(`WhatsApp disconnected for platform ${platformId}:`, reason);
        
        // نحافظ على الجلسة في معظم الحالات
        if (reason === 'LOGOUT') {
          console.log(`Explicit logout for platform ${platformId}, clearing session`);
          const currentState = sessionStates.get(platformId);
          if (currentState) {
            sessionStates.set(platformId, {
              ...currentState,
              status: 'disconnected',
              isReady: false,
              isConnected: false,
              qrCode: undefined
            });
          }
          
          // تنظيف العميل فقط عند logout صريح
          whatsappClients.delete(platformId);
          saveSessions();
        } else {
          console.log(`Temporary disconnect for platform ${platformId}, keeping session`);
        }
      });

      // معالج الأخطاء
      client.on('auth_failure', (message) => {
        console.error(`WhatsApp auth failure for platform ${platformId}:`, message);
        
        const currentState = sessionStates.get(platformId);
        if (currentState) {
          sessionStates.set(platformId, {
            ...currentState,
            status: 'disconnected',
            isReady: false,
            qrCode: undefined
          });
        }
        
        reject(new Error(`Authentication failed: ${message}`));
      });

      // بدء العميل مع معالجة الأخطاء
      console.log(`🚀 Initializing WhatsApp client for platform ${platformId}`);
      client.initialize().then(() => {
        console.log(`✅ WhatsApp client initialized successfully for platform ${platformId}`);
      }).catch((error) => {
        console.error(`❌ WhatsApp client initialization error for platform ${platformId}:`, error);
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });
      
      // timeout بعد 30 ثانية فقط للـ QR code generation
      setTimeout(() => {
        if (!isResolved) {
          console.log(`⏰ Timeout: QR code not generated within 30 seconds for platform ${platformId}`);
          isResolved = true;
          reject(new Error('Timeout: QR code not generated within 30 seconds'));
        }
      }, 30000);
    });
  }

  // الحصول على حالة الجلسة
  getSessionStatus(platformId: string) {
    const state = sessionStates.get(platformId);
    const client = whatsappClients.get(platformId);
    
    if (!state) {
      return {
        platformId,
        phoneNumber: null,
        businessName: null,
        status: 'disconnected',
        isConnected: false,
        qrCode: null
      };
    }

    return {
      platformId: state.platformId,
      phoneNumber: state.phoneNumber,
      businessName: state.businessName,
      status: state.status,
      isConnected: (state.status === 'connected' && state.isReady === true && client !== undefined),
      qrCode: state.qrCode || null
    };
  }

  // إرسال رسالة
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

  // إرسال رسالة إلى محادثة موجودة
  async sendMessageToChat(platformId: string, chatId: string, message: string): Promise<boolean> {
    const client = whatsappClients.get(platformId);
    const state = sessionStates.get(platformId);
    
    console.log(`📤 Attempting to send message to chat ${chatId} for platform ${platformId}`);
    console.log(`📤 Client exists: ${!!client}, State ready: ${state?.isReady}, State: ${state?.status}`);
    
    if (!client || !state?.isReady) {
      console.error(`❌ WhatsApp client not ready - Client: ${!!client}, State ready: ${state?.isReady}`);
      throw new Error('WhatsApp client not ready');
    }

    try {
      console.log(`📤 Sending message: "${message}" to chat: ${chatId}`);
      const result = await client.sendMessage(chatId, message);
      console.log(`✅ Message sent successfully to chat ${chatId}:`, result);
      return true;
    } catch (error) {
      console.error(`❌ Error sending message to chat ${chatId}:`, error);
      return false;
    }
  }

  // إنهاء جلسة WhatsApp
  async destroySession(platformId: string): Promise<void> {
    const client = whatsappClients.get(platformId);
    if (client) {
      try {
        // التحقق من وجود pupPage قبل الإغلاق
        if (client.pupPage && !client.pupPage.isClosed()) {
          await client.destroy();
        }
      } catch (error) {
        console.log('Error destroying client:', error);
      }
      whatsappClients.delete(platformId);
    }
    
    // حذف حالة الجلسة
    sessionStates.delete(platformId);
    saveSessions();
    
    // حذف ملفات الجلسة
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session_${platformId}`);
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      } catch (error) {
        console.log('Error removing session files:', error);
      }
    }
  }

  // الحصول على جميع المحادثات
  async getChats(platformId: string): Promise<any[]> {
    const client = whatsappClients.get(platformId);
    const state = sessionStates.get(platformId);
    
    console.log(`📱 Getting chats for platform ${platformId}, client exists: ${!!client}, state ready: ${state?.isReady}`);
    
    if (!client || !state?.isReady) {
      console.log('❌ Client not ready or not found');
      return [];
    }

    try {
      console.log('🔄 Fetching chats from WhatsApp...');
      
      // التأكد من أن العميل جاهز تماماً
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // التحقق من حالة العميل مرة أخرى
      if (!client || client.pupPage?.isClosed()) {
        console.log('❌ Client connection lost during chat fetch');
        return [];
      }
      
      const chats = await client.getChats();
      console.log(`📊 Found ${chats.length} total chats`);
      
      const filteredChats = chats
        .filter((chat: any) => !chat.isGroup) // إزالة المجموعات
        .slice(0, 20) // زيادة العدد مع تحسين الأداء
        .sort((a: any, b: any) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));

      console.log(`📱 Processing ${filteredChats.length} individual chats`);

      // جلب المعلومات مع صور البروفايل (محسّن مع timeout)
      const chatsWithProfilePics = await Promise.all(filteredChats.map(async (chat: any) => {
        let profilePicUrl = null;
        let displayName = chat.name || `واتساب ${chat.id.user}`;
        
        try {
          // timeout لجلب معلومات الاتصال (2.5 ثانية لكل محادثة)
          const contactPromise = client.getContactById(chat.id._serialized);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contact timeout')), 2500)
          );
          
          const contact = await Promise.race([contactPromise, timeoutPromise]);
          
          if (contact) {
            // استخدام اسم جهة الاتصال إذا كان متوفراً
            displayName = (contact as any).name || (contact as any).pushname || (contact as any).number || displayName;
            
            // محاولة جلب صورة البروفايل مع timeout مقلل
            try {
              const picPromise = (contact as any).getProfilePicUrl();
              const picTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile pic timeout')), 1500)
              );
              
              profilePicUrl = await Promise.race([picPromise, picTimeoutPromise]);
              console.log(`📸 Got profile pic for ${displayName}: ✅`);
            } catch (picError) {
              // لا نطبع رسالة خطأ لكل صورة مفقودة لتقليل spam
              profilePicUrl = null;
            }
          }
        } catch (contactError) {
          // فقط للأخطاء الحقيقية، ليس timeout
          if (!(contactError as Error).message.includes('timeout')) {
            console.log(`⚠️ Error fetching contact info for ${chat.id._serialized}:`, (contactError as Error).message);
          }
        }

        return {
          id: chat.id._serialized,
          name: displayName,
          phoneNumber: chat.id.user ? `+964${chat.id.user}` : '',
          lastMessage: chat.lastMessage?.body || 'لا توجد رسائل',
          lastMessageTime: chat.lastMessage?.timestamp || 0,
          unreadCount: chat.unreadCount || 0,
          isGroup: chat.isGroup,
          profilePicUrl,
          isOnline: (chat.unreadCount || 0) > 0 // بناءً على الرسائل غير المقروءة فقط
        };
      }));

      console.log(`✅ Returning ${chatsWithProfilePics.length} chats with profile pics`);
      return chatsWithProfilePics;
    } catch (error) {
      console.error('❌ Error getting chats:', error);
      return [];
    }
  }

  // الحصول على رسائل محادثة معينة
  async getMessages(platformId: string, chatId: string, limit: number = 50): Promise<any[]> {
    const client = whatsappClients.get(platformId);
    const state = sessionStates.get(platformId);
    
    if (!client || !state?.isReady) {
      return [];
    }

    try {
      const chat = await client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map((message: any) => ({
        id: message.id._serialized,
        content: message.body,
        type: message.type === 'chat' ? 'text' : message.type,
        fromMe: message.fromMe,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        author: message.author || message.from,
        hasMedia: message.hasMedia
      })).reverse(); // ترتيب من الأقدم للأحدث
      
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // إعداد معالجات الرسائل
  private setupMessageHandlers(client: any, platformId: string) {
    if (!client) return;

    // معالج الرسائل الواردة (جميع الرسائل الجديدة)
    client.on('message', (message: any) => {
      console.log(`📨 رسالة جديدة للمنصة ${platformId}:`, {
        من: message.from,
        المحتوى: message.body,
        مني: message.fromMe,
        الوقت: message.timestamp,
        النوع: message.type
      });

      // معالجة رسائل التأكيد التلقائية
      if (!message.fromMe && message.body && message.type === 'chat') {
        console.log(`🔔 فحص رسالة للتأكيد: "${message.body}" من ${message.from}`);
        this.handleConfirmationMessage(platformId, message);
      }
    });

    // معالج إنشاء الرسائل (الرسائل المرسلة والمستلمة)
    client.on('message_create', (message: any) => {
      console.log(`✉️ رسالة ${message.fromMe ? 'مرسلة' : 'مستلمة'} للمنصة ${platformId}:`, {
        من: message.from,
        المحتوى: message.body,
        الوقت: new Date(message.timestamp * 1000).toLocaleString('ar-SA')
      });
    });

    // معالج تحديث حالة الرسائل
    client.on('message_ack', (message: any, ack: any) => {
      let status = 'غير معروف';
      switch(ack) {
        case 1: status = 'مرسلة'; break;
        case 2: status = 'تم التسليم'; break;
        case 3: status = 'تمت القراءة'; break;
      }
      console.log(`📋 تحديث حالة الرسالة للمنصة ${platformId}: ${status}`);
    });
  }

  // معالج رسائل التأكيد التلقائية
  private async handleConfirmationMessage(platformId: string, message: any) {
    try {
      console.log(`🔍 فحص رسالة للتأكيد في المنصة ${platformId}: "${message.body}"`);
      
      const messageBody = message.body.trim();
      const confirmationWords = ['تم', 'اكد', 'أكد', 'تاكيد', 'تأكيد', 'موافق', 'نعم', 'اوكى', 'اوكي', 'ok', 'OK'];
      
      // التحقق من وجود كلمة تأكيد في الرسالة (بدون تحويل إلى أحرف صغيرة للعربية)
      const isConfirmation = confirmationWords.some(word => {
        if (word === word.toLowerCase()) {
          // كلمة إنجليزية
          return messageBody.toLowerCase().includes(word);
        } else {
          // كلمة عربية
          return messageBody.includes(word);
        }
      });
      
      const matchedWords = confirmationWords.filter(word => {
        if (word === word.toLowerCase()) {
          return messageBody.toLowerCase().includes(word);
        } else {
          return messageBody.includes(word);
        }
      });
      console.log(`🔍 كلمات التأكيد المطابقة: ${matchedWords.join(', ')}`);
      console.log(`📋 هل هي رسالة تأكيد؟ ${isConfirmation ? 'نعم' : 'لا'}`);
      
      if (isConfirmation) {
        console.log(`🔔 رسالة تأكيد مكتشفة من ${message.from}: "${message.body}"`);
        
        // استخراج رقم الهاتف من معرف المرسل
        const phoneNumber = message.from.replace('@c.us', '');
        console.log(`📞 رقم الهاتف المستخرج: ${phoneNumber}`);
        
        // البحث عن طلبات معلقة لهذا الرقم في هذه المنصة
        await this.confirmPendingOrdersByPhone(platformId, phoneNumber, message);
      } else {
        console.log(`ℹ️ الرسالة لا تحتوي على كلمة تأكيد`);
      }
    } catch (error) {
      console.error(`خطأ في معالجة رسالة التأكيد:`, error);
    }
  }

  // تأكيد الطلبات المعلقة حسب رقم الهاتف
  private async confirmPendingOrdersByPhone(platformId: string, phoneNumber: string, message: any) {
    try {
      // استيراد مؤقت للخدمات المطلوبة
      const { storage } = await import('./storage.js');
      
      console.log(`🔍 البحث عن طلبات معلقة للرقم ${phoneNumber} في المنصة ${platformId}`);
      
      // الحصول على جميع المنصات وربطها بمعرف WhatsApp
      // نحتاج للعثور على معرف المنصة الصحيح في قاعدة البيانات
      const actualPlatformId = await this.getActualPlatformId(platformId);
      console.log(`📋 معرف المنصة الحقيقي: ${actualPlatformId}`);
      
      if (!actualPlatformId) {
        console.log(`⚠️ لم يتم العثور على معرف المنصة الصحيح`);
        return;
      }
      
      // البحث عن الطلبات المعلقة
      const pendingOrders = await storage.getPendingOrdersByPhoneAndPlatform(phoneNumber, actualPlatformId);
      
      if (pendingOrders && pendingOrders.length > 0) {
        console.log(`📋 تم العثور على ${pendingOrders.length} طلب معلق للتأكيد`);
        
        for (const order of pendingOrders) {
          // تحديث حالة الطلب إلى مؤكد
          await storage.updateOrderStatus(order.id, 'confirmed');
          console.log(`✅ تم تأكيد الطلب رقم ${order.orderNumber || order.order_number} تلقائياً`);
          
          // إرسال رسالة تأكيد للعميل
          const confirmationReply = `✅ *تم تأكيد طلبك بنجاح*\n\nرقم الطلب: #${order.orderNumber || order.order_number}\nشكراً لك! سيتم التواصل معك قريباً لترتيب التوصيل 🚛`;
          
          const client = whatsappClients.get(platformId);
          if (client) {
            await client.sendMessage(message.from, confirmationReply);
            console.log(`📤 تم إرسال رسالة تأكيد التلقائية للعميل`);
          }
        }
      } else {
        console.log(`ℹ️ لم يتم العثور على طلبات معلقة للرقم ${phoneNumber}`);
      }
      
    } catch (error) {
      console.error(`خطأ في تأكيد الطلبات المعلقة:`, error);
    }
  }

  // العثور على معرف المنصة الحقيقي من قاعدة البيانات
  private async getActualPlatformId(whatsappPlatformId: string): Promise<string | null> {
    try {
      const { storage } = await import('./storage.js');
      
      // البحث عن المنصة باستخدام whatsappPlatformId مباشرة
      const platform = await storage.getPlatformById(whatsappPlatformId);
      
      if (platform) {
        console.log(`✅ العثور على المنصة: ${platform.id} - ${platform.platformName}`);
        return platform.id;
      }
      
      // إذا لم نجد المنصة، نبحث في جميع المنصات
      const platforms = await storage.getAllPlatforms();
      
      for (const platform of platforms) {
        // البحث عن المنصة التي لها نفس رقم WhatsApp
        if (platform.whatsappNumber) {
          const sessionState = sessionStates.get(whatsappPlatformId);
          if (sessionState && sessionState.phoneNumber && 
              platform.whatsappNumber.includes(sessionState.phoneNumber.replace('+', ''))) {
            console.log(`✅ العثور على المنصة بالرقم: ${platform.id} - ${platform.platformName}`);
            return platform.id;
          }
        }
      }
      
      // كحل أخير، نعيد أول منصة متاحة
      if (platforms.length > 0) {
        console.log(`⚠️ استخدام أول منصة متاحة: ${platforms[0].id}`);
        return platforms[0].id;
      }
      
      return null;
    } catch (error) {
      console.error(`خطأ في العثور على معرف المنصة:`, error);
      return null;
    }
  }
}

// إنشاء instance واحد من الخدمة
export const whatsappGateway = new WhatsAppGateway();
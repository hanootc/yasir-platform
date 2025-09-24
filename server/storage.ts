import {
  users,
  platforms,
  products,
  categories,
  landingPages,
  orders,
  orderItems,
  activities,
  landingPageOrders,
  systemSettings,
  tiktokCampaigns,
  tiktokAdGroups,
  tiktokAds,
  tiktokLeadForms,
  tiktokLeads,
  tiktokPixels,
  chartOfAccounts,
  transactions,
  transactionEntries,
  cashAccounts,
  cashTransactions,
  expenses,
  expenseCategories,
  budgets,
  productColors,
  productShapes,
  productSizes,
  productVariants,
  dailyAdSpend,
  zainCashPayments,
  type User,
  type UpsertUser,
  type Platform,
  type InsertPlatform,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type LandingPage,
  type InsertLandingPage,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Activity,
  type InsertActivity,
  type LandingPageOrder,
  type InsertLandingPageOrder,
  type TiktokCampaign,
  type InsertTiktokCampaign,
  type TiktokAdGroup,
  type InsertTiktokAdGroup,
  type TiktokAd,
  type InsertTiktokAd,
  type TiktokLeadForm,
  type InsertTiktokLeadForm,
  type TiktokLead,
  type InsertTiktokLead,
  type TiktokPixel,
  type InsertTiktokPixel,
  adPlatformSettings,
  type AdPlatformSettings,
  type InsertAdPlatformSettings,
  adAccounts,
  platformAdAccounts,
  type AdAccount,
  type InsertAdAccount,
  type PlatformAdAccount,
  type InsertPlatformAdAccount,
  deliverySettings,
  type DeliverySettings,
  type InsertDeliverySettings,
  employees,
  employeePermissions,
  employeeSessions,
  employeeActivities,
  employeeDepartments,
  employeePositions,
  type Employee,
  type InsertEmployee,
  type EmployeePermission,
  type InsertEmployeePermission,
  type DailyAdSpend,
  type InsertDailyAdSpend,
  type EmployeeSession,
  type InsertEmployeeSession,
  type EmployeeActivity,
  type InsertEmployeeActivity,
  type EmployeeDepartment,
  type InsertEmployeeDepartment,
  type EmployeePosition,
  type InsertEmployeePosition,
  type ProductColor,
  type InsertProductColor,
  type ProductShape,
  type InsertProductShape,
  type ProductSize,
  type InsertProductSize,
  type ProductVariant,
  type InsertProductVariant,
  type ZainCashPayment,
  type InsertZainCashPayment,
  platformThemes,
  adminUsers,
  type PlatformTheme,
  type InsertPlatformTheme,
  type UpdatePlatformTheme,
  type SelectAdminUser,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, count, sum, sql, and, gte, lte, inArray, or, like, isNull, isNotNull, exists, ilike } from "drizzle-orm";
import { localStorage } from "./localStorage";

export interface IStorage {
  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser, userId: string): Promise<User>;

  // Platform operations
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  getPlatform(id: string): Promise<Platform | undefined>;
  getPlatformById(id: string): Promise<Platform | undefined>;
  getPlatformBySubdomain(subdomain: string): Promise<Platform | undefined>;
  getAllPlatforms(): Promise<Platform[]>;
  getPlatformBySlug(slug: string): Promise<Platform | undefined>;
  getPlatformStats(platformId: string): Promise<any>;
  getPlatformGovernorateStats(platformId: string): Promise<any>;
  getPlatformChartData(platformId: string, period: string): Promise<any>;
  getPlatformOrders(platformId: string): Promise<any[]>;
  getPlatformRecentOrders(platformId: string): Promise<any[]>;
  getPlatformTopProducts(platformId: string): Promise<any[]>;
  getPlatformProducts(platformId: string): Promise<Product[]>;
  getPlatformCategories(platformId: string): Promise<Category[]>;
  getProductsByPlatform(platformId: string): Promise<Product[]>;
  getActiveProductsByPlatform(platformId: string): Promise<Product[]>;
  getActiveProductsByPlatformAndCategory(platformId: string, categoryId: string): Promise<Product[]>;
  getActiveCategoriesWithProductCount(platformId: string): Promise<any[]>;
  getOrdersByPlatform(platformId: string): Promise<Order[]>;
  getPlatformColors(platformId: string): Promise<ProductColor[]>;
  getPlatformShapes(platformId: string): Promise<ProductShape[]>;
  getPlatformSizes(platformId: string): Promise<ProductSize[]>;
  


  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  checkProductHasOrders(productId: string): Promise<boolean>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoriesByPlatform(platformId: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Product Variants operations
  getProductColors(productId: string): Promise<ProductColor[]>;
  getProductColor(id: string): Promise<ProductColor | undefined>;
  createProductColor(color: InsertProductColor): Promise<ProductColor>;
  updateProductColor(id: string, color: Partial<InsertProductColor>): Promise<ProductColor>;
  deleteProductColor(id: string): Promise<void>;

  getProductShapes(productId: string): Promise<ProductShape[]>;
  getProductShape(id: string): Promise<ProductShape | undefined>;
  createProductShape(shape: InsertProductShape): Promise<ProductShape>;
  updateProductShape(id: string, shape: Partial<InsertProductShape>): Promise<ProductShape>;
  deleteProductShape(id: string): Promise<void>;

  getProductSizes(productId: string): Promise<ProductSize[]>;
  getProductSize(id: string): Promise<ProductSize | undefined>;
  createProductSize(size: InsertProductSize): Promise<ProductSize>;
  updateProductSize(id: string, size: Partial<InsertProductSize>): Promise<ProductSize>;
  deleteProductSize(id: string): Promise<void>;

  getProductVariants(productId: string): Promise<ProductVariant[]>;
  getProductVariant(id: string): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant>;
  deleteProductVariant(id: string): Promise<void>;

  // Landing page operations
  getLandingPages(): Promise<LandingPage[]>;
  getLandingPage(id: string): Promise<LandingPage | undefined>;
  getLandingPageByUrl(url: string): Promise<LandingPage | undefined>;
  getLandingPageByCustomUrl(customUrl: string): Promise<LandingPage | undefined>;
  getLandingPageBySlugAndPlatform(slug: string, platformId: string): Promise<LandingPage | undefined>;
  getLandingPagesByProduct(productId: string, platformId: string): Promise<LandingPage[]>;
  getLandingPagesByPlatform(platformId: string): Promise<LandingPage[]>;
  createLandingPage(page: InsertLandingPage): Promise<LandingPage>;
  updateLandingPage(id: string, page: Partial<InsertLandingPage>): Promise<LandingPage>;
  deleteLandingPage(id: string): Promise<void>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getAllOrders(): Promise<any[]>; // Combined orders from both tables
  getOrder(id: string): Promise<Order | undefined>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<any>;

  // Landing page order operations
  getLandingPageOrders(): Promise<LandingPageOrder[]>;
  getLandingPageOrderById(id: string): Promise<LandingPageOrder | undefined>;
  getLandingPageOrdersByPageId(landingPageId: string, limit?: number): Promise<LandingPageOrder[]>;
  createLandingPageOrder(order: InsertLandingPageOrder): Promise<LandingPageOrder>;
  updateLandingPageOrderStatus(id: string, status: string): Promise<LandingPageOrder | undefined>;

  // Activity operations
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard operations
  getDashboardStats(): Promise<any>;
  getTopProducts(): Promise<any[]>;
  getRecentOrders(): Promise<any[]>;
  getSalesChartData(period: string): Promise<any[]>;

  // Inventory operations
  getPlatformInventory(platformId: string, filters: { fromDate: Date; toDate: Date; lowStockOnly: boolean }): Promise<any[]>;
  getInventorySummary(platformId: string, filters: { fromDate: Date; toDate: Date }): Promise<any>;
  updateProductStock(productId: string, stock: number, platformId: string): Promise<Product | undefined>;
  updateProductThreshold(productId: string, lowStockThreshold: number, platformId: string): Promise<Product | undefined>;
  getCurrentPlatform(req: any): Promise<Platform | undefined>;

  // WhatsApp-Order linking operations
  getOrdersByPhone(platformId: string, phoneVariations: string[]): Promise<Order[]>;
  getLandingPageOrdersByPhone(platformId: string, phoneVariations: string[]): Promise<LandingPageOrder[]>;
  getUserPlatform(userId: string): Promise<string | undefined>;
  getPendingOrdersByPhoneAndPlatform(phoneNumber: string, platformId: string): Promise<any[]>;

  // System Settings operations
  getSystemSetting(key: string): Promise<any>;
  setSystemSetting(key: string, value: string, description?: string): Promise<any>;

  // Platform Themes operations
  getPlatformTheme(platformId: string): Promise<PlatformTheme | undefined>;
  createPlatformTheme(theme: InsertPlatformTheme): Promise<PlatformTheme>;
  updatePlatformTheme(platformId: string, theme: Partial<UpdatePlatformTheme>): Promise<PlatformTheme>;
  deletePlatformTheme(platformId: string): Promise<void>;

  // TikTok Ads operations
  getTikTokCampaigns(platformId: string): Promise<TiktokCampaign[]>;
  getTikTokCampaign(id: string): Promise<TiktokCampaign | undefined>;
  getTikTokCampaignById(id: string): Promise<TiktokCampaign | undefined>;
  getTikTokCampaignByCampaignId(campaignId: string): Promise<TiktokCampaign | undefined>;
  upsertTikTokCampaign(campaignId: string, campaign: Partial<InsertTiktokCampaign>): Promise<TiktokCampaign>;
  updateTikTokCampaignStats(campaignId: string, stats: any): Promise<void>;
  updateTikTokCampaignStatus(id: string, status: string): Promise<TiktokCampaign>;
  
  getTikTokAdGroups(platformId: string, campaignId?: string): Promise<TiktokAdGroup[]>;
  getTikTokAdGroup(id: string): Promise<TiktokAdGroup | undefined>;
  upsertTikTokAdGroup(adGroupId: string, adGroup: Partial<InsertTiktokAdGroup>): Promise<TiktokAdGroup>;
  
  getTikTokAds(platformId: string, campaignId?: string, adGroupId?: string): Promise<TiktokAd[]>;
  getTikTokAd(id: string): Promise<TiktokAd | undefined>;
  upsertTikTokAd(adId: string, ad: Partial<InsertTiktokAd>): Promise<TiktokAd>;
  updateTikTokAdStatus(id: string, status: string): Promise<TiktokAd>;
  updateTikTokAdStats(adId: string, stats: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    conversions?: number;
    leads?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
    conversionRate?: number;
    conversionCost?: number;
    resultRate?: number;
  }): Promise<TiktokAd>;
  
  getTikTokLeadForms(platformId: string): Promise<TiktokLeadForm[]>;
  getTikTokLeadForm(id: string): Promise<TiktokLeadForm | undefined>;
  getTikTokLeadFormByFormId(formId: string): Promise<TiktokLeadForm | undefined>;
  createTikTokLeadForm(leadForm: InsertTiktokLeadForm): Promise<TiktokLeadForm>;
  upsertTikTokLeadForm(formId: string, leadForm: Partial<InsertTiktokLeadForm>): Promise<TiktokLeadForm>;
  updateTikTokLeadForm(id: string, updates: Partial<TiktokLeadForm>): Promise<TiktokLeadForm>;
  deleteTikTokLeadForm(id: string): Promise<void>;
  
  getTikTokLeads(platformId: string, formId?: string): Promise<TiktokLead[]>;
  getTikTokLead(id: string): Promise<TiktokLead | undefined>;
  createTikTokLead(lead: InsertTiktokLead): Promise<TiktokLead>;
  createLeadSubmission(submissionData: any): Promise<any>;
  getLeadSubmissionByTikTokId(tiktokLeadId: string): Promise<any>;
  updateTikTokLeadStatus(id: string, status: string, notes?: string): Promise<TiktokLead>;
  
  getTikTokPixels(platformId: string): Promise<TiktokPixel[]>;
  getTikTokPixel(id: string): Promise<TiktokPixel | undefined>;
  createTikTokPixel(pixel: InsertTiktokPixel): Promise<TiktokPixel>;
  updatePixel(pixelId: string, updates: Partial<TiktokPixel>): Promise<TiktokPixel | undefined>;

  // Ad Platform Settings operations
  getAdPlatformSettings(platformId: string): Promise<AdPlatformSettings | undefined>;
  createAdPlatformSettings(settings: InsertAdPlatformSettings): Promise<AdPlatformSettings>;
  updateAdPlatformSettings(platformId: string, settings: Partial<InsertAdPlatformSettings>): Promise<AdPlatformSettings>;

  // Accounting System operations
  getAccountingSummary(platformId: string): Promise<any>;
  
  // Chart of Accounts
  getChartOfAccounts(platformId: string): Promise<any[]>;
  createChartAccount(accountData: any): Promise<any>;
  updateChartAccount(accountId: string, updates: any): Promise<any>;
  deleteChartAccount(accountId: string): Promise<void>;
  
  // Transactions
  getTransactions(platformId: string, page: number, limit: number, filters: any): Promise<any>;
  createTransaction(transactionData: any): Promise<any>;
  updateTransactionStatus(transactionId: string, status: string, approvedBy?: string): Promise<any>;
  
  // Cash Accounts
  getCashAccounts(platformId: string): Promise<any[]>;
  createCashAccount(accountData: any): Promise<any>;
  updateCashAccount(accountId: string, updates: any): Promise<any>;
  
  // Cash Transactions
  getCashTransactions(platformId: string, page: number, limit: number, filters: any): Promise<any>;
  createCashTransaction(transactionData: any): Promise<any>;
  
  // Expenses
  getExpenses(platformId: string, page: number, limit: number, filters: any): Promise<any>;
  createExpense(expenseData: any): Promise<any>;
  updateExpense(expenseId: string, updates: any): Promise<any>;
  deleteExpense(expenseId: string): Promise<void>;
  
  // Expense Categories
  getExpenseCategories(platformId: string): Promise<any[]>;
  createExpenseCategory(categoryData: any): Promise<any>;
  updateExpenseCategory(categoryId: string, updates: any): Promise<any>;
  
  // Budgets
  getBudgets(platformId: string, filters: any): Promise<any[]>;
  createBudget(budgetData: any): Promise<any>;
  updateBudget(budgetId: string, updates: any): Promise<any>;
  
  // Financial Reports
  getProfitLossReport(platformId: string, fromDate: Date, toDate: Date): Promise<any>;
  getBalanceSheetReport(platformId: string, asOfDate: Date): Promise<any>;
  getCashFlowReport(platformId: string, fromDate: Date, toDate: Date): Promise<any>;
  
  // Employee operations
  getEmployees(platformId: string): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  
  // Employee permissions operations
  getEmployeePermissions(employeeId: string): Promise<EmployeePermission[]>;
  grantEmployeePermission(permission: InsertEmployeePermission): Promise<EmployeePermission>;
  revokeEmployeePermission(employeeId: string, permission: string): Promise<void>;
  
  // Employee sessions operations
  createEmployeeSession(session: InsertEmployeeSession): Promise<EmployeeSession>;
  validateEmployeeSession(sessionToken: string): Promise<Employee | undefined>;
  revokeEmployeeSession(sessionToken: string): Promise<void>;
  
  // Employee activities operations
  logEmployeeActivity(activity: InsertEmployeeActivity): Promise<EmployeeActivity>;
  getEmployeeActivities(platformId: string, employeeId?: string, limit?: number): Promise<EmployeeActivity[]>;
  
  // Employee departments operations
  createDefaultDepartments(platformId: string): Promise<void>;
  getEmployeeDepartments(platformId: string): Promise<EmployeeDepartment[]>;
  createEmployeeDepartment(department: InsertEmployeeDepartment): Promise<EmployeeDepartment>;
  updateEmployeeDepartment(id: string, department: Partial<InsertEmployeeDepartment>): Promise<EmployeeDepartment>;
  deleteEmployeeDepartment(id: string): Promise<void>;
  
  // Employee positions operations
  getEmployeePositions(platformId: string, departmentId?: string): Promise<EmployeePosition[]>;
  createEmployeePosition(position: InsertEmployeePosition): Promise<EmployeePosition>;
  updateEmployeePosition(id: string, position: Partial<InsertEmployeePosition>): Promise<EmployeePosition>;
  deleteEmployeePosition(id: string): Promise<void>;

  // Daily ad spend operations
  getDailyAdSpend(platformId: string, date: string): Promise<DailyAdSpend | undefined>;
  getDailyAdSpendsByDateRange(platformId: string, startDate: string, endDate: string): Promise<DailyAdSpend[]>;
  createOrUpdateDailyAdSpend(adSpend: InsertDailyAdSpend): Promise<DailyAdSpend>;
  getTotalAdSpendForPeriod(platformId: string, startDate: string, endDate: string): Promise<number>;

  // ZainCash Payment operations
  createZainCashPayment(payment: InsertZainCashPayment): Promise<ZainCashPayment>;
  getZainCashPaymentByOrderId(orderId: string): Promise<ZainCashPayment | undefined>;
  updateZainCashPayment(orderId: string, updates: Partial<ZainCashPayment>): Promise<ZainCashPayment>;
  getZainCashPaymentsByPlatformId(platformId: string): Promise<ZainCashPayment[]>;

  // Ad Account operations
  createAdAccount(account: InsertAdAccount): Promise<AdAccount>;
  getAdAccount(id: string): Promise<AdAccount | undefined>;
  getAdAccountByAdvertiserId(advertiserId: string): Promise<AdAccount | undefined>;
  getAllAdAccounts(): Promise<AdAccount[]>;
  updateAdAccount(id: string, updates: Partial<InsertAdAccount>): Promise<AdAccount>;
  deleteAdAccount(id: string): Promise<void>;
  updateAdAccountBalance(advertiserId: string, balance: number): Promise<void>;

  // Platform Ad Account connections
  connectAdAccountToPlatform(platformId: string, adAccountId: string): Promise<PlatformAdAccount>;
  disconnectAdAccountFromPlatform(platformId: string, adAccountId: string): Promise<void>;
  getAdAccountsByPlatform(platformId: string): Promise<AdAccount[]>;
  getPlatformsByAdAccount(adAccountId: string): Promise<Platform[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser, userId: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...userData, id: userId })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Platform operations
  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(platforms).values(platform).returning();
    
    // إضافة التصنيفات الافتراضية المنزلية
    await this.createDefaultCategories(newPlatform.id);
    
    // إنشاء الأقسام الثابتة للمنصة الجديدة
    await this.createDefaultDepartments(newPlatform.id);
    
    return newPlatform;
  }

  async getPlatformByPhoneNumber(phoneNumber: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.phoneNumber, phoneNumber));
    return platform;
  }

  async getPlatformByWhatsAppNumber(whatsappNumber: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.whatsappNumber, whatsappNumber));
    return platform;
  }

  // إنشاء التصنيفات الافتراضية لمنصة جديدة
  async createDefaultCategories(platformId: string): Promise<void> {
    const defaultCategories = [
      { name: 'أجهزة منزلية', description: 'أجهزة كهربائية ومنزلية', icon: 'home', googleCategory: 'Home & Garden > Household Appliances' },
      { name: 'أدوات مطبخ', description: 'أدوات ومعدات المطبخ والطبخ', icon: 'utensils', googleCategory: 'Home & Garden > Kitchen & Dining' },
      { name: 'ديكور منزلي', description: 'مستلزمات تزيين وديكور المنزل', icon: 'sparkles', googleCategory: 'Home & Garden > Decor' },
      { name: 'أدوات تنظيف', description: 'مواد ومعدات التنظيف المنزلي', icon: 'wrench', googleCategory: 'Home & Garden > Household Supplies' },
      { name: 'منسوجات منزلية', description: 'مفارش وستائر وملابس منزلية', icon: 'shirt', googleCategory: 'Home & Garden > Linens & Bedding' },
      { name: 'أدوات حديقة', description: 'مستلزمات العناية بالحديقة والنباتات', icon: 'trees', googleCategory: 'Home & Garden > Lawn & Garden' },
      { name: 'الأطفال والأسرة', description: 'منتجات الأطفال ومستلزمات الأسرة', icon: 'baby', googleCategory: 'Baby & Toddler > Baby Care' },
      { name: 'صحة ورياضة', description: 'أدوات الصحة واللياقة البدنية', icon: 'heart-pulse', googleCategory: 'Sporting Goods > Fitness & Recreation' }
    ];

    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      platformId,
      isActive: true
    }));

    await db.insert(categories).values(categoriesToInsert);
  }



  async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined> {
    const [platform] = await db.update(platforms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platforms.id, id))
      .returning();
    return platform;
  }

  async getPlatform(id: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform;
  }

  async getPlatformById(id: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform;
  }

  async getPlatformBySubdomain(subdomain: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.subdomain, subdomain));
    return platform;
  }

  async getAllPlatforms(): Promise<Platform[]> {
    const platformsList = await db.select().from(platforms);
    return platformsList;
  }

  async getPlatformBySlug(slug: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.subdomain, slug));
    return platform;
  }

  async getPlatformStats(platformId: string): Promise<any> {
    // إحصائيات المنصة - استخدام landing_page_orders بدلاً من orders
    const totalProducts = await db.select({ count: sql`count(*)` }).from(products).where(eq(products.platformId, platformId));
    const totalOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders).where(eq(landingPageOrders.platformId, platformId));
    
    // حساب كل حالة بشكل منفصل
    const pendingOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'pending'`);
    
    const confirmedOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'confirmed'`);
    
    const shippedOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'shipped'`);
    
    const deliveredOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'delivered'`);
    
    const processingOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'processing'`);
    
    const cancelledOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'cancelled'`);
    
    const refundedOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'refunded'`);
    
    const noAnswerOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'no_answer'`);
    
    const postponedOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'postponed'`);
    
    const returnedOrders = await db.select({ count: sql`count(*)` }).from(landingPageOrders)
      .where(sql`${landingPageOrders.platformId} = ${platformId} AND ${landingPageOrders.status} = 'returned'`);
    
    // حساب إجمالي المبيعات من الطلبات المؤكدة والمشحونة والمسلمة فقط
    const revenueResult = await db.select({ total: sql`sum(CAST(${landingPageOrders.totalAmount} AS DECIMAL))` })
      .from(landingPageOrders)
      .where(
        and(
          eq(landingPageOrders.platformId, platformId),
          or(
            eq(landingPageOrders.status, 'confirmed'),
            eq(landingPageOrders.status, 'shipped'), 
            eq(landingPageOrders.status, 'delivered')
          )
        )
      );

    const stats = {
      totalProducts: parseInt(totalProducts[0]?.count as string) || 0,
      totalOrders: parseInt(totalOrders[0]?.count as string) || 0,
      pendingOrders: parseInt(pendingOrders[0]?.count as string) || 0,
      confirmedOrders: parseInt(confirmedOrders[0]?.count as string) || 0,
      shippedOrders: parseInt(shippedOrders[0]?.count as string) || 0,
      deliveredOrders: parseInt(deliveredOrders[0]?.count as string) || 0,
      processingOrders: parseInt(processingOrders[0]?.count as string) || 0,
      cancelledOrders: parseInt(cancelledOrders[0]?.count as string) || 0,
      refundedOrders: parseInt(refundedOrders[0]?.count as string) || 0,
      noAnswerOrders: parseInt(noAnswerOrders[0]?.count as string) || 0,
      postponedOrders: parseInt(postponedOrders[0]?.count as string) || 0,
      returnedOrders: parseInt(returnedOrders[0]?.count as string) || 0,
      totalRevenue: parseFloat(revenueResult[0]?.total as string) || 0,
    };

    console.log(`📊 Platform ${platformId} stats:`, stats);
    return stats;
  }

  async getPlatformGovernorateStats(platformId: string): Promise<any> {
    try {
      // جلب إحصائيات المحافظات من طلبات صفحات الهبوط
      const governorateStats = await db.execute(
        sql`SELECT 
          customer_governorate as governorate,
          COUNT(*) as orders,
          SUM(total_amount) as revenue
        FROM landing_page_orders 
        WHERE platform_id = ${platformId} AND status IN ('confirmed', 'shipped', 'delivered')
        GROUP BY customer_governorate
        ORDER BY orders DESC`
      );

      return governorateStats.rows.map((row: any) => ({
        governorate: row.governorate || 'غير محدد',
        orders: parseInt(row.orders) || 0,
        revenue: parseFloat(row.revenue) || 0
      }));
    } catch (error) {
      console.error('Error fetching governorate stats:', error);
      return [];
    }
  }

  async getPlatformOrders(platformId: string): Promise<any[]> {
    try {
      // جلب الطلبات من جدول landing_page_orders
      const landingOrders = await db.execute(
        sql`SELECT 
          lpo.id, lpo.order_number, lpo.customer_name, lpo.customer_phone, 
          lpo.customer_governorate, lpo.customer_address, lpo.total_amount, lpo.discount_amount,
          lpo.status, lpo.created_at, lpo.platform_id, lpo.offer, lpo.notes, lpo.quantity,
          lpo.landing_page_id, lpo.order_source, lpo.source_details,
          COALESCE(lpo.product_id, lp.product_id) as product_id, 
          COALESCE(NULLIF(lpo.product_name, ''), p.name) as product_name, 
          CASE 
            WHEN lpo.product_image_urls IS NOT NULL AND lpo.product_image_urls != '[]'::jsonb AND jsonb_array_length(lpo.product_image_urls) > 0
            THEN lpo.product_image_urls 
            ELSE to_jsonb(COALESCE(p.image_urls, ARRAY[]::text[])) 
          END as product_image_urls,
          lpo.selected_color_ids, lpo.selected_shape_ids, lpo.selected_size_ids,
          lpo.selected_color_id, lpo.selected_shape_id, lpo.selected_size_id,
          pc.color_name, pc.color_code, pc.color_image_url,
          ps.shape_name, ps.shape_image_url, 
          psize.size_name, psize.size_value,
          'landing_page' as order_type
        FROM landing_page_orders lpo
        LEFT JOIN landing_pages lp ON lpo.landing_page_id = lp.id
        LEFT JOIN products p ON COALESCE(lpo.product_id, lp.product_id) = p.id
        LEFT JOIN product_colors pc ON lpo.selected_color_id = pc.id
        LEFT JOIN product_shapes ps ON lpo.selected_shape_id = ps.id  
        LEFT JOIN product_sizes psize ON lpo.selected_size_id = psize.id
        WHERE lpo.platform_id = ${platformId}`
      );

      // جلب الطلبات من جدول orders العادي
      const regularOrders = await db.execute(
        sql`SELECT 
          o.id, o.order_number::text as order_number, o.customer_name, o.customer_phone,
          o.customer_governorate, o.customer_address, o.total::text as total_amount, 
          o.discount_amount::text as discount_amount, o.status, o.created_at, o.platform_id,
          oi.offer, o.notes, oi.quantity, null as landing_page_id, o.order_source, o.source_details,
          oi.product_id, p.name as product_name, p.image_urls as product_image_urls,
          oi.selected_color_ids, oi.selected_shape_ids, oi.selected_size_ids,
          oi.selected_color_id, oi.selected_shape_id, oi.selected_size_id,
          pc.color_name, pc.color_code, pc.color_image_url,
          ps.shape_name, ps.shape_image_url,
          psize.size_name, psize.size_value,
          'regular' as order_type
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_colors pc ON oi.selected_color_id = pc.id
        LEFT JOIN product_shapes ps ON oi.selected_shape_id = ps.id  
        LEFT JOIN product_sizes psize ON oi.selected_size_id = psize.id
        WHERE o.platform_id = ${platformId}`
      );

      // دمج النتائج
      const allOrders = [...landingOrders.rows, ...regularOrders.rows];
      
      console.log(`Found ${allOrders.length} orders for platform ${platformId} (${landingOrders.rows.length} landing, ${regularOrders.rows.length} regular)`);

      // ترتيب الطلبات حسب التاريخ (الأحدث أولاً)
      allOrders.sort((a: any, b: any) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());

      // Transform the data to match expected format
      return allOrders.map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        customerEmail: null, // Landing page orders don't have email field
        customerPhone: row.customer_phone,
        customerGovernorate: row.customer_governorate,
        customerAddress: row.customer_address,
        totalAmount: parseFloat(row.total_amount || "0"),
        discountAmount: parseFloat(row.discount_amount || "0"),
        status: row.status,
        createdAt: row.created_at,
        platformId: row.platform_id,
        type: row.order_type || 'landing_page',
        offer: row.offer,
        notes: row.notes,
        orderSource: row.order_source,
        sourceDetails: row.source_details,
        quantity: parseInt(row.quantity || "1"), // إضافة حقل الكمية
        productId: row.product_id,
        productName: row.product_name,
        imageUrls: row.product_image_urls,
        // معلومات المتغيرات المختارة (متعددة)
        selectedColorIds: row.selected_color_ids ? (typeof row.selected_color_ids === 'string' ? JSON.parse(row.selected_color_ids) : row.selected_color_ids) : [],
        selectedShapeIds: row.selected_shape_ids ? (typeof row.selected_shape_ids === 'string' ? JSON.parse(row.selected_shape_ids) : row.selected_shape_ids) : [],
        selectedSizeIds: row.selected_size_ids ? (typeof row.selected_size_ids === 'string' ? JSON.parse(row.selected_size_ids) : row.selected_size_ids) : [],
        // معلومات المتغيرات المختارة (مفردة - للتوافق مع النظام القديم)
        selectedColorId: row.selected_color_id,
        selectedShapeId: row.selected_shape_id,
        selectedSizeId: row.selected_size_id,
        // تفاصيل المتغيرات
        selectedColor: row.color_name ? {
          id: row.selected_color_id,
          name: row.color_name,
          code: row.color_code,
          imageUrl: row.color_image_url
        } : null,
        selectedShape: row.shape_name ? {
          id: row.selected_shape_id,
          name: row.shape_name,
          imageUrl: row.shape_image_url
        } : null,
        selectedSize: row.size_name ? {
          id: row.selected_size_id,
          name: row.size_name,
          sizeValue: row.size_value
        } : null,
        // إضافة أسماء المتغيرات المباشرة للعرض (backward compatibility)
        selectedColorName: row.color_name,
        selectedShapeName: row.shape_name,
        selectedSizeName: row.size_name,
        selectedColorCode: row.color_code,
        selectedColorImageUrl: row.color_image_url,
        selectedShapeImageUrl: row.shape_image_url,
        selectedSizeValue: row.size_value
      }));
    } catch (error) {
      console.error('Error in getPlatformOrders:', error);
      return [];
    }
  }

  async getPlatformRecentOrders(platformId: string): Promise<any[]> {
    try {
      console.log('🔍 Getting recent orders for platform:', platformId);
      
      // البحث في جدول landing_page_orders (الطلبات الحقيقية)
      const recentOrders = await db
        .select({
          id: landingPageOrders.id,
          orderNumber: landingPageOrders.orderNumber,
          customerName: landingPageOrders.customerName,
          total: landingPageOrders.totalAmount,
          status: landingPageOrders.status,
          createdAt: landingPageOrders.createdAt,
        })
        .from(landingPageOrders)
        .where(eq(landingPageOrders.platformId, platformId))
        .orderBy(desc(landingPageOrders.createdAt))
        .limit(5);
      
      console.log('📋 Recent landing page orders found:', recentOrders.length, recentOrders);
      return recentOrders;
    } catch (error) {
      console.error('❌ Error in getPlatformRecentOrders:', error);
      return [];
    }
  }

  async getPlatformTopProducts(platformId: string): Promise<any[]> {
    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        orders: sql`0`.as('orders'), // سيتم حسابها لاحقاً من جدول الطلبات
      })
      .from(products)
      .where(eq(products.platformId, platformId))
      .orderBy(desc(products.createdAt))
      .limit(5);
    
    return topProducts;
  }

  async getPlatformProducts(platformId: string): Promise<Product[]> {
    try {
      const platformProducts = await db
        .select()
        .from(products)
        .where(eq(products.platformId, platformId))
        .orderBy(desc(products.createdAt));
      
      // If no products, return empty array
      if (platformProducts.length === 0) {
        return [];
      }

      // Get categories for these products
      const categoriesMap = new Map();
      // جلب الفئات بأمان (حتى لو لم يوجد googleCategory في قاعدة البيانات)
      let allCategories: any[] = [];
      try {
        allCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.platformId, platformId));
      } catch (error) {
        console.error('⚠️ Error fetching categories:', error);
        allCategories = [];
      }
      
      allCategories.forEach(cat => {
        categoriesMap.set(cat.id, cat);
      });

      // Get variants for each product
      const productsWithVariants = await Promise.all(
        platformProducts.map(async (product) => {
          // Get colors for this product
          const colors = await db
            .select()
            .from(productColors)
            .where(eq(productColors.productId, product.id));

          // Get shapes for this product
          const shapes = await db
            .select()
            .from(productShapes)
            .where(eq(productShapes.productId, product.id));

          // Get sizes for this product
          const sizes = await db
            .select()
            .from(productSizes)
            .where(eq(productSizes.productId, product.id));

          return {
            ...product,
            category: product.categoryId && categoriesMap.has(product.categoryId) 
              ? {
                  id: product.categoryId,
                  name: categoriesMap.get(product.categoryId)?.name,
                  googleCategory: categoriesMap.get(product.categoryId)?.googleCategory
                }
              : undefined,
            colors,
            shapes,
            sizes
          };
        })
      );
      
      return productsWithVariants as Product[];
    } catch (error) {
      console.error('Error fetching platform products:', error);
      return [];
    }
  }

  async getPlatformCategories(platformId: string): Promise<any[]> {
    try {
      const platformCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          icon: categories.icon,
          platformId: categories.platformId,
          isActive: categories.isActive,
          createdAt: categories.createdAt
        })
        .from(categories)
        .where(eq(categories.platformId, platformId))
        .orderBy(asc(categories.name));
      
      // Add product count manually for each category
      const categoriesWithCount = await Promise.all(
        platformCategories.map(async (category) => {
          const productCount = await db
            .select({ count: count() })
            .from(products)
            .where(and(
              eq(products.categoryId, category.id),
              eq(products.platformId, platformId),
              eq(products.isActive, true)
            ));
          
          return {
            ...category,
            productCount: productCount[0]?.count || 0
          };
        })
      );
      
      return categoriesWithCount;
    } catch (error) {
      console.error('Error fetching platform categories:', error);
      return [];
    }
  }

  async getProductsByPlatform(platformId: string): Promise<Product[]> {
    return this.getPlatformProducts(platformId);
  }

  async getActiveProductsByPlatform(platformId: string): Promise<Product[]> {
    try {
      const platformProducts = await db
        .select()
        .from(products)
        .where(and(
          eq(products.platformId, platformId),
          eq(products.isActive, true)
        ))
        .orderBy(desc(products.createdAt));

      // Get categories for the products
      const categoryIds = [...new Set(
        platformProducts
          .map(p => p.categoryId)
          .filter(id => id)
      )];

      let categoriesData: any[] = [];
      if (categoryIds.length > 0) {
        try {
          categoriesData = await db
            .select()
            .from(categories)
            .where(inArray(categories.id, categoryIds.filter((id): id is string => id !== null)));
        } catch (error) {
          console.error('⚠️ Error fetching categories (trying without googleCategory):', error);
          // Try without googleCategory column
          try {
            categoriesData = await db
              .select({
                id: categories.id,
                name: categories.name,
                description: categories.description,
                icon: categories.icon,
                platformId: categories.platformId,
                isActive: categories.isActive,
                createdAt: categories.createdAt
              })
              .from(categories)
              .where(inArray(categories.id, categoryIds.filter((id): id is string => id !== null)));
          } catch (fallbackError) {
            console.error('❌ Failed to fetch categories even without googleCategory:', fallbackError);
            categoriesData = [];
          }
        }
      }

      // Create a map for quick category lookup
      const categoriesMap = new Map(
        categoriesData.map(cat => [cat.id, cat])
      );

      // Add category info to products
      const productsWithCategories = platformProducts.map(product => ({
        ...product,
        category: product.categoryId && categoriesMap.has(product.categoryId) 
          ? {
              id: product.categoryId,
              name: categoriesMap.get(product.categoryId)?.name,
              googleCategory: (categoriesMap.get(product.categoryId) as any)?.googleCategory
            }
          : undefined
      }));
      
      return productsWithCategories as Product[];
    } catch (error) {
      console.error('Error fetching active products by platform:', error);
      return [];
    }
  }

  async getActiveProductsByPlatformAndCategory(platformId: string, categoryId: string): Promise<Product[]> {
    try {
      console.log('🔍 getActiveProductsByPlatformAndCategory called with:', { platformId, categoryId });
      
      const platformProducts = await db
        .select()
        .from(products)
        .where(and(
          eq(products.platformId, platformId),
          eq(products.categoryId, categoryId),
          eq(products.isActive, true)
        ))
        .orderBy(desc(products.createdAt));
        
      console.log('📊 Found products for category:', platformProducts.length);

      // Get category info (safely handle missing googleCategory column)
      let categoryData = null;
      try {
        const [result] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, categoryId));
        categoryData = result;
      } catch (error) {
        console.error('⚠️ Error fetching category data:', error);
        // Try without googleCategory column
        try {
          const [result] = await db
            .select({
              id: categories.id,
              name: categories.name,
              description: categories.description,
              icon: categories.icon,
              platformId: categories.platformId,
              isActive: categories.isActive,
              createdAt: categories.createdAt
            })
            .from(categories)
            .where(eq(categories.id, categoryId));
          categoryData = result;
        } catch (fallbackError) {
          console.error('❌ Failed to fetch category even without googleCategory:', fallbackError);
        }
      }

      // Add category info to products
      const productsWithCategories = platformProducts.map(product => ({
        ...product,
        category: categoryData ? {
          id: categoryData.id,
          name: categoryData.name,
          googleCategory: (categoryData as any).googleCategory
        } : undefined
      }));
      
      return productsWithCategories as Product[];
    } catch (error) {
      console.error('Error fetching active products by platform and category:', error);
      return [];
    }
  }

  async getActiveCategoriesWithProductCount(platformId: string): Promise<any[]> {
    try {
      const categoriesWithCount = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          icon: categories.icon,
          productCount: sql<number>`cast(count(${products.id}) as int)`
        })
        .from(categories)
        .leftJoin(products, and(
          eq(products.categoryId, categories.id),
          eq(products.isActive, true)
        ))
        .where(and(
          eq(categories.platformId, platformId),
          eq(categories.isActive, true)
        ))
        .groupBy(categories.id, categories.name, categories.description, categories.icon)
        .orderBy(categories.name);
      
      return categoriesWithCount;
    } catch (error) {
      console.error('Error fetching active categories with product count:', error);
      return [];
    }
  }

  async getOrdersByPlatform(platformId: string): Promise<Order[]> {
    try {
      // Get orders from the orders table
      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.platformId, platformId))
        .orderBy(desc(orders.createdAt));

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        ordersList.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          return {
            ...order,
            orderItems: items
          };
        })
      );

      return ordersWithItems as Order[];
    } catch (error) {
      console.error('Error getting orders by platform:', error);
      return [];
    }
  }

  async getPlatformColors(platformId: string): Promise<ProductColor[]> {
    try {
      const colors = await db
        .select({
          id: productColors.id,
          productId: productColors.productId,
          platformId: productColors.platformId,
          colorName: productColors.colorName,
          colorCode: productColors.colorCode,
          colorImageUrl: productColors.colorImageUrl,
          priceAdjustment: productColors.priceAdjustment,
          stockQuantity: productColors.stockQuantity,
          isActive: productColors.isActive,
          sortOrder: productColors.sortOrder,
          createdAt: productColors.createdAt,
          updatedAt: productColors.updatedAt
        })
        .from(productColors)
        .innerJoin(products, eq(productColors.productId, products.id))
        .where(eq(products.platformId, platformId))
        .orderBy(asc(productColors.colorName));

      return colors;
    } catch (error) {
      console.error('Error getting platform colors:', error);
      return [];
    }
  }

  async getPlatformShapes(platformId: string): Promise<ProductShape[]> {
    try {
      const shapes = await db
        .select({
          id: productShapes.id,
          productId: productShapes.productId,
          platformId: productShapes.platformId,
          shapeName: productShapes.shapeName,
          shapeDescription: productShapes.shapeDescription,
          shapeImageUrl: productShapes.shapeImageUrl,
          priceAdjustment: productShapes.priceAdjustment,
          stockQuantity: productShapes.stockQuantity,
          isActive: productShapes.isActive,
          sortOrder: productShapes.sortOrder,
          createdAt: productShapes.createdAt,
          updatedAt: productShapes.updatedAt
        })
        .from(productShapes)
        .innerJoin(products, eq(productShapes.productId, products.id))
        .where(eq(products.platformId, platformId))
        .orderBy(asc(productShapes.shapeName));

      return shapes;
    } catch (error) {
      console.error('Error getting platform shapes:', error);
      return [];
    }
  }

  async getPlatformSizes(platformId: string): Promise<ProductSize[]> {
    try {
      const sizes = await db
        .select({
          id: productSizes.id,
          productId: productSizes.productId,
          platformId: productSizes.platformId,
          sizeName: productSizes.sizeName,
          sizeValue: productSizes.sizeValue,
          sizeDescription: productSizes.sizeDescription,
          priceAdjustment: productSizes.priceAdjustment,
          stockQuantity: productSizes.stockQuantity,
          isActive: productSizes.isActive,
          sortOrder: productSizes.sortOrder,
          createdAt: productSizes.createdAt,
          updatedAt: productSizes.updatedAt
        })
        .from(productSizes)
        .innerJoin(products, eq(productSizes.productId, products.id))
        .where(eq(products.platformId, platformId))
        .orderBy(asc(productSizes.sizeName));

      return sizes;
    } catch (error) {
      console.error('Error getting platform sizes:', error);
      return [];
    }
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
  }

  async getCategoriesByPlatform(platformId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.platformId, platformId))
      .orderBy(asc(categories.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error) {
      console.error('Error fetching category with all columns:', error);
      // Fallback: select specific columns without googleCategory
      const [category] = await db.select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        icon: categories.icon,
        platformId: categories.platformId,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        googleCategory: sql<string | null>`NULL`.as('googleCategory') // إضافة googleCategory كـ NULL
      }).from(categories).where(eq(categories.id, id));
      return category;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const result = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          cost: products.cost,
          imageUrls: products.imageUrls,
          additionalImages: products.additionalImages, // إضافة الصور الإضافية
          offers: products.offers,
          priceOffers: products.priceOffers,
          twoItemPrice: products.twoItemPrice,
          threeItemPrice: products.threeItemPrice,
          bulkPrice: products.bulkPrice,
          bulkMinQuantity: products.bulkMinQuantity,
          isActive: products.isActive,
          platformId: products.platformId,
          categoryId: products.categoryId,
          category: categories.name,
          categoryName: categories.name, // إضافة categoryName أيضاً
          // categoryGoogleCategory: categories.googleCategory, // تعطيل مؤقت - العمود غير موجود
          stock: products.stock,
          lowStockThreshold: products.lowStockThreshold,
          sku: products.sku,
          slug: products.slug,
          defaultTheme: products.defaultTheme,
          defaultLandingTemplate: products.defaultLandingTemplate,
          createdBy: products.createdBy,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, id));
      
      console.log('🔍 Product with category data:', {
        productId: id,
        found: !!result[0],
        categoryId: result[0]?.categoryId,
        category: result[0]?.category,
        categoryName: result[0]?.categoryName
      });
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Error fetching product with category:', error);
      // Fallback: get product without category join but with all fields
      const [product] = await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        imageUrls: products.imageUrls,
        additionalImages: products.additionalImages,
        offers: products.offers,
        priceOffers: products.priceOffers,
        twoItemPrice: products.twoItemPrice,
        threeItemPrice: products.threeItemPrice,
        bulkPrice: products.bulkPrice,
        bulkMinQuantity: products.bulkMinQuantity,
        isActive: products.isActive,
        platformId: products.platformId,
        categoryId: products.categoryId,
        category: sql`NULL`.as('category'),
        stock: products.stock,
        lowStockThreshold: products.lowStockThreshold,
        sku: products.sku,
        slug: products.slug,
        defaultTheme: products.defaultTheme,
        defaultLandingTemplate: products.defaultLandingTemplate,
        createdBy: products.createdBy,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt
      }).from(products).where(eq(products.id, id));
      return product;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // الحصول على بيانات المنتج قبل الحذف
      const product = await this.getProduct(id);
      if (!product) {
        throw new Error("Product not found");
      }

      // جمع جميع الملفات التي يجب حذفها
      const filesToDelete: string[] = [];

      // إضافة صور المنتج الرئيسية
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        filesToDelete.push(...product.imageUrls);
      }

      // الحصول على ألوان المنتج وإضافة صورها
      const productColors = await this.getProductColors(id);
      for (const color of productColors) {
        if (color.colorImageUrl) {
          filesToDelete.push(color.colorImageUrl);
        }
      }

      // الحصول على أشكال المنتج وإضافة صورها
      const productShapes = await this.getProductShapes(id);
      for (const shape of productShapes) {
        if (shape.shapeImageUrl) {
          filesToDelete.push(shape.shapeImageUrl);
        }
      }

      // الحصول على أحجام المنتج وإضافة صورها (إن وجدت)
      const productSizes = await this.getProductSizes(id);
      for (const size of productSizes) {
        // Note: sizeImageUrl property doesn't exist in current schema
        // This code is kept for future compatibility
        const sizeImageUrl = (size as any).sizeImageUrl;
        if (sizeImageUrl) {
          filesToDelete.push(sizeImageUrl);
        }
      }

      // حذف جميع الملفات من نظام الملفات
      for (const filePath of filesToDelete) {
        if (filePath) {
          try {
            await localStorage.deleteFile(filePath);
            console.log(`✅ Deleted file: ${filePath}`);
          } catch (error) {
            console.error(`❌ Failed to delete file: ${filePath}`, error);
            // نستمر في الحذف حتى لو فشل حذف ملف واحد
          }
        }
      }

      // حذف صفحات الهبوط المرتبطة بالمنتج أولاً
      await db.delete(landingPages).where(eq(landingPages.productId, id));
      
      // حذف المنتج (سيتم حذف الألوان والأشكال والأحجام تلقائياً بسبب cascade)
      await db.delete(products).where(eq(products.id, id));

      console.log(`✅ Product ${id} and all associated files deleted successfully`);
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      throw error;
    }
  }

  async checkProductHasOrders(productId: string): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(orderItems)
      .where(eq(orderItems.productId, productId));
    
    return (result?.count || 0) > 0;
  }



  // Landing page operations
  async getLandingPages(): Promise<LandingPage[]> {
    return await db
      .select()
      .from(landingPages)
      .orderBy(desc(landingPages.createdAt));
  }

  async getLandingPage(id: string): Promise<LandingPage | undefined> {
    const [page] = await db.select().from(landingPages).where(eq(landingPages.id, id));
    return page;
  }

  async getLandingPageByUrl(url: string): Promise<LandingPage | undefined> {
    const [page] = await db.select().from(landingPages).where(eq(landingPages.customUrl, url));
    return page;
  }

  async getLandingPageByCustomUrl(customUrl: string): Promise<LandingPage | undefined> {
    console.log("=== STORAGE: Looking for landing page with customUrl:", customUrl);
    const [page] = await db.select().from(landingPages).where(eq(landingPages.customUrl, customUrl));
    console.log("=== STORAGE: Found page:", page ? "YES" : "NO", page?.id);
    return page;
  }

  async getLandingPageBySlugAndPlatform(slug: string, platformId: string): Promise<LandingPage | undefined> {
    const [page] = await db
      .select()
      .from(landingPages)
      .where(and(eq(landingPages.customUrl, slug), eq(landingPages.platformId, platformId)));
    return page;
  }

  async getLandingPagesByProduct(productId: string, platformId: string): Promise<LandingPage[]> {
    return await db
      .select()
      .from(landingPages)
      .where(and(
        eq(landingPages.productId, productId),
        eq(landingPages.platformId, platformId)
      ))
      .orderBy(desc(landingPages.createdAt));
  }

  async getLandingPagesByPlatform(platformId: string): Promise<any[]> {
    try {
      // Use raw SQL query to join with products table for product data
      const { pool } = await import("./db");
      const client = await pool.connect();
      
      try {
        const result = await client.query(
          `SELECT 
            lp.id,
            lp.product_id as "productId",
            lp.platform_id as "platformId", 
            lp.title,
            lp.content,
            lp.custom_url as "customUrl",
            lp.template,
            lp.is_active as "isActive",
            lp.views,
            lp.conversions,
            lp.created_by as "createdBy",
            lp.created_at as "createdAt",
            lp.updated_at as "updatedAt",
            p.name as product_name,
            p.image_urls as product_image_urls,
            p.price as product_price,
            CASE 
              WHEN p.image_urls IS NOT NULL AND array_length(p.image_urls, 1) > 0 
              THEN p.image_urls[1]
              ELSE NULL 
            END as product_image_url
           FROM landing_pages lp
           LEFT JOIN products p ON lp.product_id = p.id
           WHERE lp.platform_id = $1
           ORDER BY lp.created_at DESC`,
          [platformId]
        );
        
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error getting landing pages by platform:", error);
      // Fallback to original method if SQL fails
      return await db
        .select()
        .from(landingPages)
        .where(eq(landingPages.platformId, platformId))
        .orderBy(desc(landingPages.createdAt));
    }
  }

  async createLandingPage(page: InsertLandingPage): Promise<LandingPage> {
    // التحقق من وجود customUrl مكرر قبل الإدراج
    if (page.customUrl) {
      const existingPage = await this.getLandingPageByCustomUrl(page.customUrl);
      if (existingPage) {
        throw new Error(`الرابط المخصص '${page.customUrl}' مستخدم بالفعل`);
      }
    }
    
    const [newPage] = await db.insert(landingPages).values(page).returning();
    console.log(`✅ Created landing page: ${newPage.id} with URL: ${newPage.customUrl}`);
    return newPage;
  }

  async updateLandingPage(id: string, page: Partial<InsertLandingPage>): Promise<LandingPage> {
    // التحقق من وجود customUrl مكرر قبل التحديث (إذا تم تغيير الرابط)
    if (page.customUrl) {
      const existingPage = await this.getLandingPageByCustomUrl(page.customUrl);
      if (existingPage && existingPage.id !== id) {
        throw new Error(`الرابط المخصص '${page.customUrl}' مستخدم بالفعل`);
      }
    }
    
    const [updatedPage] = await db
      .update(landingPages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(landingPages.id, id))
      .returning();
    console.log(`✅ Updated landing page: ${updatedPage.id} with URL: ${updatedPage.customUrl}`);
    return updatedPage;
  }

  async deleteLandingPage(id: string): Promise<void> {
    await db.delete(landingPages).where(eq(landingPages.id, id));
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<any[]> {
    console.log("=== NEW ORDERS API CALLED ===");
    console.log("Fetching all orders from database...");
    
    try {
      // Get regular orders
      const regularOrders = await db.select().from(orders);
      
      // Get landing page orders
      const lpOrders = await db.select().from(landingPageOrders);
      
      // Transform regular orders
      const transformedRegularOrders = await Promise.all(
        regularOrders.map(async (order) => {
          // Get order items for this order with variant data
          const orderItemsForOrder = await db
            .select()
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .leftJoin(productColors, eq(orderItems.selectedColorId, productColors.id))
            .leftJoin(productShapes, eq(orderItems.selectedShapeId, productShapes.id))
            .leftJoin(productSizes, eq(orderItems.selectedSizeId, productSizes.id))
            .where(eq(orderItems.orderId, order.id));
          
          const firstItem = orderItemsForOrder[0];
          
          return {
            ...order,
            productName: firstItem?.products?.name || null,
            productImage: firstItem?.products?.imageUrls || null,
            productPrice: firstItem?.products?.price || null,
            productPriceOffers: firstItem?.products?.priceOffers || null,
            offer: firstItem?.order_items?.offer || null,
            // Variant data
            selectedColor: firstItem?.product_colors?.colorName || null,
            selectedColorCode: firstItem?.product_colors?.colorCode || null,
            selectedColorImageUrl: firstItem?.product_colors?.colorImageUrl || null,
            selectedShape: firstItem?.product_shapes?.shapeName || null,
            selectedSize: firstItem?.product_sizes?.sizeName || null,
            selectedSizeValue: firstItem?.product_sizes?.sizeValue || null,
            orderSource: order.orderSource,
            sourceDetails: order.sourceDetails,
            type: 'regular'
          };
        })
      );
      
      // Transform landing page orders
      const transformedLpOrders = await Promise.all(
        lpOrders.map(async (lpOrder) => {
          // Get product info from landing page
          let productInfo = null;
          if (lpOrder.landingPageId) {
            const [landingPage] = await db
              .select()
              .from(landingPages)
              .leftJoin(products, eq(landingPages.productId, products.id))
              .where(eq(landingPages.id, lpOrder.landingPageId));
            
            productInfo = landingPage?.products;
          }
          
          return {
            id: lpOrder.id,
            orderNumber: lpOrder.orderNumber,
            customerName: lpOrder.customerName,
            customerEmail: null,
            customerPhone: lpOrder.customerPhone,
            customerAddress: lpOrder.customerAddress,
            customerGovernorate: lpOrder.customerGovernorate,
            status: lpOrder.status,
            total: lpOrder.totalAmount,
            subtotal: null,
            tax: null,
            shipping: null,
            discountAmount: lpOrder.discountAmount,
            notes: lpOrder.notes,
            createdAt: lpOrder.createdAt,
            updatedAt: lpOrder.updatedAt,
            landingPageId: lpOrder.landingPageId,
            offer: lpOrder.offer,
            productName: productInfo?.name || null,
            productImage: productInfo?.imageUrls || null,
            productPrice: productInfo?.price || null,
            orderSource: lpOrder.orderSource,
            sourceDetails: lpOrder.sourceDetails,
            type: 'landing_page'
          };
        })
      );

      // Combine and sort by creation date
      const allOrders = [...transformedRegularOrders, ...transformedLpOrders];
      const sortedOrders = allOrders.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      console.log(`Found ${sortedOrders.length} orders total`);
      return sortedOrders;
      
    } catch (error) {
      console.error('Error in getAllOrders:', error);
      throw error;
    }
  }

  async getPendingOrdersCount(): Promise<number> {
    
    // Get count of regular orders with pending status
    const regularPendingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    // Get count of landing page orders with pending status
    const lpPendingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(landingPageOrders)
      .where(eq(landingPageOrders.status, 'pending'));

    const regularCount = Number(regularPendingCount[0]?.count || 0);
    const lpCount = Number(lpPendingCount[0]?.count || 0);
    const totalPending = regularCount + lpCount;
    
    return totalPending;
  }

  async getPlatformPendingOrders(platformId: string): Promise<any[]> {
    try {
      // جلب الطلبات المعلقة من جدول landing_page_orders
      const landingPendingOrders = await db.execute(
        sql`SELECT 
          lpo.id, lpo.order_number, lpo.customer_name, lpo.customer_phone, 
          lpo.customer_governorate, lpo.customer_address, lpo.total_amount,
          lpo.status, lpo.created_at, lpo.platform_id,
          'landing_page' as order_type
        FROM landing_page_orders lpo
        WHERE lpo.platform_id = ${platformId} AND lpo.status = 'pending'`
      );

      // جلب الطلبات المعلقة من جدول orders العادي
      const regularPendingOrders = await db.execute(
        sql`SELECT 
          o.id, o.order_number::text as order_number, o.customer_name, o.customer_phone,
          o.customer_governorate, o.customer_address, o.total::text as total_amount, 
          o.status, o.created_at, o.platform_id,
          'regular' as order_type
        FROM orders o
        WHERE o.platform_id = ${platformId} AND o.status = 'pending'`
      );

      // دمج النتائج
      const allPendingOrders = [...landingPendingOrders.rows, ...regularPendingOrders.rows];
      
      console.log(`Found ${allPendingOrders.length} pending orders for platform ${platformId}`);

      return allPendingOrders;
    } catch (error) {
      console.error('Error getting platform pending orders:', error);
      return [];
    }
  }

  async getProductsCount(): Promise<number> {
    console.log("=== Getting products count ===");
    
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    const count = Number(productCount[0]?.count || 0);
    console.log("Products count:", count);
    
    return count;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    // أولاً ابحث في جدول orders العادي
    const [regularOrder] = await db.select().from(orders).where(eq(orders.id, id));
    if (regularOrder) {
      return regularOrder;
    }

    // إذا لم يوجد، ابحث في جدول landing_page_orders
    const [landingOrder] = await db.select().from(landingPageOrders).where(eq(landingPageOrders.id, id));
    if (landingOrder) {
      // Convert landing page order to Order format
      return {
        ...landingOrder,
        customerEmail: null,
        tax: "0",
        shipping: "0", 
        total: landingOrder.totalAmount || "0",
        sourceDetails: landingOrder.sourceDetails || null
      } as Order;
    }
    return undefined;
  }

  async getOrderById(id: string): Promise<any> {
    try {
      // Get the order
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      if (!order) return undefined;

      // Get order items with variant details
      const items = await db.execute(
        sql`SELECT 
          oi.*, 
          p.name as product_name, p.image_urls as product_image_urls,
          oi.selected_color_ids, oi.selected_shape_ids, oi.selected_size_ids,
          oi.selected_color_id, oi.selected_shape_id, oi.selected_size_id,
          pc.color_name, pc.color_code, pc.color_image_url,
          ps.shape_name, ps.shape_image_url,
          psize.size_name, psize.size_value
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_colors pc ON oi.selected_color_id = pc.id
        LEFT JOIN product_shapes ps ON oi.selected_shape_id = ps.id  
        LEFT JOIN product_sizes psize ON oi.selected_size_id = psize.id
        WHERE oi.order_id = ${id}`
      );

      // Parse variant IDs and get variant details for each item
      const orderItemsWithVariants = await Promise.all(
        items.rows.map(async (item: any) => {
          const parsedItem = {
            ...item,
            selectedColorIds: item.selected_color_ids ? JSON.parse(item.selected_color_ids) : [],
            selectedShapeIds: item.selected_shape_ids ? JSON.parse(item.selected_shape_ids) : [],
            selectedSizeIds: item.selected_size_ids ? JSON.parse(item.selected_size_ids) : [],
          };

          // Get color details for multiple colors
          if (parsedItem.selectedColorIds.length > 0) {
            const colors = await db.select()
              .from(productColors)
              .where(sql`${productColors.id} = ANY(${parsedItem.selectedColorIds})`);
            parsedItem.colors = colors;
          }

          // Get shape details for multiple shapes
          if (parsedItem.selectedShapeIds.length > 0) {
            const shapes = await db.select()
              .from(productShapes)
              .where(sql`${productShapes.id} = ANY(${parsedItem.selectedShapeIds})`);
            parsedItem.shapes = shapes;
          }

          // Get size details for multiple sizes
          if (parsedItem.selectedSizeIds.length > 0) {
            const sizes = await db.select()
              .from(productSizes)
              .where(sql`${productSizes.id} = ANY(${parsedItem.selectedSizeIds})`);
            parsedItem.sizes = sizes;
          }

          return parsedItem;
        })
      );

      return {
        ...order,
        orderItems: orderItemsWithVariants
      };
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    try {
      
      // Get the next order number
      const orderNumber = await this.getNextOrderNumber();
      
      const orderWithNumber = {
        ...order,
        orderNumber: orderNumber.toString(),
      };
      
      const [newOrder] = await db.insert(orders).values(orderWithNumber).returning();
      
      if (items.length > 0) {
        await db.insert(orderItems).values(
          items.map(item => ({
            ...item,
            orderId: newOrder.id,
            selectedColorIds: item.selectedColorIds ? JSON.stringify(item.selectedColorIds) : null,
            selectedShapeIds: item.selectedShapeIds ? JSON.stringify(item.selectedShapeIds) : null,
            selectedSizeIds: item.selectedSizeIds ? JSON.stringify(item.selectedSizeIds) : null,
          }))
        );
      }
      
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    // أولاً نتحقق من نوع الطلب (orders أم landing_page_orders)
    try {
      const { pool } = await import("./db");
      const client = await pool.connect();
      
      try {
        // تحقق من جدول orders العادي أولاً
        const regularOrderCheck = await client.query(
          'SELECT id FROM orders WHERE id = $1',
          [id]
        );
        
        if (regularOrderCheck.rows.length > 0) {
          return this.updateRegularOrder(id, orderData);
        }
        
        // إذا لم يوجد في orders، تحقق من landing_page_orders
        const landingOrderCheck = await client.query(
          'SELECT id FROM landing_page_orders WHERE id = $1',
          [id]
        );
        
        if (landingOrderCheck.rows.length > 0) {
          return this.updateLandingPageOrder(id, orderData);
        }
        
        throw new Error("Order not found in any table");
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error checking order location:', error);
      throw error;
    }
  }

  async updateRegularOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    try {
      // استخدام استعلام SQL مباشر لتجنب مشاكل schema
      const { pool } = await import("./db");
      const client = await pool.connect();
      
      try {
        // بناء الاستعلام ديناميكياً حسب البيانات المرسلة
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (orderData.customerName !== undefined) {
          updates.push(`customer_name = $${paramIndex++}`);
          values.push(orderData.customerName);
        }
        if (orderData.customerEmail !== undefined) {
          updates.push(`customer_email = $${paramIndex++}`);
          values.push(orderData.customerEmail);
        }
        if (orderData.customerPhone !== undefined) {
          updates.push(`customer_phone = $${paramIndex++}`);
          values.push(orderData.customerPhone);
        }
        if (orderData.customerAddress !== undefined) {
          updates.push(`customer_address = $${paramIndex++}`);
          values.push(orderData.customerAddress);
        }
        if (orderData.customerGovernorate !== undefined) {
          updates.push(`customer_governorate = $${paramIndex++}`);
          values.push(orderData.customerGovernorate);
        }
        if (orderData.status !== undefined) {
          updates.push(`status = $${paramIndex++}`);
          values.push(orderData.status);
        }
        if (orderData.notes !== undefined) {
          updates.push(`notes = $${paramIndex++}`);
          values.push(orderData.notes);
        }
        if (orderData.discountAmount !== undefined) {
          updates.push(`discount_amount = $${paramIndex++}`);
          values.push(orderData.discountAmount);
        }
        if ('total' in orderData && orderData.total !== undefined) {
          updates.push(`total = $${paramIndex++}`);
          values.push(orderData.total);
        }

        // إضافة updated_at دائماً
        updates.push(`updated_at = $${paramIndex++}`);
        values.push(new Date());

        if (updates.length === 1) { // فقط updated_at
          throw new Error("No data to update");
        }

        // إضافة معرف الطلب في النهاية
        values.push(id);

        const query = `
          UPDATE orders 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        console.log("Update query:", query);
        console.log("Values:", values);

        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          throw new Error("Order not found");
        }

        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Landing page order operations
  async getLandingPageOrders(): Promise<LandingPageOrder[]> {
    return await db
      .select()
      .from(landingPageOrders)
      .orderBy(desc(landingPageOrders.createdAt));
  }

  async getLandingPageOrdersByLandingPageId(landingPageId: string): Promise<LandingPageOrder[]> {
    return await db
      .select()
      .from(landingPageOrders)
      .where(eq(landingPageOrders.landingPageId, landingPageId))
      .orderBy(desc(landingPageOrders.createdAt));
  }

  async getLandingPageOrderById(id: string): Promise<any | undefined> {
    try {
      // Use pool directly to avoid Drizzle issues
      const { pool } = await import("./db");
      const client = await pool.connect();
      
      try {
        const result = await client.query(
          `SELECT lpo.*, p.name as product_name, p.image_urls as product_image, p.price as product_price, 
                  p.category_id as product_category, c.name as category_name
           FROM landing_page_orders lpo
           LEFT JOIN products p ON lpo.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE lpo.id = $1`,
          [id]
        );
        
        const order = result.rows[0];
        if (order) {
          // تحويل أسماء الأعمدة لتتطابق مع الواجهة الأمامية
          return {
            ...order,
            // تأكد من وجود الحقول المطلوبة
            customerName: order.customer_name || order.customerName,
            customerPhone: order.customer_phone || order.customerPhone,
            customerEmail: order.customer_email || order.customerEmail,
            customerAddress: order.customer_address || order.customerAddress,
            customerGovernorate: order.customer_governorate || order.customerGovernorate,
            orderNumber: order.order_number || order.orderNumber,
            landingPageId: order.landing_page_id || order.landingPageId,
            platformId: order.platform_id || order.platformId,
            productId: order.product_id || order.productId,
            totalAmount: order.total_amount || order.totalAmount,
            createdAt: order.created_at || order.createdAt,
            updatedAt: order.updated_at || order.updatedAt,
            // معلومات المنتج
            productDetails: {
              name: order.product_name,
              imageUrls: order.product_image,
              price: order.product_price,
              categoryId: order.product_category,
              categoryName: order.category_name
            }
          };
        }
        return order;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error in getLandingPageOrderById:", error);
      return undefined;
    }
  }

  async getLandingPageOrdersByPageId(landingPageId: string, limit?: number): Promise<LandingPageOrder[]> {
    try {
      const query = db
        .select()
        .from(landingPageOrders)
        .where(eq(landingPageOrders.landingPageId, landingPageId))
        .orderBy(desc(landingPageOrders.createdAt));
      
      if (limit) {
        return await query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching landing page orders by page ID:', error);
      return [];
    }
  }

  async updateLandingPageOrderStatus(id: string, status: string): Promise<LandingPageOrder | undefined> {
    try {
      const [updatedOrder] = await db
        .update(landingPageOrders)
        .set({ status, updatedAt: new Date() })
        .where(eq(landingPageOrders.id, id))
        .returning();
      
      return updatedOrder;
    } catch (error) {
      console.error('Error updating landing page order status:', error);
      return undefined;
    }
  }

  // Update all existing order numbers to be sequential
  async updateExistingOrderNumbers(): Promise<void> {
    try {
      console.log('=== Updating existing order numbers to sequential format ===');
      
      // Get all orders ordered by creation date
      const allOrders = await db
        .select()
        .from(landingPageOrders)
        .orderBy(landingPageOrders.createdAt);
      
      console.log(`Found ${allOrders.length} orders to update`);
      
      // Update each order with sequential number
      for (let i = 0; i < allOrders.length; i++) {
        const newOrderNumber = (i + 1).toString();
        await db
          .update(landingPageOrders)
          .set({ orderNumber: newOrderNumber })
          .where(eq(landingPageOrders.id, allOrders[i].id));
        
        console.log(`Updated order ${allOrders[i].id} to number ${newOrderNumber}`);
      }
      
      console.log('=== Finished updating order numbers ===');
    } catch (error) {
      console.error('Error updating order numbers:', error);
    }
  }

  // Get next sequential order number (global - deprecated)
  async getNextOrderNumber(): Promise<number> {
    try {
      // الحصول على أعلى رقم طلب من جدول الطلبات العادية
      const [regularResult] = await db
        .select({ maxOrderNumber: sql<number>`cast(coalesce(max(cast(order_number as integer)), 0) as int)` })
        .from(orders);
        
      // الحصول على أعلى رقم طلب من جدول طلبات صفحات الهبوط
      const [lpResult] = await db
        .select({ maxOrderNumber: sql<number>`cast(coalesce(max(cast(order_number as integer)), 0) as int)` })
        .from(landingPageOrders);
        
      // أخذ أعلى رقم من الجدولين
      const maxRegular = regularResult?.maxOrderNumber || 0;
      const maxLandingPage = lpResult?.maxOrderNumber || 0;
      const maxOrderNumber = Math.max(maxRegular, maxLandingPage);
      
      console.log('📊 Order numbering:', {
        maxRegular,
        maxLandingPage,
        nextOrderNumber: maxOrderNumber + 1
      });
      
      return maxOrderNumber + 1;
    } catch (error) {
      console.error('Error getting next order number:', error);
      // في حالة الخطأ، استخدم timestamp لضمان الفرادة
      return Date.now() % 1000000; // آخر 6 أرقام من timestamp
    }
  }

  async getNextOrderNumberForPlatform(platformId: string): Promise<number> {
    try {
      // الحصول على أعلى رقم طلب من جدول الطلبات العادية لهذه المنصة
      const [regularResult] = await db
        .select({ maxOrderNumber: sql<number>`cast(coalesce(max(cast(order_number as integer)), 0) as int)` })
        .from(orders)
        .where(eq(orders.platformId, platformId));
        
      // الحصول على أعلى رقم طلب من جدول طلبات صفحات الهبوط لهذه المنصة
      const [lpResult] = await db
        .select({ maxOrderNumber: sql<number>`cast(coalesce(max(cast(order_number as integer)), 0) as int)` })
        .from(landingPageOrders)
        .where(eq(landingPageOrders.platformId, platformId));
        
      // أخذ أعلى رقم من الجدولين لهذه المنصة
      const maxRegular = regularResult?.maxOrderNumber || 0;
      const maxLandingPage = lpResult?.maxOrderNumber || 0;
      const maxOrderNumber = Math.max(maxRegular, maxLandingPage);
      
      console.log(`📊 Platform ${platformId} order numbering:`, {
        maxRegular,
        maxLandingPage,
        nextOrderNumber: maxOrderNumber + 1
      });
      
      return maxOrderNumber + 1;
    } catch (error) {
      console.error(`Error getting next order number for platform ${platformId}:`, error);
      // في حالة الخطأ، ابدأ من 1
      return 1;
    }
  }

  async createLandingPageOrder(order: InsertLandingPageOrder): Promise<LandingPageOrder> {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // استخدام الدالة الجديدة التي تحسب الرقم لكل منصة منفصلة
        const sequentialNumber = await this.getNextOrderNumberForPlatform(order.platformId);
        const orderNumber = sequentialNumber.toString();
        
        console.log(`🔄 Attempting to create order with number: ${orderNumber} (attempt ${attempts + 1})`);
        
        const [newOrder] = await db
          .insert(landingPageOrders)
          .values({
            ...order,
            orderNumber,
          })
          .returning();
        
        console.log(`✅ Successfully created order with number: ${orderNumber}`);
        return newOrder;
        
      } catch (error: any) {
        attempts++;
        
        // إذا كان الخطأ متعلق بتكرار رقم الطلب
        if (error.message?.includes('duplicate key value violates unique constraint') && 
            error.message?.includes('order_number')) {
          
          console.warn(`⚠️ Order number conflict detected, retrying... (attempt ${attempts}/${maxAttempts})`);
          
          if (attempts >= maxAttempts) {
            // في المحاولة الأخيرة، استخدم timestamp فريد
            const timestampNumber = Date.now().toString().slice(-8);
            const fallbackOrderNumber = `${timestampNumber}`;
            
            console.log(`🔄 Using fallback order number: ${fallbackOrderNumber}`);
            
            const [newOrder] = await db
              .insert(landingPageOrders)
              .values({
                ...order,
                orderNumber: fallbackOrderNumber,
              })
              .returning();
            
            return newOrder;
          }
          
          // انتظار قصير قبل المحاولة مرة أخرى
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          continue;
        }
        
        // إذا كان خطأ آخر، ارمي الخطأ
        throw error;
      }
    }
    
    throw new Error('Failed to create order after maximum attempts');
  }

  async updateOrderStatus(id: string, status: string): Promise<any> {
    let updatedOrder: any = null;
    let orderType: 'regular' | 'landing' = 'regular';
    let oldStatus: string = '';

    // Get the current order to check old status before updating
    let existingOrder: any = null;
    
    // Check in regular orders first
    try {
      const [regularOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);
      
      if (regularOrder) {
        existingOrder = regularOrder;
        oldStatus = regularOrder.status || '';
        orderType = 'regular';
      }
    } catch (error) {
      // Continue to check landing page orders
    }

    // Check in landing page orders if not found in regular orders
    if (!existingOrder) {
      try {
        const [landingPageOrder] = await db
          .select()
          .from(landingPageOrders)
          .where(eq(landingPageOrders.id, id))
          .limit(1);

        if (landingPageOrder) {
          existingOrder = landingPageOrder;
          oldStatus = landingPageOrder.status || '';
          orderType = 'landing';
        }
      } catch (error) {
        console.error('Error getting existing landing page order:', error);
      }
    }

    if (!existingOrder) {
      throw new Error(`Order with id ${id} not found`);
    }

    console.log(`🔄 Updating order ${existingOrder.orderNumber} status from "${oldStatus}" to "${status}" for platform ${existingOrder.platformId}`);
    console.log('Existing order:', existingOrder);

    // Now update the order status
    if (orderType === 'regular') {
      const [regularOrder] = await db
        .update(orders)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      
      updatedOrder = regularOrder;
    } else {
      const updateQuery = sql`
          UPDATE landing_page_orders 
          SET status = ${status}, updated_at = ${new Date()}
          WHERE id = ${id}
          RETURNING *`;
      
      console.log('Update landing page order query: UPDATE landing_page_orders SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *');
      console.log('Values:', [status, new Date(), id]);
      
      const result = await db.execute(updateQuery);
      updatedOrder = result.rows[0];
    }

    console.log('Updated order:', updatedOrder);

    if (!updatedOrder) {
      throw new Error(`Failed to update order with id ${id}`);
    }

    // Update inventory when status changes to confirmed, shipped, or delivered
    const shouldUpdateInventory = ['confirmed', 'shipped', 'delivered'].includes(status);
    const wasAlreadyProcessed = ['confirmed', 'shipped', 'delivered'].includes(oldStatus);

    if (shouldUpdateInventory && !wasAlreadyProcessed) {
      try {
        await this.updateInventoryForOrder(updatedOrder);
        console.log(`📦 Inventory updated for order ${updatedOrder.order_number || updatedOrder.orderNumber} with status ${status}`);
      } catch (error) {
        console.error('Error updating inventory for order:', error);
        // Don't throw error here to avoid breaking order status update
      }
    }

    // Update accounting system when order status changes to 'delivered' or 'confirmed'
    if (status === 'delivered' || status === 'confirmed') {
      try {
        await this.updateAccountingForOrder(updatedOrder, orderType);
        console.log(`📊 Accounting updated for order ${updatedOrder.order_number || updatedOrder.orderNumber} with status ${status}`);
      } catch (error) {
        console.error('Error updating accounting for order:', error);
        // Don't throw error here to avoid breaking order status update
      }
    }

    return updatedOrder;
  }

  // البحث عن الطلبات المعلقة حسب رقم الهاتف والمنصة
  async getPendingOrdersByPhoneAndPlatform(phoneNumber: string, platformId: string): Promise<any[]> {
    try {
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\+\(\)]/g, '');
      
      // إنشاء تباديل مختلفة لرقم الهاتف
      const phoneVariations = [
        cleanPhoneNumber,
        `+964${cleanPhoneNumber.startsWith('0') ? cleanPhoneNumber.slice(1) : cleanPhoneNumber}`,
        `964${cleanPhoneNumber.startsWith('0') ? cleanPhoneNumber.slice(1) : cleanPhoneNumber}`,
        cleanPhoneNumber.startsWith('0') ? cleanPhoneNumber : `0${cleanPhoneNumber}`,
        // إضافة تباديل عكسية
        cleanPhoneNumber.startsWith('964') ? `0${cleanPhoneNumber.slice(3)}` : '',
        cleanPhoneNumber.startsWith('+964') ? `0${cleanPhoneNumber.slice(4)}` : '',
        // إزالة أي 0 في البداية وإضافة 964
        cleanPhoneNumber.startsWith('0') ? `964${cleanPhoneNumber.slice(1)}` : '',
        cleanPhoneNumber.startsWith('0') ? `+964${cleanPhoneNumber.slice(1)}` : '',
      ].filter(v => v.length > 0);
      
      console.log(`🔍 البحث عن طلبات معلقة للرقم ${phoneNumber} في المنصة ${platformId}`);
      console.log(`📞 تباديل الهاتف:`, phoneVariations);
      
      // البحث في جدول الطلبات العادية
      const regularOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.platformId, platformId),
            eq(orders.status, 'pending'),
            or(...phoneVariations.map(phone => eq(orders.customerPhone, phone)))
          )
        );
      
      // البحث في جدول طلبات صفحات الهبوط
      const landingPageOrdersList = await db
        .select()
        .from(landingPageOrders)
        .where(
          and(
            eq(landingPageOrders.platformId, platformId),
            eq(landingPageOrders.status, 'pending'),
            or(...phoneVariations.map(phone => eq(landingPageOrders.customerPhone, phone)))
          )
        );
      
      const allPendingOrders = [...regularOrders, ...landingPageOrdersList];
      
      console.log(`📋 تم العثور على ${allPendingOrders.length} طلب معلق للرقم ${phoneNumber}`);
      
      return allPendingOrders;
      
    } catch (error) {
      console.error(`خطأ في البحث عن الطلبات المعلقة:`, error);
      return [];
    }
  }

  // Update inventory when order status changes to confirmed, shipped, or delivered
  private async updateInventoryForOrder(order: any): Promise<void> {
    try {
      // Get product ID and quantity from the order
      let productId: string | null = null;
      let quantity: number = 0;
      
      if (order.product_id) {
        productId = order.product_id;
        quantity = order.quantity || 1;
      } else if (order.landing_page_id) {
        // Get product ID from landing page
        const [landingPage] = await db
          .select({ productId: landingPages.productId })
          .from(landingPages)
          .where(eq(landingPages.id, order.landing_page_id))
          .limit(1);
        
        if (landingPage) {
          productId = landingPage.productId;
          quantity = order.quantity || 1;
        }
      }
      
      if (!productId) {
        console.log('⚠️  No product ID found for order, skipping inventory update');
        return;
      }
      
      console.log(`📦 Updating inventory for product ${productId}, reducing stock by ${quantity}`);
      
      // Get current product stock
      const [currentProduct] = await db
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (!currentProduct) {
        console.log('⚠️  Product not found, cannot update inventory');
        return;
      }
      
      const currentStock = currentProduct.stock || 0;
      const newStock = Math.max(0, currentStock - quantity); // Ensure stock doesn't go negative
      
      console.log(`📦 Product stock: ${currentStock} → ${newStock} (reduced by ${quantity})`);
      
      // Update product stock
      await db
        .update(products)
        .set({
          stock: newStock,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId));
      
      console.log(`✅ Successfully updated inventory for product ${productId}`);
      
    } catch (error) {
      console.error('❌ Error updating inventory for order:', error);
      throw error;
    }
  }

  // Update accounting system when order status changes
  private async updateAccountingForOrder(order: any, orderType: 'regular' | 'landing'): Promise<void> {
    const platformId = order.platformId;
    const orderTotal = parseFloat(order.total || '0');
    
    if (orderTotal <= 0) return;

    // Create a cash transaction for the order
    await this.createCashTransactionForOrder(platformId, order, orderTotal);
    
    // Update chart of accounts balances
    await this.updateChartOfAccountsForOrder(platformId, orderTotal);
  }

  private async createCashTransactionForOrder(platformId: string, order: any, amount: number): Promise<void> {
    try {
      // Get the main cash account for the platform
      const [cashAccount] = await db
        .select()
        .from(cashAccounts)
        .where(and(
          eq(cashAccounts.platformId, platformId),
          eq(cashAccounts.accountType, 'cash')
        ))
        .limit(1);

      if (!cashAccount) {
        console.log('No cash account found for platform:', platformId);
        return;
      }

      // Create cash transaction
      await db.insert(cashTransactions).values({
        platformId,
        cashAccountId: cashAccount.id,
        transactionType: 'income',
        amount: amount.toString(),
        description: `إيرادات من الطلب رقم ${order.orderNumber}`,
        reference: order.orderNumber,
        category: 'sales',
        partyName: order.customerName || 'عميل',
        partyType: 'customer',
        relatedOrderId: order.id,
        status: 'completed',
        transactionDate: new Date(),
        createdBy: 'system'
      });

      // Update cash account balance
      const newBalance = parseFloat(cashAccount.currentBalance || '0') + amount;
      await db
        .update(cashAccounts)
        .set({ 
          currentBalance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(cashAccounts.id, cashAccount.id));

      console.log(`💰 Cash transaction created: +${amount} for order ${order.orderNumber}`);
    } catch (error) {
      console.error('Error creating cash transaction:', error);
    }
  }

  private async updateChartOfAccountsForOrder(platformId: string, amount: number): Promise<void> {
    try {
      // Find sales revenue account
      const [salesAccount] = await db
        .select()
        .from(chartOfAccounts)
        .where(and(
          eq(chartOfAccounts.platformId, platformId),
          eq(chartOfAccounts.accountType, 'revenue'),
          eq(chartOfAccounts.accountCode, '4100') // Sales Revenue
        ))
        .limit(1);

      if (salesAccount) {
        const newBalance = parseFloat(salesAccount.creditBalance || '0') + amount;
        await db
          .update(chartOfAccounts)
          .set({ 
            creditBalance: newBalance.toString(),
            currentBalance: newBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(chartOfAccounts.id, salesAccount.id));

        console.log(`📈 Sales account updated: +${amount} to account ${salesAccount.accountCode}`);
      }

      // Find cash/bank account in chart of accounts
      const [cashChartAccount] = await db
        .select()
        .from(chartOfAccounts)
        .where(and(
          eq(chartOfAccounts.platformId, platformId),
          eq(chartOfAccounts.accountType, 'assets'),
          eq(chartOfAccounts.accountCode, '1100') // Cash
        ))
        .limit(1);

      if (cashChartAccount) {
        const newBalance = parseFloat(cashChartAccount.debitBalance || '0') + amount;
        await db
          .update(chartOfAccounts)
          .set({ 
            debitBalance: newBalance.toString(),
            currentBalance: newBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(chartOfAccounts.id, cashChartAccount.id));

        console.log(`🏦 Cash chart account updated: +${amount} to account ${cashChartAccount.accountCode}`);
      }
    } catch (error) {
      console.error('Error updating chart of accounts:', error);
    }
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(10);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard operations
  async getDashboardStats(): Promise<any> {
    console.log("=== Getting dashboard stats ===");
    
    // Get total sales from delivered regular orders only
    const [regularSales] = await db
      .select({ total: sum(orders.total) })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    // Get count of regular orders
    const [regularOrdersCount] = await db
      .select({ count: count() })
      .from(orders);

    // Get count of landing page orders
    const [lpOrdersCount] = await db
      .select({ count: count() })
      .from(landingPageOrders);

    // Calculate estimated sales from completed landing page orders only
    // Since landing page orders don't have total field, we'll estimate from product price
    const lpOrdersWithPrice = await db
      .select({
        price: sql<string>`CASE 
          WHEN ${landingPageOrders.offer} LIKE '%10,000%' THEN '10000'
          WHEN ${landingPageOrders.offer} LIKE '%20,000%' THEN '20000'
          WHEN ${landingPageOrders.offer} LIKE '%40,000%' THEN '40000'
          WHEN ${landingPageOrders.offer} LIKE '%60,000%' THEN '60000'
          ELSE '0'
        END`,
        status: landingPageOrders.status
      })
      .from(landingPageOrders)
      .where(eq(landingPageOrders.status, 'delivered'));

    const lpSales = lpOrdersWithPrice.reduce((total, order) => total + Number(order.price), 0);

    // Get active products count
    const [activeProducts] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isActive, true));

    // Get pending orders count
    const [pendingRegular] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    const [pendingLP] = await db
      .select({ count: count() })
      .from(landingPageOrders)
      .where(eq(landingPageOrders.status, 'pending'));

    const totalSales = Number(regularSales?.total || 0) + lpSales;
    const totalOrders = Number(regularOrdersCount?.count || 0) + Number(lpOrdersCount?.count || 0);
    const pendingOrders = Number(pendingRegular?.count || 0) + Number(pendingLP?.count || 0);
    const activeProductsCount = Number(activeProducts?.count || 0);

    // Calculate conversion rate (delivered orders / total orders * 100)
    const deliveredOrders = totalOrders - pendingOrders;
    const conversionRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0.0';

    console.log("Dashboard stats calculated:", {
      totalSales,
      totalOrders,
      activeProducts: activeProductsCount,
      pendingOrders,
      conversionRate
    });

    return {
      totalSales,
      totalOrders,
      activeProducts: activeProductsCount,
      pendingOrders,
      conversionRate: Number(conversionRate),
    };
  }

  async getTopProducts(): Promise<any[]> {
    console.log("=== Getting top products ===");
    
    // Get products with sales from regular order items
    const regularSales = await db
      .select({
        productId: orderItems.productId,
        salesCount: count(orderItems.id),
        revenue: sum(orderItems.total),
      })
      .from(orderItems)
      .groupBy(orderItems.productId);

    // Get products with sales from landing page orders
    const lpSales = await db
      .select({
        productId: landingPages.productId,
        salesCount: count(landingPageOrders.id),
        revenue: sql<number>`SUM(CASE 
          WHEN ${landingPageOrders.offer} LIKE '%10,000%' THEN 10000
          WHEN ${landingPageOrders.offer} LIKE '%20,000%' THEN 20000
          WHEN ${landingPageOrders.offer} LIKE '%40,000%' THEN 40000
          WHEN ${landingPageOrders.offer} LIKE '%60,000%' THEN 60000
          ELSE 0
        END)`,
      })
      .from(landingPageOrders)
      .leftJoin(landingPages, eq(landingPageOrders.landingPageId, landingPages.id))
      .where(eq(landingPageOrders.status, 'completed'))
      .groupBy(landingPages.productId);

    // Get all products with their sales data
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        stock: products.stock,
        imageUrls: products.imageUrls,
        isActive: products.isActive,
        createdAt: products.createdAt,
      })
      .from(products);

    // Combine sales data
    const productsWithSales = allProducts.map(product => {
      const regularSale = regularSales.find(sale => sale.productId === product.id);
      const lpSale = lpSales.find(sale => sale.productId === product.id);

      const totalSalesCount = Number(regularSale?.salesCount || 0) + Number(lpSale?.salesCount || 0);
      const totalRevenue = Number(regularSale?.revenue || 0) + Number(lpSale?.revenue || 0);

      return {
        ...product,
        salesCount: totalSalesCount,
        revenue: totalRevenue,
      };
    });

    // Sort by sales count and return top 5
    const topProducts = productsWithSales
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    console.log(`Found ${topProducts.length} top products`);
    return topProducts;
  }

  async getRecentOrders(): Promise<any[]> {
    console.log("=== Getting recent orders - Using Pool ===");
    
    try {
      // Import pool directly for this query
      const { pool } = await import("./db");
      
      const result = await pool.query(`
        SELECT 
          id,
          order_number as "orderNumber",
          customer_name as "customerName", 
          customer_phone as "customerPhone",
          status,
          offer,
          total_amount as "totalAmount",
          created_at as "createdAt"
        FROM landing_page_orders 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      console.log(`Pool query result: ${result.rows.length} rows`);
      
      // Transform results from pool
      const orders = result.rows.map((order: any) => {
        let total = 10000; // default price
        
        // Extract price from offer string
        if (order.offer?.includes('10,000')) total = 10000;
        else if (order.offer?.includes('20,000')) total = 20000;
        else if (order.offer?.includes('40,000')) total = 40000;
        else if (order.offer?.includes('60,000')) total = 60000;
        else if (order.totalAmount) total = parseFloat(order.totalAmount);
        
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: null,
          customerPhone: order.customerPhone,
          status: order.status,
          total: total,
          createdAt: new Date(order.createdAt),
          type: 'landing_page'
        };
      });
      
      console.log(`Transformed ${orders.length} recent orders successfully`);
      return orders;
    } catch (error) {
      console.error("Error in getRecentOrders with pool:", error);
      return [];
    }
  }

  async getFirstOrderDate(): Promise<Date | null> {
    // Get first order from regular orders
    const [firstRegular] = await db
      .select({ createdAt: orders.createdAt })
      .from(orders)
      .orderBy(asc(orders.createdAt))
      .limit(1);

    // Get first order from landing page orders
    const [firstLanding] = await db
      .select({ createdAt: landingPageOrders.createdAt })
      .from(landingPageOrders)
      .orderBy(asc(landingPageOrders.createdAt))
      .limit(1);

    const dates = [firstRegular?.createdAt, firstLanding?.createdAt].filter(Boolean);
    
    if (dates.length === 0) return null;
    
    return new Date(Math.min(...dates.map(d => d!.getTime())));
  }

  async getSalesChartData(period: string): Promise<any[]> {
    
    const firstOrderDate = await this.getFirstOrderDate();
    if (!firstOrderDate) {
      // No orders yet, return empty data
      return [];
    }
    
    const currentDate = new Date();
    const startDate = new Date(firstOrderDate);
    
    if (period === 'monthly') {
      // Get data from first order date to now
      const monthlyData = [];
      const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 
                         'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      
      // Calculate months between first order and now
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = currentDate.getFullYear();
      const endMonth = currentDate.getMonth();
      
      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      
      for (let i = 0; i < totalMonths; i++) {
        const targetDate = new Date(startYear, startMonth + i, 1);
        const nextMonth = new Date(startYear, startMonth + i + 1, 1);
        
        // Get sales from regular orders for this month (all orders for chart visibility)
        const [regularSales] = await db
          .select({ 
            total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
            count: sql<number>`COUNT(*)`
          })
          .from(orders)
          .where(and(
            gte(orders.createdAt, targetDate),
            lte(orders.createdAt, nextMonth)
          ));

        // Get sales from landing page orders for this month (all orders for chart visibility)  
        const lpOrdersThisMonth = await db
          .select({
            offer: landingPageOrders.offer,
            id: landingPageOrders.id
          })
          .from(landingPageOrders)
          .where(and(
            gte(landingPageOrders.createdAt, targetDate),
            lte(landingPageOrders.createdAt, nextMonth)
          ));

        const lpSales = lpOrdersThisMonth.reduce((total, order) => {
          if (order.offer.includes('20,000')) return total + 20000;
          if (order.offer.includes('40,000')) return total + 40000;
          if (order.offer.includes('60,000')) return total + 60000;
          return total;
        }, 0);

        const lpOrdersCount = lpOrdersThisMonth.length;

        monthlyData.push({
          name: monthNames[targetDate.getMonth()],
          sales: Number(regularSales?.total || 0) + lpSales,
          orders: Number(regularSales?.count || 0) + lpOrdersCount,
        });
      }
      
      return monthlyData;
    }
    
    if (period === 'daily') {
      // Get data from first order date to now (up to last 30 days)
      const dailyData = [];
      const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      
      // Calculate days between first order and now (limit to 30 days for performance)
      const daysDiff = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = Math.min(daysDiff + 1, 30);
      
      for (let i = totalDays - 1; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        targetDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Get sales from regular orders for this day (all orders for chart visibility)
        const [regularSales] = await db
          .select({ 
            total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
            count: sql<number>`COUNT(*)`
          })
          .from(orders)
          .where(and(
            gte(orders.createdAt, targetDate),
            lte(orders.createdAt, nextDay)
          ));

        // Get sales from landing page orders for this day (all orders for chart visibility)
        const lpOrdersThisDay = await db
          .select({
            offer: landingPageOrders.offer,
            id: landingPageOrders.id
          })
          .from(landingPageOrders)
          .where(and(
            gte(landingPageOrders.createdAt, targetDate),
            lte(landingPageOrders.createdAt, nextDay)
          ));

        const lpSales = lpOrdersThisDay.reduce((total, order) => {
          if (order.offer.includes('20,000')) return total + 20000;
          if (order.offer.includes('40,000')) return total + 40000;
          if (order.offer.includes('60,000')) return total + 60000;
          return total;
        }, 0);

        const lpOrdersCount = lpOrdersThisDay.length;

        dailyData.push({
          name: dayNames[targetDate.getDay()],
          sales: Number(regularSales?.total || 0) + lpSales,
          orders: Number(regularSales?.count || 0) + lpOrdersCount,
        });
      }
      
      return dailyData;
    }
    
    if (period === 'weekly') {
      // Get data from first order date to now (up to last 12 weeks)
      const weeklyData = [];
      
      // Calculate weeks between first order and now
      const weeksDiff = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const totalWeeks = Math.min(weeksDiff + 1, 12);
      
      for (let i = totalWeeks - 1; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - (i * 7));
        targetDate.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date(targetDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        // Get sales from regular orders for this week (all orders for chart visibility)
        const [regularSales] = await db
          .select({ 
            total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
            count: sql<number>`COUNT(*)`
          })
          .from(orders)
          .where(and(
            gte(orders.createdAt, targetDate),
            lte(orders.createdAt, nextWeek)
          ));

        // Get sales from landing page orders for this week (all orders for chart visibility)
        const lpOrdersThisWeek = await db
          .select({
            offer: landingPageOrders.offer,
            id: landingPageOrders.id
          })
          .from(landingPageOrders)
          .where(and(
            gte(landingPageOrders.createdAt, targetDate),
            lte(landingPageOrders.createdAt, nextWeek)
          ));

        const lpSales = lpOrdersThisWeek.reduce((total, order) => {
          if (order.offer.includes('20,000')) return total + 20000;
          if (order.offer.includes('40,000')) return total + 40000;
          if (order.offer.includes('60,000')) return total + 60000;
          return total;
        }, 0);

        const lpOrdersCount = lpOrdersThisWeek.length;

        weeklyData.push({
          name: `الأسبوع ${totalWeeks - i}`,
          sales: Number(regularSales?.total || 0) + lpSales,
          orders: Number(regularSales?.count || 0) + lpOrdersCount,
        });
      }
      
      return weeklyData;
    }
    
    // Default fallback (shouldn't reach here)
    return [];
  }

  async updateLandingPageOrder(id: string, orderData: Partial<InsertOrder>): Promise<any> {
    try {
      // استخدام استعلام SQL مباشر لتحديث طلبات صفحات الهبوط
      const { pool } = await import("./db");
      const client = await pool.connect();
      
      try {
        // احصل على الحالة الحالية قبل التحديث لمقارنتها
        const currentOrderResult = await client.query(
          'SELECT status, product_id FROM landing_page_orders WHERE id = $1',
          [id]
        );
        
        if (currentOrderResult.rows.length === 0) {
          throw new Error("Landing page order not found");
        }
        
        const currentOrder = currentOrderResult.rows[0];
        const oldStatus = currentOrder.status;
        const productId = currentOrder.product_id;
        // بناء الاستعلام ديناميكياً حسب البيانات المرسلة
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (orderData.customerName !== undefined) {
          updates.push(`customer_name = $${paramIndex++}`);
          values.push(orderData.customerName);
        }
        if (orderData.customerEmail !== undefined) {
          updates.push(`customer_email = $${paramIndex++}`);
          values.push(orderData.customerEmail);
        }
        if (orderData.customerPhone !== undefined) {
          updates.push(`customer_phone = $${paramIndex++}`);
          values.push(orderData.customerPhone);
        }
        if (orderData.customerAddress !== undefined) {
          updates.push(`customer_address = $${paramIndex++}`);
          values.push(orderData.customerAddress);
        }
        if (orderData.customerGovernorate !== undefined) {
          updates.push(`customer_governorate = $${paramIndex++}`);
          values.push(orderData.customerGovernorate);
        }
        if (orderData.status !== undefined) {
          updates.push(`status = $${paramIndex++}`);
          values.push(orderData.status);
        }
        if (orderData.notes !== undefined) {
          updates.push(`notes = $${paramIndex++}`);
          values.push(orderData.notes);
        }
        if (orderData.discountAmount !== undefined) {
          updates.push(`discount_amount = $${paramIndex++}`);
          values.push(orderData.discountAmount);
        }

        // إضافة updated_at دائماً
        updates.push(`updated_at = $${paramIndex++}`);
        values.push(new Date());

        // إضافة حقول إضافية للتعديل
        if ('offer' in orderData && orderData.offer !== undefined) {
          updates.push(`offer = $${paramIndex++}`);
          values.push(orderData.offer);
        }
        if ('totalAmount' in orderData && orderData.totalAmount !== undefined) {
          updates.push(`total_amount = $${paramIndex++}`);
          values.push(orderData.totalAmount);
        }

        if (updates.length === 1) { // فقط updated_at
          throw new Error("No data to update");
        }

        // إضافة معرف الطلب في النهاية
        values.push(id);

        const query = `
          UPDATE landing_page_orders 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        console.log("Update landing page order query:", query);
        console.log("Values:", values);

        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          throw new Error("Landing page order not found");
        }

        // منطق تعديل المخزون حسب تغيير الحالة
        if (productId && orderData.status !== undefined) {
          const newStatus = orderData.status;
          const orderQuantity = result.rows[0].quantity || 1; // الحصول على كمية الطلب من النتيجة
          
          // التحقق من تغيير الحالة وتأثيرها على المخزون
          const oldStatusAffectsStock = (oldStatus === 'confirmed' || oldStatus === 'delivered' || oldStatus === 'processing');
          const newStatusAffectsStock = (newStatus === 'confirmed' || newStatus === 'delivered' || newStatus === 'processing');
          const oldStatusIsReturned = (oldStatus === 'returned');
          const newStatusIsReturned = (newStatus === 'returned');
          
          if (!oldStatusAffectsStock && newStatusAffectsStock) {
            // تغيير من حالة لا تؤثر على المخزون إلى حالة تؤثر (قلل المخزون)
            console.log(`تأكيد الطلب ${id} - تقليل المخزون للمنتج ${productId} بكمية ${orderQuantity}`);
            const stockUpdateResult = await client.query(
              'UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = $2 WHERE id = $3 RETURNING stock',
              [orderQuantity, new Date(), productId]
            );
            console.log(`تم تقليل المخزون للمنتج ${productId} بكمية ${orderQuantity}. المخزون الجديد: ${stockUpdateResult.rows[0]?.stock}`);
            
          } else if (oldStatusAffectsStock && !newStatusAffectsStock && !newStatusIsReturned) {
            // تغيير من حالة تؤثر على المخزون إلى حالة لا تؤثر (ارجع المخزون) - عدا المرتجع
            console.log(`إلغاء تأكيد الطلب ${id} - إرجاع المخزون للمنتج ${productId} بكمية ${orderQuantity}`);
            await client.query(
              'UPDATE products SET stock = stock + $1, updated_at = $2 WHERE id = $3',
              [orderQuantity, new Date(), productId]
            );
            console.log(`تم إرجاع المخزون للمنتج ${productId} بكمية ${orderQuantity}`);
            
          } else if (oldStatusAffectsStock && newStatusIsReturned) {
            // تغيير من حالة مؤثرة على المخزون إلى مرتجع (ارجع المخزون)
            console.log(`إرجاع الطلب ${id} - إرجاع المخزون للمنتج ${productId} بكمية ${orderQuantity}`);
            await client.query(
              'UPDATE products SET stock = stock + $1, updated_at = $2 WHERE id = $3',
              [orderQuantity, new Date(), productId]
            );
            console.log(`تم إرجاع المخزون للمنتج ${productId} بكمية ${orderQuantity} بسبب الإرجاع`);
            
          } else if (oldStatusIsReturned && newStatusAffectsStock) {
            // تغيير من مرتجع إلى حالة مؤثرة على المخزون (قلل المخزون)
            console.log(`تأكيد الطلب المرتجع ${id} مرة أخرى - تقليل المخزون للمنتج ${productId} بكمية ${orderQuantity}`);
            await client.query(
              'UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = $2 WHERE id = $3',
              [orderQuantity, new Date(), productId]
            );
            console.log(`تم تقليل المخزون للمنتج ${productId} بكمية ${orderQuantity} بعد التأكيد مرة أخرى`);
          }
        }

        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating landing page order:', error);
      throw error;
    }
  }

  async updatePlatformLogo(platformId: string, logoUrl: string): Promise<any> {
    const [updatedPlatform] = await db
      .update(platforms)
      .set({
        logoUrl: logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(platforms.id, platformId))
      .returning();
    return updatedPlatform;
  }

  // Inventory management methods
  async getCurrentPlatform(req: any): Promise<Platform | undefined> {
    const session = req.session?.platform;
    if (!session?.platformId) {
      return undefined;
    }
    return this.getPlatform(session.platformId);
  }

  async getPlatformInventory(platformId: string, filters: { fromDate: Date; toDate: Date; lowStockOnly: boolean }): Promise<any[]> {
    try {
      let whereConditions = [eq(products.platformId, platformId)];

      if (filters.lowStockOnly) {
        whereConditions.push(sql`${products.stock} <= COALESCE(${products.lowStockThreshold}, 0)`);
      }

      const result = await db
        .select({
          id: products.id,
          name: products.name,
          categoryId: products.categoryId,
          price: products.price,
          cost: products.cost,
          sku: products.sku,
          stock: products.stock,
          lowStockThreshold: products.lowStockThreshold,
          imageUrls: products.imageUrls,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(and(...whereConditions))
        .orderBy(asc(products.name));
      
      // احتساب المبيعات والمرتجعات لكل منتج
      const productIds = result.map(p => p.id);
      const salesMap = new Map<string, number>();
      const returnsMap = new Map<string, number>();
      const confirmedMap = new Map<string, number>();
      const deliveredMap = new Map<string, number>();
      const processingMap = new Map<string, number>();
      const postponedMap = new Map<string, number>();
      
      if (productIds.length > 0) {
        try {
          // احتساب المبيعات من جدول landing_page_orders فقط للطلبات المؤكدة والمشحونة والمسلمة فقط
          const landingPageSales = await db
            .select({
              productId: landingPageOrders.productId,
              totalSales: sql<number>`CAST(COALESCE(SUM(quantity), 0) AS INTEGER)`
            })
            .from(landingPageOrders)
            .where(and(
              eq(landingPageOrders.platformId, platformId),
              inArray(landingPageOrders.productId, productIds),
              or(
                eq(landingPageOrders.status, 'confirmed'),
                eq(landingPageOrders.status, 'shipped'),
                eq(landingPageOrders.status, 'delivered')
              )
            ))
            .groupBy(landingPageOrders.productId);

          // إضافة نتائج المبيعات
          if (landingPageSales) {
            landingPageSales.forEach(sale => {
              if (sale && sale.productId) {
                salesMap.set(sale.productId, (salesMap.get(sale.productId) || 0) + (sale.totalSales || 0));
              }
            });
          }

          // احتساب المرتجعات من جدول landing_page_orders
          const landingPageReturns = await db
            .select({
              productId: landingPageOrders.productId,
              totalReturns: sql<number>`CAST(COALESCE(SUM(quantity), 0) AS INTEGER)`
            })
            .from(landingPageOrders)
            .where(and(
              eq(landingPageOrders.platformId, platformId),
              inArray(landingPageOrders.productId, productIds),
              eq(landingPageOrders.status, 'returned')
            ))
            .groupBy(landingPageOrders.productId);

          // إضافة نتائج المرتجعات
          if (landingPageReturns) {
            landingPageReturns.forEach(returned => {
              if (returned && returned.productId) {
                returnsMap.set(returned.productId, (returnsMap.get(returned.productId) || 0) + (returned.totalReturns || 0));
              }
            });
          }

          // احتساب المبيعات المؤكدة
          const confirmedSales = await db
            .select({
              productId: landingPageOrders.productId,
              total: sql<number>`CAST(COUNT(*) AS INTEGER)`
            })
            .from(landingPageOrders)
            .where(and(
              eq(landingPageOrders.platformId, platformId),
              inArray(landingPageOrders.productId, productIds),
              eq(landingPageOrders.status, 'confirmed')
            ))
            .groupBy(landingPageOrders.productId);

          confirmedSales?.forEach(sale => {
            if (sale && sale.productId) {
              confirmedMap.set(sale.productId, sale.total || 0);
            }
          });

          // احتساب المبيعات المسلمة
          const deliveredSales = await db
            .select({
              productId: landingPageOrders.productId,
              total: sql<number>`CAST(COUNT(*) AS INTEGER)`
            })
            .from(landingPageOrders)
            .where(and(
              eq(landingPageOrders.platformId, platformId),
              inArray(landingPageOrders.productId, productIds),
              eq(landingPageOrders.status, 'delivered')
            ))
            .groupBy(landingPageOrders.productId);

          deliveredSales?.forEach(sale => {
            if (sale && sale.productId) {
              deliveredMap.set(sale.productId, sale.total || 0);
            }
          });

          // احتساب المبيعات قيد المعالجة
          const processingSales = await db
            .select({
              productId: landingPageOrders.productId,
              total: sql<number>`CAST(COUNT(*) AS INTEGER)`
            })
            .from(landingPageOrders)
            .where(and(
              eq(landingPageOrders.platformId, platformId),
              inArray(landingPageOrders.productId, productIds),
              eq(landingPageOrders.status, 'processing')
            ))
            .groupBy(landingPageOrders.productId);

          processingSales?.forEach(sale => {
            if (sale && sale.productId) {
              processingMap.set(sale.productId, sale.total || 0);
            }
          });

          // احتساب المبيعات المؤجلة
          const postponedSales = await db
            .select({
              productId: landingPageOrders.productId,
              total: sql<number>`CAST(COUNT(*) AS INTEGER)`
            })
            .from(landingPageOrders)
            .where(and(
              eq(landingPageOrders.platformId, platformId),
              inArray(landingPageOrders.productId, productIds),
              eq(landingPageOrders.status, 'postponed')
            ))
            .groupBy(landingPageOrders.productId);

          postponedSales?.forEach(sale => {
            if (sale && sale.productId) {
              postponedMap.set(sale.productId, sale.total || 0);
            }
          });
        } catch (error) {
          console.error('Error calculating sales and returns:', error);
          // استمر بدون المبيعات والمرتجعات في حالة وجود خطأ
        }
      }

      // إضافة بيانات المبيعات والمرتجعات للمنتجات
      const enrichedResult = result.map(product => {
        const unitCost = parseFloat(product.cost?.toString() || '0');
        const stockQuantity = product.stock || 0;
        const soldQty = salesMap.get(product.id) || 0;
        const returnedQty = returnsMap.get(product.id) || 0;
        // عرض نفس قيمة المخزون الأصلي في حقل "متبقي" بدلاً من الحساب
        const remainingQty = stockQuantity;
        
        return {
          ...product,
          unitCost: unitCost,
          totalCost: unitCost * stockQuantity,
          soldQuantity: soldQty,
          returnedQuantity: returnedQty,
          remainingQuantity: remainingQty,
          remainingValue: unitCost * remainingQty,
          confirmedQuantity: confirmedMap.get(product.id) || 0,
          deliveredQuantity: deliveredMap.get(product.id) || 0,
          processingQuantity: processingMap.get(product.id) || 0,
          postponedQuantity: postponedMap.get(product.id) || 0,
          isLowStock: (product.stock || 0) <= (product.lowStockThreshold || 0),
          stockStatus: (product.stock || 0) <= (product.lowStockThreshold || 0) ? 'low' : 
                      (product.stock || 0) === 0 ? 'out' : 'good',
          lastUpdated: product.updatedAt?.toISOString() || new Date().toISOString()
        };
      });

      return enrichedResult;
    } catch (error) {
      console.error('Error fetching platform inventory:', error);
      return [];
    }
  }

  async getInventorySummary(platformId: string, filters: { fromDate: Date; toDate: Date }): Promise<any> {
    try {
      const totalProducts = await db
        .select({ count: sql`count(*)` })
        .from(products)
        .where(eq(products.platformId, platformId));

      const lowStockProducts = await db
        .select({ count: sql`count(*)` })
        .from(products)
        .where(
          and(
            eq(products.platformId, platformId),
            sql`COALESCE(${products.stock}, 0) <= COALESCE(${products.lowStockThreshold}, 0)`
          )
        );

      const outOfStockProducts = await db
        .select({ count: sql`count(*)` })
        .from(products)
        .where(
          and(
            eq(products.platformId, platformId),
            sql`COALESCE(${products.stock}, 0) = 0`
          )
        );

      // حساب إجمالي المخزون المتبقي والقيمة الإجمالية
      const inventoryData = await db
        .select({ 
          productId: products.id,
          stock: products.stock,
          cost: products.cost
        })
        .from(products)
        .where(eq(products.platformId, platformId));

      let totalRemainingQuantity = 0;
      let totalRemainingValue = 0;

      // حساب المخزون المتبقي لكل منتج (عرض المخزون الأصلي بدلاً من المحسوب)
      for (const product of inventoryData) {
        const stockQuantity = product.stock || 0;
        const unitCost = parseFloat(product.cost?.toString() || '0');

        // عرض المخزون الأصلي مباشرة بدلاً من الحساب
        totalRemainingQuantity += stockQuantity;
        totalRemainingValue += stockQuantity * unitCost;
      }

      return {
        totalProducts: parseInt(totalProducts[0]?.count as string) || 0,
        lowStockProducts: parseInt(lowStockProducts[0]?.count as string) || 0,
        outOfStockProducts: parseInt(outOfStockProducts[0]?.count as string) || 0,
        totalInventoryValue: totalRemainingValue,
        totalRemainingQuantity: totalRemainingQuantity,
      };
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalInventoryValue: 0,
      };
    }
  }

  async updateProductStock(productId: string, stock: number, platformId: string): Promise<Product | undefined> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({
          stock: stock,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(products.id, productId),
            eq(products.platformId, platformId)
          )
        )
        .returning();

      return updatedProduct;
    } catch (error) {
      console.error('Error updating product stock:', error);
      return undefined;
    }
  }

  async updateProductThreshold(productId: string, lowStockThreshold: number, platformId: string): Promise<Product | undefined> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({
          lowStockThreshold: lowStockThreshold,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(products.id, productId),
            eq(products.platformId, platformId)
          )
        )
        .returning();

      return updatedProduct;
    } catch (error) {
      console.error('Error updating product threshold:', error);
      return undefined;
    }
  }

  // WhatsApp-Order linking operations
  async getOrdersByPhone(platformId: string, phoneVariations: string[]): Promise<Order[]> {
    try {
      // البحث الدقيق أولاً
      const exactMatches = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.platformId, platformId),
            or(...phoneVariations.map(phone => eq(orders.customerPhone, phone)))
          )
        )
        .orderBy(desc(orders.createdAt));

      // إذا لم نجد نتائج دقيقة، جرب البحث الجزئي
      if (exactMatches.length === 0) {
        const partialMatches = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.platformId, platformId),
              or(...phoneVariations.map(phone => 
                or(
                  like(orders.customerPhone, `%${phone}%`),
                  like(orders.customerPhone, `%${phone.replace(/^0/, '')}%`),
                  like(orders.customerPhone, `%${phone.replace(/^964/, '')}%`)
                )
              ))
            )
          )
          .orderBy(desc(orders.createdAt));

        console.log(`📞 Found ${partialMatches.length} orders with partial phone match`);
        return partialMatches;
      }
      
      console.log(`📞 Found ${exactMatches.length} orders with exact phone match`);
      return exactMatches;
    } catch (error) {
      console.error('Error getting orders by phone:', error);
      return [];
    }
  }

  async getLandingPageOrdersByPhone(platformId: string, phoneVariations: string[]): Promise<LandingPageOrder[]> {
    try {
      console.log(`🔍 Searching landing page orders for platform ${platformId} with phones:`, phoneVariations);
      
      // البحث الدقيق أولاً
      const exactMatches = await db
        .select()
        .from(landingPageOrders)
        .where(
          and(
            eq(landingPageOrders.platformId, platformId),
            or(...phoneVariations.map(phone => eq(landingPageOrders.customerPhone, phone)))
          )
        )
        .orderBy(desc(landingPageOrders.createdAt));

      console.log(`🛒 Exact matches found: ${exactMatches.length}`);
      
      // إذا لم نجد نتائج دقيقة، جرب البحث الجزئي
      if (exactMatches.length === 0) {
        console.log(`🔍 Trying partial phone matches...`);
        const partialMatches = await db
          .select()
          .from(landingPageOrders)
          .where(
            and(
              eq(landingPageOrders.platformId, platformId),
              or(...phoneVariations.map(phone => 
                or(
                  like(landingPageOrders.customerPhone, `%${phone}%`),
                  like(landingPageOrders.customerPhone, `%${phone.replace(/^0/, '')}%`),
                  like(landingPageOrders.customerPhone, `%${phone.replace(/^964/, '')}%`)
                )
              ))
            )
          )
          .orderBy(desc(landingPageOrders.createdAt));

        console.log(`🛒 Found ${partialMatches.length} landing page orders with partial phone match`);
        return partialMatches;
      }
      
      console.log(`🛒 Found ${exactMatches.length} landing page orders with exact phone match`);
      return exactMatches;
    } catch (error) {
      console.error('Error getting landing page orders by phone:', error);
      return [];
    }
  }

  async getUserPlatform(userId: string): Promise<string | undefined> {
    try {
      // جلب platformId من جدول المستخدمين
      const [user] = await db
        .select({ platformId: users.platformId })
        .from(users)
        .where(eq(users.id, userId));
      
      console.log(`🔍 Getting platform for user ${userId}: ${user?.platformId}`);
      
      return user?.platformId || undefined;
    } catch (error) {
      console.error('Error getting user platform:', error);
      return undefined;
    }
  }

  // System Settings Management
  async getSystemSettings(): Promise<any> {
    try {
      const result = await db
        .select()
        .from(systemSettings);

      const settings: any = {};
      result.forEach(setting => {
        settings[setting.settingKey] = setting.settingValue;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return {};
    }
  }

  async saveSystemSettings(settingsData: any): Promise<void> {
    try {
      const settingsToUpdate = [
        { key: 'tiktokAppId', value: settingsData.tiktokAppId || null },
        { key: 'tiktokAppSecret', value: settingsData.tiktokAppSecret || null },
        { key: 'metaAppId', value: settingsData.metaAppId || null },
        { key: 'metaAppSecret', value: settingsData.metaAppSecret || null },
      ];

      for (const setting of settingsToUpdate) {
        await db
          .insert(systemSettings)
          .values({
            settingKey: setting.key,
            settingValue: setting.value,
            description: `${setting.key} setting`,
          })
          .onConflictDoUpdate({
            target: systemSettings.settingKey,
            set: {
              settingValue: setting.value,
              updatedAt: new Date(),
            }
          });
      }

      console.log('System settings saved successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      throw error;
    }
  }

  async savePlatformAdToken(platform: string, token: string, platformId: string): Promise<void> {
    try {
      const settingKey = `${platform}_token_${platformId}`;
      
      await db
        .insert(systemSettings)
        .values({
          settingKey,
          settingValue: token,
          description: `${platform} access token for platform ${platformId}`,
        })
        .onConflictDoUpdate({
          target: systemSettings.settingKey,
          set: {
            settingValue: token,
            updatedAt: new Date(),
          }
        });

      console.log(`${platform} token saved for platform ${platformId}`);
    } catch (error) {
      console.error('Error saving platform ad token:', error);
      throw error;
    }
  }

  async getPlatformAdToken(platform: string, platformId: string): Promise<string | null> {
    try {
      // البحث أولاً في جدول platforms
      const platformResult = await db
        .select()
        .from(platforms)
        .where(eq(platforms.id, platformId))
        .limit(1);
      
      if (platformResult.length > 0) {
        const platformData = platformResult[0];
        
        if (platform === 'tiktok') {
          if (platformData.tiktokAccessToken) {
            return platformData.tiktokAccessToken;
          }
        } else if (platform === 'tiktok_advertiser') {
          if (platformData.tiktokAdvertiserId) {
            return platformData.tiktokAdvertiserId;
          }
        }
      }

      // إذا لم يوجد في platforms، البحث في system_settings (للتوافق مع البيانات القديمة)
      const settingKey = `${platform}_token_${platformId}`;
      
      const result = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, settingKey))
        .limit(1);

      return result.length > 0 ? result[0].settingValue : null;
    } catch (error) {
      console.error('Error getting platform ad token:', error);
      return null;
    }
  }

  async deletePlatformAdToken(platform: string, platformId: string): Promise<void> {
    try {
      // حذف من جدول platforms
      if (platform === 'tiktok') {
        await db
          .update(platforms)
          .set({ 
            tiktokAccessToken: null,
            tiktokAdvertiserId: null 
          })
          .where(eq(platforms.id, platformId));
      }

      // حذف من system_settings أيضاً (للتوافق مع البيانات القديمة)
      const settingKey = `${platform}_token_${platformId}`;
      
      await db
        .delete(systemSettings)
        .where(eq(systemSettings.settingKey, settingKey));

      console.log(`${platform} token deleted for platform ${platformId}`);
    } catch (error) {
      console.error('Error deleting platform ad token:', error);
      throw error;
    }
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<any> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key));
    return setting;
  }

  async setSystemSetting(key: string, value: string, description?: string): Promise<any> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ settingKey: key, settingValue: value, description })
      .onConflictDoUpdate({
        target: systemSettings.settingKey,
        set: { settingValue: value, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  // ==================== TIKTOK ADS STORAGE OPERATIONS ====================

  // TikTok Campaigns
  async getTikTokCampaigns(platformId: string): Promise<TiktokCampaign[]> {
    const campaigns = await db.select().from(tiktokCampaigns)
      .where(eq(tiktokCampaigns.platformId, platformId))
      .orderBy(desc(tiktokCampaigns.createdAt));
    
    console.log(`Retrieved ${campaigns.length} campaigns from database for platform ${platformId}`);
    if (campaigns.length > 0) {
      console.log('Sample campaign from DB:', campaigns[0]);
    }
    
    return campaigns;
  }

  async getTikTokCampaign(id: string): Promise<TiktokCampaign | undefined> {
    const [campaign] = await db.select().from(tiktokCampaigns).where(eq(tiktokCampaigns.id, id));
    return campaign;
  }

  async getTikTokCampaignById(id: string): Promise<TiktokCampaign | undefined> {
    const [campaign] = await db.select().from(tiktokCampaigns).where(eq(tiktokCampaigns.id, id));
    return campaign;
  }

  async getTikTokCampaignByCampaignId(campaignId: string): Promise<TiktokCampaign | undefined> {
    const [campaign] = await db.select().from(tiktokCampaigns).where(eq(tiktokCampaigns.campaignId, campaignId));
    return campaign;
  }

  async upsertTikTokCampaign(campaignId: string, campaign: Partial<InsertTiktokCampaign>): Promise<TiktokCampaign> {
    const [result] = await db
      .insert(tiktokCampaigns)
      .values(campaign as InsertTiktokCampaign)
      .onConflictDoUpdate({
        target: tiktokCampaigns.campaignId,
        set: { ...campaign, updatedAt: new Date() }
      })
      .returning();
    return result;
  }

  async deleteTikTokCampaign(id: string): Promise<void> {
    await db.delete(tiktokCampaigns).where(eq(tiktokCampaigns.id, id));
  }

  async deleteTikTokAdGroup(id: string): Promise<void> {
    await db.delete(tiktokAdGroups).where(eq(tiktokAdGroups.id, id));
  }

  async deleteTikTokAd(id: string): Promise<void> {
    await db.delete(tiktokAds).where(eq(tiktokAds.id, id));
  }

  async updateTikTokCampaignStats(campaignId: string, stats: any): Promise<void> {
    await db.update(tiktokCampaigns)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(tiktokCampaigns.campaignId, campaignId));
  }

  async updateTikTokCampaignStatus(id: string, status: string): Promise<TiktokCampaign> {
    const [updatedCampaign] = await db.update(tiktokCampaigns)
      .set({ status, updatedAt: new Date() })
      .where(eq(tiktokCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  // TikTok Ad Groups
  async getTikTokAdGroups(platformId: string, campaignId?: string): Promise<TiktokAdGroup[]> {
    if (campaignId) {
      return await db.select().from(tiktokAdGroups)
        .where(and(eq(tiktokAdGroups.platformId, platformId), eq(tiktokAdGroups.campaignId, campaignId)))
        .orderBy(desc(tiktokAdGroups.createdAt));
    }
    
    return await db.select().from(tiktokAdGroups)
      .where(eq(tiktokAdGroups.platformId, platformId))
      .orderBy(desc(tiktokAdGroups.createdAt));
  }

  async getTikTokAdGroup(id: string): Promise<TiktokAdGroup | undefined> {
    const [adGroup] = await db.select().from(tiktokAdGroups).where(eq(tiktokAdGroups.id, id));
    return adGroup;
  }

  async getTikTokAdGroupById(id: string): Promise<TiktokAdGroup | undefined> {
    const [adGroup] = await db.select().from(tiktokAdGroups).where(eq(tiktokAdGroups.id, id));
    return adGroup;
  }

  async upsertTikTokAdGroup(adGroupId: string, adGroup: Partial<InsertTiktokAdGroup>): Promise<TiktokAdGroup> {
    const [result] = await db
      .insert(tiktokAdGroups)
      .values(adGroup as InsertTiktokAdGroup)
      .onConflictDoUpdate({
        target: tiktokAdGroups.adGroupId,
        set: { ...adGroup, updatedAt: new Date() }
      })
      .returning();
    return result;
  }

  async updateTikTokAdGroupStatus(id: string, status: string): Promise<TiktokAdGroup> {
    const [updatedAdGroup] = await db.update(tiktokAdGroups)
      .set({ status, updatedAt: new Date() })
      .where(eq(tiktokAdGroups.id, id))
      .returning();
    return updatedAdGroup;
  }

  // TikTok Ads
  async getTikTokAds(platformId: string, campaignId?: string, adGroupId?: string): Promise<TiktokAd[]> {
    let conditions = [eq(tiktokAds.platformId, platformId)];
    
    if (campaignId) {
      // Get ads through adGroup relationship since tiktokAds doesn't have direct campaignId
      const adGroupsInCampaign = await db.select({ id: tiktokAdGroups.id })
        .from(tiktokAdGroups)
        .where(eq(tiktokAdGroups.campaignId, campaignId));
      
      if (adGroupsInCampaign.length > 0) {
        const adGroupIds = adGroupsInCampaign.map(ag => ag.id);
        conditions.push(inArray(tiktokAds.adGroupId, adGroupIds));
      } else {
        // No ad groups found for this campaign, return empty result
        return [];
      }
    }
    
    if (adGroupId) {
      conditions.push(eq(tiktokAds.adGroupId, adGroupId));
    }
    
    return await db.select().from(tiktokAds)
      .where(and(...conditions))
      .orderBy(desc(tiktokAds.createdAt));
  }

  async getTikTokAd(id: string): Promise<TiktokAd | undefined> {
    const [ad] = await db.select().from(tiktokAds).where(eq(tiktokAds.id, id));
    return ad;
  }

  async upsertTikTokAd(adId: string, ad: Partial<InsertTiktokAd>): Promise<TiktokAd> {
    const [result] = await db
      .insert(tiktokAds)
      .values(ad as InsertTiktokAd)
      .onConflictDoUpdate({
        target: tiktokAds.adId,
        set: { ...ad, updatedAt: new Date() }
      })
      .returning();
    return result;
  }

  async updateTikTokAdStatus(id: string, status: string): Promise<TiktokAd> {
    const [updatedAd] = await db.update(tiktokAds)
      .set({ status, updatedAt: new Date() })
      .where(eq(tiktokAds.id, id))
      .returning();
    return updatedAd;
  }

  async updateTikTokAdStats(adId: string, stats: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    conversions?: number;
    leads?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
    conversionRate?: number;
    conversionCost?: number;
    resultRate?: number;
  }): Promise<TiktokAd> {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (stats.impressions !== undefined) updateData.impressions = stats.impressions;
    if (stats.clicks !== undefined) updateData.clicks = stats.clicks;
    if (stats.spend !== undefined) updateData.spend = stats.spend.toString();
    if (stats.conversions !== undefined) updateData.conversions = stats.conversions;
    if (stats.leads !== undefined) updateData.leads = stats.leads;

    const [updatedAd] = await db.update(tiktokAds)
      .set(updateData)
      .where(eq(tiktokAds.adId, adId))
      .returning();
    return updatedAd;
  }

  async getTikTokAdById(id: string): Promise<TiktokAd | undefined> {
    const [ad] = await db.select().from(tiktokAds).where(eq(tiktokAds.id, id));
    return ad;
  }

  async updateTikTokAdPixel(adId: string, pixelId: string | null): Promise<TiktokAd> {
    const [updatedAd] = await db.update(tiktokAds)
      .set({ pixelId, updatedAt: new Date() })
      .where(eq(tiktokAds.id, adId))
      .returning();
    return updatedAd;
  }

  async getTikTokPixelByPixelId(pixelId: string): Promise<TiktokPixel | undefined> {
    const [pixel] = await db.select().from(tiktokPixels).where(eq(tiktokPixels.pixelId, pixelId));
    return pixel;
  }

  // TikTok Lead Forms
  async getTikTokLeadFormByFormId(formId: string): Promise<TiktokLeadForm | undefined> {
    const [leadForm] = await db
      .select()
      .from(tiktokLeadForms)
      .where(eq(tiktokLeadForms.formId, formId));
    return leadForm;
  }

  async getTikTokLeadForms(platformId: string): Promise<TiktokLeadForm[]> {
    return await db.select().from(tiktokLeadForms)
      .where(eq(tiktokLeadForms.platformId, platformId))
      .orderBy(desc(tiktokLeadForms.createdAt));
  }

  async getTikTokLeadForm(id: string): Promise<TiktokLeadForm | undefined> {
    const [form] = await db.select().from(tiktokLeadForms).where(eq(tiktokLeadForms.id, id));
    return form;
  }

  async createTikTokLeadForm(leadForm: InsertTiktokLeadForm): Promise<TiktokLeadForm> {
    const [result] = await db.insert(tiktokLeadForms).values(leadForm).returning();
    return result;
  }

  // TikTok Leads
  async getTikTokLeads(platformId: string, formId?: string): Promise<TiktokLead[]> {
    if (formId) {
      return await db.select().from(tiktokLeads)
        .where(and(eq(tiktokLeads.platformId, platformId), eq(tiktokLeads.leadFormId, formId)))
        .orderBy(desc(tiktokLeads.createdAt));
    }
    
    return await db.select().from(tiktokLeads)
      .where(eq(tiktokLeads.platformId, platformId))
      .orderBy(desc(tiktokLeads.createdAt));
  }

  async getTikTokLead(id: string): Promise<TiktokLead | undefined> {
    const [lead] = await db.select().from(tiktokLeads).where(eq(tiktokLeads.id, id));
    return lead;
  }

  async createTikTokLead(lead: InsertTiktokLead): Promise<TiktokLead> {
    const [result] = await db.insert(tiktokLeads).values(lead).returning();
    return result;
  }

  async updateTikTokLeadStatus(id: string, status: string, notes?: string): Promise<TiktokLead> {
    const [result] = await db.update(tiktokLeads)
      .set({ 
        followUpStatus: status, 
        notes: notes,
        lastContactAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(tiktokLeads.id, id))
      .returning();
    return result;
  }

  // TikTok Pixels
  async getTikTokPixels(platformId: string): Promise<TiktokPixel[]> {
    return await db.select().from(tiktokPixels)
      .where(eq(tiktokPixels.platformId, platformId))
      .orderBy(desc(tiktokPixels.createdAt));
  }

  async getTikTokPixel(id: string): Promise<TiktokPixel | undefined> {
    const [pixel] = await db.select().from(tiktokPixels).where(eq(tiktokPixels.id, id));
    return pixel;
  }

  async createTikTokPixel(pixel: InsertTiktokPixel): Promise<TiktokPixel> {
    const [result] = await db.insert(tiktokPixels).values(pixel).returning();
    return result;
  }

  async updatePixel(pixelId: string, updates: Partial<TiktokPixel>): Promise<TiktokPixel | undefined> {
    const [result] = await db.update(tiktokPixels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tiktokPixels.pixelId, pixelId))
      .returning();
    return result;
  }

  // Ad Platform Settings
  async getAdPlatformSettings(platformId: string): Promise<AdPlatformSettings | undefined> {
    const [settings] = await db.select().from(adPlatformSettings)
      .where(eq(adPlatformSettings.platformId, platformId));
    return settings;
  }

  async createAdPlatformSettings(settings: InsertAdPlatformSettings): Promise<AdPlatformSettings> {
    const [result] = await db.insert(adPlatformSettings).values(settings).returning();
    return result;
  }

  async updateAdPlatformSettings(platformId: string, settings: Partial<InsertAdPlatformSettings>): Promise<AdPlatformSettings> {
    const [result] = await db.update(adPlatformSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(adPlatformSettings.platformId, platformId))
      .returning();
    return result;
  }

  // ==================== ACCOUNTING SYSTEM IMPLEMENTATION ====================

  // Accounting Summary
  async getAccountingSummary(platformId: string): Promise<any> {
    try {
      // Get current month financial summary
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Total Revenue from cash transactions
      const revenueResult = await db.execute(
        sql`SELECT COALESCE(SUM(amount), 0) as total_revenue 
            FROM cash_transactions 
            WHERE platform_id = ${platformId} 
            AND transaction_type = 'income' 
            AND created_at >= ${firstDayOfMonth}`
      );
      
      // Total Expenses from expenses table
      const expensesResult = await db.execute(
        sql`SELECT COALESCE(SUM(amount), 0) as total_expenses 
            FROM expenses 
            WHERE platform_id = ${platformId} 
            AND created_at >= ${firstDayOfMonth}`
      );
      
      // Pending transactions
      const pendingResult = await db.execute(
        sql`SELECT COUNT(*) as pending_count 
            FROM transactions 
            WHERE platform_id = ${platformId} 
            AND status = 'pending'`
      );
      
      // Current cash balance from all cash accounts
      const cashResult = await db.execute(
        sql`SELECT COALESCE(SUM(current_balance), 0) as total_cash 
            FROM cash_accounts 
            WHERE platform_id = ${platformId} 
            AND is_active = true`
      );

      const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue as string) || 0;
      const totalExpenses = parseFloat(expensesResult.rows[0]?.total_expenses as string) || 0;
      const netIncome = totalRevenue - totalExpenses;
      
      return {
        currentMonth: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          netIncome: netIncome,
          profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue * 100).toFixed(2) : 0
        },
        cashFlow: {
          totalCash: parseFloat(cashResult.rows[0]?.total_cash as string) || 0,
          pendingTransactions: parseInt(pendingResult.rows[0]?.pending_count as string) || 0
        }
      };
    } catch (error) {
      console.error('Error getting accounting summary:', error);
      return {
        currentMonth: { revenue: 0, expenses: 0, netIncome: 0, profitMargin: 0 },
        cashFlow: { totalCash: 0, pendingTransactions: 0 }
      };
    }
  }

  // Chart of Accounts
  async getChartOfAccounts(platformId: string): Promise<any[]> {
    const accounts = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.platformId, platformId))
      .orderBy(chartOfAccounts.accountCode);
    return accounts;
  }

  async createChartAccount(accountData: any): Promise<any> {
    const [account] = await db.insert(chartOfAccounts).values(accountData).returning();
    return account;
  }

  async updateChartAccount(accountId: string, updates: any): Promise<any> {
    const [account] = await db.update(chartOfAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chartOfAccounts.id, accountId))
      .returning();
    return account;
  }

  async deleteChartAccount(accountId: string): Promise<void> {
    await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, accountId));
  }

  // Transactions
  async getTransactions(platformId: string, page: number, limit: number, filters: any): Promise<any> {
    let baseQuery = db.select().from(transactions);
    let conditions = [eq(transactions.platformId, platformId)];

    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters.type) {
      conditions.push(eq(transactions.transactionType, filters.type));
    }
    if (filters.fromDate && filters.toDate) {
      conditions.push(
        gte(transactions.createdAt, filters.fromDate),
        lte(transactions.createdAt, filters.toDate)
      );
    }

    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalCount = await db.select({ count: sql`count(*)` })
      .from(transactions)
      .where(eq(transactions.platformId, platformId));

    return {
      transactions: results,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount[0]?.count as string) || 0,
        pages: Math.ceil((parseInt(totalCount[0]?.count as string) || 0) / limit)
      }
    };
  }

  async createTransaction(transactionData: any): Promise<any> {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  async updateTransactionStatus(transactionId: string, status: string, approvedBy?: string): Promise<any> {
    const [transaction] = await db.update(transactions)
      .set({ 
        status, 
        approvedBy,
        approvedAt: status === 'approved' ? new Date() : null,
        updatedAt: new Date() 
      })
      .where(eq(transactions.id, transactionId))
      .returning();
    return transaction;
  }

  // Cash Accounts
  async getCashAccounts(platformId: string): Promise<any[]> {
    const accounts = await db.select().from(cashAccounts)
      .where(eq(cashAccounts.platformId, platformId))
      .orderBy(cashAccounts.accountName);
    return accounts;
  }

  async createCashAccount(accountData: any): Promise<any> {
    const [account] = await db.insert(cashAccounts).values(accountData).returning();
    return account;
  }

  async updateCashAccount(accountId: string, updates: any): Promise<any> {
    const [account] = await db.update(cashAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cashAccounts.id, accountId))
      .returning();
    return account;
  }

  async deleteCashAccount(accountId: string): Promise<void> {
    await db.delete(cashAccounts)
      .where(eq(cashAccounts.id, accountId));
  }

  // Cash Transactions
  async getCashTransactions(platformId: string, page: number, limit: number, filters: any): Promise<any> {
    let baseQuery = db.select().from(cashTransactions);
    let conditions = [eq(cashTransactions.platformId, platformId)];

    if (filters.accountId) {
      conditions.push(eq(cashTransactions.cashAccountId, filters.accountId));
    }
    if (filters.type) {
      conditions.push(eq(cashTransactions.transactionType, filters.type));
    }
    if (filters.fromDate && filters.toDate) {
      conditions.push(
        gte(cashTransactions.createdAt, filters.fromDate),
        lte(cashTransactions.createdAt, filters.toDate)
      );
    }

    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(cashTransactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalCount = await db.select({ count: sql`count(*)` })
      .from(cashTransactions)
      .where(eq(cashTransactions.platformId, platformId));

    return {
      transactions: results,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount[0]?.count as string) || 0,
        pages: Math.ceil((parseInt(totalCount[0]?.count as string) || 0) / limit)
      }
    };
  }

  async createCashTransaction(transactionData: any): Promise<any> {
    const [transaction] = await db.insert(cashTransactions).values(transactionData).returning();
    
    // Update cash account balance
    if (transactionData.accountId) {
      const amount = parseFloat(transactionData.amount);
      const isIncome = transactionData.transactionType === 'income';
      
      await db.update(cashAccounts)
        .set({
          currentBalance: sql`current_balance ${isIncome ? '+' : '-'} ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(cashAccounts.id, transactionData.accountId));
    }
    
    return transaction;
  }

  // Expenses
  async getExpenses(platformId: string, page: number, limit: number, filters: any): Promise<any> {
    let baseQuery = db.select().from(expenses);
    let conditions = [eq(expenses.platformId, platformId)];

    if (filters.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    if (filters.status) {
      conditions.push(eq(expenses.status, filters.status));
    }
    if (filters.fromDate && filters.toDate) {
      conditions.push(
        gte(expenses.expenseDate, filters.fromDate),
        lte(expenses.expenseDate, filters.toDate)
      );
    }

    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalCount = await db.select({ count: sql`count(*)` })
      .from(expenses)
      .where(eq(expenses.platformId, platformId));

    return {
      expenses: results,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount[0]?.count as string) || 0,
        pages: Math.ceil((parseInt(totalCount[0]?.count as string) || 0) / limit)
      }
    };
  }

  async createExpense(expenseData: any): Promise<any> {
    const [expense] = await db.insert(expenses).values(expenseData).returning();
    return expense;
  }

  async updateExpense(expenseId: string, updates: any): Promise<any> {
    const [expense] = await db.update(expenses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expenses.id, expenseId))
      .returning();
    return expense;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, expenseId));
  }

  // Expense Categories
  async getExpenseCategories(platformId: string): Promise<any[]> {
    const categories = await db.select().from(expenseCategories)
      .where(eq(expenseCategories.platformId, platformId))
      .orderBy(expenseCategories.categoryName);
    return categories;
  }

  async createExpenseCategory(categoryData: any): Promise<any> {
    const [category] = await db.insert(expenseCategories).values(categoryData).returning();
    return category;
  }

  async updateExpenseCategory(categoryId: string, updates: any): Promise<any> {
    const [category] = await db.update(expenseCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expenseCategories.id, categoryId))
      .returning();
    return category;
  }

  // Budgets
  async getBudgets(platformId: string, filters: any): Promise<any[]> {
    let baseQuery = db.select().from(budgets);
    let conditions = [eq(budgets.platformId, platformId)];

    if (filters.year) {
      conditions.push(eq(budgets.budgetYear, filters.year));
    }
    if (filters.status) {
      conditions.push(eq(budgets.status, filters.status));
    }

    return await baseQuery
      .where(and(...conditions))
      .orderBy(desc(budgets.budgetYear), budgets.budgetName);
  }

  async createBudget(budgetData: any): Promise<any> {
    const [budget] = await db.insert(budgets).values(budgetData).returning();
    return budget;
  }

  async updateBudget(budgetId: string, updates: any): Promise<any> {
    const [budget] = await db.update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgets.id, budgetId))
      .returning();
    return budget;
  }

  // Financial Reports
  async getProfitLossReport(platformId: string, fromDate: Date, toDate: Date): Promise<any> {
    // Revenue from cash transactions
    const revenueResult = await db.execute(
      sql`SELECT COALESCE(SUM(amount), 0) as total_revenue 
          FROM cash_transactions 
          WHERE platform_id = ${platformId} 
          AND transaction_type = 'income' 
          AND created_at BETWEEN ${fromDate} AND ${toDate}`
    );

    // Expenses
    const expensesResult = await db.execute(
      sql`SELECT 
            ec.category_name,
            COALESCE(SUM(e.amount), 0) as total_amount
          FROM expenses e
          LEFT JOIN expense_categories ec ON e.category_id = ec.id
          WHERE e.platform_id = ${platformId}
          AND e.expense_date BETWEEN ${fromDate} AND ${toDate}
          GROUP BY ec.id, ec.category_name
          ORDER BY total_amount DESC`
    );

    const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue as string) || 0;
    const expensesByCategory = expensesResult.rows || [];
    const totalExpenses = expensesByCategory.reduce((sum, cat: any) => 
      sum + (parseFloat(cat.total_amount) || 0), 0);

    return {
      period: { from: fromDate, to: toDate },
      revenue: totalRevenue,
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory
      },
      netIncome: totalRevenue - totalExpenses,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2) : 0
    };
  }

  async getBalanceSheetReport(platformId: string, asOfDate: Date): Promise<any> {
    // Cash and cash equivalents
    const cashResult = await db.execute(
      sql`SELECT COALESCE(SUM(current_balance), 0) as total_cash 
          FROM cash_accounts 
          WHERE platform_id = ${platformId} 
          AND is_active = true`
    );

    // Chart of accounts breakdown
    const accountsResult = await db.execute(
      sql`SELECT 
            account_type,
            account_category,
            COALESCE(SUM(current_balance), 0) as total_balance
          FROM chart_of_accounts 
          WHERE platform_id = ${platformId}
          AND is_active = true
          GROUP BY account_type, account_category
          ORDER BY account_type, account_category`
    );

    return {
      asOfDate: asOfDate,
      assets: {
        cash: parseFloat(cashResult.rows[0]?.total_cash as string) || 0,
        byType: accountsResult.rows.filter((acc: any) => acc.account_type === 'assets')
      },
      liabilities: {
        byType: accountsResult.rows.filter((acc: any) => acc.account_type === 'liabilities')
      },
      equity: {
        byType: accountsResult.rows.filter((acc: any) => acc.account_type === 'equity')
      }
    };
  }

  async getCashFlowReport(platformId: string, fromDate: Date, toDate: Date): Promise<any> {
    // Operating cash flow
    const operatingResult = await db.execute(
      sql`SELECT 
            transaction_type,
            COALESCE(SUM(amount), 0) as total_amount
          FROM cash_transactions 
          WHERE platform_id = ${platformId}
          AND created_at BETWEEN ${fromDate} AND ${toDate}
          GROUP BY transaction_type`
    );

    const cashFlowData = operatingResult.rows.reduce((acc: any, row: any) => {
      acc[row.transaction_type] = parseFloat(row.total_amount) || 0;
      return acc;
    }, {});

    const cashInflows = cashFlowData.income || 0;
    const cashOutflows = cashFlowData.expense || 0;
    const netCashFlow = cashInflows - cashOutflows;

    return {
      period: { from: fromDate, to: toDate },
      operating: {
        cashInflows,
        cashOutflows,
        netCashFlow
      },
      summary: {
        beginningCash: 0, // Would need opening balance calculation
        netCashFlow,
        endingCash: netCashFlow // Simplified calculation
      }
    };
  }

  // Journal Entries
  async getJournalEntries(platformId: string, page: number, limit: number, filters: any): Promise<any> {
    let baseQuery = db.select().from(transactions);
    let conditions = [eq(transactions.platformId, platformId)];

    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters.fromDate && filters.toDate) {
      conditions.push(
        gte(transactions.createdAt, filters.fromDate),
        lte(transactions.createdAt, filters.toDate)
      );
    }

    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalCount = await db.select({ count: sql`count(*)` })
      .from(transactions)
      .where(eq(transactions.platformId, platformId));

    // Transform transactions to journal entry format
    const journalEntries = results.map((transaction: any) => ({
      id: transaction.id,
      referenceNumber: transaction.referenceNumber || `JE-${transaction.id.slice(-6)}`,
      entryDate: transaction.createdAt,
      description: transaction.description,
      status: transaction.status,
      totalDebit: transaction.amount || 0,
      totalCredit: transaction.amount || 0,
      createdAt: transaction.createdAt,
      entries: [] // Would need to get from transaction_entries table
    }));

    return {
      entries: journalEntries,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount[0]?.count as string) || 0,
        pages: Math.ceil((parseInt(totalCount[0]?.count as string) || 0) / limit)
      }
    };
  }

  async createJournalEntry(journalEntryData: any): Promise<any> {
    try {
      // Generate transaction number if not provided
      const transactionNumber = journalEntryData.referenceNumber || `JE-${Date.now()}`;
      const totalDebit = journalEntryData.entries.reduce((sum: number, entry: any) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = journalEntryData.entries.reduce((sum: number, entry: any) => sum + (entry.creditAmount || 0), 0);

      // Create the main transaction record
      const transactionData = {
        platformId: journalEntryData.platformId,
        transactionNumber: transactionNumber,
        transactionDate: new Date(journalEntryData.entryDate),
        transactionType: 'journal_entry',
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        description: journalEntryData.description,
        reference: journalEntryData.referenceNumber,
        status: 'draft',
        createdBy: journalEntryData.createdBy || 'system',
        createdAt: new Date()
      };

      const [transaction] = await db.insert(transactions).values(transactionData).returning();

      // Create transaction entries for each journal entry line
      const entryPromises = journalEntryData.entries.map(async (entry: any) => {
        const entryData = {
          transactionId: transaction.id,
          accountId: entry.accountId,
          description: entry.description,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          platformId: journalEntryData.platformId
        };
        return db.insert(transactionEntries).values(entryData).returning();
      });

      await Promise.all(entryPromises);

      return {
        ...transaction,
        entries: journalEntryData.entries
      };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  async getJournalEntry(entryId: string): Promise<any> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, entryId));
    
    if (!transaction) {
      return null;
    }

    // Get transaction entries
    const entries = await db.select().from(transactionEntries)
      .where(eq(transactionEntries.transactionId, entryId));

    return {
      id: transaction.id,
      referenceNumber: transaction.reference || transaction.transactionNumber || `JE-${transaction.id.slice(-6)}`,
      entryDate: transaction.transactionDate || transaction.createdAt,
      description: transaction.description,
      status: transaction.status,
      totalDebit: entries.reduce((sum, entry) => sum + Number(entry.debitAmount || 0), 0),
      totalCredit: entries.reduce((sum, entry) => sum + Number(entry.creditAmount || 0), 0),
      createdAt: transaction.createdAt,
      entries: entries
    };
  }

  async updateJournalEntryStatus(entryId: string, status: string, approvedBy?: string): Promise<any> {
    const [transaction] = await db.update(transactions)
      .set({ 
        status, 
        approvedBy,
        approvedAt: status === 'approved' ? new Date() : null,
        updatedAt: new Date() 
      })
      .where(eq(transactions.id, entryId))
      .returning();
    return transaction;
  }

  async deleteJournalEntry(entryId: string): Promise<void> {
    // First delete transaction entries
    await db.delete(transactionEntries)
      .where(eq(transactionEntries.transactionId, entryId));
    
    // Then delete the transaction itself
    await db.delete(transactions)
      .where(eq(transactions.id, entryId));
  }



  async upsertTikTokLeadForm(formId: string, leadFormData: Partial<InsertTiktokLeadForm>): Promise<TiktokLeadForm> {
    const existing = await this.getTikTokLeadFormByFormId(formId);
    
    if (existing) {
      const [updated] = await db.update(tiktokLeadForms)
        .set({
          ...leadFormData,
          updatedAt: new Date()
        })
        .where(eq(tiktokLeadForms.formId, formId))
        .returning();
      return updated;
    } else {
      return await this.createTikTokLeadForm({
        ...leadFormData,
        formId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as InsertTiktokLeadForm);
    }
  }

  async updateTikTokLeadForm(id: string, updates: Partial<TiktokLeadForm>): Promise<TiktokLeadForm> {
    const [updated] = await db.update(tiktokLeadForms)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tiktokLeadForms.id, id))
      .returning();
    return updated;
  }

  async deleteTikTokLeadForm(id: string): Promise<void> {
    await db.delete(tiktokLeadForms)
      .where(eq(tiktokLeadForms.id, id));
  }

  // Lead Submissions Methods
  async createLeadSubmission(submissionData: any): Promise<any> {
    const [submission] = await db.insert(tiktokLeads)
      .values({
        platformId: submissionData.platformId,
        leadFormId: submissionData.leadFormId,
        leadId: submissionData.leadId || submissionData.tiktokLeadId,
        customerName: submissionData.name || submissionData.customerName,
        customerPhone: submissionData.phone || submissionData.customerPhone,
        customerEmail: submissionData.email || submissionData.customerEmail,
        customerData: submissionData.formData || submissionData.customerData,
        followUpStatus: submissionData.status || submissionData.followUpStatus || 'new',
        notes: submissionData.notes,
        assignedTo: submissionData.assignedTo,
        submittedAt: submissionData.submittedAt || new Date(),
        lastContactAt: submissionData.lastContactAt,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return submission;
  }

  async getLeadSubmissionByTikTokId(tiktokLeadId: string): Promise<any> {
    const [submission] = await db.select()
      .from(tiktokLeads)
      .where(eq(tiktokLeads.leadId, tiktokLeadId));
    return submission;
  }

  async getPlatformChartData(platformId: string, period: string): Promise<any> {
    console.log(`📊 Getting REAL chart data for platform: ${platformId}, period: ${period}`);
    
    try {
      // جلب البيانات الحقيقية حسب الفترة الزمنية من قاعدة البيانات
      let dateQuery: string;
      let labels: string[];
      
      if (period === 'daily') {
        // آخر 7 أيام
        labels = [];
        const salesData: Array<{label: string, revenue: number, orders: number}> = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayLabel = i === 0 ? 'اليوم' : 
                          i === 1 ? 'أمس' : 
                          `${i} ${i <= 3 ? 'أيام' : 'أيام'} مضت`;
          
          labels.push(dayLabel);
          
          // جلب الطلبات لهذا اليوم
          const dayOrders = await db.execute(
            sql`SELECT COUNT(*) as count, COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as revenue 
                FROM landing_page_orders 
                WHERE platform_id = ${platformId} 
                AND DATE(created_at) = ${dateStr}`
          );
          
          const dayData = dayOrders.rows[0] as any;
          salesData.push({
            label: dayLabel,
            orders: parseInt(dayData.count) || 0,
            revenue: parseFloat(dayData.revenue) || 0
          });
        }
        
        console.log(`📊 Real daily data:`, salesData);
        return { labels, salesData };
        
      } else if (period === 'weekly') {
        // آخر 6 أسابيع
        labels = [];
        const salesData: Array<{label: string, revenue: number, orders: number}> = [];
        
        for (let i = 5; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const weekLabel = i === 0 ? 'الأسبوع الحالي' : `الأسبوع ${6-i}`;
          labels.push(weekLabel);
          
          // جلب الطلبات لهذا الأسبوع
          const weekOrders = await db.execute(
            sql`SELECT COUNT(*) as count, COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as revenue 
                FROM landing_page_orders 
                WHERE platform_id = ${platformId} 
                AND DATE(created_at) >= ${weekStart.toISOString().split('T')[0]}
                AND DATE(created_at) <= ${weekEnd.toISOString().split('T')[0]}`
          );
          
          const weekData = weekOrders.rows[0] as any;
          salesData.push({
            label: weekLabel,
            orders: parseInt(weekData.count) || 0,
            revenue: parseFloat(weekData.revenue) || 0
          });
        }
        
        console.log(`📊 Real weekly data:`, salesData);
        return { labels, salesData };
        
      } else {
        // آخر 6 أشهر
        labels = [];
        const salesData: Array<{label: string, revenue: number, orders: number}> = [];
        const monthNames = ['مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'];
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(monthDate.getMonth() - i);
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth() + 1;
          
          const monthLabel = monthNames[5-i] || `شهر ${month}`;
          labels.push(monthLabel);
          
          // جلب الطلبات لهذا الشهر
          const monthOrders = await db.execute(
            sql`SELECT COUNT(*) as count, COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as revenue 
                FROM landing_page_orders 
                WHERE platform_id = ${platformId} 
                AND EXTRACT(YEAR FROM created_at) = ${year}
                AND EXTRACT(MONTH FROM created_at) = ${month}`
          );
          
          const monthData = monthOrders.rows[0] as any;
          salesData.push({
            label: monthLabel,
            orders: parseInt(monthData.count) || 0,
            revenue: parseFloat(monthData.revenue) || 0
          });
        }
        
        console.log(`📊 Real monthly data:`, salesData);
        return { labels, salesData };
      }
      
    } catch (error) {
      console.error('Error fetching real chart data:', error);
      
      // في حالة الخطأ، استخدم البيانات الإجمالية الحقيقية
      const totalOrdersResult = await db.select({ count: sql`count(*)` })
        .from(landingPageOrders)
        .where(eq(landingPageOrders.platformId, platformId));
      
      const totalRevenueResult = await db.select({ total: sql`sum(CAST(${landingPageOrders.totalAmount} AS DECIMAL))` })
        .from(landingPageOrders)
        .where(eq(landingPageOrders.platformId, platformId));
      
      const totalOrders = parseInt(totalOrdersResult[0]?.count as string) || 0;
      const totalRevenue = parseFloat(totalRevenueResult[0]?.total as string) || 0;
      
      // عرض جميع البيانات في اليوم الحالي
      const labels = period === 'daily' ? 
        ['6 أيام مضت', '5 أيام مضت', '4 أيام مضت', '3 أيام مضت', 'أمس', 'اليوم'] :
        period === 'weekly' ?
        ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4', 'الأسبوع 5', 'الأسبوع الحالي'] :
        ['مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'];
      
      const salesData = labels.map((label, index) => ({
        label,
        orders: index === labels.length - 1 ? totalOrders : 0,
        revenue: index === labels.length - 1 ? totalRevenue : 0
      }));
      
      console.log(`📊 Fallback data used:`, { totalOrders, totalRevenue });
      return { labels, salesData };
    }
  }

  // ==================== EMPLOYEES MANAGEMENT IMPLEMENTATION ====================

  // Employee operations
  async getEmployees(platformId: string): Promise<Employee[]> {
    const employeesData = await db.select().from(employees)
      .where(eq(employees.platformId, platformId))
      .orderBy(desc(employees.createdAt));
    
    // Get permissions for each employee
    const employeesWithPermissions = await Promise.all(
      employeesData.map(async (employee) => {
        const permissions = await this.getEmployeePermissions(employee.id);
        return {
          ...employee,
          permissions: permissions.map(p => p.permission)
        };
      })
    );
    
    return employeesWithPermissions;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    
    if (employee) {
      const permissions = await this.getEmployeePermissions(id);
      return {
        ...employee,
        permissions: permissions.map(p => p.permission)
      };
    }
    
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    // Hash password if provided
    let hashedPassword;
    if (employee.password) {
      const saltRounds = 12;
      const bcrypt = await import('bcrypt');
      hashedPassword = await bcrypt.hash(employee.password, saltRounds);
    }

    const [newEmployee] = await db.insert(employees).values({
      ...employee,
      password: hashedPassword || employee.password
    }).returning();
    
    // Add default permissions based on role
    const defaultPermissions = this.getDefaultPermissionsByRole(employee.role || 'employee');
    
    if (defaultPermissions.length > 0) {
      const permissionsToInsert = defaultPermissions.map(permission => ({
        employeeId: newEmployee.id,
        permission,
        grantedBy: employee.createdBy || 'system'
      }));
      
      for (const permissionData of permissionsToInsert) {
        await db.insert(employeePermissions).values({
          employeeId: permissionData.employeeId,
          permission: permissionData.permission as any,
          grantedBy: permissionData.grantedBy
        });
      }
    }
    
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee & { permissions?: string[] }>): Promise<Employee> {
    const { permissions, ...employeeData } = employee;
    
    // Update employee basic data
    const [updatedEmployee] = await db.update(employees)
      .set({ ...employeeData, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    
    // Update permissions if provided
    if (permissions) {
      // Delete existing permissions
      await db.delete(employeePermissions)
        .where(eq(employeePermissions.employeeId, id));
      
      // Insert new permissions
      if (permissions.length > 0) {
        // Filter out permissions that don't exist in the database enum yet
        const validPermissions = [
          "dashboard_view",
          "products_view", "products_create", "products_edit", "products_delete",
          "categories_view", "categories_create", "categories_edit", "categories_delete",
          "landing_pages_view", "landing_pages_create", "landing_pages_edit", "landing_pages_delete",
          "orders_view", "orders_edit", "orders_delete", "orders_status_change",
          "whatsapp_view", "whatsapp_send", "whatsapp_manage",
          "ads_view", "ads_create", "ads_edit", "ads_delete", "ads_manage_budget",
          "accounting_view", "accounting_create", "accounting_edit", "accounting_delete", "accounting_reports",
          "accounts_view", "accounts_manage", "accounts_reports",
          "settings_view", "settings_edit",
          "design_view", "design_edit",
          "call_center_view", "call_center_manage",
          "fulfillment_view", "fulfillment_manage",
          // Add inventory permissions temporarily (they'll be properly in DB soon)
          "inventory_view", "inventory_manage", "stock_update", "stock_reports",
          "employees_view", "employees_create", "employees_edit", "employees_delete", "employees_permissions"
        ];
        
        const filteredPermissions = permissions.filter(p => validPermissions.includes(p));
        console.log('Filtered permissions:', filteredPermissions);
        console.log('Excluded permissions:', permissions.filter(p => !validPermissions.includes(p)));
        
        if (filteredPermissions.length > 0) {
          const permissionsToInsert = filteredPermissions.map(permission => ({
            employeeId: id,
            permission,
            grantedBy: 'system'
          }));
          
          for (const permissionData of permissionsToInsert) {
            await db.insert(employeePermissions).values({
              employeeId: permissionData.employeeId,
              permission: permissionData.permission as any,
              grantedBy: permissionData.grantedBy
            });
          }
        }
      }
    }
    
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    // Delete related records first (due to foreign key constraints)
    await db.delete(employeeActivities).where(eq(employeeActivities.employeeId, id));
    await db.delete(employeePermissions).where(eq(employeePermissions.employeeId, id));
    await db.delete(employeeSessions).where(eq(employeeSessions.employeeId, id));
    
    // Then delete the employee
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Employee permissions operations
  async getEmployeePermissions(employeeId: string): Promise<EmployeePermission[]> {
    const permissions = await db.select().from(employeePermissions)
      .where(eq(employeePermissions.employeeId, employeeId));
    
    console.log(`Getting permissions for employee ${employeeId}:`, permissions);
    return permissions;
  }

  async grantEmployeePermission(permission: InsertEmployeePermission): Promise<EmployeePermission> {
    const [newPermission] = await db.insert(employeePermissions)
      .values(permission)
      .returning();
    
    return newPermission;
  }

  async revokeEmployeePermission(employeeId: string, permission: string): Promise<void> {
    await db.delete(employeePermissions)
      .where(
        and(
          eq(employeePermissions.employeeId, employeeId),
          eq(employeePermissions.permission, permission as any)
        )
      );
  }

  // Employee sessions operations
  async createEmployeeSession(session: InsertEmployeeSession): Promise<EmployeeSession> {
    const [newSession] = await db.insert(employeeSessions)
      .values(session)
      .returning();
    
    return newSession;
  }

  async validateEmployeeSession(sessionToken: string): Promise<Employee | undefined> {
    const [session] = await db.select()
      .from(employeeSessions)
      .innerJoin(employees, eq(employeeSessions.employeeId, employees.id))
      .where(
        and(
          eq(employeeSessions.sessionToken, sessionToken),
          eq(employeeSessions.isActive, true)
        )
      );
    
    if (session) {
      // Update last activity
      await db.update(employeeSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(employeeSessions.sessionToken, sessionToken));
      
      return session.employees;
    }
    
    return undefined;
  }

  async revokeEmployeeSession(sessionToken: string): Promise<void> {
    await db.update(employeeSessions)
      .set({ isActive: false })
      .where(eq(employeeSessions.sessionToken, sessionToken));
  }

  // Employee activities operations
  async logEmployeeActivity(activity: InsertEmployeeActivity): Promise<EmployeeActivity> {
    try {
      // Check if platform exists before logging activity
      const [platform] = await db.select()
        .from(platforms)
        .where(eq(platforms.id, activity.platformId));
      
      if (!platform) {
        console.warn(`Platform ${activity.platformId} not found, creating default activity`);
        // Create a default activity instead of returning null
        const defaultActivity = {
          id: 'default-' + Date.now(),
          platformId: activity.platformId,
          employeeId: activity.employeeId,
          action: activity.action,
          ipAddress: activity.ipAddress || null,
          userAgent: activity.userAgent || null,
          entityType: activity.entityType || null,
          entityId: activity.entityId || null,
          details: activity.details || null,
          createdAt: new Date()
        };
        return defaultActivity as EmployeeActivity;
      }

      const [newActivity] = await db.insert(employeeActivities)
        .values(activity)
        .returning();
      
      return newActivity;
    } catch (error) {
      console.error('Error logging employee activity:', error);
      // Return a default activity instead of null
      const defaultActivity = {
        id: 'error-' + Date.now(),
        platformId: activity.platformId,
        employeeId: activity.employeeId,
        action: activity.action,
        ipAddress: activity.ipAddress || null,
        userAgent: activity.userAgent || null,
        entityType: activity.entityType || null,
        entityId: activity.entityId || null,
        details: activity.details || null,
        createdAt: new Date()
      };
      return defaultActivity as EmployeeActivity;
    }
  }

  async getEmployeeActivities(platformId: string, employeeId?: string, limit: number = 50): Promise<EmployeeActivity[]> {
    let baseQuery = db.select()
      .from(employeeActivities)
      .innerJoin(employees, eq(employeeActivities.employeeId, employees.id));
    
    let conditions = [eq(employeeActivities.platformId, platformId)];
    
    if (employeeId) {
      conditions.push(eq(employeeActivities.employeeId, employeeId));
    }
    
    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(employeeActivities.createdAt))
      .limit(limit);
    
    return results.map(r => r.employee_activities);
  }

  // Helper method to get default permissions by role
  private getDefaultPermissionsByRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'dashboard_view', 'products_view', 'products_create', 'products_edit', 'products_delete',
        'categories_view', 'categories_create', 'categories_edit', 'categories_delete',
        'landing_pages_view', 'landing_pages_create', 'landing_pages_edit', 'landing_pages_delete',
        'orders_view', 'orders_edit', 'orders_delete', 'orders_status_change',
        'whatsapp_view', 'whatsapp_send', 'whatsapp_manage',
        'ads_view', 'ads_create', 'ads_edit', 'ads_delete', 'ads_manage_budget',
        'accounting_view', 'accounting_create', 'accounting_edit', 'accounting_delete', 'accounting_reports',
        'accounts_view', 'accounts_manage', 'accounts_reports',
        'settings_view', 'settings_edit', 'design_view', 'design_edit',
        'call_center_view', 'call_center_manage', 'fulfillment_view', 'fulfillment_manage',
        'employees_view', 'employees_create', 'employees_edit', 'employees_delete', 'employees_permissions'
      ],
      manager: [
        'dashboard_view', 'products_view', 'products_create', 'products_edit',
        'categories_view', 'categories_create', 'categories_edit',
        'landing_pages_view', 'landing_pages_create', 'landing_pages_edit',
        'orders_view', 'orders_edit', 'orders_status_change',
        'whatsapp_view', 'whatsapp_send', 'whatsapp_manage',
        'ads_view', 'ads_create', 'ads_edit', 'ads_manage_budget',
        'accounting_view', 'accounting_create', 'accounting_edit', 'accounting_reports',
        'accounts_view', 'accounts_manage', 'accounts_reports',
        'call_center_view', 'call_center_manage', 'fulfillment_view', 'fulfillment_manage',
        'employees_view', 'employees_create', 'employees_edit'
      ],
      supervisor: [
        'dashboard_view', 'products_view', 'orders_view', 'orders_edit', 'orders_status_change',
        'whatsapp_view', 'whatsapp_send', 'call_center_view', 'call_center_manage',
        'fulfillment_view', 'fulfillment_manage'
      ],
      employee: [
        'dashboard_view', 'products_view', 'orders_view', 'orders_edit'
      ],
      viewer: [
        'dashboard_view'
      ]
    };

    return rolePermissions[role] || rolePermissions.employee;
  }

  // Create default departments for new platforms
  async createDefaultDepartments(platformId: string): Promise<void> {
    const defaultDepartments = [
      { name: "الإدارة العامة", description: "إدارة الشؤون العامة والتخطيط الاستراتيجي" },
      { name: "المبيعات", description: "فريق المبيعات وإدارة العملاء" },
      { name: "التسويق", description: "التسويق الرقمي وإدارة الحملات الإعلانية" },
      { name: "خدمة العملاء", description: "الرد على استفسارات العملاء والدعم الفني" },
      { name: "المحاسبة والمالية", description: "إدارة الحسابات والشؤون المالية" },
      { name: "المخازن والشحن", description: "إدارة المخزون والشحن والتوزيع" },
      { name: "تطوير المنتجات", description: "تطوير وتحسين المنتجات" },
      { name: "الموارد البشرية", description: "إدارة الموظفين والتدريب" }
    ];

    const departmentsToInsert = defaultDepartments.map(dept => ({
      ...dept,
      platformId
    }));

    await db.insert(employeeDepartments).values(departmentsToInsert);
  }

  // Employee departments operations
  async getEmployeeDepartments(platformId: string): Promise<EmployeeDepartment[]> {
    return await db.select().from(employeeDepartments)
      .where(eq(employeeDepartments.platformId, platformId))
      .orderBy(asc(employeeDepartments.name));
  }

  async createEmployeeDepartment(department: InsertEmployeeDepartment): Promise<EmployeeDepartment> {
    const [newDepartment] = await db.insert(employeeDepartments)
      .values(department)
      .returning();
    
    return newDepartment;
  }

  async updateEmployeeDepartment(id: string, department: Partial<InsertEmployeeDepartment>): Promise<EmployeeDepartment> {
    const [updatedDepartment] = await db.update(employeeDepartments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(employeeDepartments.id, id))
      .returning();
    
    return updatedDepartment;
  }

  async deleteEmployeeDepartment(id: string): Promise<void> {
    // First, update any positions that reference this department
    await db.update(employeePositions)
      .set({ departmentId: null })
      .where(eq(employeePositions.departmentId, id));
    
    // Then delete the department
    await db.delete(employeeDepartments).where(eq(employeeDepartments.id, id));
  }

  // Employee positions operations
  async getEmployeePositions(platformId: string, departmentId?: string): Promise<EmployeePosition[]> {
    let query = db.select().from(employeePositions)
      .where(eq(employeePositions.platformId, platformId))
      .orderBy(asc(employeePositions.name));
    
    if (departmentId) {
      query = db.select().from(employeePositions)
        .where(
          and(
            eq(employeePositions.platformId, platformId),
            eq(employeePositions.departmentId, departmentId)
          )
        )
        .orderBy(asc(employeePositions.name));
    }
    
    return await query;
  }

  async createEmployeePosition(position: InsertEmployeePosition): Promise<EmployeePosition> {
    const [newPosition] = await db.insert(employeePositions)
      .values(position)
      .returning();
    
    return newPosition;
  }

  async updateEmployeePosition(id: string, position: Partial<InsertEmployeePosition>): Promise<EmployeePosition> {
    const [updatedPosition] = await db.update(employeePositions)
      .set({ ...position, updatedAt: new Date() })
      .where(eq(employeePositions.id, id))
      .returning();
    
    return updatedPosition;
  }

  async deleteEmployeePosition(id: string): Promise<void> {
    await db.delete(employeePositions).where(eq(employeePositions.id, id));
  }

  // ===================== PRODUCT VARIANTS OPERATIONS =====================

  // Product Colors operations
  async getProductColors(productId: string): Promise<ProductColor[]> {
    return await db.select().from(productColors)
      .where(eq(productColors.productId, productId))
      .orderBy(asc(productColors.sortOrder), asc(productColors.colorName));
  }

  async getProductColor(id: string): Promise<ProductColor | undefined> {
    const [color] = await db.select().from(productColors)
      .where(eq(productColors.id, id));
    return color;
  }

  async createProductColor(color: InsertProductColor): Promise<ProductColor> {
    const [newColor] = await db.insert(productColors)
      .values(color)
      .returning();
    return newColor;
  }

  async updateProductColor(id: string, color: Partial<InsertProductColor>): Promise<ProductColor> {
    const [updatedColor] = await db.update(productColors)
      .set({ ...color, updatedAt: new Date() })
      .where(eq(productColors.id, id))
      .returning();
    return updatedColor;
  }

  async deleteProductColor(id: string): Promise<void> {
    await db.delete(productColors).where(eq(productColors.id, id));
  }

  // Product Shapes operations
  async getProductShapes(productId: string): Promise<ProductShape[]> {
    return await db.select().from(productShapes)
      .where(eq(productShapes.productId, productId))
      .orderBy(asc(productShapes.sortOrder), asc(productShapes.shapeName));
  }

  async getProductShape(id: string): Promise<ProductShape | undefined> {
    const [shape] = await db.select().from(productShapes)
      .where(eq(productShapes.id, id));
    return shape;
  }

  async createProductShape(shape: InsertProductShape): Promise<ProductShape> {
    const [newShape] = await db.insert(productShapes)
      .values(shape)
      .returning();
    return newShape;
  }

  async updateProductShape(id: string, shape: Partial<InsertProductShape>): Promise<ProductShape> {
    const [updatedShape] = await db.update(productShapes)
      .set({ ...shape, updatedAt: new Date() })
      .where(eq(productShapes.id, id))
      .returning();
    return updatedShape;
  }

  async deleteProductShape(id: string): Promise<void> {
    await db.delete(productShapes).where(eq(productShapes.id, id));
  }

  // Product Sizes operations
  async getProductSizes(productId: string): Promise<ProductSize[]> {
    return await db.select().from(productSizes)
      .where(eq(productSizes.productId, productId))
      .orderBy(asc(productSizes.sortOrder), asc(productSizes.sizeName));
  }

  async getProductSize(id: string): Promise<ProductSize | undefined> {
    const [size] = await db.select().from(productSizes)
      .where(eq(productSizes.id, id));
    return size;
  }

  async createProductSize(size: InsertProductSize): Promise<ProductSize> {
    const [newSize] = await db.insert(productSizes)
      .values(size)
      .returning();
    return newSize;
  }

  async updateProductSize(id: string, size: Partial<InsertProductSize>): Promise<ProductSize> {
    const [updatedSize] = await db.update(productSizes)
      .set({ ...size, updatedAt: new Date() })
      .where(eq(productSizes.id, id))
      .returning();
    return updatedSize;
  }

  async deleteProductSize(id: string): Promise<void> {
    await db.delete(productSizes).where(eq(productSizes.id, id));
  }

  // Product Variants operations
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return await db.select({
      id: productVariants.id,
      productId: productVariants.productId,
      platformId: productVariants.platformId,
      colorId: productVariants.colorId,
      shapeId: productVariants.shapeId,
      sizeId: productVariants.sizeId,
      variantName: productVariants.variantName,
      sku: productVariants.sku,
      price: productVariants.price,
      cost: productVariants.cost,
      stockQuantity: productVariants.stockQuantity,
      lowStockThreshold: productVariants.lowStockThreshold,
      imageUrls: productVariants.imageUrls,
      isActive: productVariants.isActive,
      isDefault: productVariants.isDefault,
      createdAt: productVariants.createdAt,
      updatedAt: productVariants.updatedAt,
      // Include related data
      colorName: productColors.colorName,
      colorCode: productColors.colorCode,
      colorImageUrl: productColors.colorImageUrl,
      shapeName: productShapes.shapeName,
      sizeName: productSizes.sizeName,
      sizeValue: productSizes.sizeValue,
    })
    .from(productVariants)
    .leftJoin(productColors, eq(productVariants.colorId, productColors.id))
    .leftJoin(productShapes, eq(productVariants.shapeId, productShapes.id))
    .leftJoin(productSizes, eq(productVariants.sizeId, productSizes.id))
    .where(eq(productVariants.productId, productId))
    .orderBy(desc(productVariants.isDefault), asc(productVariants.variantName));
  }

  async getProductVariant(id: string): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants)
      .where(eq(productVariants.id, id));
    return variant;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants)
      .values(variant)
      .returning();
    return newVariant;
  }

  async updateProductVariant(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant> {
    const [updatedVariant] = await db.update(productVariants)
      .set({ ...variant, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return updatedVariant;
  }

  async deleteProductVariant(id: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  // ==================== DELIVERY SETTINGS ====================
  async getDeliverySettings(platformId: string): Promise<any | null> {
    try {
      console.log(`🚚 Fetching delivery settings for platform: ${platformId}`);
      
      const [settings] = await db
        .select()
        .from(deliverySettings)
        .where(eq(deliverySettings.platformId, platformId))
        .limit(1);
      
      console.log(`🚚 Delivery settings result:`, settings);
      
      return settings || null;
    } catch (error) {
      console.error("Error fetching delivery settings:", error);
      return null;
    }
  }

  async createDeliverySettings(settingsData: any): Promise<any> {
    try {
      const [settings] = await db
        .insert(deliverySettings)
        .values(settingsData)
        .returning();
      
      return settings;
    } catch (error) {
      console.error("Error creating delivery settings:", error);
      throw error;
    }
  }

  async updateDeliverySettings(platformId: string, updates: any): Promise<any> {
    try {
      // إزالة الحقول التي لا نريد تحديثها
      const { id, createdAt, updatedAt, ...cleanUpdates } = updates;
      
      const [settings] = await db
        .update(deliverySettings)
        .set(cleanUpdates)
        .where(eq(deliverySettings.platformId, platformId))
        .returning();
      
      return settings;
    } catch (error) {
      console.error("Error updating delivery settings:", error);
      throw error;
    }
  }

  // ==================== ACCOUNTS DATA ====================
  async getLandingPageOrdersByPlatform(platformId: string, status?: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const { pool } = await import("./db");
      const client = await pool.connect();
      
      try {
        let query = `
          SELECT lpo.*, p.name as product_name, p.cost as product_cost, p.price as product_price,
                 COALESCE(lpo.delivery_fee, 0) as delivery_fee
          FROM landing_page_orders lpo
          LEFT JOIN products p ON lpo.product_id = p.id
          WHERE lpo.platform_id = $1
        `;
        
        const queryParams: any[] = [platformId];
        let paramIndex = 2;
        
        if (status) {
          query += ` AND lpo.status = $${paramIndex}`;
          queryParams.push(status);
          paramIndex++;
        }
        
        if (startDate) {
          query += ` AND DATE(lpo.created_at) >= $${paramIndex}`;
          queryParams.push(startDate);
          paramIndex++;
        }
        
        if (endDate) {
          query += ` AND DATE(lpo.created_at) <= $${paramIndex}`;
          queryParams.push(endDate);
          paramIndex++;
        }
        
        query += ` ORDER BY lpo.created_at DESC`;
        
        const result = await client.query(query, queryParams);
        
        // Transform data to match expected format
        return result.rows.map(row => ({
          id: row.id,
          totalAmount: parseFloat(row.total_amount || 0),
          deliveryFee: parseFloat(row.delivery_fee || 0),
          customerLocation: row.customer_governorate,
          quantity: parseInt(row.quantity || 1),
          items: row.product_name ? [{
            product: {
              name: row.product_name,
              cost: parseFloat(row.product_cost || 0),
              price: parseFloat(row.product_price || 0)
            },
            quantity: parseInt(row.quantity || 1)
          }] : []
        }));
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error getting orders by platform:", error);
      return [];
    }
  }

  async getOrdersByStatus(platformId: string, status: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      console.log(`Getting orders for platform ${platformId}, status: ${status}, dates: ${startDate} - ${endDate}`);
      
      let whereConditions = [
        eq(landingPageOrders.platformId, platformId),
        eq(landingPageOrders.status, status)
      ];

      // إضافة فلاتر التاريخ إذا كانت متوفرة
      if (startDate) {
        whereConditions.push(sql`DATE(${landingPageOrders.createdAt}) >= ${startDate}`);
      }
      if (endDate) {
        whereConditions.push(sql`DATE(${landingPageOrders.createdAt}) <= ${endDate}`);
      }

      const orders = await db
        .select({
          id: landingPageOrders.id,
          landingPageId: landingPageOrders.landingPageId,
          productId: landingPageOrders.productId,
          customerName: landingPageOrders.customerName,
          customerPhone: landingPageOrders.customerPhone,
          customerGovernorate: landingPageOrders.customerGovernorate,
          customerAddress: landingPageOrders.customerAddress,
          customerLocation: landingPageOrders.customerGovernorate, // استخدام المحافظة كموقع
          quantity: landingPageOrders.quantity,
          totalAmount: landingPageOrders.totalAmount,
          deliveryFee: landingPageOrders.deliveryFee,
          // discount: landingPageOrders.discount, // Field doesn't exist in schema
          offer: landingPageOrders.offer,
          status: landingPageOrders.status,
          createdAt: landingPageOrders.createdAt,
          updatedAt: landingPageOrders.updatedAt,
          // إضافة حقول المتغيرات
          selectedColorIds: landingPageOrders.selectedColorIds,
          selectedShapeIds: landingPageOrders.selectedShapeIds,
          selectedSizeIds: landingPageOrders.selectedSizeIds
        })
        .from(landingPageOrders)
        .where(and(...whereConditions))
        .orderBy(desc(landingPageOrders.createdAt));

      // جلب تفاصيل المنتجات للطلبات
      const ordersWithProducts = await Promise.all(
        orders.map(async (order) => {
          let product = null;
          if (order.productId) {
            try {
              product = await this.getProduct(order.productId);
            } catch (error) {
              console.warn(`Could not get product ${order.productId}:`, error);
            }
          }
          
          return {
            ...order,
            items: product ? [{
              product: product,
              quantity: order.quantity || 1,
              unitPrice: product.price || 0,
              totalPrice: parseFloat(product.price || '0') * (order.quantity || 1)
            }] : []
          };
        })
      );

      console.log(`Found ${ordersWithProducts.length} orders`);
      return ordersWithProducts;
    } catch (error) {
      console.error("Error getting orders by status:", error);
      throw error;
    }
  }

  // Daily ad spend operations
  async getDailyAdSpend(platformId: string, date: string): Promise<DailyAdSpend | undefined> {
    const [adSpend] = await db
      .select()
      .from(dailyAdSpend)
      .where(and(eq(dailyAdSpend.platformId, platformId), eq(dailyAdSpend.date, date)));
    return adSpend;
  }

  async getDailyAdSpendsByDateRange(platformId: string, startDate: string, endDate: string): Promise<DailyAdSpend[]> {
    return await db
      .select()
      .from(dailyAdSpend)
      .where(
        and(
          eq(dailyAdSpend.platformId, platformId),
          gte(dailyAdSpend.date, startDate),
          lte(dailyAdSpend.date, endDate)
        )
      )
      .orderBy(dailyAdSpend.date);
  }

  async createOrUpdateDailyAdSpend(adSpendData: InsertDailyAdSpend): Promise<DailyAdSpend> {
    const [adSpend] = await db
      .insert(dailyAdSpend)
      .values(adSpendData)
      .onConflictDoUpdate({
        target: [dailyAdSpend.platformId, dailyAdSpend.date],
        set: {
          amount: adSpendData.amount,
          originalAmount: adSpendData.originalAmount,
          currency: adSpendData.currency,
          exchangeRate: adSpendData.exchangeRate,
          notes: adSpendData.notes,
          updatedAt: new Date(),
        },
      })
      .returning();
    return adSpend;
  }

  async getTotalAdSpendForPeriod(platformId: string, startDate: string, endDate: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`SUM(${dailyAdSpend.amount})::numeric`,
      })
      .from(dailyAdSpend)
      .where(
        and(
          eq(dailyAdSpend.platformId, platformId),
          gte(dailyAdSpend.date, startDate),
          lte(dailyAdSpend.date, endDate)
        )
      );
    
    return Number(result[0]?.total || 0);
  }

  // ZainCash Payment operations
  async createZainCashPayment(payment: InsertZainCashPayment): Promise<ZainCashPayment> {
    const [newPayment] = await db.insert(zainCashPayments).values(payment).returning();
    return newPayment;
  }

  async getZainCashPaymentByOrderId(orderId: string): Promise<ZainCashPayment | undefined> {
    const [payment] = await db.select().from(zainCashPayments)
      .where(eq(zainCashPayments.orderId, orderId));
    return payment;
  }

  async updateZainCashPayment(orderId: string, updates: Partial<ZainCashPayment>): Promise<ZainCashPayment> {
    const [updatedPayment] = await db.update(zainCashPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(zainCashPayments.orderId, orderId))
      .returning();
    return updatedPayment;
  }

  async getZainCashPaymentsByPlatformId(platformId: string): Promise<ZainCashPayment[]> {
    return await db.select().from(zainCashPayments)
      .where(eq(zainCashPayments.platformId, platformId))
      .orderBy(desc(zainCashPayments.createdAt));
  }

  // Ad Account operations
  async createAdAccount(account: InsertAdAccount): Promise<AdAccount> {
    const [newAccount] = await db.insert(adAccounts).values(account).returning();
    return newAccount;
  }

  async getAdAccount(id: string): Promise<AdAccount | undefined> {
    const [account] = await db.select().from(adAccounts).where(eq(adAccounts.id, id));
    return account;
  }

  async getAdAccountByAdvertiserId(advertiserId: string): Promise<AdAccount | undefined> {
    const [account] = await db.select().from(adAccounts).where(eq(adAccounts.advertiserId, advertiserId));
    return account;
  }

  async getAllAdAccounts(): Promise<AdAccount[]> {
    return await db.select().from(adAccounts).orderBy(desc(adAccounts.createdAt));
  }

  async updateAdAccount(id: string, updates: Partial<InsertAdAccount>): Promise<AdAccount> {
    const [updatedAccount] = await db
      .update(adAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAdAccount(id: string): Promise<void> {
    await db.delete(adAccounts).where(eq(adAccounts.id, id));
  }

  async updateAdAccountBalance(advertiserId: string, balance: number): Promise<void> {
    await db
      .update(adAccounts)
      .set({ balance: balance.toString(), updatedAt: new Date() })
      .where(eq(adAccounts.advertiserId, advertiserId));
  }

  // Platform Ad Account connections
  async connectAdAccountToPlatform(platformId: string, adAccountId: string): Promise<PlatformAdAccount> {
    const [connection] = await db
      .insert(platformAdAccounts)
      .values({
        platformId,
        adAccountId,
        isActive: true,
        lastUsedAt: new Date(),
      })
      .returning();
    
    // Increment connected platforms count
    await db
      .update(adAccounts)
      .set({ 
        connectedPlatforms: sql`${adAccounts.connectedPlatforms} + 1`,
        updatedAt: new Date()
      })
      .where(eq(adAccounts.id, adAccountId));
    
    return connection;
  }

  async disconnectAdAccountFromPlatform(platformId: string, adAccountId: string): Promise<void> {
    await db
      .delete(platformAdAccounts)
      .where(
        and(
          eq(platformAdAccounts.platformId, platformId),
          eq(platformAdAccounts.adAccountId, adAccountId)
        )
      );
    
    // Decrement connected platforms count
    await db
      .update(adAccounts)
      .set({ 
        connectedPlatforms: sql`GREATEST(${adAccounts.connectedPlatforms} - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(adAccounts.id, adAccountId));
  }

  async getAdAccountsByPlatform(platformId: string): Promise<AdAccount[]> {
    const connectedAccounts = await db
      .select({
        account: adAccounts,
      })
      .from(adAccounts)
      .innerJoin(platformAdAccounts, eq(adAccounts.id, platformAdAccounts.adAccountId))
      .where(
        and(
          eq(platformAdAccounts.platformId, platformId),
          eq(platformAdAccounts.isActive, true)
        )
      )
      .orderBy(desc(platformAdAccounts.lastUsedAt));
    
    return connectedAccounts.map(row => row.account);
  }

  async getPlatformsByAdAccount(adAccountId: string): Promise<Platform[]> {
    const connectedPlatforms = await db
      .select({
        platform: platforms,
      })
      .from(platforms)
      .innerJoin(platformAdAccounts, eq(platforms.id, platformAdAccounts.platformId))
      .where(
        and(
          eq(platformAdAccounts.adAccountId, adAccountId),
          eq(platformAdAccounts.isActive, true)
        )
      )
      .orderBy(desc(platformAdAccounts.connectedAt));
    
    return connectedPlatforms.map(row => row.platform);
  }

  // Platform Themes operations
  async getPlatformTheme(platformId: string): Promise<PlatformTheme | undefined> {
    try {
      const [theme] = await db
        .select()
        .from(platformThemes)
        .where(eq(platformThemes.platformId, platformId))
        .limit(1);
      
      return theme || undefined;
    } catch (error) {
      console.error("Error getting platform theme:", error);
      return undefined;
    }
  }

  async createPlatformTheme(theme: InsertPlatformTheme): Promise<PlatformTheme> {
    const [newTheme] = await db
      .insert(platformThemes)
      .values({
        ...theme,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newTheme;
  }

  async updatePlatformTheme(platformId: string, theme: Partial<UpdatePlatformTheme>): Promise<PlatformTheme> {
    const [updatedTheme] = await db
      .update(platformThemes)
      .set({
        ...theme,
        updatedAt: new Date(),
      })
      .where(eq(platformThemes.platformId, platformId))
      .returning();
    
    return updatedTheme;
  }

  async deletePlatformTheme(platformId: string): Promise<void> {
    await db
      .delete(platformThemes)
      .where(eq(platformThemes.platformId, platformId));
  }

  // Admin User authentication methods
  async getAdminUserByEmail(email: string): Promise<SelectAdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);
    
    return user;
  }

  async getAdminUserById(id: string): Promise<SelectAdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);
    
    return user;
  }

  async createAdminUser(userData: InsertAdminUser): Promise<SelectAdminUser> {
    const [newUser] = await db
      .insert(adminUsers)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newUser;
  }

  async updateAdminUserLastLogin(id: string): Promise<void> {
    await db
      .update(adminUsers)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, id));
  }
}

export const storage = new DatabaseStorage();
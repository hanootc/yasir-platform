# Overview
This full-stack product management platform provides a comprehensive Arabic-first solution for businesses to manage products, landing pages, orders, and operations. Its core purpose is to streamline business processes, enhance product visibility, and drive efficiency through features like product catalog management, order processing, accounting integration, employee management, and detailed reporting. The platform aims to be a complete business solution, optimizing market penetration and operational flow.

## Recent Updates (September 4, 2025)
### **🚀 MAJOR: Complete Migration to AlmaLinux 9 + CyberPanel**
- **Platform Migration Completed**: Successfully migrated comprehensive e-commerce/business management platform from Replit to standalone AlmaLinux 9 server with CyberPanel hosting
- **Authentication System Overhaul**: Completely replaced Replit OIDC authentication with bcrypt-based email/password system, including admin user management, secure sessions, and JWT tokens
- **Domain Migration**: Updated all platform references from .replit.app to sanadi.pro domain (147.93.59.185)
- **Deployment Infrastructure**: Created production-ready PM2 ecosystem configuration, Nginx reverse proxy setup, SSL/HTTPS handling via CyberPanel
- **Build System Workaround**: Developed custom build-production.js script to bypass Vite/Replit dependency conflicts and enable standalone deployment
- **Admin Management**: Implemented admin user creation script (scripts/create-admin.ts) for initial platform setup
- **Environment Configuration**: Created .env.example template and production environment setup for all external services (PostgreSQL, ZainCash, TikTok, Facebook APIs)
- **Complete Documentation**: Updated DEPLOYMENT_GUIDE.md with comprehensive AlmaLinux setup instructions, security configuration, monitoring, and troubleshooting guides

## Recent Updates (August 30, 2025)
- **Meta Campaign Objectives Arabic Translation**: Implemented comprehensive Arabic translation system for Facebook campaign objectives (حملة شراء، حملة رسائل، النقرات، التفاعل، etc.) for improved UI clarity and user experience
- **Campaign Results Display Logic Fixed**: Corrected ad set results display to prioritize purchase data over messaging conversations for conversion campaigns, ensuring purchase campaigns show "شراء عبر الويب" instead of incorrectly showing "رسائل"
- **Cost Per Result Calculation Aligned**: Fixed cost-per-result calculations to properly align with displayed results data, ensuring accurate cost calculation based on actual conversion metrics shown to users
- **TikTok Campaign Types Fixed**: Resolved confusion between Lead Generation and Conversion campaign types
- **Specialized Endpoints**: Added separate endpoints (/api/tiktok/campaigns/conversions and /api/tiktok/campaigns/leads) for different campaign objectives
- **API Response Handling**: Fixed TikTok API success detection logic to properly handle "OK" responses and ad_ids arrays
- **Campaign Creation Success**: System now correctly creates CONVERSIONS campaigns with optimization_goal: 'CONVERT' and LEAD_GENERATION campaigns with optimization_goal: 'LEAD_GENERATION'
- **TikTok Timezone Issue RESOLVED**: Fixed critical timezone display problem in TikTok Ads Manager by implementing Unix timestamp format instead of ISO strings. All campaign and ad group scheduling now properly shows Baghdad time (UTC+03:00) in TikTok interface rather than incorrect European timezone.

# User Preferences
Preferred communication style: Simple, everyday language.
Header layout: Text and titles positioned on the right side, theme controls (color selector and day/night toggle) positioned on the left side (Arabic RTL layout).
Sidebar toggle button: User prefers toggle button positioned on the left side of the sidebar.
Design preference: Complete elimination of all hardcoded purple and blue colors. All UI elements must use dynamic theme colors instead of fixed purple/blue colors. All gradients, buttons, borders, and components must follow the selected color theme dynamically.
Theme controls: User prefers theme selector and day/night toggle buttons in page header left side, with page title text on the right side (Arabic RTL layout). Theme control buttons should be positioned close together with minimal spacing (gap-2) for consistent appearance across platform pages.
Color system: Dynamic theme system with complete removal of hardcoded colors. All components use CSS variables for theme colors (--theme-gradient, --theme-primary, --theme-primary-light, --theme-primary-lighter). No fixed purple (#a855f7) or blue (#3b82f6) colors anywhere in the system.
Platform pages layout: All platform pages (platform-dashboard.tsx, products.tsx) use unified PlatformSidebar layout with consistent theme control positioning and spacing. Main dashboard pages maintain their original layout structure.
Image hover preferences: User prefers smaller hover image sizes for clear viewing with dark background overlay. Documents scale 1.4x and profile images scale 1.3x on hover, with dark non-transp background (85% opacity) for better focus and visibility.
Modal design preferences: User prefers complete non-transparency (100% opacity) for modal backgrounds using bg-black. All form elements (input, textarea, select dropdowns, checkbox, switch) use consistent theme colors instead of system purple/blue colors. Dropdown menus have dark backgrounds with theme-colored borders and hover effects.
Employee card layout: User prefers employee profile image and name positioned on the right side of the card, with action buttons (delete and settings) positioned on the left side, following Arabic RTL design principles.
Checkbox spacing: User requires proper spacing between checkboxes and text labels in permission dialogs. Implemented gap-4 (16px) spacing in employee permission modals for better readability and user experience.
Sidebar navigation preferences: User prefers "حساباتي" (My Accounts) positioned between Ads section and Accounting system in sidebar navigation for optimal access flow.
UI Layout preferences: User prefers compact and organized page layouts with smaller cards, reduced text sizes, minimal spacing between elements, and efficient use of screen space. All statistical cards and content sections should use reduced padding (p-2 to p-3), smaller text (text-sm to text-base), and tighter gaps (gap-2 to gap-3) for better visual organization.
Circular badge design: User prefers colored circular badges for displaying numbers in both toolbar buttons and statistics cards. The circular badges should use dark versions of the background color (e.g., bg-yellow-800 for yellow backgrounds, bg-purple-800 for purple backgrounds) with white text for optimal contrast and readability. This creates a cohesive visual system where badges complement their parent container colors.
Employee management page layout: User prefers clean layout without redundant titles and counters. Action buttons (add employee, employee login) positioned on the right side, filter controls with labels positioned on the left side. Filter label text positioned directly next to dropdown menu rather than separately. Employee count badge displayed alongside filter controls.

# System Architecture

## Frontend
- **Framework & UI**: React 18 with TypeScript, Vite, Shadcn/ui (Radix UI), and Tailwind CSS.
- **Styling**: Arabic-first, RTL layout, custom Arabic font (Cairo), dynamic gradient themes, comprehensive custom color theme system using CSS variables, circular profile images.
- **State & Forms**: TanStack Query for state management, React Hook Form with Zod for validation.
- **UI/UX Decisions**: Mobile responsiveness, unified page layouts, non-transparent modal backgrounds, theme toggle with localStorage persistence, smooth page transitions, optimized routing, custom scrollbar styling, and specific hover effects.

## Backend
- **Core**: Node.js with Express.js, written in TypeScript (ES modules).
- **API**: RESTful design.
- **Database ORM**: Drizzle ORM.
- **Authentication**: BCrypt-based email/password authentication with Express sessions using PostgreSQL store.
- **Error Handling**: Centralized middleware.

## Database Design
- **Primary DB**: PostgreSQL with Neon serverless driver.
- **Schema Management**: Drizzle migrations.
- **Key Entities**: Users, Products, Landing pages, Orders, Activities, Categories, Contact management, Order tracking, `ad_platform_settings`.

## File Storage
- **Object Storage**: Google Cloud Storage with custom ACL.
- **Access Control**: Role-based permissions.
- **Uploads**: Direct-to-cloud with presigned URLs.

## Authentication & Employee Management
- **User Management**: Automatic provisioning via Replit Auth.
- **Employee System**: Fixed 6-department system, granular permission-based access control, isolated sessions, and complete employee authentication.

## Core Features
- **Product & Order Management**: Full CRUD for products, platform-specific data isolation, end-to-end order submission, filtering, status displays, intelligent order confirmation modals, and smart pixel tracking prevention.
- **WhatsApp Integration**: Automatic order confirmations with Arabic keyword detection ("تم", "أكد", "تأكيد", "موافق", "نعم", "ok"), customer-to-platform owner communication, dual WhatsApp redirection, platform notification system for new orders, bulk messaging for pending orders, intelligent phone number matching with multiple format support (07xxx ↔ 964xxx), and a settings page with session management, connection status, secure deletion, and auto-reconnect.
- **Inventory Management**: Automatic stock reduction upon order confirmation/shipping/delivery, accurate value calculation, returns, sales status, with "Remaining" quantity displaying original stock.
- **Landing Page Templates**: 11 mobile-first, standardized, compact Arabic RTL templates with dynamic theme integration, consistent forms, sticky buttons, and interactive design previews.
- **Platform Registration & Subscriptions**: Multi-step registration with ZainCash payment integration, automatic phone formatting, mandatory fields (WhatsApp, subdomain, logo), comprehensive validation, and three subscription tiers (Basic, Premium, Enterprise). Includes a comprehensive subscription tracking system with expiration alerts, access control via middleware, and a dedicated renewal page.
- **Payment Gateway**: ZainCash integration for subscriptions, with automatic fallback to simulation mode and robust error/state management.
- **Ad Platform Integrations**:
    - **TikTok**: Full API integration for campaign analytics, pixel management, campaign creation (Campaign, Ad Group, Ad) with video upload and identity configuration. Server-side Events API with real credentials, SHA256 hashing, event ID generation, E.164 phone formatting, personal data collection, server-side data (IP, User Agent, Referrer), and content ID transmission.
    - **Facebook**: Enhanced client-side Pixel loading and comprehensive server-side Conversions API integration with SHA256 encryption, dual tracking, automatic IQD to USD conversion, and actual product detail transmission.
    - **Ad Platform Settings**: Centralized configuration system for Meta, TikTok, Snapchat, Google Ads with dedicated DB storage and multi-platform tabbed interface.
- **Accounting System**: Financial management (dashboard, cash, chart of accounts, expenses, journal entries) integrated with Iraqi Unified Chart of Accounts.
- **Reports & Analytics**: Advanced reporting (overview, sales, product performance, customer insights, TikTok Ads metrics) with filtering and multiple export options (PDF, standard Excel, custom Excel).
- **Invoice Printing**: Advanced system with multiple paper sizes (A3-A6, Letter), customizable templates, dynamic sizing, QR codes, delivery company branding, and default A5 black-only printing.
- **Admin Dashboard**: Comprehensive control panel for subscription analytics, payment tracking, feature management (CRUD), admin action logging, platform management, and system settings. Includes super admin access, system-wide statistics, and configurable parameters (default subscription duration, trial period, auto-disable expired platforms, email notifications).

# External Dependencies

## Cloud Services
- **Google Cloud Storage**: Object storage.
- **Neon Database**: Serverless PostgreSQL.
- **Replit Auth**: Authentication service.
- **TikTok Business API**: Advertising data and campaign management.
- **Facebook Conversions API**: Server-side conversion tracking.
- **ZainCash Payment Gateway**: Iraqi payment processing service.

## Key Libraries
- `@tanstack/react-query`: Server state management.
- `drizzle-orm`: Type-safe database ORM.
- `@uppy/core`: File upload handling.
- `@radix-ui/***`: Accessible UI component primitives.
- `wouter`: Lightweight client-side routing.
- `zod`: Runtime type validation.
- `tailwindcss`: Utility-first CSS framework.
- `jspdf`: PDF generation.
- `xlsx`: Excel file handling.
- `html2canvas`: HTML to canvas rendering.
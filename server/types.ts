// Extended types for authentication and session management
import { type User as BaseUser } from "passport";

declare global {
  namespace Express {
    interface User extends BaseUser {
      id?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      claims?: any;
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
    
    interface SessionData {
      platform?: {
        platformId: string;
        platformName: string;
        subdomain: string;
        businessType: string;
        logoUrl?: string;
        contactEmail?: string;
        contactPhone?: string;
        whatsappNumber?: string;
      };
    }
  }
}

// TikTok API response types
export interface TikTokResponse<T = any> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

export interface TikTokCampaign {
  campaign_id: string;
  campaign_name: string;
  objective_type: string;
  status: string;
  budget_mode: string;
  budget?: number;
  start_time?: string;
  end_time?: string;
  create_time?: string;
  modify_time?: string;
}

export interface TikTokAdGroup {
  adgroup_id: string;
  campaign_id: string;
  adgroup_name: string;
  status: string;
  budget_mode: string;
  budget?: number;
  bid_type?: string;
  bid_price?: number;
  placement_type: string;
  targeting?: any;
  create_time?: string;
  modify_time?: string;
}

export interface TikTokAd {
  ad_id: string;
  adgroup_id: string;
  ad_name: string;
  status: string;
  ad_format: string;
  landing_page_url?: string;
  display_name?: string;
  image_urls?: string[];
  video_url?: string;
  ad_text?: string;
  call_to_action?: string;
  create_time?: string;
  modify_time?: string;
}
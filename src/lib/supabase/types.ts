export type QuestionStatus = 'open' | 'ai_answered' | 'matched' | 'solved' | 'hard'
export type TitleRarity = 'common' | 'rare' | 'legendary'
export type TitleConditionType = 'answer_count' | 'hard_quest' | 'unsolved_solved'

export interface Tenant {
  id: string
  name: string
  description: string | null
  description_i18n: Record<string, string> | null
  subdomain: string
  language: string
  color_theme: string
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  is_banned: boolean
  language: string
  created_at: string
}

// テナントごとに独立した表示名・実績・称号（ユーザー×テナントで1行）
export interface TenantProfile {
  tenant_id: string
  user_id: string
  display_name: string | null
  username: string | null
  skill_tags: string[]
  answered_tags: string[]
  is_available: boolean
  email_notify: boolean
  answer_count: number
  hard_quest_count: number
  question_count: number
  solved_question_count: number
  active_title_id: string | null
  created_at: string
}

export interface Title {
  id: string
  name: string
  description: string | null
  condition_type: TitleConditionType
  condition_value: number | null
  rarity: TitleRarity
}

export interface Question {
  id: string
  tenant_id: string
  user_id: string
  title: string
  body: string
  slug: string
  status: QuestionStatus
  ai_answer: string | null
  ai_answered_at: string | null
  solved_at: string | null
  solved_by: string | null
  view_count: number
  ip_address: string | null
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  question_id: string
  tenant_id: string
  user_id: string | null
  body: string
  is_ai: boolean
  is_accepted: boolean
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  question_id: string | null
  tenant_id: string
  from_user_id: string | null
  to_user_id: string | null
  amount_jpy: number
  platform_fee_jpy: number
  stripe_payment_id: string | null
  created_at: string
}

// Joined types for UI
export interface QuestionWithProfile extends Question {
  profiles: Pick<TenantProfile, 'user_id' | 'username' | 'display_name' | 'active_title_id'>
}

export interface AnswerWithProfile extends Answer {
  profiles: Pick<TenantProfile, 'user_id' | 'username' | 'display_name' | 'active_title_id'> | null
}

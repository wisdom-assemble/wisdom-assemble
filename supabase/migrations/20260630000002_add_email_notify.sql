-- profilesテーブルにemail_notifyカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notify boolean DEFAULT true;

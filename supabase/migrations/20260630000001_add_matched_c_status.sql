-- question_statusのenumにmatched_cを追加
-- 「別のメンバーに依頼」後のステータスとして必要
ALTER TYPE question_status ADD VALUE IF NOT EXISTS 'matched_c';

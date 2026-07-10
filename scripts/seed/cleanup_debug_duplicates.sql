-- ============================================================
-- BUG DEBUGテナント 重複テストデータ削除スクリプト
-- 同一タイトルが複数投稿されていた過去のテストデータのうち、
-- 各グループで最も内容が充実したもの(solved優先)1件だけ残し、残りを削除
-- answersはON DELETE CASCADEのため自動的に削除される
-- ============================================================

begin;

delete from questions where id in (
  'b6ac7413-d9a5-4325-a915-736de62ebae8',
  'ed540774-a50d-4a06-946e-cccd3f470f95',
  '21bc972a-86ec-4921-a647-9482f28a825a',
  '159a96af-815f-45d9-a777-94827210a246',
  'ded3fe80-2504-4c2d-9774-b6b92a898edd',
  'e67ee0dd-5c8b-4f49-949d-1bfcba25903b',
  '5a7db369-6514-4aef-8727-b208effe3980',
  '970dd8a3-4613-4c20-9dd3-b115b84032c0',
  '29f174c2-598d-4761-865a-ebdc1136ad47',
  'c357da64-6ebe-45e7-8fd7-c5b81895464a',
  '9ab6d535-c26e-467d-a3ca-e107afce771b',
  'e05882b4-87b3-4163-855f-cb5c4fc3aa43',
  '7fa55eae-74d5-4401-a654-15131b10bc69',
  '1621b560-457c-4483-a00b-d4bacbd0d3d2',
  '0b9ba547-5af3-4674-a3d6-864c0a7592d6',
  '66de4d30-5fed-4f19-bb5f-e100a7394a1c',
  '50f7ae2f-29d0-4434-9682-7fcee86b699a',
  '2ce050e4-58ae-40b8-bbf8-809b58581e33',
  'cf6dbbf4-4549-482d-b2c0-29de31bbbf79',
  'aa4ed347-daab-4811-9329-f19ebdbd0136',
  '328182bb-45bd-47ef-9721-d0ecbede01ef',
  '86f3f3eb-2520-4d20-8520-1ef4c2ef43fd',
  '22a3869b-420d-4f2d-b975-f46ff38295dd',
  'b57a255b-cbf8-469c-aecd-f6b6beee7c43',
  'c6f7baa6-77a7-4720-87e0-699a7369d727',
  'c33691fa-44cf-45f6-a606-5b7cacec47a7',
  '45edfa77-cf93-41f8-8706-8ec690adc3a1',
  'cf3bce9c-ed06-4b2e-aeea-23052f1dc41d',
  'a98037d9-7c17-41a5-a6a2-4ece778d318e',
  'fdf3bec5-0e4f-463e-8c72-3c52ecc7af7f',
  '6a03e588-9d77-45fd-aeb7-66a2b17cd41b',
  '298bea7f-9424-4c9d-8c80-79a360f19607'
);

commit;

-- 確認用: 削除後の件数
-- select count(*) from questions where tenant_id = 'debug';
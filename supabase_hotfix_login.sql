-- Hotfix for login/runtime access on existing migrated schema (non-destructive)
-- Run this in Supabase SQL Editor.

begin;

-- 0) Ensure core table exists
DO $$
BEGIN
  IF to_regclass('public.nguoidung') IS NULL THEN
    RAISE EXCEPTION 'Table public.nguoidung not found. Run supabase_full_migration.sql first.';
  END IF;
END $$;

-- 1) Ensure auth_user_id column exists
ALTER TABLE public.nguoidung
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- 2) Ensure uniqueness constraints for auth mapping
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nguoidung_auth_user_id_key'
      AND conrelid = 'public.nguoidung'::regclass
  ) THEN
    ALTER TABLE public.nguoidung
      ADD CONSTRAINT nguoidung_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- 3) Link existing rows by email first
UPDATE public.nguoidung n
SET auth_user_id = u.id
FROM auth.users u
WHERE n.auth_user_id IS NULL
  AND lower(n.email) = lower(u.email);

-- 4) Backfill missing rows from auth.users (safe)
INSERT INTO public.nguoidung (ten_tk, email, mat_khau, vai_tro, auth_user_id)
SELECT
  left(lower(split_part(u.email, '@', 1)) || '_' || substring(replace(u.id::text, '-', '') from 1 for 6), 100),
  u.email,
  '[supabase-auth]',
  'user',
  u.id
FROM auth.users u
LEFT JOIN public.nguoidung n_auth ON n_auth.auth_user_id = u.id
LEFT JOIN public.nguoidung n_email ON lower(n_email.email) = lower(u.email)
WHERE n_auth.auth_user_id IS NULL
  AND n_email.email IS NULL;

-- 5) API grants for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.nguoidung,
  public.nguoidung_sdt,
  public.vitien,
  public.danhmuc,
  public.chitieu,
  public.thunhap,
  public.taichinhdaihan,
  public.giaodich,
  public.ngansach,
  public.muctieutaichinh,
  public.baocaotaichinh
TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6) RLS + policies used by frontend
ALTER TABLE public.nguoidung ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giaodich ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngansach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muctieutaichinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baocaotaichinh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.danhmuc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chitieu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thunhap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taichinhdaihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nguoidung_sdt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_nguoidung_select ON public.nguoidung;
CREATE POLICY p_nguoidung_select ON public.nguoidung
FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS p_nguoidung_insert ON public.nguoidung;
CREATE POLICY p_nguoidung_insert ON public.nguoidung
FOR INSERT TO authenticated
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS p_nguoidung_update ON public.nguoidung;
CREATE POLICY p_nguoidung_update ON public.nguoidung
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS p_vitien_all ON public.vitien;
CREATE POLICY p_vitien_all ON public.vitien
FOR ALL TO authenticated
USING (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()))
WITH CHECK (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS p_giaodich_all ON public.giaodich;
CREATE POLICY p_giaodich_all ON public.giaodich
FOR ALL TO authenticated
USING (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()))
WITH CHECK (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS p_ngansach_all ON public.ngansach;
CREATE POLICY p_ngansach_all ON public.ngansach
FOR ALL TO authenticated
USING (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()))
WITH CHECK (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS p_muctieu_all ON public.muctieutaichinh;
CREATE POLICY p_muctieu_all ON public.muctieutaichinh
FOR ALL TO authenticated
USING (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()))
WITH CHECK (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS p_baocao_all ON public.baocaotaichinh;
CREATE POLICY p_baocao_all ON public.baocaotaichinh
FOR ALL TO authenticated
USING (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()))
WITH CHECK (id_nguoi_dung IN (SELECT nguoidung_id FROM public.nguoidung WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS p_danhmuc_select ON public.danhmuc;
CREATE POLICY p_danhmuc_select ON public.danhmuc
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS p_danhmuc_insert ON public.danhmuc;
CREATE POLICY p_danhmuc_insert ON public.danhmuc
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS p_chitieu_select ON public.chitieu;
CREATE POLICY p_chitieu_select ON public.chitieu
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS p_chitieu_insert ON public.chitieu;
CREATE POLICY p_chitieu_insert ON public.chitieu
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS p_thunhap_select ON public.thunhap;
CREATE POLICY p_thunhap_select ON public.thunhap
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS p_thunhap_insert ON public.thunhap;
CREATE POLICY p_thunhap_insert ON public.thunhap
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS p_taichinhdaihan_select ON public.taichinhdaihan;
CREATE POLICY p_taichinhdaihan_select ON public.taichinhdaihan
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS p_taichinhdaihan_insert ON public.taichinhdaihan;
CREATE POLICY p_taichinhdaihan_insert ON public.taichinhdaihan
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS p_nguoidung_sdt_all ON public.nguoidung_sdt;
CREATE POLICY p_nguoidung_sdt_all ON public.nguoidung_sdt
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nguoidung n
    WHERE n.nguoidung_id = public.nguoidung_sdt.nguoidung_id
      AND n.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nguoidung n
    WHERE n.nguoidung_id = public.nguoidung_sdt.nguoidung_id
      AND n.auth_user_id = auth.uid()
  )
);

commit;

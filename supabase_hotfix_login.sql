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

-- 1) No auth_user_id dependency anymore.
-- Keep the column if it already exists, but do not rely on it.

-- 2) Normalize/canonicalize existing rows by email if needed
UPDATE public.nguoidung n
SET ten_tk = COALESCE(NULLIF(n.ten_tk, ''), lower(split_part(n.email, '@', 1)))
WHERE n.ten_tk IS NULL OR n.ten_tk = '';

INSERT INTO public.nguoidung (ten_tk, email, mat_khau, vai_tro)
SELECT
  left(lower(split_part(u.email, '@', 1)), 100),
  u.email,
  '[supabase-auth]',
  'user'
FROM auth.users u
LEFT JOIN public.nguoidung n_email ON lower(n_email.email) = lower(u.email)
WHERE n_email.email IS NULL;

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
USING (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS p_nguoidung_insert ON public.nguoidung;
CREATE POLICY p_nguoidung_insert ON public.nguoidung
FOR INSERT TO authenticated
WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS p_nguoidung_update ON public.nguoidung;
CREATE POLICY p_nguoidung_update ON public.nguoidung
FOR UPDATE TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'))
WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS p_vitien_all ON public.vitien;
CREATE POLICY p_vitien_all ON public.vitien
FOR ALL TO authenticated
USING (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS p_giaodich_all ON public.giaodich;
CREATE POLICY p_giaodich_all ON public.giaodich
FOR ALL TO authenticated
USING (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS p_ngansach_all ON public.ngansach;
CREATE POLICY p_ngansach_all ON public.ngansach
FOR ALL TO authenticated
USING (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS p_muctieu_all ON public.muctieutaichinh;
CREATE POLICY p_muctieu_all ON public.muctieutaichinh
FOR ALL TO authenticated
USING (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS p_baocao_all ON public.baocaotaichinh;
CREATE POLICY p_baocao_all ON public.baocaotaichinh
FOR ALL TO authenticated
USING (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  id_nguoi_dung IN (
    SELECT nguoidung_id FROM public.nguoidung WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
);

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
      AND lower(n.email) = lower(auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nguoidung n
    WHERE n.nguoidung_id = public.nguoidung_sdt.nguoidung_id
      AND lower(n.email) = lower(auth.jwt() ->> 'email')
  )
);

commit;

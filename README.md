# Demo QLCTCN: GitHub Pages + Supabase

Repo nay da duoc chuyen doi FULL tu SQL Server sang Supabase PostgreSQL, giu day du bang va chuc nang tu file goc.

## Kien truc

- `index.html`: redirect den giao dien app.
- `app/frontend`: giao dien dang nhap, dashboard, giao dich, admin CRUD user, goi truc tiep Supabase client.
- `app/backend`: co san, nhung khong bat buoc cho che do frontend-only.
- `supabase/schema.sql`: script FULL conversion tu SQL goc.
- `render.yaml`: blueprint deploy backend len Render.

## 1) Tao database tren Supabase (FULL)

1. Tao project Supabase.
2. Vao SQL Editor.
3. Chay file `supabase/schema.sql`.
4. Kiem tra nhanh:

```sql
SELECT * FROM nguoidung;
SELECT * FROM danhmuc;
SELECT * FROM vitien;
SELECT * FROM giaodich;
```

Schema FULL trong `supabase/schema.sql` bao gom:

- 11 bang: `nguoidung`, `nguoidung_sdt`, `vitien`, `danhmuc`, `chitieu`, `thunhap`, `taichinhdaihan`, `giaodich`, `ngansach`, `muctieutaichinh`, `baocaotaichinh`.
- Sequence auto-ID tuong duong SQL goc.
- Trigger cap nhat so du vi va ngan sach.
- Cac view user: `v_nguoidung_user`, `v_nguoidung_sdt_user`, `v_vitien_user`, `v_giaodich_user`, `v_ngansach_user`, `v_muctieutaichinh_user`, `v_baocaotaichinh_user`.
- Procedure `sp_taologinvauser` (best effort tren Supabase).
- Seed data tuong duong SQL goc.

Tai khoan demo:

- Admin: `lethanh` / `thanh456`
- User: `nguyenhoang` / `hoang123`

## 2) Cau hinh frontend goi truc tiep Supabase

1. Bat GitHub Pages cho repo (branch `main`, root).
2. Mo `https://<username>.github.io/<repo>/`.
3. O form login, URL/key da duoc dien san (co the sua neu can):

- `Supabase URL`
- `Supabase Publishable Key`

4. Dang nhap bang bang `nguoidung`:

- Admin: `lethanh` / `thanh456`
- User: `nguyenhoang` / `hoang123`

Ban cung co the tao tai khoan moi ngay tai man hinh login:

- Form `Tao tai khoan moi` se them user vao bang `nguoidung` voi role `user`.
- He thong tu tao `Vi mac dinh` trong bang `vitien` de co the them giao dich ngay.

## 3) Luu y bao mat

- `supabase/schema.sql` hien tai bat quyen demo de frontend-only hoat dong voi bang user rieng.
- Khong dung che do nay cho production.
- Neu deploy that, nen quay lai model co backend hoac su dung Supabase Auth + RLS chuan.

## Local (tuy chon)

1. Tao `.env` tu `app/backend/.env.example`.
2. Chay `npm install` trong `app/backend`.
3. Chay `npm start`.
4. Mo `http://localhost:3000`.

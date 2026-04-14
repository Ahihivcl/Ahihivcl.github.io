# Demo QLCTCN: GitHub Pages + Supabase

Repo nay da duoc chuyen doi FULL tu SQL Server sang Supabase PostgreSQL, giu day du bang va chuc nang tu file goc.

## Kien truc

- `index.html`: redirect den giao dien app.
- `app/frontend`: giao dien dang nhap, dashboard, giao dich, admin CRUD user.
- `app/backend`: Express API + JWT + PostgreSQL (`pg`).
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

## 2) Deploy backend API

1. Push repo len GitHub.
2. Render -> `New` -> `Blueprint` -> chon repo.
3. Set env vars:

- `JWT_SECRET`
- `DATABASE_URL` (Supabase Postgres pooler URL)
- `DB_SSL=true`
- `CORS_ORIGIN=https://<username>.github.io`

4. Deploy, nhan API URL backend.

## 3) Chay frontend tren GitHub Pages

1. Bat Pages cho repo (branch `main`, root).
2. Mo `https://<username>.github.io/<repo>/`.
3. O login, nhap `API URL` la URL backend vua deploy.
4. Dang nhap va su dung.

## Local (tuy chon)

1. Tao `.env` tu `app/backend/.env.example`.
2. Chay `npm install` trong `app/backend`.
3. Chay `npm start`.
4. Mo `http://localhost:3000`.

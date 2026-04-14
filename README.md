# Demo QLCTCN: GitHub Pages + Supabase

Muc tieu cua repo nay:

- Frontend dat tren GitHub Pages.
- Database dat tren Supabase PostgreSQL.
- Backend API host cloud (Render), frontend github.io goi vao API do.

## Kien truc

- `index.html`: redirect nhanh toi giao dien app.
- `app/frontend`: giao dien dang nhap, dashboard, giao dich, admin CRUD user.
- `app/backend`: Express API + JWT + PostgreSQL (`pg`).
- `supabase/schema.sql`: script tao bang va seed mau cho Supabase.
- `render.yaml`: blueprint deploy backend len Render.

## 1) Tao database tren Supabase

1. Tao project Supabase.
2. Vao SQL Editor.
3. Chay file `supabase/schema.sql`.
4. Xac nhan co du lieu mau:

```sql
SELECT * FROM app_users;
SELECT * FROM categories;
SELECT * FROM wallets;
SELECT * FROM transactions;
```

Tai khoan demo sau seed:

- Admin: `lethanh` / `thanh456`
- User: `nguyenhoang` / `hoang123`

## 2) Deploy backend API (Render)

1. Push repo len GitHub.
2. Vao Render -> `New` -> `Blueprint` -> chon repo.
3. Render doc `render.yaml` va tao web service.
4. Set env vars trong Render:

- `JWT_SECRET`: chuoi bi mat dai.
- `DATABASE_URL`: connection string Postgres cua Supabase (pooler).
- `DB_SSL`: `true`.
- `CORS_ORIGIN`: domain GitHub Pages cua ban, vi du `https://yourname.github.io`.

5. Deploy xong, lay API URL, vi du `https://qlctcn-demo-app.onrender.com`.

## 3) Chay frontend tren GitHub Pages

1. Bat GitHub Pages cho repo (branch `main`, folder root).
2. Mo URL Pages: `https://<username>.github.io/<repo>/`.
3. Man hinh login co o `app/frontend/index.html`.
4. O truong `API URL`, nhap URL backend Render o buoc 2.
5. Dang nhap va su dung.

## 4) Checklist test end-to-end

1. Dang nhap admin thanh cong.
2. Tao user moi trong bang Admin.
3. Dang nhap user moi vua tao.
4. Them giao dich.
5. Kiem tra transaction moi trong Supabase SQL Editor.

## Local (tuy chon)

Neu can chay local backend:

1. Tao `.env` tu `app/backend/.env.example`.
2. Trong `app/backend`, chay `npm install`.
3. Chay `npm start`.
4. Mo `http://localhost:3000`.

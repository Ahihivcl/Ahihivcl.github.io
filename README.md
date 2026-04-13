# Demo CSDL Quan Ly Chi Tieu Ca Nhan

Ban co the deploy app len web de nguoi dung dang nhap va su dung truc tiep online (khong can localhost).

Ung dung da co san:

- Dang nhap role `admin` / `user`
- User them giao dich, xem dashboard va du lieu cua minh
- Admin CRUD user tren database

## Cau truc

- `TableQuanLyChiTieuCaNhan_v2.sql`: script tao DB, bang, du lieu mau, trigger, view, stored procedure va cap quyen.
- `index.html`, `styles.css`: trang gioi thieu cho GitHub Pages.
- `app/backend`: API Express + SQL Server + JWT auth (dong thoi serve frontend).
- `app/frontend`: giao dien dang nhap/dashboard.
- `render.yaml`: cau hinh deploy cloud tren Render.

## Deploy online full app (khuyen nghi)

### A. Chuan bi SQL Server cloud

Dung 1 trong 2 cach:

1. Azure SQL Database (de nhat).
2. SQL Server tren VM cloud (Azure/AWS/GCP) mo cong 1433.

Sau do chay file `TableQuanLyChiTieuCaNhan_v2.sql` len database cloud do.

### B. Deploy backend + frontend len Render

1. Push repo len GitHub.
2. Dang nhap Render va chon `New` -> `Blueprint`.
3. Chon repo nay, Render se doc file `render.yaml`.
4. Dien env secret:
	- `JWT_SECRET`
	- `DB_USER`
	- `DB_PASSWORD`
	- `DB_SERVER`
5. Bam deploy.
6. Sau khi xong, truy cap URL Render de vao app (vi du: `https://qlctcn-demo-app.onrender.com`).

Luu y:

- App tren Render da phuc vu ca frontend va API trong cung mot domain.
- Khong can host frontend rieng neu ban dung cach nay.

## Dang nhap demo

Tai khoan mau co trong script SQL:

- Admin: `lethanh` / `thanh456`
- User: `nguyenhoang` / `hoang123`

## Neu van muon giu GitHub Pages

GitHub Pages chi dung cho static page, khong ket noi truc tiep SQL Server.

Ban co the:

1. Van de [index.html](index.html) lam trang gioi thieu tren Pages.
2. Gan nut "Mo app" tro toi URL Render cua app that.

## Chay local (tuy chon)

1. Mo SQL Server Management Studio (SSMS).
2. Mo file `TableQuanLyChiTieuCaNhan_v2.sql`.
3. Neu can reset DB, set `@ForceRecreate = 1`.
4. Execute script.

Kiem tra nhanh:

```sql
SELECT COUNT(*) AS SoNguoiDung FROM NguoiDung;
SELECT COUNT(*) AS SoGiaoDich FROM GiaoDich;
SELECT TOP 5 NguoiDung_ID, Ten_TK, Vai_tro FROM NguoiDung;
```

1. Vao `app/backend`.
2. Tao `.env` tu `.env.example`.
3. Chay `npm install` va `npm start`.
4. Mo `http://localhost:3000`.
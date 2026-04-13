# Demo CSDL Quan Ly Chi Tieu Ca Nhan

Repo nay co 2 phan:

- Landing page tren GitHub Pages de gioi thieu do an.
- Full app demo chay local (dang nhap + phan quyen + CRUD) dung SQL Server.

## Cau truc

- `TableQuanLyChiTieuCaNhan_v2.sql`: script tao DB, bang, du lieu mau, trigger, view, stored procedure va cap quyen.
- `index.html`, `styles.css`: trang gioi thieu cho GitHub Pages.
- `app/backend`: API Express + SQL Server + JWT auth.
- `app/frontend`: giao dien dang nhap/dashboard, nhung duoc backend serve truc tiep.

## 1) Chuan bi database

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

## 2) Chay app demo dang nhap + phan quyen

Yeu cau:

- Node.js 18+
- SQL Server dang chay

Thuc hien:

1. Vao thu muc backend:

```bash
cd app/backend
```

2. Tao file `.env` tu `.env.example` va sua thong tin ket noi DB.

3. Cai dependency:

```bash
npm install
```

4. Chay server:

```bash
npm start
```

5. Mo trinh duyet: `http://localhost:3000`

Tai khoan mau co trong script SQL:

- Admin: `lethanh` / `thanh456`
- User: `nguyenhoang` / `hoang123`

Chuc nang demo:

- Dang nhap theo role.
- User xem dashboard, xem giao dich cua minh, them giao dich.
- Admin xem tong quan he thong, xem danh sach user va CRUD user (them/sua/xoa).

## 3) Deploy GitHub Pages (chi landing page)

GitHub Pages chi host static files, khong chay duoc Node.js API/SQL Server.

Ban van co the deploy landing page:

1. Push repo len GitHub.
2. Settings -> Pages.
3. Source: `Deploy from a branch`.
4. Branch: `main`, folder: `/ (root)`.

Neu can deploy full app online, can dung backend host rieng (Render/Railway/Azure) + SQL Server cloud.
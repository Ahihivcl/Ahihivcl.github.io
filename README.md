# Demo CSDL Quan Ly Chi Tieu Ca Nhan

Repo nay dung de demo do an Co So Du Lieu tren GitHub Pages.

## Noi dung repo

- `TableQuanLyChiTieuCaNhan_v2.sql`: script tao DB, bang, du lieu mau, trigger, view, stored procedure va cap quyen.
- `index.html`: landing page gioi thieu kien truc va huong dan demo.
- `styles.css`: giao dien cho trang GitHub Pages.

## Chay SQL Script tren SQL Server

1. Mo SQL Server Management Studio (SSMS).
2. Mo file `TableQuanLyChiTieuCaNhan_v2.sql`.
3. Neu muon tao moi lai DB, doi `@ForceRecreate = 1`.
4. Execute toan bo script theo tung khoi `GO`.
5. Kiem tra:

```sql
SELECT COUNT(*) AS SoNguoiDung FROM NguoiDung;
SELECT COUNT(*) AS SoGiaoDich FROM GiaoDich;
SELECT TOP 5 * FROM BaoCaoTaiChinh;
```

## Deploy len GitHub Pages

1. Push repo len GitHub.
2. Vao `Settings` -> `Pages`.
3. Tai `Source`, chon `Deploy from a branch`.
4. Chon branch `main` va folder `/ (root)`.
5. Save va doi GitHub build xong.
6. Truy cap URL: `https://<username>.github.io/<repo>/`

Neu repo co ten `<username>.github.io` thi URL se la `https://<username>.github.io/`.
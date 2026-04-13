-- ====================================================================
-- 0. KHỞI TẠO DATABASE AN TOÀN
-- ====================================================================
DECLARE @ForceRecreate bit = 0;
DECLARE @TargetDatabase sysname = N'QuanLyChiTieuCaNhan';

IF DB_NAME() <> @TargetDatabase
BEGIN
    THROW 50000, N'Hay ket noi truc tiep vao database QuanLyChiTieuCaNhan truoc khi chay script nay. Azure SQL Database khong ho tro USE de chuyen database.', 1;
END

IF DB_ID('QuanLyChiTieuCaNhan') IS NOT NULL AND @ForceRecreate = 1
BEGIN
    -- Chỉ xóa database khi bật cờ @ForceRecreate = 1
    ALTER DATABASE QuanLyChiTieuCaNhan SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QuanLyChiTieuCaNhan;
END
GO


-- ====================================================================
-- 1. TẠO CƠ SỞ DỮ LIỆU (NẾU CHƯA CÓ)
-- ====================================================================
-- Da ket noi truc tiep vao database QuanLyChiTieuCaNhan o buoc tren.
-- Azure SQL Database khong ho tro CREATE DATABASE / USE de chuyen database trong cung script.
GO

-- ====================================================================
-- 2. TẠO CÁC SEQUENCE ĐỂ TĂNG TỰ ĐỘNG ID
-- ====================================================================
CREATE SEQUENCE Seq_NguoiDung START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE Seq_ViTien START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE Seq_DanhMuc START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE Seq_GiaoDich START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE Seq_NganSach START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE Seq_MucTieuTaiChinh START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE Seq_BaoCaoTaiChinh START WITH 1 INCREMENT BY 1;
GO

-- ====================================================================
-- 3. TẠO BẢNG & RÀNG BUỘC (TABLES & CONSTRAINTS)
-- ====================================================================

-- 3.1 Bảng NguoiDung
CREATE TABLE NguoiDung (
    NguoiDung_ID varchar(10) PRIMARY KEY,
    Ten_TK varchar(100) UNIQUE,
    Email varchar(100) UNIQUE,
    Mat_khau varchar(255) NOT NULL,
    Ngay_tao date NOT NULL DEFAULT GETDATE(),
    Vai_tro varchar(20) CHECK (Vai_tro IN ('admin', 'user'))
);
GO
ALTER TABLE NguoiDung 
ADD CONSTRAINT Auto_NguoiDung_ID 
DEFAULT ('ND' + FORMAT((NEXT VALUE FOR Seq_NguoiDung), '00')) FOR NguoiDung_ID;
GO

-- 3.2 Bảng NguoiDung_SDT
CREATE TABLE NguoiDung_SDT (
    NguoiDung_ID varchar(10),
    SDT varchar(15),
    PRIMARY KEY (NguoiDung_ID, SDT),
    FOREIGN KEY (NguoiDung_ID) REFERENCES NguoiDung (NguoiDung_ID)
);
GO

-- 3.3 Bảng ViTien
CREATE TABLE ViTien (
    Vi_ID varchar(10) PRIMARY KEY,
    Ten_vi varchar(50) NOT NULL,
    Loai_vi varchar(30) NOT NULL,
    So_du_hien_tai decimal(19,2) NOT NULL,
    Ngay_tao date NOT NULL,
    ID_nguoi_dung varchar(10) NOT NULL,
    FOREIGN KEY (ID_nguoi_dung) REFERENCES NguoiDung (NguoiDung_ID),
    CONSTRAINT UQ_ViTien_ViID_NguoiDung UNIQUE (Vi_ID, ID_nguoi_dung)
);
GO
ALTER TABLE ViTien 
ADD CONSTRAINT Auto_Vi_ID 
DEFAULT ('Vi' + FORMAT((NEXT VALUE FOR Seq_ViTien), '00')) FOR Vi_ID;
GO

-- 3.4 Bảng DanhMuc
CREATE TABLE DanhMuc (
    DanhMuc_ID varchar(10) PRIMARY KEY,
    Ten_danh_muc varchar(50) NOT NULL,
    Loai_danh_muc varchar(30) NOT NULL,
    Mo_ta varchar(255)
);
GO
ALTER TABLE DanhMuc 
ADD CONSTRAINT Auto_DanhMuc_ID 
DEFAULT ('DM' + FORMAT((NEXT VALUE FOR Seq_DanhMuc), '00')) FOR DanhMuc_ID;
GO

-- 3.5 Bảng ChiTieu
CREATE TABLE ChiTieu (
    ChiTieu_ID varchar(10) PRIMARY KEY,
    FOREIGN KEY (ChiTieu_ID) REFERENCES DanhMuc (DanhMuc_ID)
);
GO

-- 3.6 Bảng ThuNhap
CREATE TABLE ThuNhap (
    ThuNhap_ID varchar(10) PRIMARY KEY,
    FOREIGN KEY (ThuNhap_ID) REFERENCES DanhMuc (DanhMuc_ID)
);
GO

-- 3.7 Bảng TaiChinhDaiHan
CREATE TABLE TaiChinhDaiHan (
    TaiChinhDaiHan_ID varchar(10) PRIMARY KEY,
    FOREIGN KEY (TaiChinhDaiHan_ID) REFERENCES DanhMuc (DanhMuc_ID)
);
GO

-- 3.8 Bảng GiaoDich
CREATE TABLE GiaoDich (
    GiaoDich_ID varchar(10) PRIMARY KEY,
    Ten_giao_dich varchar(100) NOT NULL,
    So_tien decimal(19,2) NOT NULL CHECK (So_tien > 0),
    Ngay_giao_dich date NOT NULL,
    Ghi_chu varchar(255),
    ID_nguoi_dung varchar(10) NOT NULL,
    ID_danh_muc varchar(10) NOT NULL,
    ID_vi_tien varchar(10) NOT NULL,
    FOREIGN KEY (ID_nguoi_dung) REFERENCES NguoiDung (NguoiDung_ID),
    FOREIGN KEY (ID_danh_muc) REFERENCES DanhMuc (DanhMuc_ID),
    FOREIGN KEY (ID_vi_tien, ID_nguoi_dung) REFERENCES ViTien (Vi_ID, ID_nguoi_dung)
);
GO
ALTER TABLE GiaoDich 
ADD CONSTRAINT Auto_GiaoDich_ID 
DEFAULT ('GD' + FORMAT((NEXT VALUE FOR Seq_GiaoDich), '00')) FOR GiaoDich_ID;
GO

-- 3.9 Bảng NganSach
CREATE TABLE NganSach (
    NganSach_ID varchar(10) PRIMARY KEY,
    Ten_ngan_sach varchar(100) NOT NULL,
    So_tien_gioi_han decimal(19,2) NOT NULL CHECK (So_tien_gioi_han > 0),
    Ngay_bat_dau date NOT NULL DEFAULT GETDATE(),
    Ngay_ket_thuc date NOT NULL DEFAULT DATEADD(DAY, 30, GETDATE()),
    ID_nguoi_dung varchar(10) NOT NULL,
    ID_danh_muc varchar(10) NOT NULL,
    FOREIGN KEY (ID_nguoi_dung) REFERENCES NguoiDung (NguoiDung_ID),
    FOREIGN KEY (ID_danh_muc) REFERENCES DanhMuc (DanhMuc_ID),
    CONSTRAINT UQ_NganSach_NguoiDung_DanhMuc UNIQUE (ID_nguoi_dung, ID_danh_muc)
);
GO
ALTER TABLE NganSach 
ADD CONSTRAINT Auto_NganSach_ID 
DEFAULT ('NS' + FORMAT((NEXT VALUE FOR Seq_NganSach), '00')) FOR NganSach_ID;
GO

-- 3.10 Bảng MucTieuTaiChinh
CREATE TABLE MucTieuTaiChinh (
    MucTieu_ID varchar(10) PRIMARY KEY,
    Ten_muc_tieu varchar(100) NOT NULL,
    So_tien_can_dat decimal(19,2) NOT NULL CHECK (So_tien_can_dat > 0),
    Ngay_bat_dau date NOT NULL DEFAULT GETDATE(),
    Thoi_han_hoan_thanh date,
    Trang_thai varchar(50) DEFAULT 'Chua hoan thanh' CHECK (Trang_thai IN ('Chua hoan thanh', 'Da hoan thanh')),
    ID_nguoi_dung varchar(10) NOT NULL,
    FOREIGN KEY (ID_nguoi_dung) REFERENCES NguoiDung (NguoiDung_ID)
);
GO
ALTER TABLE MucTieuTaiChinh 
ADD CONSTRAINT Auto_MucTieu_ID 
DEFAULT ('MT' + FORMAT((NEXT VALUE FOR Seq_MucTieuTaiChinh), '00')) FOR MucTieu_ID;
GO

-- 3.11 Bảng BaoCaoTaiChinh
CREATE TABLE BaoCaoTaiChinh (
    BaoCao_ID varchar(10) PRIMARY KEY,
    Ten_bao_cao varchar(100) NOT NULL,
    Tong_thu decimal(19,2) NOT NULL,
    Tong_chi decimal(19,2) NOT NULL,
    Thoi_gian DATE NOT NULL,
    ID_nguoi_dung varchar(10) NOT NULL,
    FOREIGN KEY (ID_nguoi_dung) REFERENCES NguoiDung (NguoiDung_ID)
);
GO
ALTER TABLE BaoCaoTaiChinh 
ADD CONSTRAINT Auto_BaoCao_ID 
DEFAULT ('BC' + FORMAT((NEXT VALUE FOR Seq_BaoCaoTaiChinh), '00')) FOR BaoCao_ID;
GO

-- ====================================================================
-- 3.12 TẠO CHỈ MỤC PHỤC VỤ JOIN/LỌC
-- ====================================================================
CREATE INDEX IX_ViTien_IDNguoiDung ON ViTien (ID_nguoi_dung);
CREATE INDEX IX_GiaoDich_NguoiDung_Ngay ON GiaoDich (ID_nguoi_dung, Ngay_giao_dich);
CREATE INDEX IX_GiaoDich_DanhMuc ON GiaoDich (ID_danh_muc);
CREATE INDEX IX_GiaoDich_ViTien ON GiaoDich (ID_vi_tien);
CREATE INDEX IX_NganSach_NguoiDung ON NganSach (ID_nguoi_dung);
CREATE INDEX IX_MucTieuTaiChinh_NguoiDung ON MucTieuTaiChinh (ID_nguoi_dung);
CREATE INDEX IX_BaoCaoTaiChinh_NguoiDung_ThoiGian ON BaoCaoTaiChinh (ID_nguoi_dung, Thoi_gian);
GO

-- ====================================================================
-- 4. THÊM DỮ LIỆU (INSERT DATA)
-- ====================================================================

-- 4.1 Thêm dữ liệu NguoiDung
INSERT INTO NguoiDung (Ten_TK, Email, Mat_khau, Vai_tro) VALUES
('nguyenhoang', 'nguyenhoang@gmail.com', 'hoang123', 'user'),
('lethanh', 'lethanh@outlook.com', 'thanh456', 'admin'),
('trinhbao', 'trinhbao@gmail.com', 'bao789', 'user'),
('hoangminh', 'hoangminh@gmail.com', 'minh123', 'user'),
('ngocanh', 'ngocanh@outlook.com', 'anh123', 'user'),
('phuonglinh', 'phuonglinh@gmail.com', 'linh123', 'user'),
('thaojune', 'thaojune@outlook.com', 'june123', 'admin'),
('namhieu', 'namhieu@gmail.com', 'hieu123', 'user'),
('duongkhanh', 'duongkhanh@yahoo.com', 'khanh123', 'user'),
('anhduong', 'anhduong@gmail.com', 'duong123', 'admin'),
('lanhien', 'lanhien@gmail.com', 'hien123', 'user'),
('vithao', 'vithao@outlook.com', 'thao456', 'user'),
('huyena', 'huyena@yahoo.com', 'ena123', 'admin'),
('dongtrang', 'dongtrang@gmail.com', 'trang789', 'user'),
('hoangtuan', 'hoangtuan@gmail.com', 'tuan123', 'user');
GO

-- 4.2 Thêm dữ liệu NguoiDung_SDT
INSERT INTO NguoiDung_SDT (NguoiDung_ID, SDT) VALUES
('ND03', '0901234567'), ('ND03', '0912345678'), ('ND06', '0923456789'), 
('ND06', '0934567890'), ('ND09', '0945678901'), ('ND09', '0956789012'), 
('ND12', '0967890123'), ('ND12', '0978901234'), ('ND01', '0912345678'), 
('ND02', '0987654321'), ('ND04', '0934567890'), ('ND05', '0923456789'), 
('ND07', '0981234567'), ('ND08', '0912345678'), ('ND10', '0934567890'), 
('ND11', '0945678901'), ('ND13', '0978901234'), ('ND14', '0989012345'), 
('ND15', '0990123456');
GO

-- 4.3 Thêm dữ liệu ViTien
INSERT INTO ViTien (Ten_vi, Loai_vi, So_du_hien_tai, Ngay_tao, ID_nguoi_dung) VALUES
('Agribank', 'The vat ly', 22800000, '2023-09-01', 'ND01'),
('BIDV', 'The vat ly', 13420000, '2022-05-15', 'ND02'),
('Vietcombank', 'The vat ly', 2216500, '2024-03-07', 'ND03'),
('Techcombank', 'The vat ly', 18700000, '2021-12-20', 'ND04'),
('ACB', 'The vat ly', 10230000, '2024-01-11', 'ND05'),
('Vietinbank', 'The vat ly', 1650000, '2020-06-10', 'ND06'),
('Sacombank', 'The vat ly', 20900000, '2022-08-04', 'ND07'),
('Momo', 'Vi dien tu', 3410000, '2024-02-15', 'ND08'),
('ZaloPay', 'Vi dien tu', 14300000, '2023-11-25', 'ND09'),
('VNPay', 'Vi dien tu', 12650000, '2021-04-30', 'ND10'),
('AirPay', 'Vi dien tu', 11165000, '2020-12-18', 'ND11'),
('ShopeePay', 'Vi dien tu', 13530000, '2023-01-02', 'ND12'),
('Tien mat', 'Tien mat', 3850000, '2022-07-09', 'ND13'),
('Tien mat', 'Tien mat', 5720000, '2021-10-13', 'ND14'),
('Tien mat', 'Tien mat', 4400000, '2024-09-27', 'ND15');
GO

-- 4.4 Thêm dữ liệu DanhMuc
INSERT INTO DanhMuc (Ten_danh_muc, Loai_danh_muc, Mo_ta) VALUES
('Cho, sieu thi', 'Sinh hoat', 'Chi phi cho viec mua sam tai cho hoac sieu thi'),
('An uong', 'Sinh hoat', 'Chi phi lien quan den an uong hang ngay'),
('Di chuyen', 'Sinh hoat', 'Chi phi van chuyen nhu xang xe, ve xe buyt, taxi'),
('Mua sam', 'Phat sinh', 'Chi phi cho cac mon do khong thuong xuyen'),
('Giai tri', 'Phat sinh', 'Chi phi cho cac hoat dong giai tri, xem phim, du lich'),
('Lam dep', 'Phat sinh', 'Chi phi cho viec lam dep, cham soc sac dep'),
('Suc khoe', 'Phat sinh', 'Chi phi cho viec tham kham, thuoc men, bao hiem y te'),
('Tu thien', 'Phat sinh', 'Chi phi cho cac hoat dong tu thien, ho tro cong dong'),
('Hoa don', 'Co dinh', 'Chi phi cho cac hoa don hang thang nhu dien, nuoc, internet'),
('Nha cua', 'Co dinh', 'Chi phi lien quan den nha cua, sua chua, bao tri'),
('Nguoi than', 'Co dinh', 'Chi phi cho nguoi than, bo me, con cai, hoc phi'),
('Hoc tap', 'Dau tu', 'Chi phi cho viec hoc tap, cac khoa hoc, sach vo'),
('Nha dat', 'Dau tu', 'Chi phi lien quan den viec mua ban, cho thue nha dat'),
('Vang', 'Dau tu', 'Chi phi dau tu vao vang, kim loai quy'),
('Ngan hang', 'Tiet kiem', 'Tien gui tiet kiem tai ngan hang, lai suat'),
('Luong', 'Cong viec', 'Thu nhap tu luong thang cua nguoi lao dong'),
('Tro cap', 'Chinh phu', 'Thu nhap tu cac khoan tro cap, phuc loi cua cong ty hoac chinh phu'),
('Thuong', 'Cong viec', 'Thu nhap tu cac khoan thuong, tien thuong dip le tet hoac thuong hieu suat cong viec'),
('Kinh doanh', 'Ca nhan', 'Thu nhap tu hoat dong kinh doanh, dau tu, ban hang');
GO

-- 4.5 Thêm dữ liệu Phân loại Danh Mục (ChiTieu, ThuNhap, TaiChinhDaiHan)
INSERT INTO ChiTieu (ChiTieu_ID)
SELECT DanhMuc_ID FROM DanhMuc 
WHERE (Loai_danh_muc = 'Sinh hoat' AND Ten_danh_muc IN ('Cho, sieu thi', 'An uong', 'Di chuyen'))
   OR (Loai_danh_muc = 'Phat sinh' AND Ten_danh_muc IN ('Mua sam', 'Giai tri', 'Lam dep', 'Suc khoe', 'Tu thien'))
   OR (Loai_danh_muc = 'Co dinh' AND Ten_danh_muc IN ('Hoa don', 'Nha cua', 'Nguoi than'));
GO

INSERT INTO ThuNhap (ThuNhap_ID)
SELECT DanhMuc_ID FROM DanhMuc 
WHERE (Loai_danh_muc = 'Cong viec' AND Ten_danh_muc IN ('Luong', 'Thuong'))
   OR (Loai_danh_muc = 'Chinh phu' AND Ten_danh_muc IN ('Tro cap'))
   OR (Loai_danh_muc = 'Ca nhan' AND Ten_danh_muc IN ('Kinh doanh'));
GO

INSERT INTO TaiChinhDaiHan (TaiChinhDaiHan_ID)
SELECT DanhMuc_ID FROM DanhMuc 
WHERE (Loai_danh_muc = 'Dau tu' AND Ten_danh_muc IN ('Hoc tap', 'Nha dat', 'Vang'))
   OR (Loai_danh_muc = 'Tiet kiem' AND Ten_danh_muc = 'Ngan hang');
GO

-- 4.6 Thêm dữ liệu GiaoDich
INSERT INTO GiaoDich (Ten_giao_dich, So_tien, Ngay_giao_dich, Ghi_chu, ID_nguoi_dung, ID_danh_muc, ID_vi_tien) VALUES
-- Chi tiêu
('Mua sam tai sieu thi', 500000, '2025-04-01', 'Mua thuc pham', 'ND01', 'DM01', 'Vi01'),
('Chi phi an uong', 200000, '2025-04-02', 'An trua tai nha hang', 'ND02', 'DM02', 'Vi02'),
('Ve xe buyt', 15000, '2025-04-03', 'Di chuyen di lam', 'ND03', 'DM03', 'Vi03'),
('Mua do dien tu', 2000000, '2025-04-04', 'Mua dien thoai moi', 'ND04', 'DM04', 'Vi04'),
('Sua chua nha cua', 300000, '2025-04-05', 'Sua chua cua kinh', 'ND05', 'DM10', 'Vi05'),
('Dong tien hoc phi', 1000000, '2025-04-06', 'Hoc phi cho ky hoc moi', 'ND06', 'DM12', 'Vi06'),
('Dau tu vang', 5000000, '2025-04-07', 'Dau tu vao vang', 'ND07', 'DM14', 'Vi07'),
('Chi phi xang xe', 100000, '2025-04-08', 'Do xang xe di lam', 'ND08', 'DM03', 'Vi08'),
('Gui tiet kiem ngan hang', 3000000, '2025-04-09', 'Gui tiet kiem tai ngan hang', 'ND09', 'DM15', 'Vi09'),
('Thuong cong viec', 500000, '2025-04-10', 'Nhan thuong tu cong ty', 'ND10', 'DM16', 'Vi10'),
('Mua sach hoc', 150000, '2025-04-11', 'Mua sach tham khao', 'ND11', 'DM12', 'Vi11'),
('Tham kham suc khoe', 300000, '2025-04-12', 'Di kham benh dinh ky', 'ND12', 'DM07', 'Vi12'),
('An cuoi ban than', 1000000, '2025-04-13', 'Dam cuoi ban than', 'ND13', 'DM11', 'Vi13'),
('Tien dien', 200000, '2025-04-14', 'Hoa don tien dien thang nay', 'ND14', 'DM09', 'Vi14'),
('Tham gia hoat dong giai tri', 500000, '2025-04-15', 'Di xem phim', 'ND15', 'DM05', 'Vi15'),
-- Thu nhập
('Luong thang', 10000000, '2025-04-01', 'Luong cong ty', 'ND01', 'DM16', 'Vi01'),
('Luong thang', 12000000, '2025-04-02', 'Luong cong ty', 'ND02', 'DM16', 'Vi02'),
('Tro cap xa hoi', 2000000, '2025-04-03', 'Tro cap xa hoi thang 4', 'ND03', 'DM17', 'Vi03'),
('Luong thang', 15000000, '2025-04-04', 'Luong cong ty', 'ND04', 'DM16', 'Vi04'),
('Luong thang', 9000000, '2025-04-05', 'Luong cong ty', 'ND05', 'DM16', 'Vi05'),
('Thuong hieu suat', 500000, '2025-04-06', 'Thuong cong ty cho hieu suat', 'ND06', 'DM18', 'Vi06'),
('Luong thang', 14000000, '2025-04-07', 'Luong cong ty', 'ND07', 'DM16', 'Vi07'),
('Tro cap that nghiep', 3000000, '2025-04-08', 'Tro cap that nghiep thang 4', 'ND08', 'DM17', 'Vi08'),
('Thuong cong viec', 2000000, '2025-04-09', 'Thuong hieu qua cong viec', 'ND09', 'DM18', 'Vi09'),
('Luong thang', 11000000, '2025-04-10', 'Luong cong ty', 'ND10', 'DM16', 'Vi10'),
('Luong thang', 10000000, '2025-04-11', 'Luong cong ty', 'ND11', 'DM16', 'Vi11');
GO

-- 4.7 Thêm dữ liệu NganSach
INSERT INTO NganSach (Ten_ngan_sach, So_tien_gioi_han, ID_nguoi_dung, ID_danh_muc) VALUES
('Di cho', 2200000, 'ND01', 'DM01'),
('An uong', 1700000, 'ND06', 'DM02'),
('Di chuyen', 650000, 'ND09', 'DM03'),
('Mua sam', 1200000, 'ND04', 'DM04'),
('Nha cua', 2300000, 'ND05', 'DM10'),
('Hoc tap', 1200000, 'ND03', 'DM12'),
('Dau tu vang', 5500000, 'ND02', 'DM14'),
('Tiet kiem', 3200000, 'ND07', 'DM15'),
('Tham kham suc khoe', 1200000, 'ND10', 'DM07'),
('Tham nguoi om', 1700000, 'ND08', 'DM11'),
('Qua tang', 900000, 'ND01', 'DM05'),
('Du phong khan cap', 3200000, 'ND02', 'DM08'),
('Chi phi hoc tieng Anh', 1400000, 'ND03', 'DM12'),
('Cham soc thu cung', 1200000, 'ND04', 'DM06'),
('Kinh doanh online', 5500000, 'ND05', 'DM13');
GO

-- 4.8 Thêm dữ liệu MucTieuTaiChinh
INSERT INTO MucTieuTaiChinh (Ten_muc_tieu, So_tien_can_dat, Thoi_han_hoan_thanh, ID_nguoi_dung) VALUES
('Tiet kiem cho ky nghi', 5000000, '2025-07-01', 'ND15'),
('Mua o to', 30000000, '2025-12-01', 'ND03'),
('Hoc khoa lap trinh', 2000000, '2025-05-01', 'ND07'),
('Sua chua nha', 10000000, '2025-09-01', 'ND04'),
('Dau tu co phieu', 15000000, '2025-10-01', 'ND09'),
('Mua nha moi', 50000000, '2026-04-01', 'ND06'),
('Du lich vong quanh the gioi', 20000000, '2026-04-01', 'ND05'),
('Chi phi chua benh dai han', 2000000, '2025-06-01', 'ND11'),
('Mua sam cho gia dinh', 10000000, '2025-08-01', 'ND13'),
('Dau tu vao giao duc', 5000000, '2025-06-01', 'ND10'),
('Sua chua xe hoi', 15000000, '2025-08-01', 'ND08'),
('Tiet kiem cho con', 7000000, '2026-01-01', 'ND02'),
('Mua thiet bi cong nghe', 10000000, '2025-09-01', 'ND04'),
('Dau tu vao bat dong san', 25000000, '2026-03-01', 'ND01'),
('Kham pha am thuc', 5000000, '2025-06-01', 'ND12');
GO

-- 4.9 Thêm dữ liệu BaoCaoTaiChinh
WITH BaoCao AS (
    SELECT 
        G.ID_nguoi_dung,
        SUM(CASE WHEN TN.ThuNhap_ID IS NOT NULL THEN G.So_tien ELSE 0 END) AS Tong_thu,
        SUM(CASE WHEN CT.ChiTieu_ID IS NOT NULL THEN G.So_tien ELSE 0 END) +
        SUM(CASE WHEN TCDH.TaiChinhDaiHan_ID IS NOT NULL THEN G.So_tien ELSE 0 END) AS Tong_chi,
        CAST(GETDATE() AS DATE) AS Thoi_gian
    FROM GiaoDich G
    LEFT JOIN ThuNhap TN ON G.ID_danh_muc = TN.ThuNhap_ID
    LEFT JOIN ChiTieu CT ON G.ID_danh_muc = CT.ChiTieu_ID
    LEFT JOIN TaiChinhDaiHan TCDH ON G.ID_danh_muc = TCDH.TaiChinhDaiHan_ID
    GROUP BY G.ID_nguoi_dung
)
INSERT INTO BaoCaoTaiChinh (Ten_bao_cao, Tong_thu, Tong_chi, Thoi_gian, ID_nguoi_dung)
SELECT 
    'Báo cáo tháng ' + CONVERT(VARCHAR(2), MONTH(Thoi_gian)) + '-' + CONVERT(VARCHAR(4), YEAR(Thoi_gian)),
    Tong_thu, Tong_chi, Thoi_gian, ID_nguoi_dung
FROM BaoCao;
GO

-- ====================================================================
-- 5. TẠO TRIGGER (CẬP NHẬT SỐ DƯ & NGÂN SÁCH)
-- ====================================================================

-- 5.1 Trigger cập nhật số dư ví tiền
CREATE TRIGGER trg_CapNhatSoDuVi
ON GiaoDich
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Cập nhật trừ tiền với ChiTieu
    UPDATE V
    SET V.So_du_hien_tai = V.So_du_hien_tai - I.So_tien
    FROM ViTien V
    INNER JOIN INSERTED I ON V.Vi_ID = I.ID_vi_tien
    INNER JOIN ChiTieu CT ON I.ID_danh_muc = CT.ChiTieu_ID;

    -- Cập nhật trừ tiền với TaiChinhDaiHan
    UPDATE V
    SET V.So_du_hien_tai = V.So_du_hien_tai - I.So_tien
    FROM ViTien V
    INNER JOIN INSERTED I ON V.Vi_ID = I.ID_vi_tien
    INNER JOIN TaiChinhDaiHan TCDH ON I.ID_danh_muc = TCDH.TaiChinhDaiHan_ID;

    -- Cập nhật cộng tiền với ThuNhap
    UPDATE V
    SET V.So_du_hien_tai = V.So_du_hien_tai + I.So_tien
    FROM ViTien V
    INNER JOIN INSERTED I ON V.Vi_ID = I.ID_vi_tien
    INNER JOIN ThuNhap TN ON I.ID_danh_muc = TN.ThuNhap_ID;

    -- Kiểm tra nếu ví âm thì rollback
    IF EXISTS (
        SELECT 1
        FROM ViTien V
        INNER JOIN INSERTED I ON V.Vi_ID = I.ID_vi_tien
        WHERE V.So_du_hien_tai < 0
    )
    BEGIN
        RAISERROR (N'Số dư ví không đủ để thực hiện giao dịch.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;
GO

-- 5.2 Trigger cập nhật số dư ngân sách
CREATE TRIGGER trg_CapNhatNgansach
ON GiaoDich
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
        UPDATE NS
        SET NS.So_tien_gioi_han = NS.So_tien_gioi_han - I.So_tien
        FROM NganSach NS
        INNER JOIN INSERTED I ON NS.ID_nguoi_dung = I.ID_nguoi_dung
        LEFT JOIN ThuNhap TN ON I.ID_danh_muc = TN.ThuNhap_ID
        WHERE I.ID_danh_muc = NS.ID_danh_muc
            AND TN.ThuNhap_ID IS NULL;

    IF EXISTS (
        SELECT 1
                FROM NganSach NS
                INNER JOIN INSERTED I ON NS.ID_nguoi_dung = I.ID_nguoi_dung
                LEFT JOIN ThuNhap TN ON I.ID_danh_muc = TN.ThuNhap_ID
                WHERE I.ID_danh_muc = NS.ID_danh_muc
                    AND TN.ThuNhap_ID IS NULL
                    AND NS.So_tien_gioi_han < 0
    )
    BEGIN
        RAISERROR (N'Ngân sách đã vượt quá giới hạn.', 16, 1);
                ROLLBACK TRANSACTION;
    END
END;
GO

-- ====================================================================
-- 6. TẠO CÁC VIEW DÀNH CHO USER (CHỈ XEM DỮ LIỆU CÁ NHÂN)
-- ====================================================================

CREATE VIEW v_NguoiDung_User AS
SELECT * FROM NguoiDung WHERE Ten_TK = USER_NAME();
GO

CREATE VIEW v_NguoiDung_SDT_User AS
SELECT NguoiDung_SDT.SDT 
FROM NguoiDung_SDT 
JOIN NguoiDung ON NguoiDung.NguoiDung_ID = NguoiDung_SDT.NguoiDung_ID
WHERE NguoiDung.Ten_TK = USER_NAME();
GO

CREATE VIEW v_ViTien_User AS
SELECT ViTien.Vi_ID, ViTien.Ten_vi, ViTien.Loai_vi, ViTien.So_du_hien_tai, ViTien.Ngay_tao
FROM ViTien
JOIN NguoiDung ON NguoiDung.NguoiDung_ID = ViTien.ID_nguoi_dung
WHERE NguoiDung.Ten_TK = USER_NAME();
GO

CREATE VIEW v_GiaoDich_User AS
SELECT GiaoDich.GiaoDich_ID, GiaoDich.Ten_giao_dich, GiaoDich.So_tien, GiaoDich.Ngay_giao_dich, GiaoDich.Ghi_chu
FROM GiaoDich
JOIN NguoiDung ON NguoiDung.NguoiDung_ID = GiaoDich.ID_nguoi_dung
WHERE NguoiDung.Ten_TK = USER_NAME();
GO

CREATE VIEW v_NganSach_User AS
SELECT NganSach.NganSach_ID, NganSach.Ten_ngan_sach, NganSach.So_tien_gioi_han, NganSach.Ngay_bat_dau, NganSach.Ngay_ket_thuc
FROM NganSach
JOIN NguoiDung ON NguoiDung.NguoiDung_ID = NganSach.ID_nguoi_dung
WHERE NguoiDung.Ten_TK = USER_NAME();
GO

CREATE VIEW v_MucTieuTaiChinh_User AS
SELECT MucTieuTaiChinh.MucTieu_ID, MucTieuTaiChinh.Ten_muc_tieu, MucTieuTaiChinh.So_tien_can_dat, MucTieuTaiChinh.Ngay_bat_dau, MucTieuTaiChinh.Thoi_han_hoan_thanh, MucTieuTaiChinh.Trang_thai
FROM MucTieuTaiChinh
JOIN NguoiDung ON NguoiDung.NguoiDung_ID = MucTieuTaiChinh.ID_nguoi_dung
WHERE NguoiDung.Ten_TK = USER_NAME();
GO

CREATE VIEW v_BaoCaoTaiChinh_User AS
SELECT BaoCaoTaiChinh.BaoCao_ID, BaoCaoTaiChinh.Ten_bao_cao, BaoCaoTaiChinh.Thoi_gian, BaoCaoTaiChinh.Tong_chi, BaoCaoTaiChinh.Tong_thu
FROM BaoCaoTaiChinh
JOIN NguoiDung ON NguoiDung.NguoiDung_ID = BaoCaoTaiChinh.ID_nguoi_dung
WHERE NguoiDung.Ten_TK = USER_NAME();
GO

-- ====================================================================
-- 7. TẠO STORED PROCEDURE KHỞI TẠO LOGIN VÀ USER
-- ====================================================================

-- Tạo role trước để phần GRANT không phụ thuộc vào procedure
IF DATABASE_PRINCIPAL_ID('db_user') IS NULL
    CREATE ROLE db_user;
GO

IF DATABASE_PRINCIPAL_ID('db_admin') IS NULL
    CREATE ROLE db_admin;
GO

CREATE PROCEDURE sp_TaoLoginVaUser
AS
BEGIN
    DECLARE @Ten_TK NVARCHAR(100), @Mat_khau NVARCHAR(100), @Vai_tro NVARCHAR(50), @SQL NVARCHAR(MAX);
    DECLARE @IsAzureSql BIT = CASE WHEN CAST(SERVERPROPERTY('EngineEdition') AS INT) = 5 THEN 1 ELSE 0 END;
    
    DECLARE cur CURSOR FOR
    SELECT Ten_TK, Mat_khau, Vai_tro FROM NguoiDung;
    
    OPEN cur;
    FETCH NEXT FROM cur INTO @Ten_TK, @Mat_khau, @Vai_tro;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            IF @IsAzureSql = 0
            BEGIN
                -- Tạo LOGIN nếu chưa có (chỉ hỗ trợ trên SQL Server thường / MI)
                IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = @Ten_TK)
                BEGIN
                    SET @SQL = 'CREATE LOGIN [' + @Ten_TK + '] WITH PASSWORD = N''' + @Mat_khau + ''';';
                    EXEC sp_executesql @SQL;
                END

                -- Tạo USER nếu chưa có
                IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = @Ten_TK)
                BEGIN
                    SET @SQL = 'CREATE USER [' + @Ten_TK + '] FOR LOGIN [' + @Ten_TK + '];';
                    EXEC sp_executesql @SQL;
                END
            END

            -- Gán role
            IF @Vai_tro = 'admin'
                EXEC('ALTER ROLE db_admin ADD MEMBER [' + @Ten_TK + ']');
            ELSE
                EXEC('ALTER ROLE db_user ADD MEMBER [' + @Ten_TK + ']');
        END TRY
        BEGIN CATCH
            PRINT N'Bo qua user ' + @Ten_TK + N': ' + ERROR_MESSAGE();
        END CATCH;
            
        FETCH NEXT FROM cur INTO @Ten_TK, @Mat_khau, @Vai_tro;
    END
    
    CLOSE cur;
    DEALLOCATE cur;
END;
GO

-- Khởi chạy Procedure để tạo tự động các Logins / Users
IF CAST(SERVERPROPERTY('EngineEdition') AS INT) <> 5
    EXEC sp_TaoLoginVaUser;
ELSE
    PRINT N'Skipping sp_TaoLoginVaUser on Azure SQL Database; roles were created for GRANT statements.';
GO

-- ====================================================================
-- 8. CẤP QUYỀN (GRANT PERMISSIONS) THEO ROLES
-- ====================================================================

-- Cấp quyền cho db_user (Chỉ truy cập thông qua các View cá nhân)
GRANT SELECT, INSERT, UPDATE, DELETE ON v_NguoiDung_User TO db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_NguoiDung_SDT_User TO db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_ViTien_User TO db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_GiaoDich_User TO db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_NganSach_User TO db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_MucTieuTaiChinh_User TO db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_BaoCaoTaiChinh_User TO db_user;
GO

-- Cấp quyền cho db_admin (Có toàn quyền CRUD lên các bảng gốc)
GRANT SELECT, INSERT, UPDATE, DELETE ON NguoiDung TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON NguoiDung_SDT TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON DanhMuc TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ChiTieu TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ThuNhap TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TaiChinhDaiHan TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ViTien TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON NganSach TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON GiaoDich TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON MucTieuTaiChinh TO db_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON BaoCaoTaiChinh TO db_admin;
GO
-- Full migration from TableQuanLyChiTieuCaNhan_v2.sql (SQL Server) to PostgreSQL/Supabase
-- WARNING: This script drops existing related objects before recreating.

begin;

create extension if not exists pgcrypto;

-- Drop views first
DROP VIEW IF EXISTS v_baocaotaichinh_user;
DROP VIEW IF EXISTS v_muctieutaichinh_user;
DROP VIEW IF EXISTS v_ngansach_user;
DROP VIEW IF EXISTS v_giaodich_user;
DROP VIEW IF EXISTS v_vitien_user;
DROP VIEW IF EXISTS v_nguoidung_sdt_user;
DROP VIEW IF EXISTS v_nguoidung_user;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trg_capnhatsoduvi ON giaodich;
DROP TRIGGER IF EXISTS trg_capnhatngansach ON giaodich;
DROP FUNCTION IF EXISTS fn_capnhat_sodu_vi();
DROP FUNCTION IF EXISTS fn_capnhat_ngansach();

-- Drop tables in dependency order
DROP TABLE IF EXISTS baocaotaichinh CASCADE;
DROP TABLE IF EXISTS muctieutaichinh CASCADE;
DROP TABLE IF EXISTS ngansach CASCADE;
DROP TABLE IF EXISTS giaodich CASCADE;
DROP TABLE IF EXISTS taichinhdaihan CASCADE;
DROP TABLE IF EXISTS thunhap CASCADE;
DROP TABLE IF EXISTS chitieu CASCADE;
DROP TABLE IF EXISTS danhmuc CASCADE;
DROP TABLE IF EXISTS vitien CASCADE;
DROP TABLE IF EXISTS nguoidung_sdt CASCADE;
DROP TABLE IF EXISTS nguoidung CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS seq_baocaotaichinh;
DROP SEQUENCE IF EXISTS seq_muctieutaichinh;
DROP SEQUENCE IF EXISTS seq_ngansach;
DROP SEQUENCE IF EXISTS seq_giaodich;
DROP SEQUENCE IF EXISTS seq_danhmuc;
DROP SEQUENCE IF EXISTS seq_vitien;
DROP SEQUENCE IF EXISTS seq_nguoidung;

-- 1) Sequences
CREATE SEQUENCE seq_nguoidung START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_vitien START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_danhmuc START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_giaodich START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_ngansach START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_muctieutaichinh START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_baocaotaichinh START WITH 1 INCREMENT BY 1;

-- 2) Tables
CREATE TABLE nguoidung (
    nguoidung_id varchar(10) PRIMARY KEY DEFAULT ('ND' || to_char(nextval('seq_nguoidung'), 'FM00')),
    ten_tk varchar(100) UNIQUE,
    email varchar(100) UNIQUE,
    mat_khau varchar(255) NOT NULL,
    ngay_tao date NOT NULL DEFAULT current_date,
    vai_tro varchar(20) CHECK (vai_tro IN ('admin', 'user')),
    auth_user_id uuid UNIQUE
);

CREATE TABLE nguoidung_sdt (
    nguoidung_id varchar(10),
    sdt varchar(15),
    PRIMARY KEY (nguoidung_id, sdt),
    FOREIGN KEY (nguoidung_id) REFERENCES nguoidung (nguoidung_id)
);

CREATE TABLE vitien (
    vi_id varchar(10) PRIMARY KEY DEFAULT ('Vi' || to_char(nextval('seq_vitien'), 'FM00')),
    ten_vi varchar(50) NOT NULL,
    loai_vi varchar(30) NOT NULL,
    so_du_hien_tai decimal(19,2) NOT NULL,
    ngay_tao date NOT NULL,
    id_nguoi_dung varchar(10) NOT NULL,
    FOREIGN KEY (id_nguoi_dung) REFERENCES nguoidung (nguoidung_id),
    CONSTRAINT uq_vitien_viid_nguoidung UNIQUE (vi_id, id_nguoi_dung)
);

CREATE TABLE danhmuc (
    danhmuc_id varchar(10) PRIMARY KEY DEFAULT ('DM' || to_char(nextval('seq_danhmuc'), 'FM00')),
    ten_danh_muc varchar(50) NOT NULL,
    loai_danh_muc varchar(30) NOT NULL,
    mo_ta varchar(255)
);

CREATE TABLE chitieu (
    chitieu_id varchar(10) PRIMARY KEY,
    FOREIGN KEY (chitieu_id) REFERENCES danhmuc (danhmuc_id)
);

CREATE TABLE thunhap (
    thunhap_id varchar(10) PRIMARY KEY,
    FOREIGN KEY (thunhap_id) REFERENCES danhmuc (danhmuc_id)
);

CREATE TABLE taichinhdaihan (
    taichinhdaihan_id varchar(10) PRIMARY KEY,
    FOREIGN KEY (taichinhdaihan_id) REFERENCES danhmuc (danhmuc_id)
);

CREATE TABLE giaodich (
    giaodich_id varchar(10) PRIMARY KEY DEFAULT ('GD' || to_char(nextval('seq_giaodich'), 'FM00')),
    ten_giao_dich varchar(100) NOT NULL,
    so_tien decimal(19,2) NOT NULL CHECK (so_tien > 0),
    ngay_giao_dich date NOT NULL,
    ghi_chu varchar(255),
    id_nguoi_dung varchar(10) NOT NULL,
    id_danh_muc varchar(10) NOT NULL,
    id_vi_tien varchar(10) NOT NULL,
    FOREIGN KEY (id_nguoi_dung) REFERENCES nguoidung (nguoidung_id),
    FOREIGN KEY (id_danh_muc) REFERENCES danhmuc (danhmuc_id),
    FOREIGN KEY (id_vi_tien, id_nguoi_dung) REFERENCES vitien (vi_id, id_nguoi_dung)
);

CREATE TABLE ngansach (
    ngansach_id varchar(10) PRIMARY KEY DEFAULT ('NS' || to_char(nextval('seq_ngansach'), 'FM00')),
    ten_ngan_sach varchar(100) NOT NULL,
    so_tien_gioi_han decimal(19,2) NOT NULL CHECK (so_tien_gioi_han > 0),
    ngay_bat_dau date NOT NULL DEFAULT current_date,
    ngay_ket_thuc date NOT NULL DEFAULT (current_date + interval '30 day'),
    id_nguoi_dung varchar(10) NOT NULL,
    id_danh_muc varchar(10) NOT NULL,
    FOREIGN KEY (id_nguoi_dung) REFERENCES nguoidung (nguoidung_id),
    FOREIGN KEY (id_danh_muc) REFERENCES danhmuc (danhmuc_id),
    CONSTRAINT uq_ngansach_nguoidung_danhmuc UNIQUE (id_nguoi_dung, id_danh_muc)
);

CREATE TABLE muctieutaichinh (
    muctieu_id varchar(10) PRIMARY KEY DEFAULT ('MT' || to_char(nextval('seq_muctieutaichinh'), 'FM00')),
    ten_muc_tieu varchar(100) NOT NULL,
    so_tien_can_dat decimal(19,2) NOT NULL CHECK (so_tien_can_dat > 0),
    ngay_bat_dau date NOT NULL DEFAULT current_date,
    thoi_han_hoan_thanh date,
    trang_thai varchar(50) DEFAULT 'Chua hoan thanh' CHECK (trang_thai IN ('Chua hoan thanh', 'Da hoan thanh')),
    id_nguoi_dung varchar(10) NOT NULL,
    FOREIGN KEY (id_nguoi_dung) REFERENCES nguoidung (nguoidung_id)
);

CREATE TABLE baocaotaichinh (
    baocao_id varchar(10) PRIMARY KEY DEFAULT ('BC' || to_char(nextval('seq_baocaotaichinh'), 'FM00')),
    ten_bao_cao varchar(100) NOT NULL,
    tong_thu decimal(19,2) NOT NULL,
    tong_chi decimal(19,2) NOT NULL,
    thoi_gian date NOT NULL,
    id_nguoi_dung varchar(10) NOT NULL,
    FOREIGN KEY (id_nguoi_dung) REFERENCES nguoidung (nguoidung_id)
);

-- 3) Indexes
CREATE INDEX ix_vitien_idnguoidung ON vitien (id_nguoi_dung);
CREATE INDEX ix_giaodich_nguoidung_ngay ON giaodich (id_nguoi_dung, ngay_giao_dich);
CREATE INDEX ix_giaodich_danhmuc ON giaodich (id_danh_muc);
CREATE INDEX ix_giaodich_vitien ON giaodich (id_vi_tien);
CREATE INDEX ix_ngansach_nguoidung ON ngansach (id_nguoi_dung);
CREATE INDEX ix_muctieutaichinh_nguoidung ON muctieutaichinh (id_nguoi_dung);
CREATE INDEX ix_baocaotaichinh_nguoidung_thoigian ON baocaotaichinh (id_nguoi_dung, thoi_gian);

-- 4) Seed data (same logical content as SQL Server script)
INSERT INTO nguoidung (ten_tk, email, mat_khau, vai_tro) VALUES
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

INSERT INTO nguoidung_sdt (nguoidung_id, sdt) VALUES
('ND03', '0901234567'), ('ND03', '0912345678'), ('ND06', '0923456789'),
('ND06', '0934567890'), ('ND09', '0945678901'), ('ND09', '0956789012'),
('ND12', '0967890123'), ('ND12', '0978901234'), ('ND01', '0912345678'),
('ND02', '0987654321'), ('ND04', '0934567890'), ('ND05', '0923456789'),
('ND07', '0981234567'), ('ND08', '0912345678'), ('ND10', '0934567890'),
('ND11', '0945678901'), ('ND13', '0978901234'), ('ND14', '0989012345'),
('ND15', '0990123456');

INSERT INTO vitien (ten_vi, loai_vi, so_du_hien_tai, ngay_tao, id_nguoi_dung) VALUES
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

INSERT INTO danhmuc (ten_danh_muc, loai_danh_muc, mo_ta) VALUES
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

INSERT INTO chitieu (chitieu_id)
SELECT danhmuc_id FROM danhmuc
WHERE (loai_danh_muc = 'Sinh hoat' AND ten_danh_muc IN ('Cho, sieu thi', 'An uong', 'Di chuyen'))
   OR (loai_danh_muc = 'Phat sinh' AND ten_danh_muc IN ('Mua sam', 'Giai tri', 'Lam dep', 'Suc khoe', 'Tu thien'))
   OR (loai_danh_muc = 'Co dinh' AND ten_danh_muc IN ('Hoa don', 'Nha cua', 'Nguoi than'));

INSERT INTO thunhap (thunhap_id)
SELECT danhmuc_id FROM danhmuc
WHERE (loai_danh_muc = 'Cong viec' AND ten_danh_muc IN ('Luong', 'Thuong'))
   OR (loai_danh_muc = 'Chinh phu' AND ten_danh_muc IN ('Tro cap'))
   OR (loai_danh_muc = 'Ca nhan' AND ten_danh_muc IN ('Kinh doanh'));

INSERT INTO taichinhdaihan (taichinhdaihan_id)
SELECT danhmuc_id FROM danhmuc
WHERE (loai_danh_muc = 'Dau tu' AND ten_danh_muc IN ('Hoc tap', 'Nha dat', 'Vang'))
   OR (loai_danh_muc = 'Tiet kiem' AND ten_danh_muc = 'Ngan hang');

INSERT INTO giaodich (ten_giao_dich, so_tien, ngay_giao_dich, ghi_chu, id_nguoi_dung, id_danh_muc, id_vi_tien) VALUES
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

INSERT INTO ngansach (ten_ngan_sach, so_tien_gioi_han, id_nguoi_dung, id_danh_muc) VALUES
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
('Cham soc thu cung', 1200000, 'ND04', 'DM06'),
('Kinh doanh online', 5500000, 'ND05', 'DM13');

INSERT INTO muctieutaichinh (ten_muc_tieu, so_tien_can_dat, thoi_han_hoan_thanh, id_nguoi_dung) VALUES
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

WITH baocao AS (
    SELECT
        g.id_nguoi_dung,
        SUM(CASE WHEN tn.thunhap_id IS NOT NULL THEN g.so_tien ELSE 0 END) AS tong_thu,
        SUM(CASE WHEN ct.chitieu_id IS NOT NULL THEN g.so_tien ELSE 0 END) +
        SUM(CASE WHEN tcdh.taichinhdaihan_id IS NOT NULL THEN g.so_tien ELSE 0 END) AS tong_chi,
        current_date AS thoi_gian
    FROM giaodich g
    LEFT JOIN thunhap tn ON g.id_danh_muc = tn.thunhap_id
    LEFT JOIN chitieu ct ON g.id_danh_muc = ct.chitieu_id
    LEFT JOIN taichinhdaihan tcdh ON g.id_danh_muc = tcdh.taichinhdaihan_id
    GROUP BY g.id_nguoi_dung
)
INSERT INTO baocaotaichinh (ten_bao_cao, tong_thu, tong_chi, thoi_gian, id_nguoi_dung)
SELECT
    'Bao cao thang ' || to_char(thoi_gian, 'MM-YYYY'),
    tong_thu, tong_chi, thoi_gian, id_nguoi_dung
FROM baocao;

-- 5) Trigger logic (wallet + budget updates)
CREATE OR REPLACE FUNCTION fn_capnhat_sodu_vi()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM chitieu WHERE chitieu_id = NEW.id_danh_muc)
       OR EXISTS (SELECT 1 FROM taichinhdaihan WHERE taichinhdaihan_id = NEW.id_danh_muc) THEN
        UPDATE vitien
        SET so_du_hien_tai = so_du_hien_tai - NEW.so_tien
        WHERE vi_id = NEW.id_vi_tien;
    ELSIF EXISTS (SELECT 1 FROM thunhap WHERE thunhap_id = NEW.id_danh_muc) THEN
        UPDATE vitien
        SET so_du_hien_tai = so_du_hien_tai + NEW.so_tien
        WHERE vi_id = NEW.id_vi_tien;
    END IF;

    IF EXISTS (
        SELECT 1 FROM vitien
        WHERE vi_id = NEW.id_vi_tien AND so_du_hien_tai < 0
    ) THEN
        RAISE EXCEPTION 'So du vi khong du de thuc hien giao dich.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_capnhatsoduvi
AFTER INSERT ON giaodich
FOR EACH ROW
EXECUTE FUNCTION fn_capnhat_sodu_vi();

CREATE OR REPLACE FUNCTION fn_capnhat_ngansach()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM thunhap WHERE thunhap_id = NEW.id_danh_muc) THEN
        UPDATE ngansach
        SET so_tien_gioi_han = so_tien_gioi_han - NEW.so_tien
        WHERE id_nguoi_dung = NEW.id_nguoi_dung
          AND id_danh_muc = NEW.id_danh_muc;

        IF EXISTS (
            SELECT 1
            FROM ngansach
            WHERE id_nguoi_dung = NEW.id_nguoi_dung
              AND id_danh_muc = NEW.id_danh_muc
              AND so_tien_gioi_han < 0
        ) THEN
            RAISE EXCEPTION 'Ngan sach da vuot qua gioi han.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_capnhatngansach
AFTER INSERT ON giaodich
FOR EACH ROW
EXECUTE FUNCTION fn_capnhat_ngansach();

-- 6) Views for logged-in Supabase user
-- To use these views, map each row in nguoidung.auth_user_id with auth.users.id.
CREATE VIEW v_nguoidung_user AS
SELECT nguoidung_id, ten_tk, email, ngay_tao, vai_tro
FROM nguoidung
WHERE auth_user_id = auth.uid();

CREATE VIEW v_nguoidung_sdt_user AS
SELECT ns.sdt
FROM nguoidung_sdt ns
JOIN nguoidung n ON n.nguoidung_id = ns.nguoidung_id
WHERE n.auth_user_id = auth.uid();

CREATE VIEW v_vitien_user AS
SELECT v.vi_id, v.ten_vi, v.loai_vi, v.so_du_hien_tai, v.ngay_tao
FROM vitien v
JOIN nguoidung n ON n.nguoidung_id = v.id_nguoi_dung
WHERE n.auth_user_id = auth.uid();

CREATE VIEW v_giaodich_user AS
SELECT g.giaodich_id, g.ten_giao_dich, g.so_tien, g.ngay_giao_dich, g.ghi_chu
FROM giaodich g
JOIN nguoidung n ON n.nguoidung_id = g.id_nguoi_dung
WHERE n.auth_user_id = auth.uid();

CREATE VIEW v_ngansach_user AS
SELECT ns.ngansach_id, ns.ten_ngan_sach, ns.so_tien_gioi_han, ns.ngay_bat_dau, ns.ngay_ket_thuc
FROM ngansach ns
JOIN nguoidung n ON n.nguoidung_id = ns.id_nguoi_dung
WHERE n.auth_user_id = auth.uid();

CREATE VIEW v_muctieutaichinh_user AS
SELECT mt.muctieu_id, mt.ten_muc_tieu, mt.so_tien_can_dat, mt.ngay_bat_dau, mt.thoi_han_hoan_thanh, mt.trang_thai
FROM muctieutaichinh mt
JOIN nguoidung n ON n.nguoidung_id = mt.id_nguoi_dung
WHERE n.auth_user_id = auth.uid();

CREATE VIEW v_baocaotaichinh_user AS
SELECT b.baocao_id, b.ten_bao_cao, b.thoi_gian, b.tong_chi, b.tong_thu
FROM baocaotaichinh b
JOIN nguoidung n ON n.nguoidung_id = b.id_nguoi_dung
WHERE n.auth_user_id = auth.uid();

-- 7) Bridge Supabase Auth <-> NguoiDung
CREATE OR REPLACE FUNCTION fn_sync_auth_user_to_nguoidung()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username text;
BEGIN
    v_username := lower(split_part(NEW.email, '@', 1));

    INSERT INTO nguoidung (ten_tk, email, mat_khau, vai_tro, auth_user_id)
    VALUES (
        left(v_username || '_' || substring(replace(NEW.id::text, '-', '') from 1 for 6), 100),
        NEW.email,
        '[supabase-auth]',
        'user',
        NEW.id
    )
    ON CONFLICT (auth_user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_auth_user_to_nguoidung ON auth.users;
CREATE TRIGGER trg_sync_auth_user_to_nguoidung
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION fn_sync_auth_user_to_nguoidung();

-- Backfill current auth users that do not have mapping yet
INSERT INTO nguoidung (ten_tk, email, mat_khau, vai_tro, auth_user_id)
SELECT
    left(lower(split_part(u.email, '@', 1)) || '_' || substring(replace(u.id::text, '-', '') from 1 for 6), 100),
    u.email,
    '[supabase-auth]',
    'user',
    u.id
FROM auth.users u
LEFT JOIN nguoidung n ON n.auth_user_id = u.id
WHERE n.auth_user_id IS NULL;

commit;

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { query } = require("./db");
const { signToken, requireAuth, requireAdmin } = require("./auth");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, message: "API dang chay" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Khong ket noi duoc DB", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Thieu username/password" });
  }

  try {
    const result = await query(
      `
      SELECT nguoidung_id AS "NguoiDung_ID", ten_tk AS "Ten_TK", email AS "Email", vai_tro AS "Vai_tro"
      FROM nguoidung
      WHERE ten_tk = $1 AND mat_khau = $2
      LIMIT 1
      `,
      [username, password]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: "Sai tai khoan hoac mat khau" });
    }

    const payload = {
      userId: user.NguoiDung_ID,
      username: user.Ten_TK,
      role: user.Vai_tro,
      email: user.Email
    };

    const token = signToken(payload);
    return res.json({ token, user: payload });
  } catch (err) {
    return res.status(500).json({ message: "Loi dang nhap", error: err.message });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const [users, wallets, txs] = await Promise.all([
        query("SELECT COUNT(*)::int AS total FROM nguoidung"),
        query("SELECT COUNT(*)::int AS total FROM vitien"),
        query("SELECT COUNT(*)::int AS total FROM giaodich")
      ]);

      return res.json({
        role: "admin",
        metrics: {
          totalUsers: users.rows[0].total,
          totalWallets: wallets.rows[0].total,
          totalTransactions: txs.rows[0].total
        }
      });
    }

    const summary = await query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN tn.thunhap_id IS NOT NULL THEN gd.so_tien ELSE 0 END), 0) AS "TongThu",
        COALESCE(SUM(CASE WHEN ct.chitieu_id IS NOT NULL OR tcdh.taichinhdaihan_id IS NOT NULL THEN gd.so_tien ELSE 0 END), 0) AS "TongChi"
      FROM giaodich gd
      LEFT JOIN thunhap tn ON gd.id_danh_muc = tn.thunhap_id
      LEFT JOIN chitieu ct ON gd.id_danh_muc = ct.chitieu_id
      LEFT JOIN taichinhdaihan tcdh ON gd.id_danh_muc = tcdh.taichinhdaihan_id
      WHERE gd.id_nguoi_dung = $1
      `,
      [req.user.userId]
    );

    return res.json({
      role: "user",
      metrics: {
        totalIncome: summary.rows[0].TongThu,
        totalExpense: summary.rows[0].TongChi,
        balance: Number(summary.rows[0].TongThu) - Number(summary.rows[0].TongChi)
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Loi tai dashboard", error: err.message });
  }
});

app.get("/api/meta", requireAuth, async (req, res) => {
  try {
    const walletsPromise = req.user.role === "admin"
      ? query(
          `SELECT vi_id AS "Vi_ID", ten_vi AS "Ten_vi", id_nguoi_dung AS "ID_nguoi_dung"
           FROM vitien
           ORDER BY vi_id`
        )
      : query(
          `SELECT vi_id AS "Vi_ID", ten_vi AS "Ten_vi", id_nguoi_dung AS "ID_nguoi_dung"
           FROM vitien
           WHERE id_nguoi_dung = $1
           ORDER BY vi_id`,
          [req.user.userId]
        );

    const [wallets, categories] = await Promise.all([
      walletsPromise,
      query(
        `SELECT danhmuc_id AS "DanhMuc_ID", ten_danh_muc AS "Ten_danh_muc"
         FROM danhmuc
         ORDER BY danhmuc_id`
      )
    ]);

    return res.json({ wallets: wallets.rows, categories: categories.rows });
  } catch (err) {
    return res.status(500).json({ message: "Loi tai danh sach du lieu", error: err.message });
  }
});

app.get("/api/transactions", requireAuth, async (req, res) => {
  try {
    const result = req.user.role === "admin"
      ? await query(
          `
          SELECT
            gd.giaodich_id AS "GiaoDich_ID",
            gd.ten_giao_dich AS "Ten_giao_dich",
            gd.so_tien AS "So_tien",
            gd.ngay_giao_dich AS "Ngay_giao_dich",
            gd.ghi_chu AS "Ghi_chu",
            gd.id_nguoi_dung AS "ID_nguoi_dung",
            dm.ten_danh_muc AS "Ten_danh_muc",
            vt.ten_vi AS "Ten_vi"
          FROM giaodich gd
          JOIN danhmuc dm ON dm.danhmuc_id = gd.id_danh_muc
          JOIN vitien vt ON vt.vi_id = gd.id_vi_tien AND vt.id_nguoi_dung = gd.id_nguoi_dung
          ORDER BY gd.ngay_giao_dich DESC, gd.giaodich_id DESC
          LIMIT 100
          `
        )
      : await query(
          `
          SELECT
            gd.giaodich_id AS "GiaoDich_ID",
            gd.ten_giao_dich AS "Ten_giao_dich",
            gd.so_tien AS "So_tien",
            gd.ngay_giao_dich AS "Ngay_giao_dich",
            gd.ghi_chu AS "Ghi_chu",
            gd.id_nguoi_dung AS "ID_nguoi_dung",
            dm.ten_danh_muc AS "Ten_danh_muc",
            vt.ten_vi AS "Ten_vi"
          FROM giaodich gd
          JOIN danhmuc dm ON dm.danhmuc_id = gd.id_danh_muc
          JOIN vitien vt ON vt.vi_id = gd.id_vi_tien AND vt.id_nguoi_dung = gd.id_nguoi_dung
          WHERE gd.id_nguoi_dung = $1
          ORDER BY gd.ngay_giao_dich DESC, gd.giaodich_id DESC
          LIMIT 100
          `,
          [req.user.userId]
        );

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: "Loi lay giao dich", error: err.message });
  }
});

app.post("/api/transactions", requireAuth, async (req, res) => {
  const {
    tenGiaoDich,
    soTien,
    ngayGiaoDich,
    ghiChu,
    idDanhMuc,
    idVi,
    idNguoiDung
  } = req.body || {};

  if (!tenGiaoDich || !soTien || !ngayGiaoDich || !idDanhMuc || !idVi) {
    return res.status(400).json({ message: "Thieu du lieu giao dich" });
  }

  const ownerId = req.user.role === "admin" && idNguoiDung ? idNguoiDung : req.user.userId;

  try {
    if (req.user.role !== "admin") {
      const walletCheck = await query(
        "SELECT 1 AS ok FROM vitien WHERE vi_id = $1 AND id_nguoi_dung = $2",
        [idVi, req.user.userId]
      );

      if (walletCheck.rows.length === 0) {
        return res.status(403).json({ message: "Vi khong thuoc tai khoan cua ban" });
      }
    }

    await query(
      `
      INSERT INTO giaodich (ten_giao_dich, so_tien, ngay_giao_dich, ghi_chu, id_nguoi_dung, id_danh_muc, id_vi_tien)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [tenGiaoDich, Number(soTien), ngayGiaoDich, ghiChu || null, ownerId, idDanhMuc, idVi]
    );

    return res.status(201).json({ message: "Them giao dich thanh cong" });
  } catch (err) {
    return res.status(500).json({ message: "Khong the tao giao dich", error: err.message });
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      `
      SELECT
        nguoidung_id AS "NguoiDung_ID",
        ten_tk AS "Ten_TK",
        email AS "Email",
        vai_tro AS "Vai_tro",
        ngay_tao AS "Ngay_tao"
      FROM nguoidung
      ORDER BY nguoidung_id
      `
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: "Loi lay danh sach user", error: err.message });
  }
});

app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const { tenTaiKhoan, email, matKhau, vaiTro } = req.body || {};

  if (!tenTaiKhoan || !email || !matKhau || !vaiTro) {
    return res.status(400).json({ message: "Thieu du lieu tao user" });
  }

  if (!["admin", "user"].includes(vaiTro)) {
    return res.status(400).json({ message: "Vai tro khong hop le" });
  }

  try {
    await query(
      "INSERT INTO nguoidung (ten_tk, email, mat_khau, vai_tro) VALUES ($1, $2, $3, $4)",
      [tenTaiKhoan, email, matKhau, vaiTro]
    );

    return res.status(201).json({ message: "Tao user thanh cong" });
  } catch (err) {
    return res.status(500).json({ message: "Khong the tao user", error: err.message });
  }
});

app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { email, matKhau, vaiTro } = req.body || {};

  if (!email || !matKhau || !vaiTro) {
    return res.status(400).json({ message: "Can email, matKhau, vaiTro" });
  }

  try {
    const result = await query(
      "UPDATE nguoidung SET email = $1, mat_khau = $2, vai_tro = $3 WHERE nguoidung_id = $4",
      [email, matKhau, vaiTro, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Khong tim thay user" });
    }

    return res.json({ message: "Cap nhat user thanh cong" });
  } catch (err) {
    return res.status(500).json({ message: "Khong the cap nhat user", error: err.message });
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM nguoidung WHERE nguoidung_id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Khong tim thay user" });
    }

    return res.json({ message: "Xoa user thanh cong" });
  } catch (err) {
    return res.status(500).json({ message: "Khong the xoa user", error: err.message });
  }
});

app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

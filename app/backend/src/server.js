require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { getPool, sql } = require("./db");
const { signToken, requireAuth, requireAdmin } = require("./auth");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await getPool();
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
    const pool = await getPool();
    const result = await pool
      .request()
      .input("username", sql.VarChar(100), username)
      .input("password", sql.VarChar(255), password)
      .query(`
        SELECT TOP 1 NguoiDung_ID, Ten_TK, Email, Vai_tro
        FROM NguoiDung
        WHERE Ten_TK = @username AND Mat_khau = @password
      `);

    const user = result.recordset[0];
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
    const pool = await getPool();

    if (req.user.role === "admin") {
      const [users, wallets, txs] = await Promise.all([
        pool.request().query("SELECT COUNT(*) AS total FROM NguoiDung"),
        pool.request().query("SELECT COUNT(*) AS total FROM ViTien"),
        pool.request().query("SELECT COUNT(*) AS total FROM GiaoDich")
      ]);

      return res.json({
        role: "admin",
        metrics: {
          totalUsers: users.recordset[0].total,
          totalWallets: wallets.recordset[0].total,
          totalTransactions: txs.recordset[0].total
        }
      });
    }

    const summary = await pool
      .request()
      .input("userId", sql.VarChar(10), req.user.userId)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN TN.ThuNhap_ID IS NOT NULL THEN GD.So_tien ELSE 0 END), 0) AS TongThu,
          ISNULL(SUM(CASE WHEN CT.ChiTieu_ID IS NOT NULL OR TCDH.TaiChinhDaiHan_ID IS NOT NULL THEN GD.So_tien ELSE 0 END), 0) AS TongChi
        FROM GiaoDich GD
        LEFT JOIN ThuNhap TN ON GD.ID_danh_muc = TN.ThuNhap_ID
        LEFT JOIN ChiTieu CT ON GD.ID_danh_muc = CT.ChiTieu_ID
        LEFT JOIN TaiChinhDaiHan TCDH ON GD.ID_danh_muc = TCDH.TaiChinhDaiHan_ID
        WHERE GD.ID_nguoi_dung = @userId
      `);

    return res.json({
      role: "user",
      metrics: {
        totalIncome: summary.recordset[0].TongThu,
        totalExpense: summary.recordset[0].TongChi,
        balance: summary.recordset[0].TongThu - summary.recordset[0].TongChi
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Loi tai dashboard", error: err.message });
  }
});

app.get("/api/meta", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const walletsQuery = req.user.role === "admin"
      ? pool.request().query("SELECT Vi_ID, Ten_vi, ID_nguoi_dung FROM ViTien ORDER BY Vi_ID")
      : pool.request()
          .input("userId", sql.VarChar(10), req.user.userId)
          .query("SELECT Vi_ID, Ten_vi, ID_nguoi_dung FROM ViTien WHERE ID_nguoi_dung = @userId ORDER BY Vi_ID");

    const [wallets, categories] = await Promise.all([
      walletsQuery,
      pool.request().query("SELECT DanhMuc_ID, Ten_danh_muc FROM DanhMuc ORDER BY DanhMuc_ID")
    ]);

    return res.json({ wallets: wallets.recordset, categories: categories.recordset });
  } catch (err) {
    return res.status(500).json({ message: "Loi tai danh sach du lieu", error: err.message });
  }
});

app.get("/api/transactions", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT TOP 100
        GD.GiaoDich_ID,
        GD.Ten_giao_dich,
        GD.So_tien,
        GD.Ngay_giao_dich,
        GD.Ghi_chu,
        GD.ID_nguoi_dung,
        DM.Ten_danh_muc,
        VT.Ten_vi
      FROM GiaoDich GD
      JOIN DanhMuc DM ON GD.ID_danh_muc = DM.DanhMuc_ID
      JOIN ViTien VT ON GD.ID_vi_tien = VT.Vi_ID
    `;

    if (req.user.role !== "admin") {
      request.input("userId", sql.VarChar(10), req.user.userId);
      query += " WHERE GD.ID_nguoi_dung = @userId";
    }

    query += " ORDER BY GD.Ngay_giao_dich DESC, GD.GiaoDich_ID DESC";

    const result = await request.query(query);
    return res.json(result.recordset);
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
    const pool = await getPool();

    if (req.user.role !== "admin") {
      const walletCheck = await pool
        .request()
        .input("idVi", sql.VarChar(10), idVi)
        .input("userId", sql.VarChar(10), req.user.userId)
        .query("SELECT 1 AS ok FROM ViTien WHERE Vi_ID = @idVi AND ID_nguoi_dung = @userId");

      if (walletCheck.recordset.length === 0) {
        return res.status(403).json({ message: "Vi khong thuoc tai khoan cua ban" });
      }
    }

    await pool
      .request()
      .input("tenGiaoDich", sql.VarChar(100), tenGiaoDich)
      .input("soTien", sql.Decimal(19, 2), Number(soTien))
      .input("ngayGiaoDich", sql.Date, ngayGiaoDich)
      .input("ghiChu", sql.VarChar(255), ghiChu || null)
      .input("idNguoiDung", sql.VarChar(10), ownerId)
      .input("idDanhMuc", sql.VarChar(10), idDanhMuc)
      .input("idVi", sql.VarChar(10), idVi)
      .query(`
        INSERT INTO GiaoDich (Ten_giao_dich, So_tien, Ngay_giao_dich, Ghi_chu, ID_nguoi_dung, ID_danh_muc, ID_vi_tien)
        VALUES (@tenGiaoDich, @soTien, @ngayGiaoDich, @ghiChu, @idNguoiDung, @idDanhMuc, @idVi)
      `);

    return res.status(201).json({ message: "Them giao dich thanh cong" });
  } catch (err) {
    return res.status(500).json({ message: "Khong the tao giao dich", error: err.message });
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query("SELECT NguoiDung_ID, Ten_TK, Email, Vai_tro, Ngay_tao FROM NguoiDung ORDER BY NguoiDung_ID");
    return res.json(result.recordset);
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
    const pool = await getPool();
    await pool
      .request()
      .input("tenTaiKhoan", sql.VarChar(100), tenTaiKhoan)
      .input("email", sql.VarChar(100), email)
      .input("matKhau", sql.VarChar(255), matKhau)
      .input("vaiTro", sql.VarChar(20), vaiTro)
      .query(`
        INSERT INTO NguoiDung (Ten_TK, Email, Mat_khau, Vai_tro)
        VALUES (@tenTaiKhoan, @email, @matKhau, @vaiTro)
      `);

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
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.VarChar(10), id)
      .input("email", sql.VarChar(100), email)
      .input("matKhau", sql.VarChar(255), matKhau)
      .input("vaiTro", sql.VarChar(20), vaiTro)
      .query(`
        UPDATE NguoiDung
        SET Email = @email, Mat_khau = @matKhau, Vai_tro = @vaiTro
        WHERE NguoiDung_ID = @id
      `);

    if (result.rowsAffected[0] === 0) {
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
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.VarChar(10), id)
      .query("DELETE FROM NguoiDung WHERE NguoiDung_ID = @id");

    if (result.rowsAffected[0] === 0) {
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

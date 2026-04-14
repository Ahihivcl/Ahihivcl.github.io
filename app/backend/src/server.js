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
      SELECT user_code AS "NguoiDung_ID", username AS "Ten_TK", email AS "Email", role AS "Vai_tro"
      FROM app_users
      WHERE username = $1 AND password = $2
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
        query("SELECT COUNT(*)::int AS total FROM app_users"),
        query("SELECT COUNT(*)::int AS total FROM wallets"),
        query("SELECT COUNT(*)::int AS total FROM transactions")
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
        COALESCE(SUM(CASE WHEN c.kind = 'income' THEN t.amount ELSE 0 END), 0) AS "TongThu",
        COALESCE(SUM(CASE WHEN c.kind <> 'income' THEN t.amount ELSE 0 END), 0) AS "TongChi"
      FROM transactions t
      JOIN categories c ON c.category_code = t.category_code
      WHERE t.user_code = $1
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
          `SELECT wallet_code AS "Vi_ID", wallet_name AS "Ten_vi", user_code AS "ID_nguoi_dung"
           FROM wallets
           ORDER BY wallet_code`
        )
      : query(
          `SELECT wallet_code AS "Vi_ID", wallet_name AS "Ten_vi", user_code AS "ID_nguoi_dung"
           FROM wallets
           WHERE user_code = $1
           ORDER BY wallet_code`,
          [req.user.userId]
        );

    const [wallets, categories] = await Promise.all([
      walletsPromise,
      query(
        `SELECT category_code AS "DanhMuc_ID", category_name AS "Ten_danh_muc"
         FROM categories
         ORDER BY category_code`
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
            t.transaction_code AS "GiaoDich_ID",
            t.title AS "Ten_giao_dich",
            t.amount AS "So_tien",
            t.transaction_date AS "Ngay_giao_dich",
            t.note AS "Ghi_chu",
            t.user_code AS "ID_nguoi_dung",
            c.category_name AS "Ten_danh_muc",
            w.wallet_name AS "Ten_vi"
          FROM transactions t
          JOIN categories c ON c.category_code = t.category_code
          JOIN wallets w ON w.wallet_code = t.wallet_code
          ORDER BY t.transaction_date DESC, t.id DESC
          LIMIT 100
          `
        )
      : await query(
          `
          SELECT
            t.transaction_code AS "GiaoDich_ID",
            t.title AS "Ten_giao_dich",
            t.amount AS "So_tien",
            t.transaction_date AS "Ngay_giao_dich",
            t.note AS "Ghi_chu",
            t.user_code AS "ID_nguoi_dung",
            c.category_name AS "Ten_danh_muc",
            w.wallet_name AS "Ten_vi"
          FROM transactions t
          JOIN categories c ON c.category_code = t.category_code
          JOIN wallets w ON w.wallet_code = t.wallet_code
          WHERE t.user_code = $1
          ORDER BY t.transaction_date DESC, t.id DESC
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
        "SELECT 1 AS ok FROM wallets WHERE wallet_code = $1 AND user_code = $2",
        [idVi, req.user.userId]
      );

      if (walletCheck.rows.length === 0) {
        return res.status(403).json({ message: "Vi khong thuoc tai khoan cua ban" });
      }
    }

    await query(
      `
      INSERT INTO transactions (title, amount, transaction_date, note, user_code, category_code, wallet_code)
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
        user_code AS "NguoiDung_ID",
        username AS "Ten_TK",
        email AS "Email",
        role AS "Vai_tro",
        created_at::date AS "Ngay_tao"
      FROM app_users
      ORDER BY user_code
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
      "INSERT INTO app_users (username, email, password, role) VALUES ($1, $2, $3, $4)",
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
      "UPDATE app_users SET email = $1, password = $2, role = $3 WHERE user_code = $4",
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
    const result = await query("DELETE FROM app_users WHERE user_code = $1", [id]);

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

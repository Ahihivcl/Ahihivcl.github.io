const state = {
  supabase: null,
  session: null,
  profile: null,
  nguoiDungId: null,
  categories: [],
  wallets: [],
  transactions: []
};

const SUPABASE_URL = "https://dhfnyufxzlytrkadinpn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NXcJo9m1MMnlV6iO7KDHFA_E4YVGhD5";

const authCard = document.getElementById("authCard");
const appPanel = document.getElementById("appPanel");

const loginForm = document.getElementById("loginForm");
const txForm = document.getElementById("txForm");
const walletForm = document.getElementById("walletForm");
const categoryForm = document.getElementById("categoryForm");

const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authMessage = document.getElementById("authMessage");
const appMessage = document.getElementById("appMessage");

const welcome = document.getElementById("welcome");
const roleBadge = document.getElementById("roleBadge");
const txTable = document.getElementById("txTable");

const txCategory = document.getElementById("txCategory");
const txWallet = document.getElementById("txWallet");

function setMessage(target, text, isError = true) {
  target.textContent = text || "";
  target.style.color = isError ? "#b64635" : "#0b7a3d";
}

function mapAuthError(error, action) {
  const message = (error && error.message ? error.message : "").toLowerCase();
  const status = error && (error.status || error.code);

  if (status === 429 || message.includes("for security purposes")) {
    return "Ban thao tac qua nhanh (rate limit). Doi 1-5 phut roi thu lai.";
  }

  if (message.includes("email not confirmed")) {
    return "Email chua xac thuc. Vao hop thu va bam link xac nhan truoc khi dang nhap.";
  }

  if (message.includes("invalid login credentials")) {
    return "Sai email hoac mat khau. Luu y: dang nhap bang EMAIL, khong phai username cu.";
  }

  if (message.includes("email address") && message.includes("invalid")) {
    return "Email khong hop le. Hay dung dia chi email that (vd: tenban@gmail.com).";
  }

  if (action === "signup") {
    return error?.message || "Khong tao duoc tai khoan.";
  }

  return error?.message || "Dang nhap that bai.";
}

function setView(mode) {
  authCard.classList.toggle("hidden", mode !== "auth");
  appPanel.classList.toggle("hidden", mode !== "app");
}

function initClient() {
  state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

async function ensureNguoiDungRecord(userId) {
  const existing = await state.supabase
    .from("nguoidung")
    .select("nguoidung_id, ten_tk, email, vai_tro")
    .eq("auth_user_id", userId)
    .single();

  if (!existing.error && existing.data) {
    state.profile = existing.data;
    state.nguoiDungId = existing.data.nguoidung_id;
    return;
  }

  if (existing.error && existing.error.code !== "PGRST116") {
    throw existing.error;
  }

  const email = state.session.user.email || "";
  const username = (email.split("@")[0] || "user").toLowerCase();

  const created = await state.supabase
    .from("nguoidung")
    .insert({
      ten_tk: username,
      email,
      mat_khau: "[supabase-auth]",
      vai_tro: "user",
      auth_user_id: userId
    })
    .select("nguoidung_id, ten_tk, email, vai_tro")
    .single();

  if (created.error) {
    throw created.error;
  }

  state.profile = created.data;
  state.nguoiDungId = created.data.nguoidung_id;
}

function fillOptions() {
  txCategory.innerHTML = state.categories
    .map(c => `<option value="${c.danhmuc_id}">${c.ten_danh_muc} (${c.loai_danh_muc})</option>`)
    .join("");

  txWallet.innerHTML = state.wallets
    .map(w => `<option value="${w.vi_id}">${w.ten_vi} (${w.loai_vi})</option>`)
    .join("");
}

function renderTransactions() {
  const categoryMap = new Map(state.categories.map(c => [c.danhmuc_id, c.ten_danh_muc]));
  const walletMap = new Map(state.wallets.map(w => [w.vi_id, w.ten_vi]));

  txTable.innerHTML = state.transactions
    .map(tx => `
      <tr>
        <td>${tx.giaodich_id}</td>
        <td>${tx.ten_giao_dich}</td>
        <td>${Number(tx.so_tien).toLocaleString("vi-VN")}</td>
        <td>${String(tx.ngay_giao_dich).slice(0, 10)}</td>
        <td>${categoryMap.get(tx.id_danh_muc) || "-"}</td>
        <td>${walletMap.get(tx.id_vi_tien) || "-"}</td>
      </tr>
    `)
    .join("");
}

async function refreshData() {
  const userId = state.nguoiDungId;

  const [walletRes, categoryRes, txRes] = await Promise.all([
    state.supabase
      .from("vitien")
      .select("vi_id,ten_vi,loai_vi")
      .eq("id_nguoi_dung", userId)
      .order("vi_id", { ascending: true }),
    state.supabase
      .from("danhmuc")
      .select("danhmuc_id,ten_danh_muc,loai_danh_muc")
      .order("danhmuc_id", { ascending: true }),
    state.supabase
      .from("giaodich")
      .select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,id_danh_muc,id_vi_tien")
      .eq("id_nguoi_dung", userId)
      .order("ngay_giao_dich", { ascending: false })
      .limit(100)
  ]);

  if (walletRes.error) {
    throw walletRes.error;
  }
  if (categoryRes.error) {
    throw categoryRes.error;
  }
  if (txRes.error) {
    throw txRes.error;
  }

  state.wallets = walletRes.data || [];
  state.categories = categoryRes.data || [];
  state.transactions = txRes.data || [];

  fillOptions();
  renderTransactions();
}

async function bootstrapSession() {
  const { data } = await state.supabase.auth.getSession();
  if (!data.session) {
    setView("auth");
    return;
  }

  state.session = data.session;
  await ensureNguoiDungRecord(state.session.user.id);

  welcome.textContent = `Xin chao, ${state.profile.ten_tk || state.session.user.email}`;
  roleBadge.textContent = `Role: ${state.profile.vai_tro || "user"}`;

  setView("app");
  await refreshData();
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  setMessage(authMessage, "");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage(authMessage, mapAuthError(error, "login"), true);
    return;
  }

  state.session = data.session;
  await ensureNguoiDungRecord(state.session.user.id);

  welcome.textContent = `Xin chao, ${state.profile.ten_tk || state.session.user.email}`;
  roleBadge.textContent = `Role: ${state.profile.vai_tro || "user"}`;

  setView("app");
  await refreshData();
});

signupBtn.addEventListener("click", async () => {
  setMessage(authMessage, "");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setMessage(authMessage, "Nhap email va mat khau de tao tai khoan", true);
    return;
  }

  const { error } = await state.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    setMessage(authMessage, mapAuthError(error, "signup"), true);
    return;
  }

  setMessage(authMessage, "Da tao tai khoan. Neu project bat confirm email, hay mo mail de xac thuc roi dang nhap.", false);
});

logoutBtn.addEventListener("click", async () => {
  await state.supabase.auth.signOut();
  state.session = null;
  state.profile = null;
  state.nguoiDungId = null;
  state.wallets = [];
  state.categories = [];
  state.transactions = [];
  setView("auth");
});

walletForm.addEventListener("submit", async event => {
  event.preventDefault();
  setMessage(appMessage, "");

  const name = document.getElementById("walletName").value.trim();
  const walletType = document.getElementById("walletType").value.trim();

  if (!name || !walletType) {
    setMessage(appMessage, "Nhap ten va loai vi", true);
    return;
  }

  const { error } = await state.supabase.from("vitien").insert({
    ten_vi: name,
    loai_vi: walletType,
    so_du_hien_tai: 0,
    ngay_tao: new Date().toISOString().slice(0, 10),
    id_nguoi_dung: state.nguoiDungId
  });

  if (error) {
    setMessage(appMessage, error.message, true);
    return;
  }

  walletForm.reset();
  setMessage(appMessage, "Them vi thanh cong", false);
  await refreshData();
});

categoryForm.addEventListener("submit", async event => {
  event.preventDefault();
  setMessage(appMessage, "");

  const name = document.getElementById("categoryName").value.trim();
  const kind = document.getElementById("categoryKind").value;

  if (!name || !kind) {
    setMessage(appMessage, "Nhap ten danh muc", true);
    return;
  }

  const loaiDanhMucMap = {
    expense: "Phat sinh",
    income: "Cong viec",
    long_term: "Dau tu"
  };

  const insertCategory = await state.supabase
    .from("danhmuc")
    .insert({
      ten_danh_muc: name,
      loai_danh_muc: loaiDanhMucMap[kind] || "Phat sinh",
      mo_ta: "Danh muc tao tren app"
    })
    .select("danhmuc_id")
    .single();

  if (insertCategory.error) {
    setMessage(appMessage, insertCategory.error.message, true);
    return;
  }

  const categoryId = insertCategory.data.danhmuc_id;
  const subTable = kind === "income" ? "thunhap" : (kind === "long_term" ? "taichinhdaihan" : "chitieu");

  const subInsert = await state.supabase.from(subTable).insert(
    subTable === "thunhap"
      ? { thunhap_id: categoryId }
      : subTable === "taichinhdaihan"
      ? { taichinhdaihan_id: categoryId }
      : { chitieu_id: categoryId }
  );

  if (subInsert.error) {
    setMessage(appMessage, subInsert.error.message, true);
    return;
  }

  categoryForm.reset();
  setMessage(appMessage, "Them danh muc thanh cong", false);
  await refreshData();
});

txForm.addEventListener("submit", async event => {
  event.preventDefault();
  setMessage(appMessage, "");

  if (!state.wallets.length || !state.categories.length) {
    setMessage(appMessage, "Can tao it nhat 1 vi va 1 danh muc truoc", true);
    return;
  }

  const payload = {
    ten_giao_dich: document.getElementById("txName").value.trim(),
    so_tien: Number(document.getElementById("txAmount").value),
    ngay_giao_dich: document.getElementById("txDate").value,
    id_danh_muc: txCategory.value,
    id_vi_tien: txWallet.value,
    id_nguoi_dung: state.nguoiDungId,
    ghi_chu: document.getElementById("txNote").value.trim() || null
  };

  const { error } = await state.supabase.from("giaodich").insert(payload);
  if (error) {
    setMessage(appMessage, error.message, true);
    return;
  }

  txForm.reset();
  setMessage(appMessage, "Them giao dich thanh cong", false);
  await refreshData();
});

window.addEventListener("load", async () => {
  try {
    initClient();
    await bootstrapSession();
    if (!state.session) {
      setView("auth");
    }
  } catch (_err) {
    setMessage(authMessage, "Khong ket noi duoc Supabase hoac schema chua dung. Hay chay file supabase_full_migration.sql", true);
    setView("auth");
  }
});

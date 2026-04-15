const state = {
  user: null,
  users: [],
  categories: [],
  wallets: [],
  incomeCategorySet: new Set(),
  supabase: null,
  adminTableRows: [],
  adminSelectedRow: null
};

const DEFAULT_SUPABASE_URL = "https://dhfnyufxzlytrkadinpn.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_NXcJo9m1MMnlV6iO7KDHFA_E4YVGhD5";

const loginCard = document.getElementById("loginCard");
const appPanel = document.getElementById("appPanel");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const txMessage = document.getElementById("txMessage");
const adminMessage = document.getElementById("adminMessage");
const phoneMessage = document.getElementById("phoneMessage");
const budgetMessage = document.getElementById("budgetMessage");
const goalMessage = document.getElementById("goalMessage");
const reportMessage = document.getElementById("reportMessage");
const walletMessage = document.getElementById("walletMessage");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const txForm = document.getElementById("txForm");
const userCreateForm = document.getElementById("userCreateForm");
const phoneForm = document.getElementById("phoneForm");
const budgetForm = document.getElementById("budgetForm");
const goalForm = document.getElementById("goalForm");
const reportForm = document.getElementById("reportForm");
const walletForm = document.getElementById("walletForm");
const logoutBtn = document.getElementById("logoutBtn");

const welcome = document.getElementById("welcome");
const roleBadge = document.getElementById("roleBadge");
const metrics = document.getElementById("metrics");
const adminSection = document.getElementById("adminSection");

const txTable = document.getElementById("txTable");
const userTable = document.getElementById("userTable");
const phoneTable = document.getElementById("phoneTable");
const budgetTable = document.getElementById("budgetTable");
const goalTable = document.getElementById("goalTable");
const reportTable = document.getElementById("reportTable");
const txSubmitBtn = document.getElementById("txSubmitBtn");

const txCategory = document.getElementById("txCategory");
const txWallet = document.getElementById("txWallet");
const budgetCategory = document.getElementById("budgetCategory");

const phoneUser = document.getElementById("phoneUser");
const budgetUser = document.getElementById("budgetUser");
const goalUser = document.getElementById("goalUser");
const adminTableSelect = document.getElementById("adminTableSelect");
const adminTableReloadBtn = document.getElementById("adminTableReloadBtn");
const adminTableHead = document.getElementById("adminTableHead");
const adminTableBody = document.getElementById("adminTableBody");
const adminRowJson = document.getElementById("adminRowJson");
const adminInsertBtn = document.getElementById("adminInsertBtn");
const adminUpdateBtn = document.getElementById("adminUpdateBtn");
const adminDeleteBtn = document.getElementById("adminDeleteBtn");
const adminTableMessage = document.getElementById("adminTableMessage");

const ADMIN_TABLE_CONFIG = [
  { name: "nguoidung", pk: ["nguoidung_id"] },
  { name: "nguoidung_sdt", pk: ["nguoidung_id", "sdt"] },
  { name: "vitien", pk: ["vi_id"] },
  { name: "danhmuc", pk: ["danhmuc_id"] },
  { name: "chitieu", pk: ["chitieu_id"] },
  { name: "thunhap", pk: ["thunhap_id"] },
  { name: "taichinhdaihan", pk: ["taichinhdaihan_id"] },
  { name: "giaodich", pk: ["giaodich_id"] },
  { name: "ngansach", pk: ["ngansach_id"] },
  { name: "muctieutaichinh", pk: ["muctieu_id"] },
  { name: "baocaotaichinh", pk: ["baocao_id"] }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeRowValue(value) {
  if (value === "") {
    return null;
  }
  return value;
}

function getAdminTableConfig(tableName) {
  return ADMIN_TABLE_CONFIG.find(x => x.name === tableName);
}

function setMessage(target, text, isError = true) {
  if (!target) {
    return;
  }
  target.textContent = text || "";
  target.style.color = isError ? "#b64635" : "#0b7a3d";
}

function makeClient() {
  state.supabase = window.supabase.createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
}

function currentUserCode() {
  return state.user?.nguoidung_id;
}

function selectedOrCurrent(selectEl) {
  return state.user?.vai_tro === "admin" ? (selectEl.value || currentUserCode()) : currentUserCode();
}

function renderMetrics(metricsData) {
  const entries = Object.entries(metricsData || {});
  metrics.innerHTML = entries
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
      return `<div class="metric"><div class="label">${label}</div><div class="value">${Number(v).toLocaleString("vi-VN")}</div></div>`;
    })
    .join("");
}

function renderTransactions(rows) {
  txTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.giaodich_id}</td>
        <td>${r.ten_giao_dich}</td>
        <td>${Number(r.so_tien).toLocaleString("vi-VN")}</td>
        <td>${String(r.ngay_giao_dich).slice(0, 10)}</td>
        <td>${r.id_nguoi_dung}</td>
      </tr>
    `)
    .join("");
}

function renderUserRows(rows) {
  userTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.nguoidung_id}</td>
        <td>${r.ten_tk}</td>
        <td><input id="email-${r.nguoidung_id}" value="${r.email || ""}"></td>
        <td>
          <select id="role-${r.nguoidung_id}">
            <option value="user" ${r.vai_tro === "user" ? "selected" : ""}>user</option>
            <option value="admin" ${r.vai_tro === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
        <td>
          <button class="action-btn btn-edit" onclick="updateUser('${r.nguoidung_id}')">Sua</button>
          <button class="action-btn btn-delete" onclick="deleteUser('${r.nguoidung_id}')">Xoa</button>
        </td>
      </tr>
    `)
    .join("");
}

function clearAdminSelection() {
  state.adminSelectedRow = null;
  if (adminRowJson) {
    adminRowJson.value = "";
  }
  document.querySelectorAll("#adminTableBody tr").forEach(row => {
    row.classList.remove("is-selected");
  });
}

function renderAdminTableRows(rows) {
  const data = rows || [];
  state.adminTableRows = data;

  if (!adminTableHead || !adminTableBody) {
    return;
  }

  if (data.length === 0) {
    adminTableHead.innerHTML = "<tr><th>Du lieu</th><th>Hanh dong</th></tr>";
    adminTableBody.innerHTML = "<tr><td colspan=\"2\">Bang hien tai chua co du lieu.</td></tr>";
    clearAdminSelection();
    return;
  }

  const columnSet = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => columnSet.add(key));
  });
  const columns = Array.from(columnSet);

  adminTableHead.innerHTML = `<tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join("")}<th>Hanh dong</th></tr>`;
  adminTableBody.innerHTML = data
    .map((row, idx) => {
      const cells = columns
        .map(col => `<td>${escapeHtml(row[col] == null ? "" : row[col])}</td>`)
        .join("");
      return `
        <tr id="admin-row-${idx}">
          ${cells}
          <td>
            <button class="action-btn btn-edit" onclick="pickAdminRow(${idx})">Chon</button>
            <button class="action-btn btn-delete" onclick="deleteAdminRow(${idx})">Xoa</button>
          </td>
        </tr>
      `;
    })
    .join("");

  clearAdminSelection();
}

async function loadAdminTableRows() {
  if (state.user?.vai_tro !== "admin") {
    return;
  }

  const tableName = adminTableSelect.value;
  const { data, error } = await state.supabase
    .from(tableName)
    .select("*")
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  renderAdminTableRows(data || []);
}

async function insertAdminRow() {
  const tableName = adminTableSelect.value;
  const payload = JSON.parse(adminRowJson.value || "{}");
  const normalized = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, normalizeRowValue(v)]));

  const { error } = await state.supabase.from(tableName).insert([normalized]);
  if (error) {
    throw new Error(error.message);
  }
}

async function updateAdminRow() {
  const tableName = adminTableSelect.value;
  const config = getAdminTableConfig(tableName);

  if (!config) {
    throw new Error("Bang khong duoc cau hinh khoa chinh");
  }

  if (!state.adminSelectedRow) {
    throw new Error("Hay chon dong can cap nhat truoc");
  }

  const payload = JSON.parse(adminRowJson.value || "{}");
  const normalized = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, normalizeRowValue(v)]));

  let req = state.supabase.from(tableName).update(normalized);
  config.pk.forEach(pk => {
    req = req.eq(pk, state.adminSelectedRow[pk]);
  });

  const { error } = await req;
  if (error) {
    throw new Error(error.message);
  }
}

async function deleteAdminRowBySource(rowSource) {
  const tableName = adminTableSelect.value;
  const config = getAdminTableConfig(tableName);

  if (!config) {
    throw new Error("Bang khong duoc cau hinh khoa chinh");
  }

  const row = rowSource || state.adminSelectedRow;
  if (!row) {
    throw new Error("Hay chon dong can xoa truoc");
  }

  let req = state.supabase.from(tableName).delete();
  config.pk.forEach(pk => {
    req = req.eq(pk, row[pk]);
  });

  const { error } = await req;
  if (error) {
    throw new Error(error.message);
  }
}

function renderPhones(rows) {
  phoneTable.innerHTML = (rows || [])
    .map(r => `<tr><td>${r.nguoidung_id}</td><td>${r.sdt}</td></tr>`)
    .join("");
}

function renderBudgets(rows) {
  budgetTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.ngansach_id}</td>
        <td>${r.ten_ngan_sach}</td>
        <td>${Number(r.so_tien_gioi_han).toLocaleString("vi-VN")}</td>
        <td>${r.id_nguoi_dung}</td>
      </tr>
    `)
    .join("");
}

function renderGoals(rows) {
  goalTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.muctieu_id}</td>
        <td>${r.ten_muc_tieu}</td>
        <td>${Number(r.so_tien_can_dat).toLocaleString("vi-VN")}</td>
        <td>${r.trang_thai}</td>
      </tr>
    `)
    .join("");
}

function renderReports(rows) {
  reportTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.baocao_id}</td>
        <td>${r.ten_bao_cao}</td>
        <td>${Number(r.tong_thu).toLocaleString("vi-VN")}</td>
        <td>${Number(r.tong_chi).toLocaleString("vi-VN")}</td>
        <td>${r.id_nguoi_dung}</td>
      </tr>
    `)
    .join("");
}

function updateWalletDependentUI() {
  const hasWallet = state.wallets.length > 0;
  txWallet.disabled = !hasWallet;
  txSubmitBtn.disabled = !hasWallet;

  if (!hasWallet) {
    txWallet.innerHTML = "<option value=''>Chua co vi nao. Hay them vi truoc khi tao giao dich.</option>";
    if (!txMessage.textContent) {
      setMessage(txMessage, "Ban chua co vi. Vui long them vi de co the tao giao dich.", true);
    }
    return;
  }

  if (txMessage.textContent.includes("chua co vi")) {
    setMessage(txMessage, "", false);
  }
}

function fillSelectOptions() {
  txCategory.innerHTML = state.categories
    .map(c => `<option value="${c.danhmuc_id}">${c.danhmuc_id} - ${c.ten_danh_muc}</option>`)
    .join("");

  budgetCategory.innerHTML = state.categories
    .map(c => `<option value="${c.danhmuc_id}">${c.danhmuc_id} - ${c.ten_danh_muc}</option>`)
    .join("");

  txWallet.innerHTML = state.wallets
    .map(w => `<option value="${w.vi_id}">${w.vi_id} - ${w.ten_vi} (${w.id_nguoi_dung})</option>`)
    .join("");

  const userOptions = state.users
    .map(u => `<option value="${u.nguoidung_id}">${u.nguoidung_id} - ${u.ten_tk}</option>`)
    .join("");

  phoneUser.innerHTML = userOptions;
  budgetUser.innerHTML = userOptions;
  goalUser.innerHTML = userOptions;
  updateWalletDependentUI();
}

function toggleAdminUI() {
  const isAdmin = state.user?.vai_tro === "admin";
  adminSection.classList.toggle("hidden", !isAdmin);
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin);
  });
}

function ensureAdminTableOptions() {
  if (!adminTableSelect) {
    return;
  }

  if (adminTableSelect.options.length > 0) {
    return;
  }

  adminTableSelect.innerHTML = ADMIN_TABLE_CONFIG
    .map(item => `<option value="${item.name}">${item.name}</option>`)
    .join("");
}

window.pickAdminRow = function pickAdminRow(index) {
  const row = state.adminTableRows[index];
  if (!row) {
    return;
  }

  state.adminSelectedRow = { ...row };
  adminRowJson.value = JSON.stringify(row, null, 2);

  document.querySelectorAll("#adminTableBody tr").forEach(el => {
    el.classList.remove("is-selected");
  });

  const selectedTr = document.getElementById(`admin-row-${index}`);
  if (selectedTr) {
    selectedTr.classList.add("is-selected");
  }
};

window.deleteAdminRow = async function deleteAdminRow(index) {
  const row = state.adminTableRows[index];
  if (!row) {
    return;
  }

  if (!confirm("Xoa dong da chon?")) {
    return;
  }

  setMessage(adminTableMessage, "");

  try {
    await deleteAdminRowBySource(row);
    setMessage(adminTableMessage, "Xoa dong thanh cong", false);
    await loadAdminTableRows();
    await refreshData();
  } catch (err) {
    setMessage(adminTableMessage, err.message, true);
  }
};

async function loadSummaryMetrics() {
  const sb = state.supabase;
  if (state.user.vai_tro === "admin") {
    const [{ count: userCount }, { count: walletCount }, { count: txCount }] = await Promise.all([
      sb.from("nguoidung").select("nguoidung_id", { count: "exact", head: true }),
      sb.from("vitien").select("vi_id", { count: "exact", head: true }),
      sb.from("giaodich").select("giaodich_id", { count: "exact", head: true })
    ]);

    renderMetrics({
      totalUsers: userCount || 0,
      totalWallets: walletCount || 0,
      totalTransactions: txCount || 0
    });
    return;
  }

  const { data: rows, error } = await sb
    .from("giaodich")
    .select("so_tien,id_danh_muc")
    .eq("id_nguoi_dung", currentUserCode());

  if (error) {
    throw new Error(error.message);
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of rows || []) {
    if (state.incomeCategorySet.has(row.id_danh_muc)) {
      totalIncome += Number(row.so_tien || 0);
    } else {
      totalExpense += Number(row.so_tien || 0);
    }
  }

  renderMetrics({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  });
}

async function refreshData() {
  const sb = state.supabase;
  const isAdmin = state.user.vai_tro === "admin";

  const usersPromise = isAdmin
    ? sb.from("nguoidung").select("nguoidung_id,ten_tk,email,vai_tro,ngay_tao").order("nguoidung_id")
    : sb.from("nguoidung").select("nguoidung_id,ten_tk,email,vai_tro,ngay_tao").eq("nguoidung_id", currentUserCode());

  const walletsPromise = isAdmin
    ? sb.from("vitien").select("vi_id,ten_vi,id_nguoi_dung").order("vi_id")
    : sb.from("vitien").select("vi_id,ten_vi,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("vi_id");

  const txPromise = isAdmin
    ? sb.from("giaodich").select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,id_nguoi_dung").order("ngay_giao_dich", { ascending: false }).limit(100)
    : sb.from("giaodich").select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("ngay_giao_dich", { ascending: false }).limit(100);

  const phonePromise = isAdmin
    ? sb.from("nguoidung_sdt").select("nguoidung_id,sdt").order("nguoidung_id")
    : sb.from("nguoidung_sdt").select("nguoidung_id,sdt").eq("nguoidung_id", currentUserCode());

  const budgetPromise = isAdmin
    ? sb.from("ngansach").select("ngansach_id,ten_ngan_sach,so_tien_gioi_han,id_nguoi_dung").order("ngansach_id")
    : sb.from("ngansach").select("ngansach_id,ten_ngan_sach,so_tien_gioi_han,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("ngansach_id");

  const goalPromise = isAdmin
    ? sb.from("muctieutaichinh").select("muctieu_id,ten_muc_tieu,so_tien_can_dat,trang_thai,id_nguoi_dung").order("muctieu_id")
    : sb.from("muctieutaichinh").select("muctieu_id,ten_muc_tieu,so_tien_can_dat,trang_thai,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("muctieu_id");

  const reportPromise = isAdmin
    ? sb.from("baocaotaichinh").select("baocao_id,ten_bao_cao,tong_thu,tong_chi,id_nguoi_dung").order("baocao_id", { ascending: false }).limit(100)
    : sb.from("baocaotaichinh").select("baocao_id,ten_bao_cao,tong_thu,tong_chi,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("baocao_id", { ascending: false }).limit(100);

  const [
    categoriesRes,
    incomeRes,
    usersRes,
    walletsRes,
    txRes,
    phonesRes,
    budgetRes,
    goalRes,
    reportRes
  ] = await Promise.all([
    sb.from("danhmuc").select("danhmuc_id,ten_danh_muc").order("danhmuc_id"),
    sb.from("thunhap").select("thunhap_id"),
    usersPromise,
    walletsPromise,
    txPromise,
    phonePromise,
    budgetPromise,
    goalPromise,
    reportPromise
  ]);

  const error = categoriesRes.error || incomeRes.error || usersRes.error || walletsRes.error || txRes.error || phonesRes.error || budgetRes.error || goalRes.error || reportRes.error;
  if (error) {
    throw new Error(error.message);
  }

  state.categories = categoriesRes.data || [];
  state.incomeCategorySet = new Set((incomeRes.data || []).map(x => x.thunhap_id));
  state.users = usersRes.data || [];
  state.wallets = walletsRes.data || [];

  fillSelectOptions();
  renderTransactions(txRes.data);
  renderPhones(phonesRes.data);
  renderBudgets(budgetRes.data);
  renderGoals(goalRes.data);
  renderReports(reportRes.data);

  if (isAdmin) {
    renderUserRows(state.users);
    ensureAdminTableOptions();
    await loadAdminTableRows();
  } else {
    renderAdminTableRows([]);
  }

  toggleAdminUI();
  await loadSummaryMetrics();
}

registerForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(registerMessage, "");

  try {
    makeClient();
    const tenTK = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const matKhau = document.getElementById("regPassword").value;
    const matKhau2 = document.getElementById("regPassword2").value;

    if (!tenTK || !email || !matKhau) {
      throw new Error("Vui long nhap day du thong tin");
    }

    if (matKhau !== matKhau2) {
      throw new Error("Mat khau nhap lai khong khop");
    }

    const { data: newUser, error: insertUserErr } = await state.supabase
      .from("nguoidung")
      .insert([{ ten_tk: tenTK, email, mat_khau: matKhau, vai_tro: "user" }])
      .select("nguoidung_id, ten_tk")
      .single();

    if (insertUserErr) {
      throw new Error(insertUserErr.message);
    }

    setMessage(registerMessage, `Tao tai khoan ${newUser.ten_tk} thanh cong. Dang nhap va tu tao vi dau tien cua ban.`, false);
    registerForm.reset();
    document.getElementById("username").value = tenTK;
    document.getElementById("password").focus();
  } catch (err) {
    setMessage(registerMessage, err.message, true);
  }
});

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(loginMessage, "");

  try {
    makeClient();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await state.supabase
      .from("nguoidung")
      .select("nguoidung_id,ten_tk,email,vai_tro")
      .eq("ten_tk", username)
      .eq("mat_khau", password)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Sai tai khoan hoac mat khau");
    }

    state.user = data;
    welcome.textContent = `Xin chao, ${state.user.ten_tk}`;
    roleBadge.textContent = `Role: ${state.user.vai_tro}`;

    loginCard.classList.add("hidden");
    appPanel.classList.remove("hidden");

    await refreshData();
  } catch (err) {
    setMessage(loginMessage, err.message, true);
  }
});

txForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(txMessage, "");

  if (!txWallet.value) {
    setMessage(txMessage, "Ban chua co vi. Vui long them vi truoc khi tao giao dich.", true);
    return;
  }

  const payload = {
    ten_giao_dich: document.getElementById("txName").value.trim(),
    so_tien: Number(document.getElementById("txAmount").value),
    ngay_giao_dich: document.getElementById("txDate").value,
    id_danh_muc: txCategory.value,
    id_vi_tien: txWallet.value,
    ghi_chu: document.getElementById("txNote").value.trim() || null,
    id_nguoi_dung: state.user.vai_tro === "admin"
      ? (state.wallets.find(x => x.vi_id === txWallet.value)?.id_nguoi_dung || currentUserCode())
      : currentUserCode()
  };

  try {
    const { error } = await state.supabase.from("giaodich").insert([payload]);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(txMessage, "Them giao dich thanh cong", false);
    txForm.reset();
    await refreshData();
  } catch (err) {
    setMessage(txMessage, err.message, true);
  }
});

walletForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(walletMessage, "");

  const tenVi = document.getElementById("walletName").value.trim();
  const loaiVi = document.getElementById("walletType").value;
  const soDu = Number(document.getElementById("walletBalance").value || 0);

  if (!tenVi) {
    setMessage(walletMessage, "Vui long nhap ten vi", true);
    return;
  }

  if (Number.isNaN(soDu) || soDu < 0) {
    setMessage(walletMessage, "So du hien tai khong hop le", true);
    return;
  }

  const payload = {
    ten_vi: tenVi,
    loai_vi: loaiVi,
    so_du_hien_tai: soDu,
    ngay_tao: new Date().toISOString().slice(0, 10),
    id_nguoi_dung: currentUserCode()
  };

  try {
    const { error } = await state.supabase.from("vitien").insert([payload]);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(walletMessage, "Them vi thanh cong", false);
    walletForm.reset();
    document.getElementById("walletBalance").value = 0;
    await refreshData();
  } catch (err) {
    setMessage(walletMessage, err.message, true);
  }
});

phoneForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(phoneMessage, "");

  const sdt = document.getElementById("phoneNumber").value.trim();
  const uid = selectedOrCurrent(phoneUser);

  try {
    const { error } = await state.supabase.from("nguoidung_sdt").insert([{ nguoidung_id: uid, sdt }]);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(phoneMessage, "Them SDT thanh cong", false);
    phoneForm.reset();
    await refreshData();
  } catch (err) {
    setMessage(phoneMessage, err.message, true);
  }
});

budgetForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(budgetMessage, "");

  const payload = {
    ten_ngan_sach: document.getElementById("budgetName").value.trim(),
    so_tien_gioi_han: Number(document.getElementById("budgetLimit").value),
    id_danh_muc: budgetCategory.value,
    id_nguoi_dung: selectedOrCurrent(budgetUser),
    ngay_bat_dau: document.getElementById("budgetStart").value || new Date().toISOString().slice(0, 10),
    ngay_ket_thuc: document.getElementById("budgetEnd").value || null
  };

  try {
    const { error } = await state.supabase.from("ngansach").insert([payload]);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(budgetMessage, "Them ngan sach thanh cong", false);
    budgetForm.reset();
    await refreshData();
  } catch (err) {
    setMessage(budgetMessage, err.message, true);
  }
});

goalForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(goalMessage, "");

  const payload = {
    ten_muc_tieu: document.getElementById("goalName").value.trim(),
    so_tien_can_dat: Number(document.getElementById("goalAmount").value),
    thoi_han_hoan_thanh: document.getElementById("goalDeadline").value,
    id_nguoi_dung: selectedOrCurrent(goalUser)
  };

  try {
    const { error } = await state.supabase.from("muctieutaichinh").insert([payload]);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(goalMessage, "Them muc tieu thanh cong", false);
    goalForm.reset();
    await refreshData();
  } catch (err) {
    setMessage(goalMessage, err.message, true);
  }
});

reportForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(reportMessage, "");

  try {
    const targetUser = currentUserCode();
    const { data: rows, error } = await state.supabase
      .from("giaodich")
      .select("so_tien,id_danh_muc")
      .eq("id_nguoi_dung", targetUser);

    if (error) {
      throw new Error(error.message);
    }

    let tongThu = 0;
    let tongChi = 0;
    for (const row of rows || []) {
      if (state.incomeCategorySet.has(row.id_danh_muc)) {
        tongThu += Number(row.so_tien || 0);
      } else {
        tongChi += Number(row.so_tien || 0);
      }
    }

    const now = new Date();
    const tenBaoCao = `Bao cao thang ${now.getMonth() + 1}-${now.getFullYear()}`;
    const { error: insErr } = await state.supabase.from("baocaotaichinh").insert([
      {
        ten_bao_cao: tenBaoCao,
        tong_thu: tongThu,
        tong_chi: tongChi,
        thoi_gian: now.toISOString().slice(0, 10),
        id_nguoi_dung: targetUser
      }
    ]);

    if (insErr) {
      throw new Error(insErr.message);
    }

    setMessage(reportMessage, "Tao bao cao thanh cong", false);
    await refreshData();
  } catch (err) {
    setMessage(reportMessage, err.message, true);
  }
});

userCreateForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(adminMessage, "");

  if (state.user?.vai_tro !== "admin") {
    setMessage(adminMessage, "Chi admin moi tao duoc user", true);
    return;
  }

  const payload = {
    ten_tk: document.getElementById("newUsername").value.trim(),
    email: document.getElementById("newEmail").value.trim(),
    mat_khau: document.getElementById("newPassword").value,
    vai_tro: document.getElementById("newRole").value
  };

  try {
    const { error } = await state.supabase.from("nguoidung").insert([payload]);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, "Tao user thanh cong", false);
    userCreateForm.reset();
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
});

adminTableSelect.addEventListener("change", async () => {
  if (state.user?.vai_tro !== "admin") {
    return;
  }

  setMessage(adminTableMessage, "");
  try {
    await loadAdminTableRows();
  } catch (err) {
    setMessage(adminTableMessage, err.message, true);
  }
});

adminTableReloadBtn.addEventListener("click", async () => {
  if (state.user?.vai_tro !== "admin") {
    return;
  }

  setMessage(adminTableMessage, "");
  try {
    await loadAdminTableRows();
    setMessage(adminTableMessage, "Tai lai du lieu bang thanh cong", false);
  } catch (err) {
    setMessage(adminTableMessage, err.message, true);
  }
});

adminInsertBtn.addEventListener("click", async () => {
  if (state.user?.vai_tro !== "admin") {
    return;
  }

  setMessage(adminTableMessage, "");
  try {
    await insertAdminRow();
    setMessage(adminTableMessage, "Them dong thanh cong", false);
    await loadAdminTableRows();
    await refreshData();
  } catch (err) {
    setMessage(adminTableMessage, err.message, true);
  }
});

adminUpdateBtn.addEventListener("click", async () => {
  if (state.user?.vai_tro !== "admin") {
    return;
  }

  setMessage(adminTableMessage, "");
  try {
    await updateAdminRow();
    setMessage(adminTableMessage, "Cap nhat dong thanh cong", false);
    await loadAdminTableRows();
    await refreshData();
  } catch (err) {
    setMessage(adminTableMessage, err.message, true);
  }
});

adminDeleteBtn.addEventListener("click", async () => {
  if (state.user?.vai_tro !== "admin") {
    return;
  }

  if (!confirm("Xoa dong da chon?")) {
    return;
  }

  setMessage(adminTableMessage, "");
  try {
    await deleteAdminRowBySource();
    setMessage(adminTableMessage, "Xoa dong thanh cong", false);
    await loadAdminTableRows();
    await refreshData();
  } catch (err) {
    setMessage(adminTableMessage, err.message, true);
  }
});

logoutBtn.addEventListener("click", () => {
  state.user = null;
  state.adminTableRows = [];
  state.adminSelectedRow = null;
  appPanel.classList.add("hidden");
  loginCard.classList.remove("hidden");
  renderAdminTableRows([]);
  setMessage(adminTableMessage, "");
});

window.updateUser = async function updateUser(id) {
  setMessage(adminMessage, "");

  const email = document.getElementById(`email-${id}`).value.trim();
  const vaiTro = document.getElementById(`role-${id}`).value;
  const matKhau = prompt("Nhap mat khau moi cho user (bat buoc de update):");

  if (!matKhau) {
    setMessage(adminMessage, "Ban da huy cap nhat", true);
    return;
  }

  try {
    const { error } = await state.supabase
      .from("nguoidung")
      .update({ email, mat_khau: matKhau, vai_tro: vaiTro })
      .eq("nguoidung_id", id);

    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Cap nhat user ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.deleteUser = async function deleteUser(id) {
  if (!confirm(`Xoa user ${id}?`)) {
    return;
  }

  try {
    const { error } = await state.supabase.from("nguoidung").delete().eq("nguoidung_id", id);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Xoa user ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

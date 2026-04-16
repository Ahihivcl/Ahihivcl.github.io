const state = {
  user: null,
  users: [],
  categories: [],
  wallets: [],
  transactions: [],
  phones: [],
  budgets: [],
  goals: [],
  reports: [],
  incomeCategorySet: new Set(),
  supabase: null,
  adminTableRows: [],
  adminSelectedRow: null,
  adminTableColumns: []
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
const reportMonth = document.getElementById("reportMonth");

const welcome = document.getElementById("welcome");
const roleBadge = document.getElementById("roleBadge");
const metrics = document.getElementById("metrics");
const adminSection = document.getElementById("adminSection");

const txTable = document.getElementById("txTable");
const walletTable = document.getElementById("walletTable");
const userTable = document.getElementById("userTable");
const phoneTable = document.getElementById("phoneTable");
const budgetTable = document.getElementById("budgetTable");
const goalTable = document.getElementById("goalTable");
const reportTable = document.getElementById("reportTable");
const reportTxTable = document.getElementById("reportTxTable");
const reportDetailPanel = document.getElementById("reportDetailPanel");
const reportDetailTitle = document.getElementById("reportDetailTitle");
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
const adminFormGrid = document.getElementById("adminFormGrid");
const adminInsertBtn = document.getElementById("adminInsertBtn");
const adminUpdateBtn = document.getElementById("adminUpdateBtn");
const adminDeleteBtn = document.getElementById("adminDeleteBtn");
const adminFormResetBtn = document.getElementById("adminFormResetBtn");
const adminTableMessage = document.getElementById("adminTableMessage");

const ADMIN_TABLE_CONFIG = [
  { name: "nguoidung", pk: ["nguoidung_id"], columns: ["nguoidung_id", "ten_tk", "email", "mat_khau", "ngay_tao", "vai_tro"] },
  { name: "nguoidung_sdt", pk: ["nguoidung_id", "sdt"], columns: ["nguoidung_id", "sdt"] },
  { name: "vitien", pk: ["vi_id"], columns: ["vi_id", "ten_vi", "loai_vi", "so_du_hien_tai", "ngay_tao", "id_nguoi_dung"] },
  { name: "danhmuc", pk: ["danhmuc_id"], columns: ["danhmuc_id", "ten_danh_muc", "loai_danh_muc", "mo_ta"] },
  { name: "chitieu", pk: ["chitieu_id"], columns: ["chitieu_id"] },
  { name: "thunhap", pk: ["thunhap_id"], columns: ["thunhap_id"] },
  { name: "taichinhdaihan", pk: ["taichinhdaihan_id"], columns: ["taichinhdaihan_id"] },
  { name: "giaodich", pk: ["giaodich_id"], columns: ["giaodich_id", "ten_giao_dich", "so_tien", "ngay_giao_dich", "ghi_chu", "id_nguoi_dung", "id_danh_muc", "id_vi_tien"] },
  { name: "ngansach", pk: ["ngansach_id"], columns: ["ngansach_id", "ten_ngan_sach", "so_tien_gioi_han", "ngay_bat_dau", "ngay_ket_thuc", "id_nguoi_dung", "id_danh_muc"] },
  { name: "muctieutaichinh", pk: ["muctieu_id"], columns: ["muctieu_id", "ten_muc_tieu", "so_tien_can_dat", "ngay_bat_dau", "thoi_han_hoan_thanh", "trang_thai", "id_nguoi_dung"] },
  { name: "baocaotaichinh", pk: ["baocao_id"], columns: ["baocao_id", "ten_bao_cao", "tong_thu", "tong_chi", "thoi_gian", "id_nguoi_dung"] }
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

function prettyFieldName(column) {
  return column
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferFieldType(column, value) {
  if (column.includes("ngay") || column.includes("thoi_han") || column === "thoi_gian") {
    return "date";
  }

  if (typeof value === "number") {
    return "number";
  }

  if (column.startsWith("so_") || column.startsWith("tong_")) {
    return "number";
  }

  return "text";
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

function ensureReportMonthDefault() {
  if (!reportMonth || reportMonth.value) {
    return;
  }

  const now = new Date();
  reportMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentUserCode() {
  return state.user?.nguoidung_id;
}

function isAdminUser() {
  return state.user?.vai_tro === "admin";
}

function selectedOrCurrent(selectEl) {
  return state.user?.vai_tro === "admin" ? (selectEl.value || currentUserCode()) : currentUserCode();
}

function toMonthRange(monthValue) {
  const [yearStr, monthStr] = String(monthValue || "").split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) {
    return null;
  }

  const from = `${yearStr}-${String(month).padStart(2, "0")}-01`;
  const lastDate = new Date(year, month, 0).getDate();
  const to = `${yearStr}-${String(month).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;
  return { from, to, year, month };
}

function getUserWalletBalanceMap() {
  const map = {};
  (state.wallets || []).forEach(w => {
    map[w.id_nguoi_dung] = (map[w.id_nguoi_dung] || 0) + Number(w.so_du_hien_tai || 0);
  });
  return map;
}

function calculateBudgetSpent(budgetRow) {
  const start = budgetRow.ngay_bat_dau || new Date().toISOString().slice(0, 10);
  const end = budgetRow.ngay_ket_thuc || "9999-12-31";

  const spent = (state.transactions || []).reduce((sum, tx) => {
    const day = String(tx.ngay_giao_dich || "").slice(0, 10);
    const sameUser = tx.id_nguoi_dung === budgetRow.id_nguoi_dung;
    const sameCategory = tx.id_danh_muc === budgetRow.id_danh_muc;
    const inRange = day >= start && day <= end;
    const isExpense = !state.incomeCategorySet.has(tx.id_danh_muc);
    if (sameUser && sameCategory && inRange && isExpense) {
      return sum + Number(tx.so_tien || 0);
    }
    return sum;
  }, 0);

  return spent;
}

async function syncGoalStatuses() {
  const changed = (state.goals || []).filter(g => g.trang_thai !== g._status);
  if (changed.length === 0) {
    return;
  }

  await Promise.all(
    changed.map(g =>
      state.supabase
        .from("muctieutaichinh")
        .update({ trang_thai: g._status })
        .eq("muctieu_id", g.muctieu_id)
    )
  );
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
        <td>
          ${isAdminUser() ? `
            <button class="action-btn btn-edit" onclick="updateTransaction('${r.giaodich_id}')">Sua</button>
            <button class="action-btn btn-delete" onclick="deleteTransaction('${r.giaodich_id}')">Xoa</button>
          ` : ""}
        </td>
      </tr>
    `)
    .join("");
}

function renderWallets(rows) {
  walletTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.vi_id}</td>
        <td>${r.ten_vi}</td>
        <td>${r.loai_vi || ""}</td>
        <td>${Number(r.so_du_hien_tai || 0).toLocaleString("vi-VN")}</td>
        <td>${r.id_nguoi_dung}</td>
        <td>
          ${isAdminUser() ? `
            <button class="action-btn btn-edit" onclick="updateWallet('${r.vi_id}')">Sua</button>
            <button class="action-btn btn-delete" onclick="deleteWallet('${r.vi_id}')">Xoa</button>
          ` : ""}
        </td>
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
  document.querySelectorAll("#adminTableBody tr").forEach(row => {
    row.classList.remove("is-selected");
  });
  renderAdminForm();
}

function getAdminColumns(tableName, rows) {
  const config = getAdminTableConfig(tableName);
  const columnsFromConfig = config?.columns || [];
  const columnsFromData = Array.from(new Set((rows || []).flatMap(row => Object.keys(row || {}))));

  if (columnsFromConfig.length === 0) {
    return columnsFromData;
  }

  const merged = [...columnsFromConfig];
  columnsFromData.forEach(col => {
    if (!merged.includes(col)) {
      merged.push(col);
    }
  });

  return merged;
}

function renderAdminForm(sourceRow = null) {
  if (!adminFormGrid) {
    return;
  }

  const tableName = adminTableSelect?.value;
  const config = getAdminTableConfig(tableName);
  const columns = state.adminTableColumns || [];

  if (columns.length === 0) {
    adminFormGrid.innerHTML = "<p class=\"muted\">Khong co cot de hien thi form.</p>";
    return;
  }

  const row = sourceRow || {};
  adminFormGrid.innerHTML = columns
    .map(col => {
      const inputType = inferFieldType(col, row[col]);
      const isPk = Boolean(config?.pk?.includes(col));
      const readOnly = Boolean(state.adminSelectedRow && isPk);
      const value = row[col] == null ? "" : String(row[col]);
      const tag = isPk ? "<span class=\"pk-tag\">PK</span>" : "";
      return `
        <div class="admin-form-field">
          <label for="admin-field-${col}">${prettyFieldName(col)} ${tag}</label>
          <input id="admin-field-${col}" data-admin-col="${col}" type="${inputType}" value="${escapeHtml(value)}" ${readOnly ? "readonly" : ""}>
        </div>
      `;
    })
    .join("");
}

function getAdminFormPayload() {
  const payload = {};
  const inputs = adminFormGrid.querySelectorAll("[data-admin-col]");

  inputs.forEach(input => {
    const key = input.getAttribute("data-admin-col");
    const rawValue = input.value;
    if (rawValue === "") {
      return;
    }

    if (input.type === "number") {
      const numberValue = Number(rawValue);
      payload[key] = Number.isNaN(numberValue) ? rawValue : numberValue;
      return;
    }

    payload[key] = normalizeRowValue(rawValue);
  });

  return payload;
}

function renderAdminTableRows(rows) {
  const data = rows || [];
  state.adminTableRows = data;
  state.adminTableColumns = getAdminColumns(adminTableSelect.value, data);

  if (!adminTableHead || !adminTableBody) {
    return;
  }

  const columns = state.adminTableColumns;

  if (columns.length === 0) {
    adminTableHead.innerHTML = "<tr><th>Du lieu</th></tr>";
    adminTableBody.innerHTML = "<tr><td>Khong tim thay cot du lieu.</td></tr>";
    clearAdminSelection();
    return;
  }

  adminTableHead.innerHTML = `<tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join("")}<th>Hanh dong</th></tr>`;

  if (data.length === 0) {
    adminTableBody.innerHTML = `<tr><td colspan="${columns.length + 1}">Bang hien tai chua co du lieu.</td></tr>`;
    clearAdminSelection();
    return;
  }

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
  const payload = getAdminFormPayload();

  if (Object.keys(payload).length === 0) {
    throw new Error("Vui long nhap du lieu tren form");
  }

  const { error } = await state.supabase.from(tableName).insert([payload]);
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

  const payload = getAdminFormPayload();
  config.pk.forEach(pk => {
    delete payload[pk];
  });

  if (Object.keys(payload).length === 0) {
    throw new Error("Khong co truong nao de cap nhat");
  }

  let req = state.supabase.from(tableName).update(payload);
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
    .map(r => `
      <tr>
        <td>${r.nguoidung_id}</td>
        <td>${r.sdt}</td>
        <td>
          ${isAdminUser() ? `
            <button class="action-btn btn-edit" onclick="updatePhone('${r.nguoidung_id}','${r.sdt}')">Sua</button>
            <button class="action-btn btn-delete" onclick="deletePhone('${r.nguoidung_id}','${r.sdt}')">Xoa</button>
          ` : ""}
        </td>
      </tr>
    `)
    .join("");
}

function renderBudgets(rows) {
  budgetTable.innerHTML = (rows || [])
    .map(r => `
      <tr>
        <td>${r.ngansach_id}</td>
        <td>${r.ten_ngan_sach}</td>
        <td>${Number(r.so_tien_gioi_han).toLocaleString("vi-VN")}</td>
        <td>${Number(r._spent || 0).toLocaleString("vi-VN")}</td>
        <td class="${Number(r._remain || 0) < 0 ? "cell-negative" : "cell-positive"}">${Number(r._remain || 0).toLocaleString("vi-VN")}</td>
        <td>
          <div class="progress-wrap">
            <div class="progress-bar ${Number(r._progress || 0) > 100 ? "over" : ""}" style="width:${Math.min(Number(r._progress || 0), 100)}%"></div>
          </div>
          <span class="progress-label">${Number(r._progress || 0).toFixed(0)}%</span>
        </td>
        <td>${r.id_nguoi_dung}</td>
        <td>
          <button class="action-btn btn-edit" onclick="updateBudget('${r.ngansach_id}')">Sua</button>
          <button class="action-btn btn-delete" onclick="deleteBudget('${r.ngansach_id}')">Xoa</button>
        </td>
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
        <td>${Number(r._currentSaving || 0).toLocaleString("vi-VN")} / ${Number(r.so_tien_can_dat || 0).toLocaleString("vi-VN")} (${Number(r._progress || 0).toFixed(0)}%)</td>
        <td><span class="goal-status ${r._status === "Da hoan thanh" ? "done" : "todo"}">${r._status}</span></td>
        <td>
          <button class="action-btn btn-edit" onclick="updateGoal('${r.muctieu_id}')">Sua</button>
          <button class="action-btn btn-delete" onclick="deleteGoal('${r.muctieu_id}')">Xoa</button>
        </td>
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
        <td>${String(r.thoi_gian || "").slice(0, 7)}</td>
        <td>${r.id_nguoi_dung}</td>
        <td>
          <button class="action-btn btn-edit" onclick="viewReportTransactions('${r.baocao_id}')">Xem</button>
          ${isAdminUser() ? `
            <button class="action-btn btn-edit" onclick="updateReport('${r.baocao_id}')">Sua</button>
            <button class="action-btn btn-delete" onclick="deleteReport('${r.baocao_id}')">Xoa</button>
          ` : ""}
        </td>
      </tr>
    `)
    .join("");
}

function renderReportTransactions(rows, reportRow) {
  const data = rows || [];
  reportDetailPanel.classList.remove("hidden");
  reportDetailTitle.textContent = `Chi tiet giao dich - ${reportRow.ten_bao_cao}`;

  if (data.length === 0) {
    reportTxTable.innerHTML = "<tr><td colspan=\"4\">Khong co giao dich trong thang nay.</td></tr>";
    return;
  }

  reportTxTable.innerHTML = data
    .map(tx => {
      const isIncome = state.incomeCategorySet.has(tx.id_danh_muc);
      const cls = isIncome ? "tx-income" : "tx-expense";
      const sign = isIncome ? "+" : "-";
      return `
        <tr>
          <td>${String(tx.ngay_giao_dich || "").slice(0, 10)}</td>
          <td>${escapeHtml(tx.ten_giao_dich || "")}</td>
          <td>${isIncome ? "Thu" : "Chi"}</td>
          <td class="${cls}">${sign}${Number(tx.so_tien || 0).toLocaleString("vi-VN")}</td>
        </tr>
      `;
    })
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
  renderAdminForm(state.adminSelectedRow);

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

  const [{ data: txRows, error: txError }, { data: walletRows, error: walletError }] = await Promise.all([
    sb.from("giaodich").select("so_tien,id_danh_muc").eq("id_nguoi_dung", currentUserCode()),
    sb.from("vitien").select("so_du_hien_tai").eq("id_nguoi_dung", currentUserCode())
  ]);

  if (txError || walletError) {
    throw new Error((txError || walletError).message);
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of txRows || []) {
    if (state.incomeCategorySet.has(row.id_danh_muc)) {
      totalIncome += Number(row.so_tien || 0);
    } else {
      totalExpense += Number(row.so_tien || 0);
    }
  }

  const walletBalance = (walletRows || []).reduce((sum, row) => sum + Number(row.so_du_hien_tai || 0), 0);

  renderMetrics({
    totalIncome,
    totalExpense,
    balance: walletBalance
  });
}

async function refreshData() {
  const sb = state.supabase;
  const isAdmin = state.user.vai_tro === "admin";
  ensureReportMonthDefault();

  const usersPromise = isAdmin
    ? sb.from("nguoidung").select("nguoidung_id,ten_tk,email,vai_tro,ngay_tao").order("nguoidung_id")
    : sb.from("nguoidung").select("nguoidung_id,ten_tk,email,vai_tro,ngay_tao").eq("nguoidung_id", currentUserCode());

  const walletsPromise = isAdmin
    ? sb.from("vitien").select("vi_id,ten_vi,loai_vi,so_du_hien_tai,id_nguoi_dung").order("vi_id")
    : sb.from("vitien").select("vi_id,ten_vi,loai_vi,so_du_hien_tai,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("vi_id");

  const txPromise = isAdmin
    ? sb.from("giaodich").select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,ghi_chu,id_nguoi_dung,id_danh_muc").order("ngay_giao_dich", { ascending: false }).limit(300)
    : sb.from("giaodich").select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,ghi_chu,id_nguoi_dung,id_danh_muc").eq("id_nguoi_dung", currentUserCode()).order("ngay_giao_dich", { ascending: false }).limit(300);

  const phonePromise = isAdmin
    ? sb.from("nguoidung_sdt").select("nguoidung_id,sdt").order("nguoidung_id")
    : sb.from("nguoidung_sdt").select("nguoidung_id,sdt").eq("nguoidung_id", currentUserCode());

  const budgetPromise = isAdmin
    ? sb.from("ngansach").select("ngansach_id,ten_ngan_sach,so_tien_gioi_han,id_nguoi_dung,id_danh_muc,ngay_bat_dau,ngay_ket_thuc").order("ngansach_id")
    : sb.from("ngansach").select("ngansach_id,ten_ngan_sach,so_tien_gioi_han,id_nguoi_dung,id_danh_muc,ngay_bat_dau,ngay_ket_thuc").eq("id_nguoi_dung", currentUserCode()).order("ngansach_id");

  const goalPromise = isAdmin
    ? sb.from("muctieutaichinh").select("muctieu_id,ten_muc_tieu,so_tien_can_dat,trang_thai,id_nguoi_dung").order("muctieu_id")
    : sb.from("muctieutaichinh").select("muctieu_id,ten_muc_tieu,so_tien_can_dat,trang_thai,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("muctieu_id");

  const reportPromise = isAdmin
    ? sb.from("baocaotaichinh").select("baocao_id,ten_bao_cao,tong_thu,tong_chi,thoi_gian,id_nguoi_dung").order("thoi_gian", { ascending: false }).limit(100)
    : sb.from("baocaotaichinh").select("baocao_id,ten_bao_cao,tong_thu,tong_chi,thoi_gian,id_nguoi_dung").eq("id_nguoi_dung", currentUserCode()).order("thoi_gian", { ascending: false }).limit(100);

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
  state.transactions = txRes.data || [];
  state.phones = phonesRes.data || [];
  state.budgets = (budgetRes.data || []).map(row => {
    const spent = calculateBudgetSpent(row);
    const limit = Number(row.so_tien_gioi_han || 0);
    const remain = limit - spent;
    const progress = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      ...row,
      _spent: spent,
      _remain: remain,
      _progress: progress
    };
  });

  const walletBalanceByUser = getUserWalletBalanceMap();
  state.goals = (goalRes.data || []).map(row => {
    const currentSaving = Number(walletBalanceByUser[row.id_nguoi_dung] || 0);
    const target = Number(row.so_tien_can_dat || 0);
    const status = currentSaving >= target ? "Da hoan thanh" : "Chua hoan thanh";
    return {
      ...row,
      _currentSaving: currentSaving,
      _status: status,
      _progress: target > 0 ? (currentSaving / target) * 100 : 0
    };
  });

  state.reports = reportRes.data || [];

  try {
    await syncGoalStatuses();
  } catch (_err) {
    // Skip blocking UI refresh if background status sync fails.
  }

  fillSelectOptions();
  renderTransactions(state.transactions);
  renderWallets(state.wallets);
  renderPhones(state.phones);
  renderBudgets(state.budgets);
  renderGoals(state.goals);
  renderReports(state.reports);
  reportDetailPanel.classList.add("hidden");
  reportTxTable.innerHTML = "";

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
    const monthValue = reportMonth.value;
    const range = toMonthRange(monthValue);
    if (!range) {
      throw new Error("Vui long chon thang bao cao");
    }

    const { data: rows, error } = await state.supabase
      .from("giaodich")
      .select("so_tien,id_danh_muc")
      .eq("id_nguoi_dung", targetUser)
      .gte("ngay_giao_dich", range.from)
      .lte("ngay_giao_dich", range.to);

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

    const tenBaoCao = `Bao cao thang ${range.month}-${range.year}`;
    const { data: existingRows, error: existingErr } = await state.supabase
      .from("baocaotaichinh")
      .select("baocao_id")
      .eq("id_nguoi_dung", targetUser)
      .gte("thoi_gian", range.from)
      .lte("thoi_gian", range.to)
      .limit(1);

    if (existingErr) {
      throw new Error(existingErr.message);
    }

    if (existingRows && existingRows.length > 0) {
      const { error: updErr } = await state.supabase
        .from("baocaotaichinh")
        .update({
          ten_bao_cao: tenBaoCao,
          tong_thu: tongThu,
          tong_chi: tongChi,
          thoi_gian: range.from
        })
        .eq("baocao_id", existingRows[0].baocao_id);

      if (updErr) {
        throw new Error(updErr.message);
      }
    } else {
      const { error: insErr } = await state.supabase.from("baocaotaichinh").insert([
        {
          ten_bao_cao: tenBaoCao,
          tong_thu: tongThu,
          tong_chi: tongChi,
          thoi_gian: range.from,
          id_nguoi_dung: targetUser
        }
      ]);

      if (insErr) {
        throw new Error(insErr.message);
      }
    }

    setMessage(reportMessage, "Tao bao cao thanh cong", false);
    await refreshData();
  } catch (err) {
    setMessage(reportMessage, err.message, true);
  }
});

window.viewReportTransactions = async function viewReportTransactions(reportId) {
  const reportRow = state.reports.find(x => x.baocao_id === reportId);
  if (!reportRow) {
    setMessage(reportMessage, "Khong tim thay bao cao", true);
    return;
  }

  const month = String(reportRow.thoi_gian || "").slice(0, 7);
  const range = toMonthRange(month);
  if (!range) {
    setMessage(reportMessage, "Khong xac dinh duoc thang bao cao", true);
    return;
  }

  try {
    const { data, error } = await state.supabase
      .from("giaodich")
      .select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,id_danh_muc")
      .eq("id_nguoi_dung", reportRow.id_nguoi_dung)
      .gte("ngay_giao_dich", range.from)
      .lte("ngay_giao_dich", range.to)
      .order("ngay_giao_dich", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    renderReportTransactions(data || [], reportRow);
    setMessage(reportMessage, `Da mo chi tiet bao cao ${reportRow.ten_bao_cao}`, false);
  } catch (err) {
    setMessage(reportMessage, err.message, true);
  }
};

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

adminFormResetBtn.addEventListener("click", () => {
  clearAdminSelection();
  setMessage(adminTableMessage, "Da reset form. Ban co the nhap du lieu moi.", false);
});

logoutBtn.addEventListener("click", () => {
  state.user = null;
  state.adminTableRows = [];
  state.adminSelectedRow = null;
  state.adminTableColumns = [];
  appPanel.classList.add("hidden");
  loginCard.classList.remove("hidden");
  renderAdminTableRows([]);
  setMessage(adminTableMessage, "");
  reportDetailPanel.classList.add("hidden");
  reportTxTable.innerHTML = "";
});

window.updateTransaction = async function updateTransaction(id) {
  if (!isAdminUser()) {
    return;
  }

  const row = state.transactions.find(x => x.giaodich_id === id);
  if (!row) {
    setMessage(adminMessage, "Khong tim thay giao dich", true);
    return;
  }

  const ten = prompt("Ten giao dich moi:", row.ten_giao_dich || "");
  if (ten === null) {
    return;
  }
  const soTien = prompt("So tien moi:", row.so_tien ?? "");
  if (soTien === null) {
    return;
  }
  const ngay = prompt("Ngay giao dich (YYYY-MM-DD):", String(row.ngay_giao_dich || "").slice(0, 10));
  if (ngay === null) {
    return;
  }
  const ghiChu = prompt("Ghi chu:", row.ghi_chu || "") ?? "";

  try {
    const { error } = await state.supabase
      .from("giaodich")
      .update({
        ten_giao_dich: ten.trim(),
        so_tien: Number(soTien),
        ngay_giao_dich: ngay,
        ghi_chu: ghiChu.trim() || null
      })
      .eq("giaodich_id", id);

    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Cap nhat giao dich ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.deleteTransaction = async function deleteTransaction(id) {
  if (!isAdminUser()) {
    return;
  }

  if (!confirm(`Xoa giao dich ${id}?`)) {
    return;
  }

  try {
    const { error } = await state.supabase.from("giaodich").delete().eq("giaodich_id", id);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Xoa giao dich ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.updateWallet = async function updateWallet(id) {
  if (!isAdminUser()) {
    return;
  }

  const row = state.wallets.find(x => x.vi_id === id);
  if (!row) {
    setMessage(adminMessage, "Khong tim thay vi", true);
    return;
  }

  const tenVi = prompt("Ten vi moi:", row.ten_vi || "");
  if (tenVi === null) {
    return;
  }
  const loaiVi = prompt("Loai vi moi:", row.loai_vi || "Tien mat");
  if (loaiVi === null) {
    return;
  }
  const soDu = prompt("So du hien tai:", row.so_du_hien_tai ?? "0");
  if (soDu === null) {
    return;
  }

  try {
    const { error } = await state.supabase
      .from("vitien")
      .update({ ten_vi: tenVi.trim(), loai_vi: loaiVi.trim(), so_du_hien_tai: Number(soDu) })
      .eq("vi_id", id);

    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Cap nhat vi ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.deleteWallet = async function deleteWallet(id) {
  if (!isAdminUser()) {
    return;
  }

  if (!confirm(`Xoa vi ${id}?`)) {
    return;
  }

  try {
    const { error } = await state.supabase.from("vitien").delete().eq("vi_id", id);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Xoa vi ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.updatePhone = async function updatePhone(userId, phoneNumber) {
  if (!isAdminUser()) {
    return;
  }

  const newPhone = prompt("Nhap SDT moi:", phoneNumber || "");
  if (!newPhone) {
    return;
  }

  try {
    const { error } = await state.supabase
      .from("nguoidung_sdt")
      .update({ sdt: newPhone.trim() })
      .eq("nguoidung_id", userId)
      .eq("sdt", phoneNumber);

    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Cap nhat SDT user ${userId} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.deletePhone = async function deletePhone(userId, phoneNumber) {
  if (!isAdminUser()) {
    return;
  }

  if (!confirm(`Xoa SDT ${phoneNumber} cua user ${userId}?`)) {
    return;
  }

  try {
    const { error } = await state.supabase
      .from("nguoidung_sdt")
      .delete()
      .eq("nguoidung_id", userId)
      .eq("sdt", phoneNumber);

    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Xoa SDT ${phoneNumber} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.updateBudget = async function updateBudget(id) {
  const row = state.budgets.find(x => x.ngansach_id === id);
  if (!row) {
    setMessage(budgetMessage, "Khong tim thay ngan sach", true);
    return;
  }

  const ten = prompt("Ten ngan sach moi:", row.ten_ngan_sach || "");
  if (ten === null) {
    return;
  }
  const limit = prompt("So tien gioi han moi:", row.so_tien_gioi_han ?? "");
  if (limit === null) {
    return;
  }

  try {
    let req = state.supabase
      .from("ngansach")
      .update({ ten_ngan_sach: ten.trim(), so_tien_gioi_han: Number(limit) })
      .eq("ngansach_id", id);

    if (!isAdminUser()) {
      req = req.eq("id_nguoi_dung", currentUserCode());
    }

    const { error } = await req;

    if (error) {
      throw new Error(error.message);
    }

    setMessage(budgetMessage, `Cap nhat ngan sach ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(budgetMessage, err.message, true);
  }
};

window.deleteBudget = async function deleteBudget(id) {
  if (!confirm(`Xoa ngan sach ${id}?`)) {
    return;
  }

  try {
    let req = state.supabase.from("ngansach").delete().eq("ngansach_id", id);
    if (!isAdminUser()) {
      req = req.eq("id_nguoi_dung", currentUserCode());
    }
    const { error } = await req;
    if (error) {
      throw new Error(error.message);
    }

    setMessage(budgetMessage, `Xoa ngan sach ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(budgetMessage, err.message, true);
  }
};

window.updateGoal = async function updateGoal(id) {
  const row = state.goals.find(x => x.muctieu_id === id);
  if (!row) {
    setMessage(goalMessage, "Khong tim thay muc tieu", true);
    return;
  }

  const ten = prompt("Ten muc tieu moi:", row.ten_muc_tieu || "");
  if (ten === null) {
    return;
  }
  const amount = prompt("So tien can dat moi:", row.so_tien_can_dat ?? "");
  if (amount === null) {
    return;
  }

  try {
    let req = state.supabase
      .from("muctieutaichinh")
      .update({ ten_muc_tieu: ten.trim(), so_tien_can_dat: Number(amount) })
      .eq("muctieu_id", id);

    if (!isAdminUser()) {
      req = req.eq("id_nguoi_dung", currentUserCode());
    }

    const { error } = await req;

    if (error) {
      throw new Error(error.message);
    }

    setMessage(goalMessage, `Cap nhat muc tieu ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(goalMessage, err.message, true);
  }
};

window.deleteGoal = async function deleteGoal(id) {
  if (!confirm(`Xoa muc tieu ${id}?`)) {
    return;
  }

  try {
    let req = state.supabase.from("muctieutaichinh").delete().eq("muctieu_id", id);
    if (!isAdminUser()) {
      req = req.eq("id_nguoi_dung", currentUserCode());
    }
    const { error } = await req;
    if (error) {
      throw new Error(error.message);
    }

    setMessage(goalMessage, `Xoa muc tieu ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(goalMessage, err.message, true);
  }
};

window.updateReport = async function updateReport(id) {
  if (!isAdminUser()) {
    return;
  }

  const row = state.reports.find(x => x.baocao_id === id);
  if (!row) {
    setMessage(adminMessage, "Khong tim thay bao cao", true);
    return;
  }

  const ten = prompt("Ten bao cao moi:", row.ten_bao_cao || "");
  if (ten === null) {
    return;
  }
  const tongThu = prompt("Tong thu moi:", row.tong_thu ?? "");
  if (tongThu === null) {
    return;
  }
  const tongChi = prompt("Tong chi moi:", row.tong_chi ?? "");
  if (tongChi === null) {
    return;
  }

  try {
    const { error } = await state.supabase
      .from("baocaotaichinh")
      .update({ ten_bao_cao: ten.trim(), tong_thu: Number(tongThu), tong_chi: Number(tongChi) })
      .eq("baocao_id", id);

    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Cap nhat bao cao ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.deleteReport = async function deleteReport(id) {
  if (!isAdminUser()) {
    return;
  }

  if (!confirm(`Xoa bao cao ${id}?`)) {
    return;
  }

  try {
    const { error } = await state.supabase.from("baocaotaichinh").delete().eq("baocao_id", id);
    if (error) {
      throw new Error(error.message);
    }

    setMessage(adminMessage, `Xoa bao cao ${id} thanh cong`, false);
    await refreshData();
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

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

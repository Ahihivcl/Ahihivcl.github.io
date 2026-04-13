const state = {
  token: null,
  user: null,
  categories: [],
  wallets: []
};

const loginCard = document.getElementById("loginCard");
const appPanel = document.getElementById("appPanel");
const loginMessage = document.getElementById("loginMessage");
const txMessage = document.getElementById("txMessage");
const adminMessage = document.getElementById("adminMessage");

const loginForm = document.getElementById("loginForm");
const txForm = document.getElementById("txForm");
const userCreateForm = document.getElementById("userCreateForm");
const logoutBtn = document.getElementById("logoutBtn");

const welcome = document.getElementById("welcome");
const roleBadge = document.getElementById("roleBadge");
const metrics = document.getElementById("metrics");
const txTable = document.getElementById("txTable");
const userTable = document.getElementById("userTable");
const adminSection = document.getElementById("adminSection");

const txCategory = document.getElementById("txCategory");
const txWallet = document.getElementById("txWallet");

function setMessage(target, text, isError = true) {
  target.textContent = text || "";
  target.style.color = isError ? "#b64635" : "#0b7a3d";
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Loi API");
  }

  return data;
}

function renderMetrics(data) {
  const entries = Object.entries(data.metrics || {});
  metrics.innerHTML = entries
    .map(([k, v]) => {
      const label = k
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, c => c.toUpperCase());
      return `<div class="metric"><div class="label">${label}</div><div class="value">${Number(v).toLocaleString("vi-VN")}</div></div>`;
    })
    .join("");
}

function renderTransactions(rows) {
  txTable.innerHTML = rows
    .map(r => `
      <tr>
        <td>${r.GiaoDich_ID}</td>
        <td>${r.Ten_giao_dich}</td>
        <td>${Number(r.So_tien).toLocaleString("vi-VN")}</td>
        <td>${String(r.Ngay_giao_dich).slice(0, 10)}</td>
        <td>${r.ID_nguoi_dung}</td>
      </tr>
    `)
    .join("");
}

function renderUserRows(rows) {
  userTable.innerHTML = rows
    .map(
      r => `
      <tr>
        <td>${r.NguoiDung_ID}</td>
        <td>${r.Ten_TK}</td>
        <td><input id="email-${r.NguoiDung_ID}" value="${r.Email || ""}"></td>
        <td>
          <select id="role-${r.NguoiDung_ID}">
            <option value="user" ${r.Vai_tro === "user" ? "selected" : ""}>user</option>
            <option value="admin" ${r.Vai_tro === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
        <td>
          <button class="action-btn btn-edit" onclick="updateUser('${r.NguoiDung_ID}')">Sua</button>
          <button class="action-btn btn-delete" onclick="deleteUser('${r.NguoiDung_ID}')">Xoa</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function fillOptions() {
  txCategory.innerHTML = state.categories
    .map(c => `<option value="${c.DanhMuc_ID}">${c.DanhMuc_ID} - ${c.Ten_danh_muc}</option>`)
    .join("");

  txWallet.innerHTML = state.wallets
    .map(w => `<option value="${w.Vi_ID}">${w.Vi_ID} - ${w.Ten_vi} (${w.ID_nguoi_dung})</option>`)
    .join("");
}

async function refreshData() {
  const [dash, meta, txs] = await Promise.all([
    api("/api/dashboard"),
    api("/api/meta"),
    api("/api/transactions")
  ]);

  renderMetrics(dash);
  state.categories = meta.categories || [];
  state.wallets = meta.wallets || [];
  fillOptions();
  renderTransactions(txs);

  if (state.user.role === "admin") {
    adminSection.classList.remove("hidden");
    const users = await api("/api/admin/users");
    renderUserRows(users);
  } else {
    adminSection.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(loginMessage, "");

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    state.token = data.token;
    state.user = data.user;

    welcome.textContent = `Xin chao, ${state.user.username}`;
    roleBadge.textContent = `Role: ${state.user.role}`;

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

  const payload = {
    tenGiaoDich: document.getElementById("txName").value.trim(),
    soTien: Number(document.getElementById("txAmount").value),
    ngayGiaoDich: document.getElementById("txDate").value,
    idDanhMuc: txCategory.value,
    idVi: txWallet.value,
    ghiChu: document.getElementById("txNote").value.trim()
  };

  try {
    await api("/api/transactions", { method: "POST", body: JSON.stringify(payload) });
    setMessage(txMessage, "Them giao dich thanh cong", false);
    txForm.reset();
    await refreshData();
  } catch (err) {
    setMessage(txMessage, err.message, true);
  }
});

userCreateForm.addEventListener("submit", async e => {
  e.preventDefault();
  setMessage(adminMessage, "");

  const payload = {
    tenTaiKhoan: document.getElementById("newUsername").value.trim(),
    email: document.getElementById("newEmail").value.trim(),
    matKhau: document.getElementById("newPassword").value,
    vaiTro: document.getElementById("newRole").value
  };

  try {
    await api("/api/admin/users", { method: "POST", body: JSON.stringify(payload) });
    setMessage(adminMessage, "Tao user thanh cong", false);
    userCreateForm.reset();
    const users = await api("/api/admin/users");
    renderUserRows(users);
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
});

logoutBtn.addEventListener("click", () => {
  state.token = null;
  state.user = null;
  appPanel.classList.add("hidden");
  loginCard.classList.remove("hidden");
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
    await api(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ email, vaiTro, matKhau })
    });
    setMessage(adminMessage, `Cap nhat user ${id} thanh cong`, false);
    const users = await api("/api/admin/users");
    renderUserRows(users);
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

window.deleteUser = async function deleteUser(id) {
  if (!confirm(`Xoa user ${id}?`)) {
    return;
  }

  try {
    await api(`/api/admin/users/${id}`, { method: "DELETE" });
    setMessage(adminMessage, `Xoa user ${id} thanh cong`, false);
    const users = await api("/api/admin/users");
    renderUserRows(users);
  } catch (err) {
    setMessage(adminMessage, err.message, true);
  }
};

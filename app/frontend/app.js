const state = {
  user: null,
  categories: [],
  wallets: [],
  supabase: null
};

const DEFAULT_SUPABASE_URL = "https://dhfnyufxzlytrkadinpn.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_NXcJo9m1MMnlV6iO7KDHFA_E4YVGhD5";

const loginCard = document.getElementById("loginCard");
const appPanel = document.getElementById("appPanel");
const loginMessage = document.getElementById("loginMessage");
const txMessage = document.getElementById("txMessage");
const adminMessage = document.getElementById("adminMessage");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
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
const registerMessage = document.getElementById("registerMessage");

function setMessage(target, text, isError = true) {
  target.textContent = text || "";
  target.style.color = isError ? "#b64635" : "#0b7a3d";
}

function makeClient() {
  state.supabase = window.supabase.createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
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
      .insert([
        {
          ten_tk: tenTK,
          email,
          mat_khau: matKhau,
          vai_tro: "user"
        }
      ])
      .select("nguoidung_id, ten_tk")
      .single();

    if (insertUserErr) {
      throw new Error(insertUserErr.message);
    }

    const { error: walletErr } = await state.supabase.from("vitien").insert([
      {
        ten_vi: "Vi mac dinh",
        loai_vi: "Vi dien tu",
        so_du_hien_tai: 0,
        ngay_tao: new Date().toISOString().slice(0, 10),
        id_nguoi_dung: newUser.nguoidung_id
      }
    ]);

    if (walletErr) {
      throw new Error(walletErr.message);
    }

    setMessage(registerMessage, `Tao tai khoan ${newUser.ten_tk} thanh cong. Ban co the dang nhap ngay.`, false);
    registerForm.reset();
    document.getElementById("username").value = tenTK;
    document.getElementById("password").focus();
  } catch (err) {
    setMessage(registerMessage, err.message, true);
  }
});

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
  txTable.innerHTML = rows
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
  userTable.innerHTML = rows
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

function fillOptions() {
  txCategory.innerHTML = state.categories
    .map(c => `<option value="${c.danhmuc_id}">${c.danhmuc_id} - ${c.ten_danh_muc}</option>`)
    .join("");

  txWallet.innerHTML = state.wallets
    .map(w => `<option value="${w.vi_id}">${w.vi_id} - ${w.ten_vi} (${w.id_nguoi_dung})</option>`)
    .join("");
}

async function refreshData() {
  const sb = state.supabase;

  const [{ data: categories, error: cErr }, { data: wallets, error: wErr }] = await Promise.all([
    sb.from("danhmuc").select("danhmuc_id,ten_danh_muc").order("danhmuc_id"),
    state.user.vai_tro === "admin"
      ? sb.from("vitien").select("vi_id,ten_vi,id_nguoi_dung").order("vi_id")
      : sb.from("vitien").select("vi_id,ten_vi,id_nguoi_dung").eq("id_nguoi_dung", state.user.nguoidung_id).order("vi_id")
  ]);

  if (cErr || wErr) {
    throw new Error(cErr?.message || wErr?.message || "Loi tai meta");
  }

  state.categories = categories || [];
  state.wallets = wallets || [];
  fillOptions();

  const txQuery = sb
    .from("giaodich")
    .select("giaodich_id,ten_giao_dich,so_tien,ngay_giao_dich,id_nguoi_dung")
    .order("ngay_giao_dich", { ascending: false })
    .limit(100);

  const { data: txs, error: txErr } = state.user.vai_tro === "admin"
    ? await txQuery
    : await txQuery.eq("id_nguoi_dung", state.user.nguoidung_id);

  if (txErr) {
    throw new Error(txErr.message);
  }

  renderTransactions(txs || []);

  const { data: summaryRows, error: sErr } = await sb
    .from("giaodich")
    .select("so_tien,id_danh_muc")
    .eq("id_nguoi_dung", state.user.nguoidung_id);

  if (sErr) {
    throw new Error(sErr.message);
  }

  const incomeRows = await sb.from("thunhap").select("thunhap_id");
  if (incomeRows.error) {
    throw new Error(incomeRows.error.message);
  }

  const incomeSet = new Set((incomeRows.data || []).map(x => x.thunhap_id));

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of summaryRows || []) {
    if (incomeSet.has(row.id_danh_muc)) {
      totalIncome += Number(row.so_tien || 0);
    } else {
      totalExpense += Number(row.so_tien || 0);
    }
  }

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

    adminSection.classList.remove("hidden");
    const { data: users, error: uErr } = await sb
      .from("nguoidung")
      .select("nguoidung_id,ten_tk,email,vai_tro,ngay_tao")
      .order("nguoidung_id");

    if (uErr) {
      throw new Error(uErr.message);
    }

    renderUserRows(users || []);
  } else {
    adminSection.classList.add("hidden");
    renderMetrics({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  }
}

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

  const payload = {
    ten_giao_dich: document.getElementById("txName").value.trim(),
    so_tien: Number(document.getElementById("txAmount").value),
    ngay_giao_dich: document.getElementById("txDate").value,
    id_danh_muc: txCategory.value,
    id_vi_tien: txWallet.value,
    ghi_chu: document.getElementById("txNote").value.trim() || null,
    id_nguoi_dung: state.user.vai_tro === "admin"
      ? (state.wallets.find(x => x.vi_id === txWallet.value)?.id_nguoi_dung || state.user.nguoidung_id)
      : state.user.nguoidung_id
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

logoutBtn.addEventListener("click", () => {
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

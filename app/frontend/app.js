const state = {
  supabase: null,
  session: null,
  profile: null,
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

function setView(mode) {
  authCard.classList.toggle("hidden", mode !== "auth");
  appPanel.classList.toggle("hidden", mode !== "app");
}

function initClient() {
  state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

async function getProfile(userId) {
  const { data, error } = await state.supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  state.profile = data || { id: userId, username: "user", role: "user" };
}

function fillOptions() {
  txCategory.innerHTML = state.categories
    .map(c => `<option value="${c.id}">${c.name} (${c.kind})</option>`)
    .join("");

  txWallet.innerHTML = state.wallets
    .map(w => `<option value="${w.id}">${w.name} (${w.wallet_type})</option>`)
    .join("");
}

function renderTransactions() {
  const categoryMap = new Map(state.categories.map(c => [c.id, c.name]));
  const walletMap = new Map(state.wallets.map(w => [w.id, w.name]));

  txTable.innerHTML = state.transactions
    .map(tx => `
      <tr>
        <td>${tx.id.slice(0, 8)}</td>
        <td>${tx.title}</td>
        <td>${Number(tx.amount).toLocaleString("vi-VN")}</td>
        <td>${String(tx.transaction_date).slice(0, 10)}</td>
        <td>${categoryMap.get(tx.category_id) || "-"}</td>
        <td>${walletMap.get(tx.wallet_id) || "-"}</td>
      </tr>
    `)
    .join("");
}

async function refreshData() {
  const uid = state.session.user.id;

  const [walletRes, categoryRes, txRes] = await Promise.all([
    state.supabase
      .from("wallets")
      .select("id,name,wallet_type")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false }),
    state.supabase
      .from("categories")
      .select("id,name,kind")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false }),
    state.supabase
      .from("transactions")
      .select("id,title,amount,transaction_date,category_id,wallet_id")
      .eq("owner_id", uid)
      .order("transaction_date", { ascending: false })
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
  await getProfile(state.session.user.id);

  welcome.textContent = `Xin chao, ${state.profile.username || state.session.user.email}`;
  roleBadge.textContent = `Role: ${state.profile.role || "user"}`;

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
    setMessage(authMessage, error.message, true);
    return;
  }

  state.session = data.session;
  await getProfile(state.session.user.id);
  welcome.textContent = `Xin chao, ${state.profile.username || state.session.user.email}`;
  roleBadge.textContent = `Role: ${state.profile.role || "user"}`;

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

  const { error } = await state.supabase.auth.signUp({ email, password });
  if (error) {
    setMessage(authMessage, error.message, true);
    return;
  }

  setMessage(authMessage, "Da tao tai khoan. Kiem tra email neu bat confirm.", false);
});

logoutBtn.addEventListener("click", async () => {
  await state.supabase.auth.signOut();
  state.session = null;
  state.profile = null;
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

  const { error } = await state.supabase.from("wallets").insert({
    owner_id: state.session.user.id,
    name,
    wallet_type: walletType,
    balance: 0
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

  const { error } = await state.supabase.from("categories").insert({
    owner_id: state.session.user.id,
    name,
    kind
  });

  if (error) {
    setMessage(appMessage, error.message, true);
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
    owner_id: state.session.user.id,
    title: document.getElementById("txName").value.trim(),
    amount: Number(document.getElementById("txAmount").value),
    transaction_date: document.getElementById("txDate").value,
    category_id: txCategory.value,
    wallet_id: txWallet.value,
    note: document.getElementById("txNote").value.trim() || null
  };

  const { error } = await state.supabase.from("transactions").insert(payload);
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
    setMessage(authMessage, "Khong ket noi duoc Supabase. Kiem tra URL/key trong app.js", true);
    setView("auth");
  }
});

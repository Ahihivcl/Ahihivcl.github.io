require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = process.env.SYNC_DEFAULT_PASSWORD || "TempPass#2026";
const DRY_RUN = String(process.env.SYNC_DRY_RUN || "false").toLowerCase() === "true";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fetchMissingNguoiDung() {
  const { data, error } = await supabase
    .from("nguoidung")
    .select("nguoidung_id, email, ten_tk, auth_user_id")
    .is("auth_user_id", null)
    .not("email", "is", null)
    .order("nguoidung_id", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function linkByEmailFirst() {
  const sql = `
    update public.nguoidung n
    set auth_user_id = u.id
    from auth.users u
    where n.auth_user_id is null
      and lower(n.email) = lower(u.email);
  `;

  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    return false;
  }

  return true;
}

async function createAuthUser(email, password) {
  const result = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (result.error) {
    return { ok: false, error: result.error };
  }

  return { ok: true, userId: result.data.user.id };
}

async function findAuthUserIdByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const users = data?.users || [];
    if (!users.length) {
      return null;
    }

    const match = users.find(u => String(u.email || "").toLowerCase() === email);
    if (match) {
      return match.id;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function linkNguoiDung(nguoiDungId, authUserId) {
  const { error } = await supabase
    .from("nguoidung")
    .update({ auth_user_id: authUserId })
    .eq("nguoidung_id", nguoiDungId);

  if (error) {
    throw error;
  }
}

async function run() {
  console.log("== Sync Auth Users ==");
  console.log(`Dry run: ${DRY_RUN}`);

  // Optional pre-link step if SQL helper function exists in DB.
  // If exec_sql RPC is absent, this just silently continues.
  await linkByEmailFirst();

  const missing = await fetchMissingNguoiDung();
  if (!missing.length) {
    console.log("No users missing auth_user_id.");
    return;
  }

  console.log(`Found ${missing.length} rows missing auth_user_id.`);

  const summary = {
    created: 0,
    linked: 0,
    skipped: 0,
    failed: 0
  };

  for (const row of missing) {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email) {
      summary.skipped += 1;
      console.log(`[SKIP] ${row.nguoidung_id}: empty email`);
      continue;
    }

    if (DRY_RUN) {
      summary.skipped += 1;
      console.log(`[DRY] ${row.nguoidung_id}: would create auth user for ${email}`);
      continue;
    }

    const created = await createAuthUser(email, DEFAULT_PASSWORD);
    if (!created.ok) {
      const message = String(created.error.message || "").toLowerCase();
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        try {
          const existingAuthId = await findAuthUserIdByEmail(email);
          if (existingAuthId) {
            await linkNguoiDung(row.nguoidung_id, existingAuthId);
            summary.linked += 1;
            console.log(`[LINK] ${row.nguoidung_id} -> ${existingAuthId} (${email})`);
            continue;
          }
        } catch (lookupErr) {
          summary.failed += 1;
          console.log(`[FAIL-LOOKUP] ${row.nguoidung_id} ${email}: ${lookupErr.message}`);
          continue;
        }
      }

      summary.failed += 1;
      console.log(`[FAIL] ${row.nguoidung_id} ${email}: ${created.error.message}`);
      continue;
    }

    summary.created += 1;

    try {
      await linkNguoiDung(row.nguoidung_id, created.userId);
      summary.linked += 1;
      console.log(`[OK] ${row.nguoidung_id} -> ${created.userId} (${email})`);
    } catch (err) {
      summary.failed += 1;
      console.log(`[FAIL-LINK] ${row.nguoidung_id} ${email}: ${err.message}`);
    }
  }

  console.log("== Summary ==");
  console.log(summary);
  console.log("Default password for newly created users:", DEFAULT_PASSWORD);
  console.log("Users should change password after first login.");
}

run().catch(err => {
  console.error("syncAuthUsers failed:", err.message || err);
  process.exit(1);
});

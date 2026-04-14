-- Supabase PostgreSQL schema for QLCTCN demo app
-- Run in Supabase SQL Editor

CREATE SEQUENCE IF NOT EXISTS seq_user START 1;
CREATE SEQUENCE IF NOT EXISTS seq_wallet START 1;
CREATE SEQUENCE IF NOT EXISTS seq_category START 1;
CREATE SEQUENCE IF NOT EXISTS seq_transaction START 1;

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  user_code TEXT UNIQUE NOT NULL DEFAULT ('ND' || LPAD(nextval('seq_user')::text, 2, '0')),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  category_code TEXT UNIQUE NOT NULL DEFAULT ('DM' || LPAD(nextval('seq_category')::text, 2, '0')),
  category_name TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'saving'))
);

CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  wallet_code TEXT UNIQUE NOT NULL DEFAULT ('Vi' || LPAD(nextval('seq_wallet')::text, 2, '0')),
  wallet_name TEXT NOT NULL,
  balance NUMERIC(19, 2) NOT NULL DEFAULT 0,
  user_code TEXT NOT NULL REFERENCES app_users(user_code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_code TEXT UNIQUE NOT NULL DEFAULT ('GD' || LPAD(nextval('seq_transaction')::text, 2, '0')),
  title TEXT NOT NULL,
  amount NUMERIC(19, 2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  note TEXT,
  user_code TEXT NOT NULL REFERENCES app_users(user_code) ON DELETE CASCADE,
  category_code TEXT NOT NULL REFERENCES categories(category_code),
  wallet_code TEXT NOT NULL REFERENCES wallets(wallet_code)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_code ON wallets(user_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_code_date ON transactions(user_code, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_code);

-- Seed users
INSERT INTO app_users (username, email, password, role)
VALUES
  ('lethanh', 'lethanh@outlook.com', 'thanh456', 'admin'),
  ('nguyenhoang', 'nguyenhoang@gmail.com', 'hoang123', 'user')
ON CONFLICT (username) DO NOTHING;

-- Seed categories
INSERT INTO categories (category_name, kind)
VALUES
  ('Luong', 'income'),
  ('Thuong', 'income'),
  ('An uong', 'expense'),
  ('Di chuyen', 'expense'),
  ('Tiet kiem', 'saving')
ON CONFLICT (category_name) DO NOTHING;

-- Seed wallets
INSERT INTO wallets (wallet_name, balance, user_code)
SELECT 'Momo', 5000000, u.user_code
FROM app_users u
WHERE u.username = 'lethanh'
  AND NOT EXISTS (SELECT 1 FROM wallets w WHERE w.wallet_name = 'Momo' AND w.user_code = u.user_code);

INSERT INTO wallets (wallet_name, balance, user_code)
SELECT 'Vietcombank', 8000000, u.user_code
FROM app_users u
WHERE u.username = 'nguyenhoang'
  AND NOT EXISTS (SELECT 1 FROM wallets w WHERE w.wallet_name = 'Vietcombank' AND w.user_code = u.user_code);

-- Seed transactions (idempotent by title/date/user)
INSERT INTO transactions (title, amount, transaction_date, note, user_code, category_code, wallet_code)
SELECT
  'Luong thang 4',
  12000000,
  DATE '2026-04-01',
  'Luong cong ty',
  u.user_code,
  (SELECT category_code FROM categories WHERE category_name = 'Luong' LIMIT 1),
  (SELECT wallet_code FROM wallets WHERE wallet_name = 'Momo' AND user_code = u.user_code LIMIT 1)
FROM app_users u
WHERE u.username = 'lethanh'
  AND NOT EXISTS (
  SELECT 1 FROM transactions
  WHERE title = 'Luong thang 4' AND transaction_date = DATE '2026-04-01' AND user_code = u.user_code
);

INSERT INTO transactions (title, amount, transaction_date, note, user_code, category_code, wallet_code)
SELECT
  'Tien an trua',
  100000,
  DATE '2026-04-03',
  'Chi tieu hang ngay',
  u.user_code,
  (SELECT category_code FROM categories WHERE category_name = 'An uong' LIMIT 1),
  (SELECT wallet_code FROM wallets WHERE wallet_name = 'Vietcombank' AND user_code = u.user_code LIMIT 1)
FROM app_users u
WHERE u.username = 'nguyenhoang'
  AND NOT EXISTS (
  SELECT 1 FROM transactions
  WHERE title = 'Tien an trua' AND transaction_date = DATE '2026-04-03' AND user_code = u.user_code
);

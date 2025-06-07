-- VIPボーナス関連テーブル

CREATE TABLE vip_bonus_links (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE vip_bonus_redeemed (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  redeemed_at TIMESTAMP NOT NULL,
  UNIQUE (user_id, token)
);

-- usersテーブルにlast_work追加

ALTER TABLE users ADD COLUMN last_work TIMESTAMP;

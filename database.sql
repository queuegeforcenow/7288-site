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

ALTER TABLE users ADD COLUMN last_work_at TIMESTAMP;



CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(16) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  total_bet BIGINT DEFAULT 0,
  balance BIGINT DEFAULT 0
);


CREATE TABLE vip_links (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE bonus_links (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_by UUID[] DEFAULT '{}'
);


CREATE TABLE vip_claims (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  link_id INTEGER REFERENCES vip_links(id),
  claimed_at TIMESTAMP NOT NULL
);

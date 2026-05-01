ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET email_verified = true WHERE google_sub IS NOT NULL;

CREATE TABLE email_verifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);

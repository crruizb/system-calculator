CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug      VARCHAR(63) UNIQUE NOT NULL,
    name      VARCHAR(255) NOT NULL,
    plan      VARCHAR(20)  NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_sub    VARCHAR(255) UNIQUE,
    role          VARCHAR(20) NOT NULL DEFAULT 'owner',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_has_auth CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL)
);

CREATE TABLE calculators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug        VARCHAR(63) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    sheet_url   VARCHAR(2048) NOT NULL,
    settings    JSONB NOT NULL DEFAULT '{}',
    branding    JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    stripe_subscription_id  VARCHAR(255),
    plan                    VARCHAR(20) NOT NULL DEFAULT 'free',
    status                  VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_end      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 001-audit-ledger.sql  --  The immutable Master Registry audit ledger
-- Runs once on first container start (empty data dir), via
-- /docker-entrypoint-initdb.d. Idempotent guards included so re-running by hand
-- is safe.
-- =============================================================================
-- Design contract (from the Sovereign AI Engine "Immutable Rules"):
--   * Every autonomous detection / proposed prescription / execution / rollback
--     is an INSERT here. Nothing else writes.
--   * APPEND-ONLY: UPDATE and DELETE are blocked at two layers --
--       (1) role privileges (ai_agent gets INSERT + SELECT only), and
--       (2) a trigger that RAISES on UPDATE/DELETE for ALL roles incl. owner.
--   * TAMPER-EVIDENT: each row carries a SHA-256 hash chained to the prior row.
--     A single altered/removed row breaks the chain for everything after it.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;     -- semantic memory for the orchestrator
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- digest() for the hash chain

-- --- The ledger -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_audit_ledger (
    id              bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ts              timestamptz   NOT NULL DEFAULT now(),
    node            text          NOT NULL,             -- node-1 | node-2 | nas
    agent           text          NOT NULL,             -- which agent/model acted
    action          text          NOT NULL,             -- allowlisted action name
    params          jsonb         NOT NULL DEFAULT '{}'::jsonb,
    justification   text          NOT NULL,             -- why (audit requires it)
    decision        text          NOT NULL              -- lifecycle state
                      CHECK (decision IN ('detected','proposed','approved',
                                          'executed','rolled_back','refused')),
    health_status   text,                               -- Uptime Kuma verdict
    prev_hash       text          NOT NULL,
    row_hash        text          NOT NULL
);

-- --- Hash chain: compute row_hash = sha256(prev_hash || canonical payload) ---
-- BEFORE INSERT, link each row to the latest existing row_hash. Genesis row
-- links to 64 zeroes.
CREATE OR REPLACE FUNCTION ai_audit_ledger_chain()
RETURNS trigger AS $$
DECLARE
    last_hash text;
    payload   text;
BEGIN
    SELECT row_hash INTO last_hash
      FROM ai_audit_ledger
     ORDER BY id DESC
     LIMIT 1;

    NEW.prev_hash := COALESCE(last_hash, repeat('0', 64));

    -- Canonical, order-stable serialization of the auditable fields.
    payload := NEW.prev_hash
            || '|' || NEW.ts::text
            || '|' || NEW.node
            || '|' || NEW.agent
            || '|' || NEW.action
            || '|' || COALESCE(NEW.params::text, '{}')
            || '|' || NEW.justification
            || '|' || NEW.decision
            || '|' || COALESCE(NEW.health_status, '');

    NEW.row_hash := encode(digest(payload, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_audit_ledger_chain ON ai_audit_ledger;
CREATE TRIGGER trg_ai_audit_ledger_chain
    BEFORE INSERT ON ai_audit_ledger
    FOR EACH ROW EXECUTE FUNCTION ai_audit_ledger_chain();

-- --- Immutability: block UPDATE/DELETE for everyone, owner included ----------
CREATE OR REPLACE FUNCTION ai_audit_ledger_immutable()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'ai_audit_ledger is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_audit_ledger_immutable ON ai_audit_ledger;
CREATE TRIGGER trg_ai_audit_ledger_immutable
    BEFORE UPDATE OR DELETE ON ai_audit_ledger
    FOR EACH ROW EXECUTE FUNCTION ai_audit_ledger_immutable();

-- --- Chain verification helper ----------------------------------------------
-- Returns the first id where the chain breaks, or NULL if the ledger is intact.
CREATE OR REPLACE FUNCTION ai_audit_ledger_verify()
RETURNS bigint AS $$
DECLARE
    r          record;
    expected   text := repeat('0', 64);
    payload    text;
    computed   text;
BEGIN
    FOR r IN SELECT * FROM ai_audit_ledger ORDER BY id ASC LOOP
        IF r.prev_hash <> expected THEN
            RETURN r.id;
        END IF;
        payload := r.prev_hash
                || '|' || r.ts::text
                || '|' || r.node
                || '|' || r.agent
                || '|' || r.action
                || '|' || COALESCE(r.params::text, '{}')
                || '|' || r.justification
                || '|' || r.decision
                || '|' || COALESCE(r.health_status, '');
        computed := encode(digest(payload, 'sha256'), 'hex');
        IF computed <> r.row_hash THEN
            RETURN r.id;
        END IF;
        expected := r.row_hash;
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- --- Least-privilege agent role ---------------------------------------------
-- The AI / n8n connect as ai_agent: INSERT + SELECT only. No UPDATE, DELETE,
-- TRUNCATE -- enforced at the privilege layer in addition to the trigger.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_agent') THEN
        EXECUTE format('CREATE ROLE ai_agent LOGIN PASSWORD %L',
                       current_setting('custom.ai_agent_password', true));
    END IF;
END $$;

-- Fallback if the GUC was not provided at init: set the password from env later
-- with  ALTER ROLE ai_agent PASSWORD '...';
GRANT CONNECT ON DATABASE poetech_registry TO ai_agent;
GRANT USAGE ON SCHEMA public TO ai_agent;
GRANT INSERT, SELECT ON ai_audit_ledger TO ai_agent;
GRANT EXECUTE ON FUNCTION ai_audit_ledger_verify() TO ai_agent;
REVOKE UPDATE, DELETE, TRUNCATE ON ai_audit_ledger FROM ai_agent;

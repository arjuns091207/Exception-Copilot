-- Audit logs must be append-only.

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'Audit logs are append-only. UPDATE and DELETE are prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_append_only
ON public.audit_logs;

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- Performance indexes.

CREATE INDEX IF NOT EXISTS idx_exceptions_status
ON public.exceptions(status);

CREATE INDEX IF NOT EXISTS idx_exceptions_severity
ON public.exceptions(severity);

CREATE INDEX IF NOT EXISTS idx_exceptions_partner_name
ON public.exceptions(partner_name);

CREATE INDEX IF NOT EXISTS idx_exceptions_created_at
ON public.exceptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_exception_id
ON public.ai_analyses(exception_id);

CREATE INDEX IF NOT EXISTS idx_approvals_exception_id
ON public.approvals(exception_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_exception_id
ON public.audit_logs(exception_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON public.audit_logs(created_at DESC);
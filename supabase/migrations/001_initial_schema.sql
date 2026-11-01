-- Exception Copilot
-- Baseline schema migration
-- Existing tables are preserved through IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR NOT NULL,
    role VARCHAR NOT NULL
        CHECK (role IN ('operator', 'reviewer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_code VARCHAR(30) UNIQUE NOT NULL,
    partner_name VARCHAR(150) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    error_code VARCHAR(50) NOT NULL,
    error_description TEXT,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending', 'analyzed', 'approved', 'rejected',
            'validating', 'processing', 'sent', 'resolved', 'failed'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID NOT NULL
        REFERENCES public.exceptions(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    confidence NUMERIC(5,2)
        CHECK (confidence >= 0 AND confidence <= 100),
    suggested_fix JSONB NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID NOT NULL REFERENCES public.exceptions(id),
    analysis_id UUID NOT NULL REFERENCES public.ai_analyses(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    decision VARCHAR(20) NOT NULL
        CHECK (decision IN ('approved', 'rejected')),
    decision_reason TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_id UUID REFERENCES public.exceptions(id),
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preserve Row Level Security.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
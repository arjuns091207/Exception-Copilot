CREATE OR REPLACE FUNCTION public.decide_exception_approval(
    p_exception_code TEXT,
    p_analysis_id UUID,
    p_user_id UUID,
    p_decision TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exception exceptions%ROWTYPE;
    v_analysis ai_analyses%ROWTYPE;
    v_role TEXT;
    v_approval_id UUID;
    v_decided_at TIMESTAMPTZ := NOW();
BEGIN
    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Decision must be approved or rejected';
    END IF;

    SELECT role INTO v_role
    FROM users
    WHERE id = p_user_id;

    IF v_role NOT IN ('reviewer', 'admin') OR v_role IS NULL THEN
        RAISE EXCEPTION 'Reviewer or admin role required';
    END IF;

    SELECT * INTO v_exception
    FROM exceptions
    WHERE exception_code = p_exception_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exception not found';
    END IF;

    IF v_exception.status NOT IN ('pending', 'analyzed') THEN
        RAISE EXCEPTION 'Exception is not eligible for a decision';
    END IF;

    SELECT * INTO v_analysis
    FROM ai_analyses
    WHERE id = p_analysis_id
      AND exception_id = v_exception.id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Analysis does not belong to this exception';
    END IF;

    IF EXISTS (
        SELECT 1 FROM ai_analyses
        WHERE exception_id = v_exception.id
          AND created_at > v_analysis.created_at
    ) THEN
        RAISE EXCEPTION 'Analysis is stale; use the latest analysis';
    END IF;

    IF EXISTS (
        SELECT 1 FROM approvals
        WHERE exception_id = v_exception.id
    ) THEN
        RAISE EXCEPTION 'A decision already exists for this exception';
    END IF;

    INSERT INTO approvals (
        exception_id, analysis_id, user_id, decision, decision_reason, decided_at
    )
    VALUES (
        v_exception.id, p_analysis_id, p_user_id,
        p_decision, p_reason, v_decided_at
    )
    RETURNING id INTO v_approval_id;

    UPDATE exceptions
    SET status = p_decision
    WHERE id = v_exception.id;

    INSERT INTO audit_logs (
        exception_id, user_id, action, old_value, new_value, details
    )
    VALUES (
        v_exception.id,
        p_user_id,
        'exception_' || p_decision,
        jsonb_build_object('status', v_exception.status),
        jsonb_build_object('status', p_decision),
        jsonb_build_object(
            'approval_id', v_approval_id,
            'analysis_id', p_analysis_id,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'approval_id', v_approval_id,
        'exception_id', v_exception.id,
        'analysis_id', p_analysis_id,
        'decision', p_decision,
        'decided_at', v_decided_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.decide_exception_approval(TEXT, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_exception_approval(TEXT, UUID, UUID, TEXT, TEXT) TO service_role;

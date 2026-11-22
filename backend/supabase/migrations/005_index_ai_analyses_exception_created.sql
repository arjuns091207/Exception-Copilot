CREATE INDEX idx_ai_analyses_exception_created
ON public.ai_analyses (exception_id, created_at DESC);
ALTER TABLE public.approvals
ADD CONSTRAINT approvals_exception_id_unique
UNIQUE (exception_id);
-- INVOICES TABLE
-- Other business tables (clients, cases, tasks, documents, deadlines, messages)
-- were created in earlier migrations. This adds the missing invoices table.

CREATE TABLE IF NOT EXISTS public.invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount_ghs  NUMERIC(12,2) NOT NULL CHECK (amount_ghs > 0),
  status      TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
  due_date    DATE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices: user can read own" ON public.invoices
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "invoices: user can insert own" ON public.invoices
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "invoices: user can update own" ON public.invoices
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "invoices: user can delete own" ON public.invoices
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

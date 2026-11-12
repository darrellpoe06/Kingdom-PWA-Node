-- =============================================================================
-- 0323 — a book is reviewed by those who hold it, and the shelf shows the
-- average to everyone (DR-1449)
-- =============================================================================
-- A Payhip-class storefront shows a rating on each product. Ours rests on
-- the purchaser-gated conversation (0051): a review is one more kind of
-- message there, with a rating from 1 to 5, and only a person who owns the
-- book may post one (the existing RLS), one per person per book. Everyone,
-- signed in or not, may read the SUMMARY (count and average) through a
-- SECURITY DEFINER function that returns numbers only, never a body or a
-- name, so the storefront can show stars without opening the conversation.
-- =============================================================================

ALTER TABLE public.book_conversations
  ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE public.book_conversations DROP CONSTRAINT IF EXISTS book_conversations_kind_check;
ALTER TABLE public.book_conversations
  ADD CONSTRAINT book_conversations_kind_check CHECK (kind IN ('question', 'comment', 'answer', 'review'));

-- A review carries a rating; nothing else does.
ALTER TABLE public.book_conversations DROP CONSTRAINT IF EXISTS book_conversations_review_has_rating;
ALTER TABLE public.book_conversations
  ADD CONSTRAINT book_conversations_review_has_rating CHECK ((kind = 'review') = (rating IS NOT NULL));

-- One review per person per book.
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_conversations_one_review
  ON public.book_conversations (product_id, user_id) WHERE kind = 'review';

-- The summary anyone may read: how many reviews and their average, per book.
CREATE OR REPLACE FUNCTION public.book_review_summary()
RETURNS TABLE (product_id text, reviews integer, average numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.product_id, count(*)::integer AS reviews, round(avg(c.rating)::numeric, 2) AS average
  FROM public.book_conversations c
  WHERE c.kind = 'review' AND c.rating IS NOT NULL
  GROUP BY c.product_id;
$$;
REVOKE ALL ON FUNCTION public.book_review_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_review_summary() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

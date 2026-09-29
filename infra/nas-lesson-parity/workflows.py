"""
workflows.py -- the parity interface any workflow can join later (DR-0671).

Lessons are the only workflow built now. The loop in parity_loop.py is
measure -> gap -> fix -> promote, and every step reads a workflow through this
interface, so another workflow (a sermon summary, a property listing, a tax
extract) joins by supplying one WorkflowSpec and a versions table of the same
shape as public.lesson_versions:

    (id, teaching_row_id, lesson_id, writer, model_label, prompt_sha256,
     prompt_text, body jsonb, gate_results jsonb, elapsed_ms, created_at,
     published)   -- teaching_row_id / lesson_id are the workflow's
                     input id and output id.

A WorkflowSpec names:
  name              the workflow ("lessons")
  reference_family  the writer whose output is the reference ("claude")
  compare(ref, cand) -> {score, passed, sections, floors, gaps}
                    deterministic; every section returns its evidence
  crossref(versions, reference_family) -> {matrix, consensus, insights, excluded}
  gap_classes       {class: the kind of algorithmic fix that closes it}
  fixes_package     the package whose modules implement GAP_CLASS/STAGE/apply
  threshold, n      promotion: score >= threshold AND every floor, n times in a row

Rules every workflow keeps: no LLM judges a score; the reference is never
passed through fixes; a gate a version fails excludes it from consensus; a
contribution only one writer brought is a candidate insight, not an error.
"""
import parity_core as pc


class WorkflowSpec:
    def __init__(self, name, reference_family, compare, crossref, gap_classes, fixes_package, threshold, n):
        self.name = name
        self.reference_family = reference_family
        self.compare = compare
        self.crossref = crossref
        self.gap_classes = gap_classes
        self.fixes_package = fixes_package
        self.threshold = threshold
        self.n = n


LESSONS = WorkflowSpec(
    name="lessons",
    reference_family="claude",
    compare=pc.compare,
    crossref=pc.crossref,
    gap_classes=pc.GAP_CLASSES,
    fixes_package="fixes",
    threshold=pc.PROMOTION_THRESHOLD,
    n=pc.PROMOTION_N,
)

REGISTRY = {LESSONS.name: LESSONS}

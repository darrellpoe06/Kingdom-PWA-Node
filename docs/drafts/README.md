# docs/drafts — work in progress, deliberately outside the source tree

A course is not finished until it is **registered in `LEARN_CATALOG` and reachable
by a reader** — `learn-catalog-render.test.jsx` enforces exactly that: every
course lib in `app/src/lib` must be surfaced in the catalog ("built ⇒ surfaced",
DR-0065). That gate is right and it is not to be worked around.

So a course that is part-authored lives **here** until it is whole, and is moved
into `app/src/lib` in the commit that also registers it, writes its nine exports
and ships its test. That keeps two things true at once: nothing half-built can
reach a reader, and hours of authoring are not lost when an ephemeral sandbox is
reclaimed.

Nothing in this directory is imported, linted, bundled or executed.

| file | what it is | state |
|---|---|---|
_Empty. Banking moved into `app/src/lib` in the commit that registered it, which is how this directory is meant to be used._

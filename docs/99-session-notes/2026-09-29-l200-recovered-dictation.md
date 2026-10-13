# L200 provenance — Darrell's spoken lesson, recovered from a growing-repeat dictation

- **Source row:** `public.agent_inbox` id `8d290c20-1d1c-4901-b8a8-a99b45734e76` (Supabase project `mjjlevhdufpaplypnqrv`)
- **Created:** 2026-09-29 17:59:56 UTC, by Darrell's phone account; source `thinking-space`
- **Tags at intake:** `lesson`, `lesson-name-ok`, `lesson-name:Darrell Poe`
- **Raw body:** 54,115 characters, 10,602 space-separated words
- **Why it was garbled:** Android Chrome dictation appended every partial recognition result, so each utterance appears many times, each copy one or two words longer than the last (the defect itself is fixed separately, DR-0685). Nothing in the row was edited; the recovery reads it only.
- **Lesson built from it:** L200 (DR-0684)

## How the words were recovered (deterministic)

Each appended partial either repeats the previous partial and extends it, or starts a new sentence run. So wherever a partial was followed by its own extension, the word sequence contains an immediate repeat `X X` (the partial, then the same words again at the start of the next, longer partial). Removing the first copy of every such immediate repeat leaves the last, longest version of each run, in order.

The rule, run inside the database on the row itself (no copy of the text passed through hand transcription):

1. Split the body on single spaces into a word array.
2. Walk the array from the first word. At each position `i`, look for the **longest** `L` (up to 250 words) such that words `i .. i+L-1` equal words `i+L .. i+2L-1`.
3. If one is found, delete the first copy (`i .. i+L-1`) and test the same position again. If none is found, move to `i+1`.
4. Join what remains with single spaces.

```sql
create or replace function pg_temp.collapse_squares_long(w text[], maxl int) returns text[] language plpgsql as $$
declare i int := 1; l int; n int; k int; ok boolean; found_sq boolean;
begin
  loop
    n := coalesce(array_length(w,1),0);
    exit when i > n;
    found_sq := false;
    l := least(maxl, (n - i + 1) / 2);
    while l >= 1 loop
      ok := true;
      for k in 0..l-1 loop
        if w[i+k] <> w[i+l+k] then ok := false; exit; end if;
      end loop;
      if ok then w := w[1:i-1] || w[i+l:n]; found_sq := true; exit; end if;
      l := l - 1;
    end loop;
    if not found_sq then i := i + 1; end if;
  end loop;
  return w;
end $$;
select array_to_string(pg_temp.collapse_squares_long(regexp_split_to_array(body,' '), 250),' ')
from public.agent_inbox where id = '8d290c20-1d1c-4901-b8a8-a99b45734e76';
```

**Why longest-first.** A first run tried the shortest repeat first. It failed on the last sentence: each partial there began with a stray doubled word ("the the ones ..."), and collapsing that one-word repeat first broke the long repeat, so about 3,000 characters of that sentence stayed repeated. Longest-first removes the whole earlier partial before any one-word repeat inside it is looked at. The cost is small and named: a word he really did say twice in a row would also be collapsed to one. In speech like this that loses a stammer, not a meaning.

**Result:** 202 words, 1,040 characters. The final run ends in exactly the words the raw body ends with ("... break all that down and put that in lesson"), and every word below appears in the raw body in this order.

## His words, as recovered (verbatim output of the rule)

> lesson or how did the all those people know Jesus was supposed to do when he got there how did they know that Jesus was doing what he was doing I needed to do how do they know he was son of David all of those things where documentation were they using were they only using the Old Testament and can I find every single reference and what made them know specifically that he will come in on a coat or specifically like these things and again that the how does the books of other books that they State not the Apocrypha for the ones that historically you know in a historical sense and also in a sort of data-driven since you know the narrative that we already know about Yahweh how does that impact what does that look like through the lens of reading again not the ones that we know that are actually not like we can tell that they're documentedly false but the ones that sound like you look smell all of that and actually you know them as historical context and they were in the Bible in the past break all that down and put that in lesson

## Rendered for meaning (DR-0331)

Lesson. How did all those people know what Jesus was supposed to do when He got there? How did they know that what Jesus was doing was what He had to do? How did they know He was the Son of David, and all of those things? What documentation were they using? Were they only using the Old Testament? Can I find every single reference? And what made them know, specifically, that He would come in on a colt, and things that specific?

And again: the other books that they name (not the Apocrypha). The ones that are historical, in a historical sense and in a data-driven sense. Given the narrative we already know about Yahweh, how does that affect it, and what does it look like through that lens? Not the ones we know are documented as false, but the ones that look right, sound right and smell right, that we know as historical context, and that were in the Bible in the past. Break all of that down and put it in a lesson.

## What was ambiguous, said plainly

| heard | rendered as | why |
|---|---|---|
| "come in on a **coat**" | colt | The sentence is about a specific prophecy of how He would arrive; Zechariah 9:9 ("riding upon an ass, and upon a colt the foal of an ass") and Matthew 21:5 / John 12:15 are the only arrival-on-an-animal prophecy in the Word. No other reading makes sense of "come in on". |
| "data-driven **since**" | sense | Parallel to "in a historical sense" just before it. |
| "the books of other books that they **State**" | the other books they name | Not certain. Read with the end of the sentence ("they were in the Bible in the past"), it most likely means books the Bible itself names or quotes. It could also mean books other people point to. The lesson takes the first reading and also covers the second by teaching how to test any book offered as history. |
| "sound like you look smell all of that" | look right, sound right, smell right | The everyday "smell test": sources that hold up. |
| "they were in the Bible in the past" | named or quoted in the Bible | Read with "historical context"; the lesson does not claim any lost book was once part of Scripture. |
| "doing what he was doing I needed to do" | what He was doing was what He had to do | Recognizer wording; the sense is the necessity of His acts (cf. Luke 24:26, "Ought not Christ to have suffered these things"). |

## What the caller's premise said, and what the full text shows

The intake note guessed the lesson was about telling apart people and practices in the Bible that look like something in the historical record. The full text shows a **two-part question**: (1) how did people in the Gospels know Jesus was the promised Son of David, what record were they reading, was it only the Old Testament, where is every reference, and how did they know about the colt; and (2) the other books the Bible names, separated from the documented fakes, and how the credible historical record fits the narrative of Yahweh. The lesson is built on the full text, not on the guess.

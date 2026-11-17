// =============================================================================
// WordBuilder — spell the Bible word (kids) or put the verse in order (teens)
// =============================================================================
// The words are the weekly memory verse's own, loaded from the hosted KJV at
// play time (lib/kids/word-builder.js); the week's seed replays the same
// shuffle on every device; stars are this round's alone. A verse the device
// cannot load says so, and nothing is typed in its place.
import React, { useEffect, useMemo, useState } from 'react';
import { verseText } from '../../lib/bible-kjv.js';
import { useTextToSpeech } from '../../lib/tts.js';
import { weeklyVerse, weekIndex } from '../../lib/youth-zone.js';
import {
  buildableWords, scrambleLetters, hintTokens, placedSoFarIsRight, spelled, nextLetter, starsFor,
  phrasesOf, shufflePhrases, inOrder, longestWord,
} from '../../lib/kids/word-builder.js';
import { Shot, ShotSlot, GuideBubble, KidsIcon } from './GuideArt.jsx';

function Stars({ n, max = 4 }) {
  return (
    <div className="kz-stars" aria-label={`${n} of ${max} stars`} data-testid="stars" data-stars={n}>
      {Array.from({ length: max }, (_, i) => <KidsIcon key={i} name={i < n ? 'starfill' : 'starline'} />)}
    </div>
  );
}

/** Kids: one word at a time from its shuffled letters. */
export function SpellRound({ text, verseRef, word, seed, onNext, last = false }) {
  const [placed, setPlaced] = useState([]);
  const [hints, setHints] = useState(0);
  const [shake, setShake] = useState(null);
  const tts = useTextToSpeech();
  const tiles = useMemo(() => scrambleLetters(word.word, seed), [word, seed]);
  const used = new Set(placed.map((t) => t.id));
  const done = spelled(word.word, placed);
  const tokens = useMemo(() => hintTokens(text, word.index), [text, word]);
  const tap = (tile) => {
    if (done || used.has(tile.id)) return;
    const next = placed.concat([tile]);
    if (placedSoFarIsRight(word.word, next)) { setPlaced(next); setShake(null); } else { setShake(tile.id); }
  };
  const showLetter = () => {
    const want = nextLetter(word.word, placed);
    const tile = tiles.find((t) => !used.has(t.id) && t.letter === want);
    if (tile) { setPlaced(placed.concat([tile])); setHints(hints + 1); }
  };
  return (
    <div data-testid="spell-round" data-word={word.word} data-done={done ? 'true' : 'false'}>
      <div className="kz-hint">
        {tokens.map((t, i) => (t.blank
          ? <span key={i} className="kz-blank" data-testid="hint-blank">{placed.map((p) => p.letter.toUpperCase()).join(' ')}{'_ '.repeat(Math.max(0, t.answer.length - placed.length))}</span>
          : <span key={i}>{t.word} </span>))}
        <span className="kz-ref">{verseRef} · KJV</span>
      </div>
      <div className="kz-slots" aria-label="The letters you placed">
        {word.word.split('').map((ch, i) => <div key={i} className={`kz-letter${placed[i] ? ' f' : ''}`}>{placed[i] ? placed[i].letter.toUpperCase() : ''}</div>)}
      </div>
      <div className="kz-tiles" aria-label="Tap the letters in order">
        {tiles.map((t) => (
          <button key={t.id} type="button" className={`kz-tile${shake === t.id ? ' shake' : ''} kz-focus-visible`} onClick={() => tap(t)} disabled={used.has(t.id) || done} data-testid={`tile-${t.id}`} aria-label={`letter ${t.letter.toUpperCase()}`}>
            {t.letter.toUpperCase()}
          </button>
        ))}
      </div>
      <Stars n={starsFor({ hints })} />
      <div className="kz-actions kz-focus-visible">
        <button type="button" className="kz-act blue kz-focus-visible" onClick={() => tts && tts.supported && tts.speak(text)} disabled={!(tts && tts.supported)}><KidsIcon name="read" /> Hear the verse</button>
        <button type="button" className="kz-act orange kz-focus-visible" onClick={showLetter} disabled={done} data-testid="show-letter"><KidsIcon name="bulb" /> Show a letter</button>
      </div>
      {done && (
        <div className="kz-actions kz-focus-visible">
          <span className="lc-small" role="status" data-testid="spell-result">You spelled {word.display}! {starsFor({ hints })} stars.</span>
          <button type="button" className="kz-act green kz-focus-visible" onClick={onNext} data-testid="spell-next">{last ? 'Finish ▶' : 'Next word ▶'}</button>
        </div>
      )}
    </div>
  );
}

/** Teens: the verse's phrases back in order, then the longest word with no hint. */
export function OrderRound({ text, verseRef, seed, onNext }) {
  const phrases = useMemo(() => phrasesOf(text), [text]);
  const shuffled = useMemo(() => shufflePhrases(phrases, seed), [phrases, seed]);
  const [arranged, setArranged] = useState([]);
  const [wrong, setWrong] = useState(null);
  const done = arranged.length === phrases.length && inOrder(arranged);
  const tap = (p) => {
    if (done || arranged.some((a) => a.order === p.order)) return;
    if (p.order === arranged.length) { setArranged(arranged.concat([p])); setWrong(null); } else setWrong(p.order);
  };
  if (phrases.length < 2) return null;
  return (
    <div data-testid="order-round" data-done={done ? 'true' : 'false'}>
      <div className="kz-hint"><span className="kz-ref" style={{ marginTop: 0 }}>{verseRef} · put the verse in order</span></div>
      <div aria-label="Your order">
        {arranged.map((p) => <span key={p.order} className="kz-phrase placed">{p.phrase}</span>)}
      </div>
      <div aria-label="Tap the next phrase">
        {shuffled.filter((p) => !arranged.some((a) => a.order === p.order)).map((p) => (
          <button key={p.order} type="button" className={`kz-phrase${wrong === p.order ? ' shake' : ''} kz-focus-visible`} onClick={() => tap(p)} data-testid={`phrase-${p.order}`}>{p.phrase}</button>
        ))}
      </div>
      {wrong != null && <p className="lc-small" role="status">Not yet. Which part comes next?</p>}
      {done && (
        <div className="kz-actions kz-focus-visible">
          <span className="lc-small" role="status" data-testid="order-result">In order! Now spell the longest word.</span>
          <button type="button" className="kz-act green kz-focus-visible" onClick={onNext} data-testid="order-next">Next ▶</button>
        </div>
      )}
    </div>
  );
}

export default function WordBuilder({ door = 'kids', now = null, loadVerse = verseText, onBack = null, shotList = undefined }) {
  const at = useMemo(() => now || new Date(), [now]);
  const verse = weeklyVerse(door, at);
  const seed = weekIndex(at);
  const [text, setText] = useState(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let alive = true;
    setText(null); setStep(0);
    Promise.resolve().then(() => loadVerse(verse.ref)).then((t) => { if (alive) setText(String(t || '')); }).catch(() => { if (alive) setText(''); });
    return () => { alive = false; };
  }, [verse.ref, loadVerse]);
  const teens = door === 'teens';
  const words = useMemo(() => (text ? (teens ? [longestWord(text)].filter(Boolean) : buildableWords(text)) : []), [text, teens]);
  const rounds = teens ? 1 + words.length : words.length;
  const finished = text && step >= rounds;
  return (
    <div className="kz-game" data-testid="word-builder" data-door={door}>
      <div className="kz-gamehead g-orange">
        <div className="kz-words">
          <h2>{teens ? 'Put it in order' : 'Spell the Bible word'}</h2>
          <p>{teens ? 'The verse, phrase by phrase, then its longest word.' : `Tap the letters in order. ${words.length ? `Word ${Math.min(step + 1, words.length)} of ${words.length} from this week's verse.` : ''}`}</p>
        </div>
        <Shot id="word-builder-header" alt="" className="kz-art" list={shotList} fallback={<ShotSlot id="word-builder-header" className="kz-art" what="the girl lifting a letter block" />} />
      </div>
      <div className="kz-body">
        <GuideBubble who="boy" shot="boy-explain" list={shotList}>{teens ? 'Tap the phrases in the order the verse says them.' : 'Tap the letters in order to spell the missing word. Stuck? Show a letter costs one star.'}</GuideBubble>
        {text === null && <p className="lc-small" data-testid="builder-loading">Loading the verse from the Word…</p>}
        {text === '' && <p className="lc-notice" data-testid="builder-unavailable">The words of {verse.ref} are not on this device yet. Open the Scripture tab once while online and they will be.</p>}
        {text && !finished && teens && step === 0 && <OrderRound text={text} verseRef={verse.ref} seed={seed} onNext={() => setStep(1)} />}
        {text && !finished && (!teens || step >= 1) && words[teens ? step - 1 : step] && (
          <SpellRound key={step} text={text} verseRef={verse.ref} word={words[teens ? step - 1 : step]} seed={seed + step} onNext={() => setStep(step + 1)} last={step === rounds - 1} />
        )}
        {text && !finished && !teens && !words.length && <p className="lc-notice">This week's verse has no word of four letters or more to spell. Try Who am I?</p>}
        {finished && (
          <div className="kz-panel" data-testid="builder-finished">
            <h3>Every word of {verse.ref}!</h3>
            <p className="lc-p">"{text}"</p>
            <div className="kz-actions kz-focus-visible">
              <button type="button" className="kz-act plain kz-focus-visible" onClick={() => setStep(0)}>Play again</button>
              {onBack && <button type="button" className="kz-act green kz-focus-visible" onClick={onBack}>Back to games</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// progress-of-revelation-basis — the reason behind every date on the chart
// =============================================================================
// Darrell 2026-11-10, on the timeline: "Also review them against knowledge of
// dates... research their standards so we have a reason to have the ones we
// have... make sense?" (DR-1410).
//
// The dates themselves stay the photographed chart's, transcribed line for line
// (progress-of-revelation.js); this file says WHY each one stands, so no date on
// the chart rests on nothing. THE STANDARD the chart follows is the conservative
// evangelical dating of the books: the Exodus from 1 Kings 6:1, the authors the
// books name for themselves, the prophets by their own headings, and the New
// Testament written before Jerusalem fell in AD 70 apart from John's writings.
// The volume the pages came from is not named on them; matching it to a
// particular study Bible was not verified, so it is not claimed.
//
// THE ORDER OF REASONS (DR-0098: the Word explains the Word):
//   fixed    the Word itself names the king, the year or the event
//   bounded  the Word gives an edge: the last event a book records, or a fact
//            that must still be true when it was written
//   inferred the date is reasoned from the book's contents; the Word does not
//            state it, and the chart's judgment is said to be a judgment
//   silent   the Word gives no date; the chart's placement is its own estimate
// Every `says` is a phrase read from app/public/bible/kjv and checked by
// progress-of-revelation-basis.test.js, so a reason cannot quote a verse wrong.
// `note` names where the Word refines the chart's span.
// =============================================================================

export const DATING_STANDARD =
  'A conservative evangelical dating: the Exodus about 1446 BC from 1 Kings 6:1, each book by the author and the days it names for itself, and the New Testament before AD 70 apart from John. Later dates proposed elsewhere chiefly set aside a book’s own heading (Daniel 10:1, Isaiah 1:1); this chart keeps the heading.';

export const BASIS_GRADES = ['fixed', 'bounded', 'inferred', 'silent'];

const B = (grade, why, anchors = [], note = '') => ({ grade, why, anchors, note });
const a = (ref, says) => ({ ref, says });

export const PROGRESS_BASIS = {
  Job: B('silent', 'The book names no king and no event in Israel’s history, so the Word gives no date; the chart sets it first and says Unknown.', [
    a('Job 1:1', 'There was a man in the land of Uz'),
  ]),
  Genesis: B(
    'bounded',
    'Moses wrote the law between the Exodus and his death: 480 years before Solomon’s fourth year (966 BC) puts the Exodus at 1446, and Moses finished writing in the fortieth year.',
    [
      a('1 Kings 6:1', 'four hundred and eightieth year after the children of Israel were come out of the land of Egypt'),
      a('Deuteronomy 31:24', 'Moses had made an end of writing the words of this law in a book'),
    ]
  ),
  Exodus: B('bounded', 'Written by Moses between the Exodus (1446) and his death forty years on.', [
    a('1 Kings 6:1', 'four hundred and eightieth year'),
    a('Deuteronomy 1:3', 'in the fortieth year, in the eleventh month'),
  ]),
  Leviticus: B('bounded', 'Given at Sinai and written by Moses inside the same forty years.', [
    a('Deuteronomy 31:24', 'Moses had made an end of writing the words of this law in a book'),
  ]),
  Numbers: B('bounded', 'Covers the wilderness years up to the plains of Moab, inside the forty years.', [
    a('Deuteronomy 1:3', 'in the fortieth year, in the eleventh month'),
  ]),
  Deuteronomy: B('fixed', 'Moses spoke it in the fortieth year, eleventh month, just before his death (about 1406 BC).', [
    a('Deuteronomy 1:3', 'in the fortieth year, in the eleventh month, on the first day of the month'),
  ]),
  Psalms: B(
    'bounded',
    'The span runs from Moses (the title over Psalm 90 names him) to psalms of the exile in Babylon; collected over centuries by many authors.',
    [a('Psalms 137:1', 'By the rivers of Babylon, there we sat down')],
    'Psalm titles are not in the verse text on disk, so Psalm 90’s title is cited, not checked by phrase.'
  ),
  Joshua: B('bounded', 'Joshua wrote in the book of the law himself, inside his lifetime after the conquest.', [
    a('Joshua 24:26', 'Joshua wrote these words in the book of the law of God'),
  ]),
  Judges: B('bounded', 'Written when Israel had a king, yet while the Jebusites still held Jerusalem, so before David took it (about 1004 BC).', [
    a('Judges 21:25', 'In those days there was no king in Israel'),
    a('Judges 1:21', 'the Jebusites dwell with the children of Benjamin in Jerusalem unto this day'),
  ]),
  Ruth: B(
    'bounded',
    'The genealogy ends with David and does not name Solomon, so it was written once David was known; the chart marks Samuel as author with a query.',
    [a('Ruth 4:22', 'and Jesse begat David')]
  ),
  'Song of Solomon': B('inferred', 'The Word names Solomon; placing it early in his reign is the chart’s reading of the book, not a date the Word states.', [
    a('Song of Solomon 1:1', 'which is Solomon’s'),
  ]),
  Proverbs: B('bounded', 'Solomon’s proverbs, with a section copied out by Hezekiah’s men, so the book was complete by Hezekiah’s death (686 BC).', [
    a('Proverbs 25:1', 'which the men of Hezekiah king of Judah copied out'),
  ]),
  Ecclesiastes: B('inferred', 'The Preacher is the son of David, king in Jerusalem; placing it late in Solomon’s life is the chart’s reading of its tone.', [
    a('Ecclesiastes 1:1', 'the son of David, king in Jerusalem'),
  ]),
  '1 Samuel': B(
    'bounded',
    'Written when there were kings of Judah as a separate line, so after the kingdom divided (931 BC); the chart’s upper edge is the fall of Samaria (722).',
    [a('1 Samuel 27:6', 'Ziklag pertaineth unto the kings of Judah unto this day')]
  ),
  '2 Samuel': B('bounded', 'The same edge as 1 Samuel, the one book in two parts.', [a('1 Samuel 27:6', 'unto the kings of Judah unto this day')]),
  Obadiah: B(
    'silent',
    'Edom stood by when strangers entered Jerusalem, but the Word does not name which invasion; the chart takes the one under Jehoram, and the fall of 586 BC is the other reading.',
    [a('Obadiah 1:11', 'foreigners entered into his gates, and cast lots upon Jerusalem')]
  ),
  Joel: B('silent', 'Joel names no king; the chart places him in the boyhood reign of Joash by inference.', [
    a('Joel 1:1', 'The word of the LORD that came to Joel the son of Pethuel'),
  ]),
  Jonah: B('fixed', 'Jonah prophesied in the days of Jeroboam the son of Joash (about 793 to 753 BC).', [
    a('2 Kings 14:25', 'by the hand of his servant Jonah, the son of Amittai, the prophet'),
  ]),
  Amos: B('fixed', 'In the days of Uzziah and Jeroboam, two years before the earthquake.', [a('Amos 1:1', 'two years before the earthquake')]),
  Micah: B('fixed', 'In the days of Jotham, Ahaz and Hezekiah.', [a('Micah 1:1', 'in the days of Jotham, Ahaz, and Hezekiah, kings of Judah')]),
  Hosea: B('fixed', 'In the days of Uzziah, Jotham, Ahaz and Hezekiah, and of Jeroboam.', [
    a('Hosea 1:1', 'in the days of Uzziah, Jotham, Ahaz, and Hezekiah'),
  ]),
  Isaiah: B('bounded', 'Isaiah’s heading names Uzziah to Hezekiah, and the book records Sennacherib’s death (681 BC), its last event.', [
    a('Isaiah 1:1', 'in the days of Uzziah, Jotham, Ahaz, and Hezekiah'),
    a('Isaiah 37:38', 'Esarhaddon his son reigned in his stead'),
  ]),
  Nahum: B('bounded', 'No-Amon (Thebes) has already fallen (663 BC) and Nineveh has not yet (612 BC).', [a('Nahum 3:8', 'Art thou better than populous No')]),
  Zephaniah: B('fixed', 'In the days of Josiah (640 to 609 BC).', [a('Zephaniah 1:1', 'in the days of Josiah the son of Amon, king of Judah')]),
  Habakkuk: B('bounded', 'The Chaldeans are being raised up, not yet master of Judah, so before 605 BC.', [a('Habakkuk 1:6', 'I raise up the Chaldeans')]),
  Ezekiel: B('fixed', 'From the fifth year of Jehoiachin’s captivity (593 BC) to the twenty-seventh (571 BC).', [
    a('Ezekiel 1:2', 'the fifth year of king Jehoiachin’s captivity'),
    a('Ezekiel 29:17', 'in the seven and twentieth year'),
  ]),
  Lamentations: B('fixed', 'Written over the fresh ruin of the temple and the city (586 BC).', [
    a('Lamentations 2:7', 'The Lord hath cast off his altar, he hath abhorred his sanctuary'),
  ]),
  Jeremiah: B(
    'fixed',
    'From the thirteenth year of Josiah; Jeremiah’s own words end at chapter 51.',
    [a('Jeremiah 1:2', 'in the thirteenth year of his reign'), a('Jeremiah 51:64', 'Thus far are the words of Jeremiah')],
    'Chapter 52 records the thirty-seventh year of Jehoiachin’s captivity (561 BC), after the chart’s end of 570: an appended record, as 51:64 says.'
  ),
  '1 Kings': B(
    'bounded',
    'Kings ends with Jehoiachin released in the thirty-seventh year of his captivity (561 BC) and does not record Cyrus’ return (538 BC).',
    [a('2 Kings 25:27', 'in the seven and thirtieth year of the captivity of Jehoiachin')]
  ),
  '2 Kings': B('bounded', 'The same edge, the one book in two parts.', [a('2 Kings 25:27', 'in the seven and thirtieth year of the captivity of Jehoiachin')]),
  Daniel: B('fixed', 'Daniel’s last vision is dated to the third year of Cyrus (536 BC).', [a('Daniel 10:1', 'In the third year of Cyrus king of Persia')]),
  Haggai: B('fixed', 'In the second year of Darius (520 BC).', [a('Haggai 1:1', 'In the second year of Darius the king')]),
  Zechariah: B(
    'fixed',
    'The visions are dated from the second year of Darius (520 BC) to the fourth (518 BC).',
    [a('Zechariah 1:1', 'in the second year of Darius'), a('Zechariah 7:1', 'in the fourth year of king Darius')],
    'The Word dates chapters 1 to 8 to 520 to 518 BC; the chart’s 480 to 470 is its estimate for the undated chapters 9 to 14.'
  ),
  Ezra: B('fixed', 'Ezra went up in the seventh year of Artaxerxes (458/457 BC).', [a('Ezra 7:7', 'in the seventh year of Artaxerxes the king')]),
  '1 Chronicles': B('bounded', 'The genealogy runs generations past Zerubbabel, and the history ends with Cyrus’ decree (538 BC).', [
    a('1 Chronicles 3:19', 'Zerubbabel, and Shimei'),
    a('2 Chronicles 36:22', 'in the first year of Cyrus king of Persia'),
  ]),
  '2 Chronicles': B('bounded', 'Ends with the first year of Cyrus; the chart’s author is Ezra with a query.', [
    a('2 Chronicles 36:22', 'in the first year of Cyrus king of Persia'),
  ]),
  Esther: B(
    'bounded',
    'Set in the days of Ahasuerus, who ruled from India to Ethiopia (Xerxes, 486 to 465 BC), so written after his reign; the chart’s outer edge is the end of Persia (331 BC).',
    [a('Esther 1:1', 'which reigned, from India even unto Ethiopia')]
  ),
  Malachi: B('inferred', 'No king is named; the altar is in use again and the sins are those Nehemiah met on his return, so the chart places it then.', [
    a('Malachi 1:7', 'Ye offer polluted bread upon mine altar'),
    a('Malachi 2:11', 'hath married the daughter of a strange god'),
    a('Nehemiah 13:23', 'saw I Jews that had married wives of Ashdod'),
  ]),
  Nehemiah: B('fixed', 'Nehemiah returned to the king in the thirty-second year of Artaxerxes (433/432 BC) and came back after certain days.', [
    a('Nehemiah 13:6', 'in the two and thirtieth year of Artaxerxes'),
  ]),
  James: B(
    'inferred',
    'Written to the twelve tribes scattered abroad, with no word of the Gentile question settled at Jerusalem, so before that council (about AD 49).',
    [a('James 1:1', 'to the twelve tribes which are scattered abroad')]
  ),
  Galatians: B('inferred', 'Paul counts fourteen years to his visit to Jerusalem; the chart places the letter just before or at the council.', [
    a('Galatians 2:1', 'Then fourteen years after I went up again to Jerusalem'),
  ]),
  Matthew: B('bounded', 'The temple’s fall is foretold, not reported as past, so before AD 70.', [
    a('Matthew 24:2', 'There shall not be left here one stone upon another'),
  ]),
  Mark: B('bounded', 'The same: the temple’s fall is still ahead.', [a('Mark 13:2', 'there shall not be left one stone upon another')]),
  '1 Thessalonians': B(
    'fixed',
    'Written from Corinth when Timothy came back; Gallio, before whom Paul stood there, was proconsul in AD 51 to 52 (the Delphi inscription).',
    [a('1 Thessalonians 3:6', 'when Timotheus came from you unto us'), a('Acts 18:12', 'when Gallio was the deputy of Achaia')]
  ),
  '2 Thessalonians': B('fixed', 'Written soon after the first, from the same Corinthian stay.', [a('Acts 18:12', 'when Gallio was the deputy of Achaia')]),
  '1 Corinthians': B('fixed', 'Written at Ephesus before Pentecost, on the third journey.', [
    a('1 Corinthians 16:8', 'I will tarry at Ephesus until Pentecost'),
  ]),
  '2 Corinthians': B('fixed', 'Written from Macedonia on the same journey.', [a('2 Corinthians 7:5', 'when we were come into Macedonia')]),
  Romans: B('fixed', 'Written as Paul set out for Jerusalem with the gift for the saints.', [
    a('Romans 15:25', 'But now I go unto Jerusalem to minister unto the saints'),
  ]),
  Luke: B('bounded', 'Acts calls it the former treatise, so it was written before Acts.', [a('Acts 1:1', 'The former treatise have I made, O Theophilus')]),
  Ephesians: B('fixed', 'Written in bonds, in Paul’s first Roman imprisonment.', [a('Ephesians 6:20', 'I am an ambassador in bonds')]),
  Philippians: B('fixed', 'Written in bonds known through all the palace.', [a('Philippians 1:13', 'my bonds in Christ are manifest in all the palace')]),
  Colossians: B('fixed', 'Written in the same bonds, in Paul’s first Roman imprisonment.', [a('Colossians 4:18', 'Remember my bonds')]),
  Philemon: B('fixed', 'Written by Paul the aged, a prisoner.', [a('Philemon 1:9', 'Paul the aged, and now also a prisoner of Jesus Christ')]),
  Acts: B('bounded', 'Acts ends with Paul two whole years in Rome and says nothing of his death or of Jerusalem’s fall, so about AD 62.', [
    a('Acts 28:30', 'Paul dwelt two whole years in his own hired house'),
  ]),
  '1 Timothy': B('inferred', 'Paul went into Macedonia leaving Timothy at Ephesus, a journey after the end of Acts, so after his release.', [
    a('1 Timothy 1:3', 'when I went into Macedonia'),
  ]),
  Titus: B('inferred', 'Paul left Titus in Crete, a work not in Acts, so after his release.', [a('Titus 1:5', 'For this cause left I thee in Crete')]),
  '1 Peter': B('inferred', 'Sent from Babylon, read by the chart as Rome, before Peter’s death.', [a('1 Peter 5:13', 'The church that is at Babylon')]),
  '2 Timothy': B('fixed', 'Paul’s last letter: the time of his departure is at hand.', [a('2 Timothy 4:6', 'the time of my departure is at hand')]),
  '2 Peter': B('fixed', 'Peter writes knowing he must shortly put off his tabernacle.', [a('2 Peter 1:14', 'shortly I must put off this my tabernacle')]),
  Hebrews: B(
    'bounded',
    'The priests still stand daily offering, and the old covenant is ready to vanish: the temple service is still running, so before AD 70.',
    [a('Hebrews 10:11', 'every priest standeth daily ministering'), a('Hebrews 8:13', 'is ready to vanish away')]
  ),
  Jude: B('inferred', 'Jude calls his readers to remember the apostles’ words spoken before; the chart places it after 2 Peter.', [
    a('Jude 1:17', 'remember ye the words which were spoken before of the apostles'),
  ]),
  John: B('bounded', 'Written after Peter’s death, which it explains, and when a saying about John not dying had spread.', [
    a('John 21:19', 'signifying by what death he should glorify God'),
    a('John 21:23', 'that that disciple should not die'),
  ]),
  '1 John': B('inferred', 'Written by John late in life, after the Gospel; the chart’s placement.', []),
  '2 John': B('inferred', 'From the elder, late in John’s life.', [a('2 John 1:1', 'The elder unto the elect lady')]),
  '3 John': B('inferred', 'From the elder to Gaius, written with 2 John late in John’s life.', [a('3 John 1:1', 'The elder unto the wellbeloved Gaius')]),
  Revelation: B('fixed', 'Written on Patmos; Irenaeus (Against Heresies 5.30.3) places the vision at the end of Domitian’s reign (AD 95 to 96).', [
    a('Revelation 1:9', 'was in the isle that is called Patmos'),
  ]),
};

/** The reason for one book's date, or null when none is recorded. */
export function basisFor(book) {
  return PROGRESS_BASIS[book] || null;
}

/** "Why this date" in one line: the grade in words, then the reason. */
export function basisLine(book) {
  const b = basisFor(book);
  if (!b) return '';
  const head = { fixed: 'The Word dates it', bounded: 'The Word bounds it', inferred: 'Reasoned from the book', silent: 'The Word gives no date' }[b.grade];
  return `${head}: ${b.why}${b.note ? ` ${b.note}` : ''}`;
}

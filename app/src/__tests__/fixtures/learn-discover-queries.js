// =============================================================================
// The Learning Zone discovery search: 60 realistic searches to judge it by
// =============================================================================
// Written BEFORE the ranking was tuned for them, in the way a person would type
// when they open the Learning Zone with something on their mind. `kind` is how
// it is typed; `expect` is the words a lesson that truly answers it carries in
// its title, theme or big idea. The expectation is an AUTOMATED PROXY for
// relevance (a floor, run on every build); the real judgment is the manual
// review recorded in docs/design/learn-discover/SEARCH-EVALUATION.md.
// The first nine are the questions Darrell named on 2026-11-26.
export const QUERIES = [
  // ---- the nine named questions ----
  { kind: 'question', q: 'Why am I always stressed?', expect: /stress|worr|anxi|peace|fear|rest|burden|overwhelm|tired|mind|care|trust|calm/i },
  { kind: 'question', q: 'How can I strengthen my marriage?', expect: /marri|husband|wife|spous|wedding|covenant|couple|love|bride/i },
  {
    kind: 'question',
    q: 'How do I raise godly children?',
    expect: /child|parent|famil|kid|son|daughter|youth|heritage|generation|little ones|train up|teen|father|mother/i,
  },
  { kind: 'question', q: 'How can I get out of debt?', expect: /debt|loan|borrow|lend|owe|credit|payment|usury|interest|surety|bond|pay/i },
  { kind: 'question', q: 'How do I buy my first home?', expect: /home|house|property|inspect|buy|mortgage|apprais|land|price|purchase|deal|sign/i },
  {
    kind: 'question',
    q: 'What does the Bible say about forgiveness?',
    expect: /forgiv|mercy|apolog|confess|offen|pardon|reconcil|bitter|trespass|debts|restor|repent/i,
  },
  { kind: 'question', q: 'How do I find my purpose?', expect: /purpose|call|gift|skill|craft|talent|vision|work|plan|steward|identity|fruit/i },
  { kind: 'question', q: 'How can I become a better leader?', expect: /lead|shepherd|pastor|elder|serve|office|steward|follow|authority|example|team/i },
  {
    kind: 'question',
    q: 'How can I grow closer to God?',
    expect: /pray|spirit|worship|presence|obey|abide|seek|faith|know|holy|voice|hear|walk|word|father|relationship/i,
  },
  // ---- more conversational questions ----
  {
    kind: 'question',
    q: 'My husband and I keep arguing about money',
    expect: /husband|wife|marri|money|spouse|covenant|household|steward|debt|budget|provision/i,
  },
  { kind: 'question', q: 'How do I talk to my teenager about God?', expect: /teen|youth|child|parent|son|daughter|train|teach|faith|generation|family|talk/i },
  { kind: 'question', q: "I lost my job and I'm scared", expect: /job|work|labou?r|wage|provision|fear|trust|anxi|worr|income|boss|employ|career|peace/i },
  {
    kind: 'question',
    q: "What should I do when I can't sleep because I'm worried?",
    expect: /sleep|rest|worr|anxi|peace|fear|tired|night|mind|burden|trust|calm|care/i,
  },
  {
    kind: 'question',
    q: 'How do I start a business with no money?',
    expect: /business|work|income|money|start|build|plan|cost|profit|customer|enterprise|capital|seed|steward|rent/i,
  },
  { kind: 'question', q: 'Is it wrong to charge interest on a loan?', expect: /interest|usury|loan|lend|borrow|debt|brother|poor|surety|credit|bank/i },
  {
    kind: 'question',
    q: 'How do I know if AI is telling me the truth?',
    expect: /a\.?i\.?|machine|model|chatbot|truth|verify|test|prove|data|algorithm|trust|source|claim/i,
  },
  {
    kind: 'question',
    q: 'What does the Bible say about being a good steward?',
    expect: /steward|talent|manage|trust|faithful|servant|account|own|provision|resource|wise|gift|money/i,
  },
  {
    kind: 'question',
    q: 'How do I forgive someone who hurt me badly?',
    expect: /forgiv|mercy|offen|hurt|bitter|pardon|reconcil|apolog|wrong|trespass|restor|repent|grace|debts/i,
  },
  {
    kind: 'question',
    q: 'Why does Yahweh allow suffering?',
    expect: /suffer|trial|pain|hurt|loss|grief|hard|afflict|comfort|refin|test|tribulation|sorrow|trouble|evil|job/i,
  },
  {
    kind: 'question',
    q: 'How do I teach my kids about money?',
    expect: /child|kid|son|daughter|teach|train|money|save|wage|steward|family|inherit|heir|allowance|generation|legacy/i,
  },
  // ---- short phrases ----
  { kind: 'phrase', q: 'anxiety', expect: /anxi|worr|fear|peace|care|trust|calm|rest|stress|mind|burden/i },
  { kind: 'phrase', q: 'debt', expect: /debt|loan|borrow|lend|owe|credit|payment|usury|interest|surety|bond|pay|financ/i },
  { kind: 'phrase', q: 'marriage', expect: /marri|husband|wife|spous|wedding|covenant|couple|bride/i },
  { kind: 'phrase', q: 'prayer', expect: /pray|worship|seek|petition|ask|intercess|closet|faith|name/i },
  { kind: 'phrase', q: 'tithing and giving', expect: /tithe|tenth|give|giving|offering|generous|first ?fruit|alms|gift|steward|storehouse/i },
  { kind: 'phrase', q: 'landlord and tenant', expect: /landlord|tenant|lease|rent|evict|property|housing|lessor|repair|deposit/i },
  { kind: 'phrase', q: 'eviction', expect: /evict|tenant|landlord|lease|rent|notice|court|property|housing/i },
  { kind: 'phrase', q: 'investing', expect: /invest|stock|bond|market|risk|return|saving|wealth|fund|compound|asset|money/i },
  { kind: 'phrase', q: 'stock market', expect: /stock|market|share|invest|bond|trade|price|company|equity|economy/i },
  { kind: 'phrase', q: 'slavery history', expect: /slav|1619|america|history|heritage|ancest|freedom|civil|nation|truth|record|african|black/i },
  { kind: 'phrase', q: 'fasting', expect: /fast|food|eat|meal|body|hunger|temple|health|diet|prayer|daniel/i },
  { kind: 'phrase', q: 'leadership', expect: /lead|shepherd|pastor|elder|serve|office|steward|follow|authority|example|team|king/i },
  { kind: 'phrase', q: 'peace', expect: /peace|rest|calm|quiet|anxi|worr|trust|still|comfort|joy/i },
  { kind: 'phrase', q: 'home inspection', expect: /inspect|home|house|property|defect|buy|repair|look|survey|plague|roof/i },
  { kind: 'phrase', q: 'Holy Spirit', expect: /spirit|holy|comforter|helper|fruit|gift|filled|anoint|power|guide/i },
  // ---- misspellings ----
  { kind: 'typo', q: 'forgivness', expect: /forgiv|mercy|apolog|confess|offen|pardon|reconcil|bitter|trespass|debts|restor|repent/i },
  { kind: 'typo', q: 'anxity and worry', expect: /anxi|worr|fear|peace|care|trust|calm|rest|stress|mind|burden/i },
  { kind: 'typo', q: 'maraige advice', expect: /marri|husband|wife|spous|wedding|covenant|couple|bride|love/i },
  { kind: 'typo', q: 'raising childern', expect: /child|parent|famil|kid|son|daughter|youth|heritage|generation|little ones|train up|teen/i },
  { kind: 'typo', q: 'how to get a morgage', expect: /mortgage|loan|home|house|financ|lend|borrow|debt|buy|bank|credit|rate|term/i },
  { kind: 'typo', q: 'how to pray prayr', expect: /pray|worship|seek|petition|ask|intercess|closet|faith|name/i },
  { kind: 'typo', q: 'leadrship skills', expect: /lead|shepherd|pastor|elder|serve|office|steward|follow|authority|example|team|skill/i },
  { kind: 'typo', q: 'invesing for retirement', expect: /invest|stock|bond|market|risk|return|saving|wealth|fund|compound|asset|money|retire|legacy|inherit/i },
  { kind: 'typo', q: 'landlrod problems', expect: /landlord|tenant|lease|rent|evict|property|housing|repair|deposit|manage/i },
  { kind: 'typo', q: 'stres at work', expect: /stress|work|labou?r|job|worr|rest|peace|burden|boss|career|tired|anxi/i },
  // ---- everyday concerns ----
  { kind: 'concern', q: 'I feel lonely', expect: /lonel|alone|friend|comfort|fellowship|forsake|companion|presence|isolat|belong|father|body|neighbo/i },
  { kind: 'concern', q: "my kids won't listen to me", expect: /child|kid|son|daughter|parent|listen|hear|train|teach|discipline|obey|famil|teen|father/i },
  { kind: 'concern', q: "I'm tired all the time", expect: /tired|rest|weary|sleep|burnout|strength|energy|sabbath|body|health|burden|fatigue|work/i },
  { kind: 'concern', q: 'how to save money every month', expect: /save|saving|budget|money|income|spend|steward|wealth|provision|store|invest|wage/i },
  {
    kind: 'concern',
    q: 'angry coworker who makes my day hard',
    expect: /anger|angry|wrath|boss|work|neighbo|patience|peace|answer|conflict|enemy|forgiv|tongue|employ|labou?r/i,
  },
  { kind: 'concern', q: "I'm afraid of the future", expect: /fear|afraid|future|tomorrow|trust|worr|anxi|plan|hope|prophe|end|courage|peace/i },
  {
    kind: 'concern',
    q: 'how do I handle conflict with my family',
    expect: /conflict|famil|brother|forgiv|reconcil|peace|household|anger|bond|parent|sibling|child|marri|tongue/i,
  },
  { kind: 'concern', q: 'Sunday school lessons for little children', expect: /child|little|kid|young|learn|count|read|teach|train|youth|bible|story/i },
  { kind: 'concern', q: 'how do I study the Bible for myself', expect: /study|word|scripture|read|verse|bible|meditat|search|learn|test|berean|understand/i },
  {
    kind: 'concern',
    q: 'is it okay to use ChatGPT',
    expect: /a\.?i\.?|chatbot|machine|model|tool|truth|verify|test|trust|llm|assist|help|private|privacy|data/i,
  },
  {
    kind: 'concern',
    q: 'how do I buy a rental property',
    expect: /rental|rent|property|landlord|tenant|buy|invest|income|house|home|lease|deal|partner|price/i,
  },
  { kind: 'concern', q: 'my rent is too high', expect: /rent|tenant|landlord|lease|price|afford|housing|property|cost|wage|pay|home|house/i },
  { kind: 'concern', q: 'what is my identity in Christ', expect: /identity|christ|son|child|new|called|know|name|spirit|beloved|image|who/i },
  { kind: 'concern', q: 'how to choose a good church', expect: /church|body|assembl|pastor|elder|fellowship|office|congregat|shepherd|teach|flock|member/i },
  { kind: 'concern', q: 'teaching my child to read and count', expect: /child|read|count|number|learn|math|letter|little|teach|train|kid|measure/i },
];

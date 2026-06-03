export const TEST_CONFIG = {
  title: "English Placement Test",
  timeLimitMinutes: 35,
  sections: [
    { id: "grammar", label: "Grammar", shortLabel: "Грамматика" },
    { id: "vocabulary", label: "Vocabulary", shortLabel: "Лексика" },
    { id: "reading", label: "Reading", shortLabel: "Чтение" },
    { id: "listening", label: "Listening", shortLabel: "Аудирование" }
  ],
  levelBands: [
    { level: "A1", min: 0, title: "Beginner", note: "Нужна база: простые фразы, be/have, present simple, everyday vocabulary." },
    { level: "A2", min: 28, title: "Elementary", note: "Можно работать с повседневными темами и постепенно укреплять времена, вопросы и лексику." },
    { level: "B1", min: 44, title: "Intermediate", note: "Есть рабочая база для общения; стоит развивать точность, связность и понимание деталей." },
    { level: "B2", min: 60, title: "Upper-Intermediate", note: "Хороший самостоятельный уровень; фокус на нюансах, беглости и академической/деловой речи." },
    { level: "C1", min: 76, title: "Advanced", note: "Сильный уровень; полезны сложные тексты, идиоматика, стилистика и точность." },
    { level: "C2", min: 90, title: "Proficient candidate", note: "Результат похож на C2-кандидата, но без speaking/writing финальный уровень лучше подтвердить интервью." }
  ]
};

export const QUESTIONS = [
  {
    id: "g01",
    section: "grammar",
    level: "A1",
    points: 1,
    prompt: "She ___ from Canada.",
    options: ["are", "is", "am", "be"],
    answer: 1
  },
  {
    id: "g02",
    section: "grammar",
    level: "A1",
    points: 1,
    prompt: "I usually ___ breakfast at 8 o'clock.",
    options: ["have", "has", "having", "am have"],
    answer: 0
  },
  {
    id: "g03",
    section: "grammar",
    level: "A2",
    points: 2,
    prompt: "We ___ to the cinema last Saturday.",
    options: ["go", "went", "have gone", "were go"],
    answer: 1
  },
  {
    id: "g04",
    section: "grammar",
    level: "A2",
    points: 2,
    prompt: "This exercise is ___ than the previous one.",
    options: ["difficult", "more difficult", "most difficult", "as difficult"],
    answer: 1
  },
  {
    id: "g05",
    section: "grammar",
    level: "B1",
    points: 3,
    prompt: "I ___ here since I left university.",
    options: ["work", "worked", "have worked", "am working"],
    answer: 2
  },
  {
    id: "g06",
    section: "grammar",
    level: "B1",
    points: 3,
    prompt: "If the weather is good tomorrow, we ___ a picnic.",
    options: ["have", "will have", "would have", "had"],
    answer: 1
  },
  {
    id: "g07",
    section: "grammar",
    level: "B2",
    points: 4,
    prompt: "The report, ___ was published yesterday, contains several surprising findings.",
    options: ["who", "where", "which", "what"],
    answer: 2
  },
  {
    id: "g08",
    section: "grammar",
    level: "B2",
    points: 4,
    prompt: "He ___ have forgotten the meeting. He is usually very reliable.",
    options: ["must", "can't", "shouldn't", "needn't"],
    answer: 1
  },
  {
    id: "g09",
    section: "grammar",
    level: "C1",
    points: 5,
    prompt: "Rarely ___ such a convincing presentation.",
    options: ["I have seen", "have I seen", "I saw", "did I seen"],
    answer: 1
  },
  {
    id: "g10",
    section: "grammar",
    level: "C1",
    points: 5,
    prompt: "It is essential that every applicant ___ informed of the change.",
    options: ["is", "will be", "be", "has been"],
    answer: 2
  },
  {
    id: "g11",
    section: "grammar",
    level: "C2",
    points: 6,
    prompt: "Had the committee been more transparent, the proposal ___ so much resistance.",
    options: ["would not meet", "would not have met", "will not meet", "did not meet"],
    answer: 1
  },
  {
    id: "g12",
    section: "grammar",
    level: "C2",
    points: 6,
    prompt: "No sooner ___ the announcement than investors began selling shares.",
    options: ["the company made", "had the company made", "did the company made", "has the company made"],
    answer: 1
  },
  {
    id: "v01",
    section: "vocabulary",
    level: "A1",
    points: 1,
    prompt: "Which word is the opposite of expensive?",
    options: ["cheap", "large", "late", "clean"],
    answer: 0
  },
  {
    id: "v02",
    section: "vocabulary",
    level: "A1",
    points: 1,
    prompt: "You buy bread at a ___.",
    options: ["library", "bakery", "station", "hospital"],
    answer: 1
  },
  {
    id: "v03",
    section: "vocabulary",
    level: "A2",
    points: 2,
    prompt: "Choose the correct collocation: ___ a mistake.",
    options: ["do", "make", "take", "put"],
    answer: 1
  },
  {
    id: "v04",
    section: "vocabulary",
    level: "A2",
    points: 2,
    prompt: "When a plane leaves the ground, it ___.",
    options: ["gets on", "takes off", "looks after", "turns up"],
    answer: 1
  },
  {
    id: "v05",
    section: "vocabulary",
    level: "B1",
    points: 3,
    prompt: "A reliable person is someone who ___.",
    options: ["is easy to trust", "gets angry quickly", "talks very loudly", "changes plans often"],
    answer: 0
  },
  {
    id: "v06",
    section: "vocabulary",
    level: "B1",
    points: 3,
    prompt: "Despite the rain, the match continued. 'Despite' means ___.",
    options: ["because of", "although there was", "after", "instead of"],
    answer: 1
  },
  {
    id: "v07",
    section: "vocabulary",
    level: "B2",
    points: 4,
    prompt: "To bring up a topic in a meeting means to ___.",
    options: ["avoid it", "mention it", "finish it", "translate it"],
    answer: 1
  },
  {
    id: "v08",
    section: "vocabulary",
    level: "B2",
    points: 4,
    prompt: "To scrutinize a document means to read it ___.",
    options: ["quickly and casually", "aloud to a group", "very carefully", "only once"],
    answer: 2
  },
  {
    id: "v09",
    section: "vocabulary",
    level: "C1",
    points: 5,
    prompt: "To mitigate a problem means to ___.",
    options: ["make it less severe", "hide it completely", "describe it briefly", "create it deliberately"],
    answer: 0
  },
  {
    id: "v10",
    section: "vocabulary",
    level: "C2",
    points: 6,
    prompt: "A statement that is equivocal is ___.",
    options: ["emotionally sincere", "deliberately unclear", "mathematically exact", "socially unacceptable"],
    answer: 1
  },
  {
    id: "r01",
    section: "reading",
    level: "A2",
    points: 2,
    passageTitle: "Notice",
    passage: "The language school office will be closed on Monday morning because of staff training. Students can collect course books from 2 p.m. to 6 p.m. on Monday or any time on Tuesday.",
    prompt: "When can students collect books on Monday?",
    options: ["Before staff training", "From 2 p.m. to 6 p.m.", "Only in the morning", "Any time"],
    answer: 1
  },
  {
    id: "r02",
    section: "reading",
    level: "A2",
    points: 2,
    passageTitle: "Notice",
    passage: "The language school office will be closed on Monday morning because of staff training. Students can collect course books from 2 p.m. to 6 p.m. on Monday or any time on Tuesday.",
    prompt: "Why is the office closed on Monday morning?",
    options: ["The books have not arrived", "There is staff training", "It is a public holiday", "The teachers are ill"],
    answer: 1
  },
  {
    id: "r03",
    section: "reading",
    level: "B1",
    points: 3,
    passageTitle: "Email",
    passage: "Hi Marta, I checked the hotel prices for our trip. The city centre hotel is convenient, but breakfast is not included and parking is expensive. The smaller hotel near the station is cheaper and includes breakfast. It is ten minutes from the centre by tram. I think we should choose the station hotel unless you really want to stay near the conference venue. Tom",
    prompt: "Which hotel does Tom prefer?",
    options: ["The city centre hotel", "The station hotel", "The conference hotel", "He has no preference"],
    answer: 1
  },
  {
    id: "r04",
    section: "reading",
    level: "B1",
    points: 3,
    passageTitle: "Email",
    passage: "Hi Marta, I checked the hotel prices for our trip. The city centre hotel is convenient, but breakfast is not included and parking is expensive. The smaller hotel near the station is cheaper and includes breakfast. It is ten minutes from the centre by tram. I think we should choose the station hotel unless you really want to stay near the conference venue. Tom",
    prompt: "What disadvantage does the city centre hotel have?",
    options: ["It is far from the venue", "It has no parking", "Breakfast costs extra", "It is near the station"],
    answer: 2
  },
  {
    id: "r05",
    section: "reading",
    level: "B2",
    points: 4,
    passageTitle: "Article extract",
    passage: "Remote work has not simply moved office routines into living rooms. In many companies it has forced managers to define outcomes more clearly, because presence is no longer a reliable sign of productivity. However, teams that rely only on written updates often lose the informal learning that happens when colleagues solve problems together in real time.",
    prompt: "What is the writer's main point?",
    options: ["Remote work always improves productivity", "Managers now need clearer measures of results", "Written updates are better than meetings", "Informal learning is unnecessary"],
    answer: 1
  },
  {
    id: "r06",
    section: "reading",
    level: "B2",
    points: 4,
    passageTitle: "Article extract",
    passage: "Remote work has not simply moved office routines into living rooms. In many companies it has forced managers to define outcomes more clearly, because presence is no longer a reliable sign of productivity. However, teams that rely only on written updates often lose the informal learning that happens when colleagues solve problems together in real time.",
    prompt: "What can teams lose when they rely only on written updates?",
    options: ["Office furniture", "Informal learning", "Internet access", "Clear deadlines"],
    answer: 1
  },
  {
    id: "r07",
    section: "reading",
    level: "C1",
    points: 5,
    passageTitle: "Commentary",
    passage: "The city's decision to pedestrianise the old market street has been praised as bold, yet its success will depend less on the ban on cars itself than on the quality of the alternatives. If buses remain infrequent and deliveries are poorly coordinated, the policy may be remembered not as a vision for public space, but as an inconvenience wrapped in attractive language.",
    prompt: "What does the writer suggest about the policy?",
    options: ["It is guaranteed to fail", "Its language is too technical", "It needs practical support to succeed", "It should focus mainly on delivery companies"],
    answer: 2
  },
  {
    id: "r08",
    section: "reading",
    level: "C2",
    points: 6,
    passageTitle: "Essay extract",
    passage: "The museum's new exhibition avoids the familiar temptation to present innovation as a parade of heroic inventions. Instead, it shows progress as an argument: messy, uneven, and repeatedly shaped by people whose names did not survive in patents or headlines. This curatorial restraint is not a lack of drama, but a refusal to simplify.",
    prompt: "What does the writer admire about the exhibition?",
    options: ["Its focus on famous inventors", "Its refusal to oversimplify progress", "Its dramatic lighting design", "Its chronological clarity"],
    answer: 1
  },
  {
    id: "l01",
    section: "listening",
    level: "A1",
    points: 1,
    audioText: "Hi, this is Anna. The English club starts at half past six this evening, not six o'clock. See you there.",
    prompt: "What time does the English club start?",
    options: ["6:00", "6:30", "7:00", "7:30"],
    answer: 1
  },
  {
    id: "l02",
    section: "listening",
    level: "A2",
    points: 2,
    audioText: "The train to Oxford leaves from platform four. Please keep your ticket ready because staff will check it before you get on the train.",
    prompt: "What should passengers have ready?",
    options: ["Their passport", "Their ticket", "Their phone charger", "Their hotel address"],
    answer: 1
  },
  {
    id: "l03",
    section: "listening",
    level: "B1",
    points: 3,
    audioText: "The project meeting has moved from Wednesday to Friday because the client needs two more days to review the design. Please send any final comments by Thursday morning.",
    prompt: "Why was the meeting moved?",
    options: ["The client needs more review time", "The design was cancelled", "The team is on holiday", "The office is closed"],
    answer: 0
  },
  {
    id: "l04",
    section: "listening",
    level: "B2",
    points: 4,
    audioText: "Online courses can widen access to education, but access alone is not enough. Completion rates tend to improve when learners receive regular feedback and feel that someone is monitoring their progress.",
    prompt: "According to the speaker, what helps online learners finish courses?",
    options: ["Shorter videos only", "Regular feedback and progress monitoring", "More expensive platforms", "Studying without deadlines"],
    answer: 1
  },
  {
    id: "l05",
    section: "listening",
    level: "C1",
    points: 5,
    audioText: "The speaker is not rejecting artificial intelligence in education. Her concern is that schools may adopt tools faster than they develop clear principles for using them responsibly.",
    prompt: "What is the speaker's main concern?",
    options: ["AI tools are always inaccurate", "Schools may adopt AI without enough guidance", "Teachers refuse to use new technology", "Students dislike digital tools"],
    answer: 1
  },
  {
    id: "l06",
    section: "listening",
    level: "C2",
    points: 6,
    audioText: "The proposal sounds radical only if we assume the current system is neutral. In fact, the existing rules already reward certain habits and penalize others, so reform is less a disruption than an admission of what has been happening all along.",
    prompt: "What does the speaker imply about the current system?",
    options: ["It is completely neutral", "It already favors some behaviours", "It cannot be changed", "It was recently introduced"],
    answer: 1
  }
];

const CLASS_ID = 'test-class-001';
const BOOK_IDS = ['the_cookie', 'the_lunch_thief', 'finding_leo'];

const BOOKS = [
  { id: 'the_cookie', title: 'The Cookie', status: 'published' },
  { id: 'the_lunch_thief', title: 'The Lunch Thief', status: 'published' },
  { id: 'finding_leo', title: 'Finding Leo', status: 'published' },
];

const CHAPTERS = [
  { id: 'tc-ch01', title: 'The Cafeteria', book_id: 'the_cookie', chapter_order: 0, cefr_estimate: 'A1', status: 'published' },
  { id: 'tc-ch02', title: 'The Routine', book_id: 'the_cookie', chapter_order: 1, cefr_estimate: 'A1', status: 'published' },
  { id: 'tc-ch03', title: 'Leo', book_id: 'the_cookie', chapter_order: 2, cefr_estimate: 'A1', status: 'published' },
  { id: 'tc-ch04', title: 'The Cookie', book_id: 'the_cookie', chapter_order: 3, cefr_estimate: 'A1', status: 'published' },
  { id: 'tc-ch05', title: 'The Search', book_id: 'the_cookie', chapter_order: 4, cefr_estimate: 'A1', status: 'published' },
  { id: 'tc-ch06', title: 'Found', book_id: 'the_cookie', chapter_order: 5, cefr_estimate: 'A1', status: 'published' },
  { id: 'tl-ch01', title: 'Missing', book_id: 'the_lunch_thief', chapter_order: 0, cefr_estimate: 'A1', status: 'published' },
  { id: 'tl-ch02', title: 'Suspects', book_id: 'the_lunch_thief', chapter_order: 1, cefr_estimate: 'A1', status: 'published' },
  { id: 'tl-ch03', title: 'The Plan', book_id: 'the_lunch_thief', chapter_order: 2, cefr_estimate: 'A1', status: 'published' },
  { id: 'tl-ch04', title: 'Caught', book_id: 'the_lunch_thief', chapter_order: 3, cefr_estimate: 'A1', status: 'published' },
  { id: 'tl-ch05', title: 'Surprise', book_id: 'the_lunch_thief', chapter_order: 4, cefr_estimate: 'A1', status: 'published' },
  { id: 'tl-ch06', title: 'Together', book_id: 'the_lunch_thief', chapter_order: 5, cefr_estimate: 'A1', status: 'published' },
  { id: 'fl-ch01', title: 'The New Kid', book_id: 'finding_leo', chapter_order: 0, cefr_estimate: 'A1', status: 'published' },
  { id: 'fl-ch02', title: 'Alone', book_id: 'finding_leo', chapter_order: 1, cefr_estimate: 'A1', status: 'published' },
  { id: 'fl-ch03', title: 'The Park', book_id: 'finding_leo', chapter_order: 2, cefr_estimate: 'A1', status: 'published' },
  { id: 'fl-ch04', title: 'Lost', book_id: 'finding_leo', chapter_order: 3, cefr_estimate: 'A1', status: 'published' },
  { id: 'fl-ch05', title: 'Searching', book_id: 'finding_leo', chapter_order: 4, cefr_estimate: 'A1', status: 'published' },
  { id: 'fl-ch06', title: 'Home', book_id: 'finding_leo', chapter_order: 5, cefr_estimate: 'A1', status: 'published' },
];

const STUDENT_DEFS = [
  { id: 'stu-01', name: 'María García', l1: 'es',
    wpm: [52,58,61,65,68,72,74,78,80,83,85,88],
    acc: [72,75,78,80,82,84,76,79,82,85,88,90],
    flu: [65,68,70,72,74,76,68,72,75,78,80,82],
    ex:  [75,80,85,78,88,92,72,78,82,85,90,88],
    weakPhonemes: { 'θ': 38, 'ð': 42, 'ʃ': 55, 'ʒ': 48 },
    cards: [
      { word: 'watch', box: 5, cefr: 'A1' }, { word: 'library', box: 4, cefr: 'A2' },
      { word: 'cafeteria', box: 5, cefr: 'B1' }, { word: 'routine', box: 4, cefr: 'B1' },
      { word: 'search', box: 3, cefr: 'A2' }, { word: 'cookie', box: 5, cefr: 'A1' },
      { word: 'apron', box: 3, cefr: 'B2' }, { word: 'counter', box: 4, cefr: 'A2' },
      { word: 'tray', box: 2, cefr: 'B1' }, { word: 'napkin', box: 3, cefr: 'B1' },
      { word: 'suspect', box: 4, cefr: 'B1' }, { word: 'missing', box: 5, cefr: 'A2' },
      { word: 'caught', box: 3, cefr: 'A2' }, { word: 'surprise', box: 4, cefr: 'A2' },
      { word: 'together', box: 5, cefr: 'A2' }, { word: 'lunch', box: 5, cefr: 'A1' },
      { word: 'thief', box: 2, cefr: 'B1' }, { word: 'plan', box: 4, cefr: 'A2' },
      { word: 'evidence', box: 1, cefr: 'B2' }, { word: 'innocent', box: 2, cefr: 'B1' },
      { word: 'guilty', box: 3, cefr: 'B1' }, { word: 'forgive', box: 2, cefr: 'B1' },
      { word: 'promise', box: 4, cefr: 'A2' }, { word: 'share', box: 5, cefr: 'A2' },
      { word: 'nervous', box: 3, cefr: 'A2' }, { word: 'excited', box: 5, cefr: 'A2' },
      { word: 'worried', box: 4, cefr: 'A2' }, { word: 'relieved', box: 2, cefr: 'B1' },
      { word: 'embarrassed', box: 1, cefr: 'B1' }, { word: 'grateful', box: 3, cefr: 'B1' },
      { word: 'confused', box: 4, cefr: 'A2' }, { word: 'afraid', box: 5, cefr: 'A2' },
      { word: 'lonely', box: 3, cefr: 'A2' }, { word: 'proud', box: 4, cefr: 'A2' },
    ],
    booksCompleted: 2,
  },
  { id: 'stu-02', name: 'Diego Reyes', l1: 'es',
    wpm: [38,42,45,48,51,54],
    acc: [58,62,65,68,70,72],
    flu: [50,54,58,60,62,65],
    ex:  [60,65,70,72,68,75],
    weakPhonemes: { 'θ': 28, 'ð': 35, 'ʒ': 40, 'ŋ': 45 },
    cards: [
      { word: 'watch', box: 3, cefr: 'A1' }, { word: 'cafeteria', box: 2, cefr: 'B1' },
      { word: 'routine', box: 2, cefr: 'B1' }, { word: 'search', box: 1, cefr: 'A2' },
      { word: 'cookie', box: 3, cefr: 'A1' }, { word: 'apron', box: 1, cefr: 'B2' },
      { word: 'counter', box: 2, cefr: 'A2' }, { word: 'tray', box: 1, cefr: 'B1' },
      { word: 'napkin', box: 2, cefr: 'B1' }, { word: 'library', box: 3, cefr: 'A2' },
      { word: 'nervous', box: 1, cefr: 'A2' }, { word: 'excited', box: 2, cefr: 'A2' },
      { word: 'worried', box: 1, cefr: 'A2' }, { word: 'afraid', box: 2, cefr: 'A2' },
      { word: 'lonely', box: 1, cefr: 'A2' }, { word: 'confused', box: 2, cefr: 'A2' },
      { word: 'promise', box: 1, cefr: 'A2' }, { word: 'share', box: 3, cefr: 'A2' },
      { word: 'plan', box: 2, cefr: 'A2' }, { word: 'together', box: 3, cefr: 'A2' },
      { word: 'surprise', box: 1, cefr: 'A2' }, { word: 'caught', box: 2, cefr: 'A2' },
    ],
    booksCompleted: 1,
  },
  { id: 'stu-03', name: 'Wei Chen', l1: 'zh',
    wpm: [48,52,55,58,62,65,67,70,72,75,78,80],
    acc: [68,72,75,78,80,82,70,74,78,82,85,87],
    flu: [60,64,68,70,72,75,62,66,70,74,78,80],
    ex:  [72,75,78,80,82,85,70,75,80,82,85,88],
    weakPhonemes: { 'ɹ': 35, 'l': 48, 'θ': 52, 'v': 58 },
    cards: [
      { word: 'watch', box: 4, cefr: 'A1' }, { word: 'library', box: 3, cefr: 'A2' },
      { word: 'cafeteria', box: 4, cefr: 'B1' }, { word: 'routine', box: 3, cefr: 'B1' },
      { word: 'search', box: 4, cefr: 'A2' }, { word: 'cookie', box: 5, cefr: 'A1' },
      { word: 'apron', box: 2, cefr: 'B2' }, { word: 'counter', box: 3, cefr: 'A2' },
      { word: 'tray', box: 4, cefr: 'B1' }, { word: 'napkin', box: 3, cefr: 'B1' },
      { word: 'suspect', box: 3, cefr: 'B1' }, { word: 'missing', box: 4, cefr: 'A2' },
      { word: 'caught', box: 4, cefr: 'A2' }, { word: 'surprise', box: 5, cefr: 'A2' },
      { word: 'together', box: 4, cefr: 'A2' }, { word: 'lunch', box: 5, cefr: 'A1' },
      { word: 'thief', box: 3, cefr: 'B1' }, { word: 'plan', box: 4, cefr: 'A2' },
      { word: 'evidence', box: 2, cefr: 'B2' }, { word: 'innocent', box: 3, cefr: 'B1' },
      { word: 'guilty', box: 2, cefr: 'B1' }, { word: 'forgive', box: 3, cefr: 'B1' },
      { word: 'promise', box: 4, cefr: 'A2' }, { word: 'share', box: 5, cefr: 'A2' },
      { word: 'nervous', box: 4, cefr: 'A2' }, { word: 'excited', box: 5, cefr: 'A2' },
      { word: 'worried', box: 3, cefr: 'A2' }, { word: 'relieved', box: 2, cefr: 'B1' },
    ],
    booksCompleted: 2,
  },
  { id: 'stu-04', name: 'Yuki Tanaka', l1: 'ja',
    wpm: [42,45,48,52,55,58],
    acc: [62,65,68,70,72,75],
    flu: [55,58,60,62,65,68],
    ex:  [65,70,72,75,70,78],
    weakPhonemes: { 'ɹ': 32, 'l': 42, 'θ': 48, 'v': 50, 'ð': 52 },
    cards: [
      { word: 'watch', box: 2, cefr: 'A1' }, { word: 'cafeteria', box: 2, cefr: 'B1' },
      { word: 'routine', box: 1, cefr: 'B1' }, { word: 'search', box: 3, cefr: 'A2' },
      { word: 'cookie', box: 4, cefr: 'A1' }, { word: 'apron', box: 1, cefr: 'B2' },
      { word: 'counter', box: 2, cefr: 'A2' }, { word: 'tray', box: 1, cefr: 'B1' },
      { word: 'napkin', box: 3, cefr: 'B1' }, { word: 'library', box: 2, cefr: 'A2' },
      { word: 'nervous', box: 2, cefr: 'A2' }, { word: 'excited', box: 3, cefr: 'A2' },
      { word: 'worried', box: 1, cefr: 'A2' }, { word: 'afraid', box: 2, cefr: 'A2' },
      { word: 'lonely', box: 1, cefr: 'A2' }, { word: 'confused', box: 3, cefr: 'A2' },
      { word: 'promise', box: 2, cefr: 'A2' }, { word: 'share', box: 4, cefr: 'A2' },
    ],
    booksCompleted: 1,
  },
  { id: 'stu-05', name: 'Soo-Jin Park', l1: 'ko',
    wpm: [55,60,64,68,72,75,78,82,85,88,90,92],
    acc: [78,80,82,85,87,90,80,83,86,88,90,92],
    flu: [72,75,78,80,82,85,74,78,80,83,86,88],
    ex:  [82,85,88,90,92,95,80,85,88,90,92,95],
    weakPhonemes: { 'θ': 55, 'ð': 58 },
    cards: [
      { word: 'watch', box: 5, cefr: 'A1' }, { word: 'library', box: 5, cefr: 'A2' },
      { word: 'cafeteria', box: 5, cefr: 'B1' }, { word: 'routine', box: 4, cefr: 'B1' },
      { word: 'search', box: 5, cefr: 'A2' }, { word: 'cookie', box: 5, cefr: 'A1' },
      { word: 'apron', box: 4, cefr: 'B2' }, { word: 'counter', box: 5, cefr: 'A2' },
      { word: 'tray', box: 4, cefr: 'B1' }, { word: 'napkin', box: 4, cefr: 'B1' },
      { word: 'suspect', box: 5, cefr: 'B1' }, { word: 'missing', box: 5, cefr: 'A2' },
      { word: 'caught', box: 4, cefr: 'A2' }, { word: 'surprise', box: 5, cefr: 'A2' },
      { word: 'together', box: 5, cefr: 'A2' }, { word: 'lunch', box: 5, cefr: 'A1' },
      { word: 'thief', box: 4, cefr: 'B1' }, { word: 'plan', box: 5, cefr: 'A2' },
      { word: 'evidence', box: 3, cefr: 'B2' }, { word: 'innocent', box: 4, cefr: 'B1' },
      { word: 'guilty', box: 4, cefr: 'B1' }, { word: 'forgive', box: 3, cefr: 'B1' },
      { word: 'promise', box: 5, cefr: 'A2' }, { word: 'share', box: 5, cefr: 'A2' },
      { word: 'nervous', box: 5, cefr: 'A2' }, { word: 'excited', box: 5, cefr: 'A2' },
      { word: 'worried', box: 4, cefr: 'A2' }, { word: 'relieved', box: 4, cefr: 'B1' },
      { word: 'embarrassed', box: 3, cefr: 'B1' }, { word: 'grateful', box: 4, cefr: 'B1' },
      { word: 'confused', box: 5, cefr: 'A2' }, { word: 'proud', box: 5, cefr: 'A2' },
    ],
    booksCompleted: 2,
  },
  { id: 'stu-06', name: 'Carlos Mendoza', l1: 'es',
    wpm: [32,35,38,40,42,45],
    acc: [52,55,58,60,62,65],
    flu: [45,48,50,52,55,58],
    ex:  [48,52,55,58,60,55],
    weakPhonemes: { 'θ': 22, 'ð': 28, 'ʒ': 35, 'ʃ': 38, 'ŋ': 42 },
    cards: [
      { word: 'watch', box: 1, cefr: 'A1' }, { word: 'cafeteria', box: 1, cefr: 'B1' },
      { word: 'cookie', box: 2, cefr: 'A1' }, { word: 'search', box: 1, cefr: 'A2' },
      { word: 'apron', box: 1, cefr: 'B2' }, { word: 'counter', box: 2, cefr: 'A2' },
      { word: 'tray', box: 1, cefr: 'B1' }, { word: 'napkin', box: 1, cefr: 'B1' },
      { word: 'nervous', box: 1, cefr: 'A2' }, { word: 'afraid', box: 2, cefr: 'A2' },
      { word: 'lonely', box: 1, cefr: 'A2' }, { word: 'confused', box: 1, cefr: 'A2' },
    ],
    booksCompleted: 1,
  },
  { id: 'stu-07', name: 'Mei Lin', l1: 'zh',
    wpm: [50,55,60,64,68,72,75,78,82,85,87,90],
    acc: [75,78,80,82,85,88,77,80,83,86,88,90],
    flu: [68,72,74,76,78,82,70,74,78,80,82,85],
    ex:  [78,82,85,88,90,88,80,82,85,88,90,92],
    weakPhonemes: { 'ɹ': 42, 'θ': 55 },
    cards: [
      { word: 'watch', box: 5, cefr: 'A1' }, { word: 'library', box: 4, cefr: 'A2' },
      { word: 'cafeteria', box: 5, cefr: 'B1' }, { word: 'routine', box: 4, cefr: 'B1' },
      { word: 'search', box: 5, cefr: 'A2' }, { word: 'cookie', box: 5, cefr: 'A1' },
      { word: 'apron', box: 3, cefr: 'B2' }, { word: 'counter', box: 5, cefr: 'A2' },
      { word: 'tray', box: 4, cefr: 'B1' }, { word: 'napkin', box: 4, cefr: 'B1' },
      { word: 'suspect', box: 4, cefr: 'B1' }, { word: 'missing', box: 5, cefr: 'A2' },
      { word: 'caught', box: 5, cefr: 'A2' }, { word: 'surprise', box: 5, cefr: 'A2' },
      { word: 'together', box: 5, cefr: 'A2' }, { word: 'lunch', box: 5, cefr: 'A1' },
      { word: 'thief', box: 4, cefr: 'B1' }, { word: 'plan', box: 5, cefr: 'A2' },
      { word: 'evidence', box: 3, cefr: 'B2' }, { word: 'innocent', box: 4, cefr: 'B1' },
      { word: 'guilty', box: 3, cefr: 'B1' }, { word: 'forgive', box: 4, cefr: 'B1' },
      { word: 'promise', box: 5, cefr: 'A2' }, { word: 'share', box: 5, cefr: 'A2' },
      { word: 'nervous', box: 5, cefr: 'A2' }, { word: 'excited', box: 5, cefr: 'A2' },
      { word: 'worried', box: 4, cefr: 'A2' }, { word: 'relieved', box: 3, cefr: 'B1' },
      { word: 'grateful', box: 4, cefr: 'B1' }, { word: 'proud', box: 5, cefr: 'A2' },
    ],
    booksCompleted: 2,
  },
  { id: 'stu-08', name: 'Andrés Silva', l1: 'es',
    wpm: [45,48,52,55,58,62],
    acc: [65,68,70,72,75,78],
    flu: [58,60,62,65,68,70],
    ex:  [68,70,72,75,72,78],
    weakPhonemes: { 'θ': 35, 'ð': 40, 'ʃ': 52 },
    cards: [
      { word: 'watch', box: 3, cefr: 'A1' }, { word: 'cafeteria', box: 2, cefr: 'B1' },
      { word: 'routine', box: 3, cefr: 'B1' }, { word: 'search', box: 2, cefr: 'A2' },
      { word: 'cookie', box: 4, cefr: 'A1' }, { word: 'apron', box: 1, cefr: 'B2' },
      { word: 'counter', box: 3, cefr: 'A2' }, { word: 'tray', box: 2, cefr: 'B1' },
      { word: 'napkin', box: 2, cefr: 'B1' }, { word: 'library', box: 3, cefr: 'A2' },
      { word: 'nervous', box: 2, cefr: 'A2' }, { word: 'excited', box: 4, cefr: 'A2' },
      { word: 'worried', box: 2, cefr: 'A2' }, { word: 'afraid', box: 3, cefr: 'A2' },
      { word: 'lonely', box: 1, cefr: 'A2' }, { word: 'confused', box: 3, cefr: 'A2' },
      { word: 'promise', box: 3, cefr: 'A2' }, { word: 'share', box: 4, cefr: 'A2' },
      { word: 'plan', box: 3, cefr: 'A2' }, { word: 'together', box: 4, cefr: 'A2' },
    ],
    booksCompleted: 1,
  },
  { id: 'stu-09', name: 'Hana Kim', l1: 'ko',
    wpm: [52,56,60,64,68,72,75,78,80,82,84,86],
    acc: [72,75,78,80,82,85,74,78,80,82,85,88],
    flu: [65,68,72,74,76,78,68,72,74,76,80,82],
    ex:  [75,78,82,80,85,88,72,78,80,85,88,90],
    weakPhonemes: { 'θ': 48, 'ð': 52 },
    cards: [
      { word: 'watch', box: 5, cefr: 'A1' }, { word: 'library', box: 4, cefr: 'A2' },
      { word: 'cafeteria', box: 4, cefr: 'B1' }, { word: 'routine', box: 3, cefr: 'B1' },
      { word: 'search', box: 4, cefr: 'A2' }, { word: 'cookie', box: 5, cefr: 'A1' },
      { word: 'apron', box: 3, cefr: 'B2' }, { word: 'counter', box: 4, cefr: 'A2' },
      { word: 'tray', box: 3, cefr: 'B1' }, { word: 'napkin', box: 4, cefr: 'B1' },
      { word: 'suspect', box: 4, cefr: 'B1' }, { word: 'missing', box: 5, cefr: 'A2' },
      { word: 'caught', box: 4, cefr: 'A2' }, { word: 'surprise', box: 5, cefr: 'A2' },
      { word: 'together', box: 4, cefr: 'A2' }, { word: 'lunch', box: 5, cefr: 'A1' },
      { word: 'thief', box: 3, cefr: 'B1' }, { word: 'plan', box: 4, cefr: 'A2' },
      { word: 'evidence', box: 2, cefr: 'B2' }, { word: 'innocent', box: 3, cefr: 'B1' },
      { word: 'guilty', box: 3, cefr: 'B1' }, { word: 'forgive', box: 3, cefr: 'B1' },
      { word: 'promise', box: 4, cefr: 'A2' }, { word: 'share', box: 5, cefr: 'A2' },
      { word: 'nervous', box: 4, cefr: 'A2' }, { word: 'excited', box: 5, cefr: 'A2' },
    ],
    booksCompleted: 2,
  },
  { id: 'stu-10', name: 'Tomás Herrera', l1: 'es',
    wpm: [40,44,48,52,56,60],
    acc: [60,64,68,72,75,78],
    flu: [52,56,60,64,68,72],
    ex:  [55,60,65,68,65,72],
    weakPhonemes: { 'θ': 30, 'ð': 38, 'ʃ': 48 },
    cards: [
      { word: 'watch', box: 2, cefr: 'A1' }, { word: 'cafeteria', box: 1, cefr: 'B1' },
      { word: 'routine', box: 2, cefr: 'B1' }, { word: 'search', box: 1, cefr: 'A2' },
      { word: 'cookie', box: 3, cefr: 'A1' }, { word: 'apron', box: 1, cefr: 'B2' },
      { word: 'counter', box: 2, cefr: 'A2' }, { word: 'tray', box: 1, cefr: 'B1' },
      { word: 'napkin', box: 2, cefr: 'B1' }, { word: 'library', box: 2, cefr: 'A2' },
      { word: 'nervous', box: 1, cefr: 'A2' }, { word: 'excited', box: 3, cefr: 'A2' },
      { word: 'worried', box: 1, cefr: 'A2' }, { word: 'afraid', box: 2, cefr: 'A2' },
      { word: 'lonely', box: 1, cefr: 'A2' }, { word: 'confused', box: 2, cefr: 'A2' },
    ],
    booksCompleted: 1,
  },
];

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function buildTestData() {
  const allTexts = CHAPTERS.map(ch => ({
    ...ch,
    cefr: ch.cefr_estimate,
    audio_urls: null,
    analysis: null,
  }));

  const classes = [{ id: CLASS_ID, class_name: 'Period 3 ELD', class_code: 'ELD3AB', teacher_id: 'teacher-001' }];

  const enrollments = STUDENT_DEFS.map(s => ({
    class_id: CLASS_ID,
    student_id: s.id,
    enrolled_at: dateStr(60),
  }));

  const studentProfiles = {};
  STUDENT_DEFS.forEach(s => {
    studentProfiles[s.id] = { id: s.id, display_name: s.name, email: `${s.id}@test.local` };
  });

  const assignments = [];
  const progress = [];
  const chaptersToAssign = CHAPTERS.slice(0, 12);
  chaptersToAssign.forEach((ch, i) => {
    const aId = `assign-${i}`;
    assignments.push({
      id: aId,
      classId: CLASS_ID,
      textId: ch.id,
      title: `Read: ${ch.title}`,
      tasks: { read: true, record: true, exercises: true },
      dueDate: dateStr(50 - i * 4),
      archivedAt: null,
      createdAt: dateStr(55 - i * 4),
    });

    STUDENT_DEFS.forEach(s => {
      const maxCh = s.booksCompleted * 6;
      if (i < maxCh) {
        progress.push({
          id: `prog-${s.id}-${i}`,
          assignmentId: aId,
          studentId: s.id,
          completed: { read: true, record: true, exercises: true },
          updatedAt: dateStr(48 - i * 4),
        });
      }
    });
  });

  const fluencySessions = [];
  const pronunciationAssessments = [];
  const phonemeSessions = [];
  const exerciseResults = [];
  const srsCards = [];
  const studentRecordings = [];

  const allPhonemes = ['θ','ð','ʃ','ʒ','ŋ','ɹ','l','v','iː','ʌ','e','æ','p','k','t','s','n','m','d','b'];

  STUDENT_DEFS.forEach(s => {
    const maxCh = s.booksCompleted * 6;
    const assignedChapters = CHAPTERS.slice(0, maxCh);

    assignedChapters.forEach((ch, ci) => {
      const sessionDate = dateStr(50 - ci * 4);

      fluencySessions.push({
        id: `flu-${s.id}-${ci}`,
        user_id: s.id,
        text_id: ch.id,
        session_date: sessionDate,
        wpm: s.wpm[ci] || s.wpm[s.wpm.length - 1],
        words_read: Math.round((s.wpm[ci] || 60) * 2),
        duration_seconds: 120,
        session_mode: 'timed',
      });

      const accVal = s.acc[ci] || s.acc[s.acc.length - 1];
      const fluVal = s.flu[ci] || s.flu[s.flu.length - 1];
      pronunciationAssessments.push({
        user_id: s.id,
        text_id: ch.id,
        overall_accuracy: accVal,
        azure_fluency_score: fluVal,
        azure_prosody_score: Math.round(fluVal * 0.95),
        azure_completeness_score: Math.min(100, accVal + 8),
        processed_at: sessionDate,
      });

      const phonemeMedians = {};
      const phonemeCounts = {};
      const weakList = [];
      allPhonemes.forEach(p => {
        const weakVal = s.weakPhonemes[p];
        if (weakVal != null) {
          const growth = Math.min(15, ci * 2);
          phonemeMedians[p] = Math.min(100, weakVal + growth);
          phonemeCounts[p] = 3 + ci;
          if (phonemeMedians[p] < 50) weakList.push(p);
        } else {
          phonemeMedians[p] = 75 + Math.round(Math.sin(ci + p.charCodeAt(0)) * 10);
          phonemeMedians[p] = Math.min(100, Math.max(60, phonemeMedians[p]));
          phonemeCounts[p] = 4 + ci;
        }
      });
      phonemeSessions.push({
        user_id: s.id,
        text_id: ch.id,
        session_date: sessionDate,
        overall_accuracy: accVal,
        phoneme_medians: phonemeMedians,
        phoneme_counts: phonemeCounts,
        weak_phonemes: weakList,
        words_assessed: Math.round((s.wpm[ci] || 60) * 2),
      });

      const exScore = s.ex[ci] || s.ex[s.ex.length - 1];
      const total = 10;
      const score = Math.round(total * exScore / 100);
      const answers = [];
      for (let q = 0; q < total; q++) {
        answers.push({ probeIndex: q, selectedIdx: 0, correct: q < score });
      }
      exerciseResults.push({
        user_id: s.id,
        text_id: ch.id,
        score,
        total,
        completed_at: sessionDate,
        answers,
      });

      studentRecordings.push({
        user_id: s.id,
        text_id: ch.id,
        storage_path: `test/${s.id}/${ch.id}.webm`,
        duration_seconds: 120,
        assessment_status: 'complete',
        created_at: sessionDate,
      });
    });

    s.cards.forEach((card, ci) => {
      const chIdx = ci % Math.min(maxCh, CHAPTERS.length);
      const ch = CHAPTERS[chIdx];
      const reviewDaysAgo = card.box <= 2 ? 1 : card.box <= 3 ? 3 : card.box <= 4 ? 7 : 14;
      const nextDaysAgo = card.box <= 2 ? -1 : card.box <= 3 ? -2 : 5;
      srsCards.push({
        user_id: s.id,
        word: card.word,
        text_id: ch?.id || null,
        leitner_box: card.box,
        card_type: 'translation',
        cefr: card.cefr,
        added_date: dateStr(55 - chIdx * 4),
        last_review_date: dateStr(reviewDaysAgo),
        next_review_date: dateStr(nextDaysAgo),
      });
    });
  });

  return {
    classes,
    enrollments,
    studentProfiles,
    curatedTexts: allTexts,
    books: BOOKS,
    assignments,
    progress,
    fluencySessions,
    pronunciationAssessments,
    phonemeSessions,
    srsCards,
    exerciseResults,
    studentRecordings,
  };
}

let cached = null;

export default function getTestData() {
  if (!cached) cached = buildTestData();
  return cached;
}

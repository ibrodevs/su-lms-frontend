export const student = {
  name: "Амина",
  id: "BO-2024-0876",
  group: "10-А",
};

export const subjects = [
  {
    id: "math",
    title: "Математика",
    teacher: "Айгуль Нурбековна",
    description: "Алгебра, уравнения и практические задания для уверенной подготовки.",
    accent: "#1cb0f6",
    icon: "M",
    image: "/images/subjects/math.svg",
  },
  {
    id: "english",
    title: "Английский язык",
    teacher: "John Smith",
    description: "Грамматика, разговорные структуры и короткая практика после каждого урока.",
    accent: "#58cc02",
    icon: "E",
    image: "/images/subjects/english.svg",
  },
  {
    id: "history-kg",
    title: "История Кыргызстана",
    teacher: "Эржан Оспанов",
    description: "Ключевые периоды истории Кыргызстана, торговые пути и культурное наследие.",
    accent: "#ff9600",
    icon: "И",
    image: "/images/subjects/history.svg",
  },
  {
    id: "informatics",
    title: "Информатика",
    teacher: "Назира Токтосунова",
    description: "Алгоритмы, логика и базовые принципы решения задач в цифровой среде.",
    accent: "#8b5cf6",
    icon: "I",
    image: "/images/subjects/informatics.svg",
  },
];

export const lessons = [
  {
    id: "math-discriminant",
    subjectId: "math",
    title: "Дискриминант квадратного уравнения",
    description:
      "Студент изучит формулу дискриминанта и научится определять количество корней квадратного уравнения.",
    duration: "18 минут",
    youtubeUrl: "https://www.youtube.com/watch?v=ZBalWWHYFQc",
    youtubeEmbedUrl: "https://www.youtube.com/embed/ZBalWWHYFQc",
    passingScore: 85,
    topics: [
      "Что такое квадратное уравнение",
      "Формула дискриминанта",
      "Связь D с количеством корней",
      "Пошаговый пример решения",
      "Типичные ошибки при подстановке коэффициентов",
    ],
    content: `
## Что такое дискриминант?

Дискриминант — это выражение, которое помогает понять, сколько решений имеет квадратное уравнение.

Квадратное уравнение записывается так:

\`ax² + bx + c = 0\`

Формула дискриминанта:

\`D = b² - 4ac\`

Если **D > 0**, уравнение имеет два разных корня. Если **D = 0**, корень один. Если **D < 0**, действительных корней нет.

## Пример

Решим уравнение:

\`x² - 5x + 6 = 0\`

Здесь: \`a = 1\`, \`b = -5\`, \`c = 6\`.

\`D = (-5)² - 4 × 1 × 6 = 25 - 24 = 1\`

Так как дискриминант больше нуля, у уравнения два корня:

\`x₁ = 2\`, \`x₂ = 3\`

## Как не ошибиться

Всегда сначала выпишите коэффициенты, затем аккуратно подставьте их в формулу. Самая частая ошибка — забыть знак минус у коэффициента \`b\`.
`,
    materials: [
      {
        id: "discriminant-notes",
        title: "Конспект по дискриминанту",
        type: "pdf",
        url: "/materials/discriminant.pdf",
      },
      {
        id: "quadratic-examples",
        title: "Примеры решения квадратных уравнений",
        type: "pdf",
        url: "/materials/quadratic-examples.pdf",
      },
    ],
    quiz: {
      id: "quiz-math-discriminant",
      title: "Тест: Дискриминант",
      questions: [
        {
          id: 1,
          question: "Какая формула дискриминанта?",
          options: ["D = b² - 4ac", "D = a² + b²", "D = 2a + b", "D = c² - a"],
          correctAnswer: 0,
        },
        {
          id: 2,
          question: "Сколько корней у уравнения, если D > 0?",
          options: ["Один", "Два", "Ни одного", "Бесконечно много"],
          correctAnswer: 1,
        },
        {
          id: 3,
          question: "Что означает D = 0?",
          options: ["Два корня", "Один корень", "Нет корней", "Нельзя решить"],
          correctAnswer: 1,
        },
        {
          id: 4,
          question: "В уравнении x² - 5x + 6 = 0 чему равен b?",
          options: ["1", "5", "-5", "6"],
          correctAnswer: 2,
        },
        {
          id: 5,
          question: "Если D < 0, то действительных корней...",
          options: ["Два", "Один", "Нет", "Бесконечно много"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "math-linear-systems",
    subjectId: "math",
    title: "Системы линейных уравнений",
    description:
      "Разбор метода подстановки и метода сложения на практических задачах.",
    duration: "16 минут",
    youtubeUrl: "https://www.youtube.com/watch?v=H2C4cTkjq0c",
    youtubeEmbedUrl: "https://www.youtube.com/embed/H2C4cTkjq0c",
    passingScore: 80,
    topics: ["Что такое система", "Метод подстановки", "Метод сложения", "Проверка пары решений"],
    content: `
## Система уравнений

Система линейных уравнений содержит несколько уравнений с одними и теми же неизвестными.

Решение системы — это такая пара значений, которая подходит ко всем уравнениям одновременно.

## Метод подстановки

1. Выразите одну переменную через другую.
2. Подставьте выражение во второе уравнение.
3. Найдите первую переменную.
4. Вернитесь к выражению и найдите вторую переменную.

## Метод сложения

Метод сложения удобен, когда коэффициенты при одной переменной можно быстро уничтожить сложением или вычитанием уравнений.
`,
    materials: [
      {
        id: "linear-systems-notes",
        title: "Памятка по системам уравнений",
        type: "pdf",
        url: "/materials/linear-systems.pdf",
      },
    ],
    quiz: {
      id: "quiz-math-linear-systems",
      title: "Тест: Системы уравнений",
      questions: [
        {
          id: 1,
          question: "Что является решением системы двух уравнений?",
          options: ["Одно число", "Пара значений", "Только x", "Любое значение"],
          correctAnswer: 1,
        },
        {
          id: 2,
          question: "Что делают при методе подстановки?",
          options: ["Выражают переменную", "Строят диаграмму", "Складывают корни", "Удаляют все числа"],
          correctAnswer: 0,
        },
        {
          id: 3,
          question: "Как проверить решение системы?",
          options: ["Подставить в оба уравнения", "Умножить на 0", "Сравнить только x", "Не проверять"],
          correctAnswer: 0,
        },
        {
          id: 4,
          question: "Метод сложения удобен, когда коэффициенты...",
          options: ["Случайные", "Можно сократить", "Всегда равны 1", "Отрицательные"],
          correctAnswer: 1,
        },
        {
          id: 5,
          question: "Если пара значений подходит только к одному уравнению, она...",
          options: ["Решение системы", "Не решение системы", "Всегда верна", "Главный корень"],
          correctAnswer: 1,
        },
      ],
    },
  },
  {
    id: "english-present-simple",
    subjectId: "english",
    title: "Present Simple",
    description:
      "Правило, структура предложений и частые маркеры времени в Present Simple.",
    duration: "14 минут",
    youtubeUrl: "https://www.youtube.com/watch?v=L9AWrJnhsRI",
    youtubeEmbedUrl: "https://www.youtube.com/embed/L9AWrJnhsRI",
    passingScore: 80,
    topics: ["Когда использовать Present Simple", "Утверждения", "Вопросы с do/does", "Отрицания", "Наречия частотности"],
    content: `
## Когда нужен Present Simple?

Present Simple используется для привычек, регулярных действий, фактов и расписаний.

Примеры:

- I study English every day.
- She plays tennis on Sundays.
- Water boils at 100°C.

## Утверждения

С местоимениями **he / she / it** к глаголу часто добавляется окончание **-s**:

\`She reads books.\`

## Вопросы и отрицания

Для вопросов используем **do** или **does**:

\`Do you like math?\`
\`Does he play football?\`

Для отрицания:

\`I do not watch TV.\`
\`She does not eat meat.\`
`,
    materials: [
      {
        id: "present-simple-table",
        title: "Таблица Present Simple",
        type: "pdf",
        url: "/materials/present-simple.pdf",
      },
    ],
    quiz: {
      id: "quiz-english-present-simple",
      title: "Тест: Present Simple",
      questions: [
        {
          id: 1,
          question: "Какой вариант верный?",
          options: ["She play tennis", "She plays tennis", "She playing tennis", "She to play tennis"],
          correctAnswer: 1,
        },
        {
          id: 2,
          question: "Какой вспомогательный глагол нужен для he/she/it?",
          options: ["do", "does", "did", "is"],
          correctAnswer: 1,
        },
        {
          id: 3,
          question: "Что обычно описывает Present Simple?",
          options: ["Привычки и факты", "Действие прямо сейчас", "Будущее с will", "Прошлое"],
          correctAnswer: 0,
        },
        {
          id: 4,
          question: "Выберите отрицание: He ____ coffee.",
          options: ["don't drink", "doesn't drinks", "doesn't drink", "not drink"],
          correctAnswer: 2,
        },
        {
          id: 5,
          question: "Какой маркер времени подходит Present Simple?",
          options: ["yesterday", "now", "usually", "at the moment"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    id: "history-silk-road",
    subjectId: "history-kg",
    title: "Великий Шёлковый путь и Кыргызстан",
    description:
      "Историческая справка о роли территории Кыргызстана в торговых и культурных маршрутах.",
    duration: "17 минут",
    youtubeUrl: "https://www.youtube.com/watch?v=vn3e37VWc0k",
    youtubeEmbedUrl: "https://www.youtube.com/embed/vn3e37VWc0k",
    passingScore: 85,
    topics: ["Маршруты через Тянь-Шань", "Города и караван-сараи", "Торговля и культура", "Историческое наследие"],
    content: `
## Почему Шёлковый путь важен?

Великий Шёлковый путь соединял Восток и Запад. Через территорию современного Кыргызстана проходили маршруты, связывавшие Ферганскую долину, Семиречье, Китай и Центральную Азию.

## Кыргызстан на торговых маршрутах

Горные перевалы Тянь-Шаня были сложными, но важными участками пути. Караваны перевозили шёлк, специи, ремесленные изделия, книги и идеи.

## Культурный обмен

Шёлковый путь был не только торговым маршрутом. Он помогал распространять знания, религиозные идеи, языки, технологии и художественные традиции.

## Что важно запомнить

История Шёлкового пути показывает, что Кыргызстан был частью большой евразийской сети обмена и культурного взаимодействия.
`,
    materials: [
      {
        id: "history-kg-notes",
        title: "Конспект: Шёлковый путь и Кыргызстан",
        type: "pdf",
        url: "/materials/history-kg.pdf",
      },
    ],
    quiz: {
      id: "quiz-history-silk-road",
      title: "Тест: Шёлковый путь",
      questions: [
        {
          id: 1,
          question: "Что соединял Великий Шёлковый путь?",
          options: ["Только города Кыргызстана", "Восток и Запад", "Только Европу", "Только морские порты"],
          correctAnswer: 1,
        },
        {
          id: 2,
          question: "Какие горы связаны с маршрутами Кыргызстана?",
          options: ["Тянь-Шань", "Альпы", "Анды", "Пиренеи"],
          correctAnswer: 0,
        },
        {
          id: 3,
          question: "Что перевозили караваны?",
          options: ["Только камни", "Шёлк, специи и изделия", "Только воду", "Ничего"],
          correctAnswer: 1,
        },
        {
          id: 4,
          question: "Шёлковый путь способствовал...",
          options: ["Изоляции", "Культурному обмену", "Запрету торговли", "Исчезновению городов"],
          correctAnswer: 1,
        },
        {
          id: 5,
          question: "Почему тема важна для истории Кыргызстана?",
          options: ["Показывает роль региона в Евразии", "Не имеет значения", "Относится только к морю", "Это современная трасса"],
          correctAnswer: 0,
        },
      ],
    },
  },
  {
    id: "informatics-algorithms",
    subjectId: "informatics",
    title: "Что такое алгоритм",
    description:
      "Понятие алгоритма, свойства и примеры из повседневной жизни и программирования.",
    duration: "15 минут",
    youtubeUrl: "https://www.youtube.com/watch?v=6hfOvs8pY1k",
    youtubeEmbedUrl: "https://www.youtube.com/embed/6hfOvs8pY1k",
    passingScore: 80,
    topics: ["Определение алгоритма", "Шаги и порядок действий", "Свойства алгоритма", "Примеры алгоритмов"],
    content: `
## Алгоритм простыми словами

Алгоритм — это точное описание шагов, которые нужно выполнить для решения задачи.

Примеры алгоритмов встречаются каждый день: рецепт блюда, инструкция по сборке, маршрут до школы или программа для компьютера.

## Свойства алгоритма

- **Определённость**: каждый шаг должен быть понятен.
- **Конечность**: алгоритм должен завершаться.
- **Результативность**: после выполнения должен получиться результат.
- **Массовость**: алгоритм можно применять к разным похожим задачам.

## Пример

Алгоритм нахождения большего из двух чисел:

1. Прочитать число A.
2. Прочитать число B.
3. Если A > B, вывести A.
4. Иначе вывести B.
`,
    materials: [
      {
        id: "algorithms-notes",
        title: "Конспект: основы алгоритмов",
        type: "pdf",
        url: "/materials/algorithms.pdf",
      },
    ],
    quiz: {
      id: "quiz-informatics-algorithms",
      title: "Тест: Алгоритмы",
      questions: [
        {
          id: 1,
          question: "Что такое алгоритм?",
          options: ["Случайный набор слов", "Точное описание шагов", "Только рисунок", "Любая ошибка"],
          correctAnswer: 1,
        },
        {
          id: 2,
          question: "Какое свойство означает, что алгоритм должен завершаться?",
          options: ["Конечность", "Красота", "Случайность", "Длина"],
          correctAnswer: 0,
        },
        {
          id: 3,
          question: "Что является примером алгоритма?",
          options: ["Рецепт", "Шум", "Пустой лист", "Цвет"],
          correctAnswer: 0,
        },
        {
          id: 4,
          question: "Что важно для каждого шага алгоритма?",
          options: ["Он должен быть непонятным", "Он должен быть точным", "Он должен быть секретным", "Он должен быть бесконечным"],
          correctAnswer: 1,
        },
        {
          id: 5,
          question: "Алгоритмы используются в программировании для...",
          options: ["Решения задач", "Удаления смысла", "Запрета вычислений", "Только дизайна"],
          correctAnswer: 0,
        },
      ],
    },
  },
];

export const getLessonsBySubject = (subjectId) =>
  lessons.filter((lesson) => lesson.subjectId === subjectId);

export const findSubject = (subjectId) =>
  subjects.find((subject) => subject.id === subjectId);

export const findLesson = (lessonId) =>
  lessons.find((lesson) => lesson.id === lessonId);

export const findMaterial = (materialId) =>
  lessons.flatMap((lesson) => lesson.materials).find((material) => material.id === materialId);

export const LANGUAGES = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export const translations = {
  uz: {
    // Login screen
    appTagline: "Matndan videoga, bir necha soniyada",
    googleLogin: "Google orqali kirish",
    freeVideoNote: "Ro'yxatdan o'tgan har bir kishiga",
    freeVideoNote2: "1 ta bepul video",
    freeVideoNote3: "beriladi",

    // Nav
    navCreate: "Yaratish",
    navLibrary: "Mening videolarim",
    navInspire: "Ilhom",
    credits: "kredit",
    pricing: "Tariflar",

    // Hero
    heroTitle1: "Tasavvuringizni",
    heroTitle2: "videoga",
    heroTitle3: "aylantiring",
    heroSubtitle: "Birgina g'oyadan professional, kinematik AI video yarating.",

    // Form
    describeScene: "Sahnani tasvirlang",
    promptPlaceholder: "Masalan: quyosh botayotganda cho'lda yurayotgan tuya, kinematik yorug'lik, sekin harakat, oltin rang...",
    style: "STIL",
    duration: "VAQT",
    ratio: "NISBAT",
    styleCinematic: "Kinematik",
    styleAnime: "Anime",
    styleRealistic: "Realistik",
    style3d: "3D animatsiya",

    // Credits banner
    outOfCredits: "Bepul videongiz tugadi.",
    viewPricing: "Tariflarni ko'rish",

    // Generate button
    generating: "Video yaratilmoqda",
    generateVideo: "Video yaratish",

    // Preview panel
    generatingStyle: "uslubida video yaratilmoqda",
    generatingTime: "Bu odatda 1-3 daqiqa vaqt oladi",
    videoAppearsHere: "Video shu yerda ko'rinadi",
    startTyping: "Chapdagi maydonga tasvir yozib boshlang",

    // Previous videos
    previousVideos: "Oldingi videolar",
    download: "Yuklab olish",
    regenerate: "Qayta yaratish",

    // Library
    myVideos: "Mening videolarim",
    noVideosYet: "Hali video yaratmagansiz",

    // Inspire
    getInspired: "Ilhom oling",
    inspireSubtitle: "AI yordamida yaratilgan kinematik videolar",

    // Errors
    serverError: "Server xatosi",
    videoNotStarted: "Video jarayoni boshlanmadi.",
    statusCheckError: "Holatni tekshirishda xatolik",
    videoGenerationFailed: "Video yaratish muvaffaqiyatsiz tugadi",
    backendConnectionError: "Backendga ulanib bo'lmadi. BACKEND_URL sozlanganini va server ishga tushirilganini tekshiring.",

    // Inspiration items
    inspirationSahro: "Sahro g'oliblari",
    inspirationSoat: "Zamonaviy soat",
    tagKinematik: "Kinematik",
    tagMahsulot: "Mahsulot",

    // Pricing
    pricingTitle: "Narxlar",
    pricingSubtitle: "Sizga eng mos tarifni tanlang. Barcha tariflar asosiy funksiyalarimizdan foydalanishni o'z ichiga oladi.",
    close: "Yopish",
    mostPopular: "Eng ommabop",
    perMonth: "/oy",
    perCredit: "Har bir kredit uchun",
    creditsPerMonth: "kredit / oy",
    loading: "Yuklanmoqda",
    selectPlan: "Tanlash",
    orderError: "To'lov sahifasiga o'tib bo'lmadi. Backend ishlab turganini tekshiring.",
    paymentNote: "To'lov Click orqali amalga oshiriladi. Istalgan vaqtda bekor qilishingiz mumkin.",
    planBasic: "Asosiy",
    planStandard: "Standart",
    planPro: "Pro",
    planMax: "Max",
    featurePlan1: "Kinematik, anime, realistik va 3D uslublar",
    featurePlan2: "16:9, 9:16 va 1:1 nisbatlar",
    featurePlan3: "HD sifatda yuklab olish",
    featurePlan4: "Cheksiz saqlanadigan galereya",

    // Android app
    downloadApp: "Android uchun yuklab olish",
    downloadAppShort: "Ilova",
  },

  ru: {
    appTagline: "От текста к видео за несколько секунд",
    googleLogin: "Войти через Google",
    freeVideoNote: "Каждому зарегистрированному пользователю",
    freeVideoNote2: "даётся 1 бесплатное видео",
    freeVideoNote3: "",

    navCreate: "Создать",
    navLibrary: "Мои видео",
    navInspire: "Вдохновение",
    credits: "кредит",
    pricing: "Тарифы",

    heroTitle1: "Превратите",
    heroTitle2: "воображение",
    heroTitle3: "в видео",
    heroSubtitle: "Создавайте профессиональные кинематографичные AI-видео из одной идеи.",

    describeScene: "Опишите сцену",
    promptPlaceholder: "Например: верблюд идёт по пустыне на закате, кинематографичный свет, замедленное движение, золотой оттенок...",
    style: "СТИЛЬ",
    duration: "ДЛИТЕЛЬНОСТЬ",
    ratio: "СООТНОШЕНИЕ",
    styleCinematic: "Кинематографичный",
    styleAnime: "Аниме",
    styleRealistic: "Реалистичный",
    style3d: "3D анимация",

    outOfCredits: "Ваше бесплатное видео закончилось.",
    viewPricing: "Посмотреть тарифы",

    generating: "Видео создаётся",
    generateVideo: "Создать видео",

    generatingStyle: "создаётся видео в стиле",
    generatingTime: "Обычно это занимает 1-3 минуты",
    videoAppearsHere: "Видео появится здесь",
    startTyping: "Начните с описания в поле слева",

    previousVideos: "Предыдущие видео",
    download: "Скачать",
    regenerate: "Создать заново",

    myVideos: "Мои видео",
    noVideosYet: "Вы ещё не создали ни одного видео",

    getInspired: "Вдохновитесь",
    inspireSubtitle: "Кинематографичные видео, созданные с помощью AI",

    serverError: "Ошибка сервера",
    videoNotStarted: "Процесс создания видео не запущен.",
    statusCheckError: "Ошибка проверки статуса",
    videoGenerationFailed: "Не удалось создать видео",
    backendConnectionError: "Не удалось подключиться к серверу. Проверьте настройку BACKEND_URL и работу сервера.",

    inspirationSahro: "Победители пустыни",
    inspirationSoat: "Современные часы",
    tagKinematik: "Кинематографичный",
    tagMahsulot: "Продукт",

    // Pricing
    pricingTitle: "Тарифы",
    pricingSubtitle: "Выберите подходящий тариф. Все тарифы включают доступ к основным функциям.",
    close: "Закрыть",
    mostPopular: "Самый популярный",
    perMonth: "/мес",
    perCredit: "За каждый кредит",
    creditsPerMonth: "кредитов / мес",
    loading: "Загрузка",
    selectPlan: "Выбрать",
    orderError: "Не удалось перейти к оплате. Проверьте, работает ли сервер.",
    paymentNote: "Оплата производится через Click. Вы можете отменить подписку в любое время.",
    planBasic: "Базовый",
    planStandard: "Стандарт",
    planPro: "Про",
    planMax: "Макс",
    featurePlan1: "Кинематографичный, аниме, реалистичный и 3D стили",
    featurePlan2: "Соотношения 16:9, 9:16 и 1:1",
    featurePlan3: "Скачивание в HD качестве",
    featurePlan4: "Неограниченная сохранённая галерея",

    // Android app
    downloadApp: "Скачать для Android",
    downloadAppShort: "Приложение",
  },

  en: {
    appTagline: "From text to video in seconds",
    googleLogin: "Continue with Google",
    freeVideoNote: "Every registered user gets",
    freeVideoNote2: "1 free video",
    freeVideoNote3: "",

    navCreate: "Create",
    navLibrary: "My Videos",
    navInspire: "Inspire",
    credits: "credits",
    pricing: "Pricing",

    heroTitle1: "Turn your",
    heroTitle2: "imagination",
    heroTitle3: "into video",
    heroSubtitle: "Create professional, cinematic AI videos from a single idea.",

    describeScene: "Describe the scene",
    promptPlaceholder: "E.g. a camel walking through the desert at sunset, cinematic lighting, slow motion, golden tones...",
    style: "STYLE",
    duration: "DURATION",
    ratio: "RATIO",
    styleCinematic: "Cinematic",
    styleAnime: "Anime",
    styleRealistic: "Realistic",
    style3d: "3D animation",

    outOfCredits: "You've used your free video.",
    viewPricing: "View pricing",

    generating: "Generating video",
    generateVideo: "Generate video",

    generatingStyle: "video generating in style",
    generatingTime: "This usually takes 1-3 minutes",
    videoAppearsHere: "Your video will appear here",
    startTyping: "Start by describing a scene on the left",

    previousVideos: "Previous videos",
    download: "Download",
    regenerate: "Regenerate",

    myVideos: "My Videos",
    noVideosYet: "You haven't created any videos yet",

    getInspired: "Get inspired",
    inspireSubtitle: "Cinematic videos created with AI",

    serverError: "Server error",
    videoNotStarted: "Video generation did not start.",
    statusCheckError: "Error checking status",
    videoGenerationFailed: "Video generation failed",
    backendConnectionError: "Could not connect to the backend. Check that BACKEND_URL is configured and the server is running.",

    inspirationSahro: "Desert Wanderers",
    inspirationSoat: "Modern Watch",
    tagKinematik: "Cinematic",
    tagMahsulot: "Product",

    // Pricing
    pricingTitle: "Pricing",
    pricingSubtitle: "Choose the plan that fits you best. All plans include access to our core features.",
    close: "Close",
    mostPopular: "Most popular",
    perMonth: "/mo",
    perCredit: "Per credit",
    creditsPerMonth: "credits / month",
    loading: "Loading",
    selectPlan: "Select",
    orderError: "Could not proceed to checkout. Please check that the backend is running.",
    paymentNote: "Payment is processed via Click. You can cancel anytime.",
    planBasic: "Basic",
    planStandard: "Standard",
    planPro: "Pro",
    planMax: "Max",
    featurePlan1: "Cinematic, anime, realistic and 3D styles",
    featurePlan2: "16:9, 9:16 and 1:1 aspect ratios",
    featurePlan3: "HD quality downloads",
    featurePlan4: "Unlimited saved gallery",

    // Android app
    downloadApp: "Download for Android",
    downloadAppShort: "App",
  },
};
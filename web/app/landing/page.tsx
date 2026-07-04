"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  Globe2,
  Instagram,
  LockKeyhole,
  MailCheck,
  MessageSquareText,
  MonitorPlay,
  Network,
  Play,
  Target,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

const navItems = [
  { href: "#problem", label: "Problem" },
  { href: "#solution", label: "System" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const riskReversals = [
  "Setup in 2 hours",
  "Cancel anytime",
  "Zero management required",
];

const problemCards = [
  {
    title: "The 'Asleep at the Wheel' leak.",
    body: "A lead messages you at 2 AM. Your team replies at 9 AM. You lost the deal.",
    icon: Clock3,
  },
  {
    title: "The overhead trap.",
    body: "You are paying $5,000+/mo for a messy mix of copywriters, editors, and media buyers.",
    icon: BadgeDollarSign,
  },
  {
    title: "Lost knowledge.",
    body: "Your most valuable sales data is buried and forgotten in Google Docs and Telegram chats.",
    icon: Database,
  },
];

const solutionSteps = [
  {
    step: "01",
    title: "The Brand Vault.",
    body: "We absorb your brand guidelines, colors, offers, proof, and tone of voice so the AI sounds exactly like you.",
    icon: LockKeyhole,
  },
  {
    step: "02",
    title: "The 19-agent team executes.",
    body: "Dedicated AI specialists autonomously research, write, and create your video assets.",
    icon: Network,
  },
  {
    step: "03",
    title: "The 24/7 closer.",
    body: "The AI replies to inbound DMs instantly and books meetings in under 2 seconds.",
    icon: MailCheck,
  },
];

const integrations = [
  { name: "HubSpot", icon: Building2 },
  { name: "Meta", icon: Target },
  { name: "TikTok", icon: MonitorPlay },
  { name: "Instagram DMs", icon: Instagram },
  { name: "Stripe", icon: CircleDollarSign },
  { name: "Paddle", icon: Globe2 },
];

const faqItems = [
  {
    q: "Is this just ChatGPT?",
    a: "No. It is a coordinated network of highly trained, specialized AI models built for specific marketing tasks.",
  },
  {
    q: "How does it know my brand?",
    a: "Through our deep Brand Vault onboarding process. We load your proof, offers, audience, voice, objections, and market rules before the agents produce anything.",
  },
  {
    q: "What if the AI makes a mistake?",
    a: "You get a one-click Human Override button for instant manual control. Approvals, budgets, and publishing gates stay under your rules.",
  },
];

const pricingTiers = [
  {
    name: "Basic",
    price: "$200",
    note: "Best for small businesses to test the concept and use only what is necessary.",
    cta: "Start basic",
    featured: false,
    features: [
      "Brand Vault starter setup",
      "Core copy and ad angle generation",
      "Limited creative production",
      "Manual approval queue",
    ],
  },
  {
    name: "Enterprise Pilot",
    price: "$500",
    note: "Capabilities of a medium marketing agency. Full campaign. Prove the ROI for yourself.",
    cta: "Book your pilot",
    featured: true,
    features: [
      "Complete campaign buildout",
      "Video ad generation workflow",
      "DM response simulation",
      "ROI report after the pilot",
    ],
  },
  {
    name: "The AI Operating System",
    price: "$1,500/mo",
    note: "Full access to all 19 agents, unlimited DM closing, and dedicated processing power.",
    cta: "Talk to sales",
    featured: false,
    features: [
      "All 19 specialized agents",
      "Unlimited inbound DM closing",
      "Dedicated processing power",
      "Weekly growth system review",
    ],
  },
];

const articles = [
  {
    title: "How Converza cuts customer acquisition costs by 40%",
    category: "Case note",
    read: "6 min",
  },
  {
    title: "Why the human sales rep is becoming obsolete",
    category: "Opinion",
    read: "4 min",
  },
  {
    title: "The 19-agent revenue team: what each agent does",
    category: "Product",
    read: "8 min",
  },
];

type Language = "en" | "ru" | "uz";

const languageOptions: Array<{ code: Language; label: string; short: string }> = [
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "uz", label: "O'zbekcha", short: "UZ" },
];

const translations = {
  en: {
    nav: {
      items: [
        { href: "#problem", label: "Problem" },
        { href: "#solution", label: "System" },
        { href: "#pricing", label: "Pricing" },
        { href: "#faq", label: "FAQ" },
      ],
      register: "Register",
    },
    hero: {
      eyebrow: "Autonomous Revenue Team for serious operators",
      headline:
        "Fire your $5,000 marketing agency. Hire a 19-agent AI team that never sleeps.",
      subheadline:
        "Converza is your entire Go-To-Market team on autopilot. Just give us your product links, and we will generate high-converting video ads and close leads in your DMs 24/7.",
      cta: "Book Your Pilot",
      risk: ["Setup in 2 hours", "Cancel anytime", "Zero management required"],
    },
    mockup: {
      commandCenter: "Command Center",
      revenueRun: "Revenue run",
      campaign: "Spring Launch · Meta + DMs",
      live: "Live",
      inbound: "Inbound DM",
      inboundMessage: '"Can you send pricing and book a call for tomorrow?"',
      drafted: "AI reply drafted",
      agentLabel: "agent",
      agents: [
        { name: "Strategy", state: "Brief parsed", pct: "100%" },
        { name: "Copywriting", state: "42 hooks ready", pct: "84%" },
        { name: "Video Editing", state: "Rendering cuts", pct: "62%" },
        { name: "DM Closer", state: "11 replies sent", pct: "Live" },
      ],
      nodes: ["Vault", "Strategy", "Copy", "Video", "DMs", "CRM", "Reports", "Budget", "QA"],
    },
    problem: {
      eyebrow: "The bleeding neck",
      title: "Manual Work is Killing Your Sales Pipeline.",
      cards: [
        {
          title: "The 'Asleep at the Wheel' leak.",
          body: "A lead messages you at 2 AM. Your team replies at 9 AM. You lost the deal.",
        },
        {
          title: "The overhead trap.",
          body: "You are paying $5,000+/mo for a messy mix of copywriters, editors, and media buyers.",
        },
        {
          title: "Lost knowledge.",
          body: "Your most valuable sales data is buried and forgotten in Google Docs and Telegram chats.",
        },
      ],
    },
    solution: {
      eyebrow: "The fix",
      title: "We Build the Assets. Meta Drives the Traffic.",
      intro:
        "Your team does not need another dashboard to manage. It needs a machine that takes the raw inputs and ships the revenue work.",
      steps: [
        {
          step: "01",
          title: "The Brand Vault.",
          body: "We absorb your brand guidelines, colors, offers, proof, and tone of voice so the AI sounds exactly like you.",
        },
        {
          step: "02",
          title: "The 19-agent team executes.",
          body: "Dedicated AI specialists autonomously research, write, and create your video assets.",
        },
        {
          step: "03",
          title: "The 24/7 closer.",
          body: "The AI replies to inbound DMs instantly and books meetings in under 2 seconds.",
        },
      ],
    },
    integrations: {
      eyebrow: "Integrations",
      title: "Plugs Directly Into the Tools You Already Use.",
    },
    advantage: {
      eyebrow: "Why us?",
      title: "We Didn't Build a Chatbot. We Built a Digital Workforce.",
      body: "Basic AI wrappers guess and hallucinate. Converza splits your marketing into 19 distinct roles with strict, fail-proof rules. No guessing. 100% precision.",
      roles: [
        ["Strategy", "Offer angles, market map, campaign brief"],
        ["Copywriting", "Hooks, scripts, landing copy, DM replies"],
        ["Video Editing", "Creative variants, captions, cutdowns"],
        ["Revenue QA", "Approval rules, budget checks, reports"],
      ],
    },
    demo: {
      eyebrow: "Proof of concept",
      title: "Behind-the-Scenes Reveal.",
      intro: "Watch the Lead Agent generate a 30-day TikTok campaign in 43 seconds.",
      label: "Behind-the-Scenes Reveal",
      duration: "43 seconds",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Closing Objections.",
      items: [
        {
          q: "Is this just ChatGPT?",
          a: "No. It is a coordinated network of highly trained, specialized AI models built for specific marketing tasks.",
        },
        {
          q: "How does it know my brand?",
          a: "Through our deep Brand Vault onboarding process. We load your proof, offers, audience, voice, objections, and market rules before the agents produce anything.",
        },
        {
          q: "What if the AI makes a mistake?",
          a: "You get a one-click Human Override button for instant manual control. Approvals, budgets, and publishing gates stay under your rules.",
        },
      ],
    },
    pricing: {
      eyebrow: "ROI pitch",
      title: "Stop Buying Hours. Buy Output.",
      intro: "Pick the level that matches the risk you want to remove this month.",
      pilotBadge: "Pilot",
      tiers: [
        {
          name: "Basic",
          price: "$200",
          note: "Best for small businesses to test the concept and use only what is necessary.",
          cta: "Start basic",
          features: [
            "Brand Vault starter setup",
            "Core copy and ad angle generation",
            "Limited creative production",
            "Manual approval queue",
          ],
        },
        {
          name: "Enterprise Pilot",
          price: "$500",
          note: "Capabilities of a medium marketing agency. Full campaign. Prove the ROI for yourself.",
          cta: "Book your pilot",
          features: [
            "Complete campaign buildout",
            "Video ad generation workflow",
            "DM response simulation",
            "ROI report after the pilot",
          ],
        },
        {
          name: "The AI Operating System",
          price: "$1,500/mo",
          note: "Full access to all 19 agents, unlimited DM closing, and dedicated processing power.",
          cta: "Talk to sales",
          features: [
            "All 19 specialized agents",
            "Unlimited inbound DM closing",
            "Dedicated processing power",
            "Weekly growth system review",
          ],
        },
      ],
    },
    founders: {
      eyebrow: "Behind Converza",
      title: "Built by operators who care about systems.",
      people: [
        {
          name: "Nuriddin",
          role: "Founder & CEO",
          bio: "Obsessive systems architect and growth strategist.",
          initials: "N",
        },
        {
          name: "Saidakbar Nosirov",
          role: "CTO & Co-founder",
          bio: "Specialist in complex data routing and backend infrastructure.",
          initials: "SN",
        },
      ],
    },
    blog: {
      eyebrow: "News, cases & blog",
      title: "Field notes from the revenue machine.",
      readNote: "Read note",
      articles: [
        {
          title: "How Converza cuts customer acquisition costs by 40%",
          category: "Case note",
          read: "6 min",
        },
        {
          title: "Why the human sales rep is becoming obsolete",
          category: "Opinion",
          read: "4 min",
        },
        {
          title: "The 19-agent revenue team: what each agent does",
          category: "Product",
          read: "8 min",
        },
      ],
    },
    footer: {
      links: ["Privacy Policy", "Terms of Service", "Legal", "Contact", "Socials"],
    },
    modal: {
      title: "Book Pilot Access",
      description:
        "Request early access to Converza DM Closer. We'll review and approve within 24 hours.",
      fields: {
        fullName: "Full name *",
        businessName: "Business name *",
        challenge: "Main challenge *",
        phone: "Phone number *",
        telegram: "Telegram @username *",
      },
      placeholders: {
        fullName: "Ali Valiyev",
        businessName: "Nafis Beauty Salon",
        challenge: "We lose leads after hours...",
        phone: "+998901234567",
        telegram: "@username",
      },
      hint: "Use the same @username you'll log in with.",
      submit: "Submit Request",
      successTitle: "Request received",
      successBody:
        "We'll check your details and reach out on Telegram or phone within 24 hours.",
      close: "Close",
      closeLabel: "Close form",
    },
  },
  ru: {
    nav: {
      items: [
        { href: "#problem", label: "Проблема" },
        { href: "#solution", label: "Система" },
        { href: "#pricing", label: "Цены" },
        { href: "#faq", label: "FAQ" },
      ],
      register: "Регистрация",
    },
    hero: {
      eyebrow: "Автономная revenue-команда для серьезных операторов",
      headline:
        "Увольте агентство за $5,000. Наймите AI-команду из 19 агентов, которая не спит.",
      subheadline:
        "Converza — ваша Go-To-Market команда на автопилоте. Дайте ссылки на продукты, а мы создадим видео-рекламу и будем закрывать лидов в DM 24/7.",
      cta: "Забронировать пилот",
      risk: ["Настройка за 2 часа", "Отмена в любой момент", "Ноль менеджмента"],
    },
    mockup: {
      commandCenter: "Центр управления",
      revenueRun: "Revenue запуск",
      campaign: "Spring Launch · Meta + DMs",
      live: "Live",
      inbound: "Входящий DM",
      inboundMessage: '"Можете отправить цены и забронировать звонок на завтра?"',
      drafted: "AI-ответ готов",
      agentLabel: "агент",
      agents: [
        { name: "Стратегия", state: "Бриф разобран", pct: "100%" },
        { name: "Копирайтинг", state: "42 хука готовы", pct: "84%" },
        { name: "Видео", state: "Рендеринг роликов", pct: "62%" },
        { name: "DM closer", state: "11 ответов отправлено", pct: "Live" },
      ],
      nodes: ["Vault", "Стратегия", "Копи", "Видео", "DMs", "CRM", "Отчеты", "Бюджет", "QA"],
    },
    problem: {
      eyebrow: "Боль в воронке",
      title: "Ручная работа убивает ваш sales pipeline.",
      cards: [
        {
          title: "Лид пришел ночью.",
          body: "Лид пишет в 2:00. Команда отвечает в 9:00. Сделка уже ушла.",
        },
        {
          title: "Ловушка расходов.",
          body: "Вы платите $5,000+/мес за хаотичную смесь копирайтеров, монтажеров и медиабайеров.",
        },
        {
          title: "Потерянные знания.",
          body: "Самые ценные sales-данные лежат забытыми в Google Docs и Telegram-чатах.",
        },
      ],
    },
    solution: {
      eyebrow: "Решение",
      title: "Мы создаем ассеты. Meta приводит трафик.",
      intro:
        "Команде не нужен еще один dashboard для ручного контроля. Ей нужна машина, которая берет входные данные и выпускает revenue-работу.",
      steps: [
        {
          step: "01",
          title: "Brand Vault.",
          body: "Мы впитываем бренд-гайд, цвета, офферы, доказательства и тон, чтобы AI звучал как вы.",
        },
        {
          step: "02",
          title: "Работает команда из 19 агентов.",
          body: "Специализированные AI-агенты автономно исследуют, пишут и создают видео-ассеты.",
        },
        {
          step: "03",
          title: "Closer 24/7.",
          body: "AI мгновенно отвечает на входящие DM и бронирует встречи меньше чем за 2 секунды.",
        },
      ],
    },
    integrations: {
      eyebrow: "Интеграции",
      title: "Подключается к инструментам, которыми вы уже пользуетесь.",
    },
    advantage: {
      eyebrow: "Почему мы?",
      title: "Мы построили не чатбот. Мы построили цифровую команду.",
      body: "Обычные AI-wrapper'ы гадают и ошибаются. Converza делит маркетинг на 19 ролей со строгими правилами. Без догадок. Максимальная точность.",
      roles: [
        ["Стратегия", "Углы оффера, карта рынка, бриф кампании"],
        ["Копирайтинг", "Хуки, скрипты, лендинг-копи, DM-ответы"],
        ["Видео", "Креативные варианты, captions, короткие версии"],
        ["Revenue QA", "Правила approvals, проверка бюджета, отчеты"],
      ],
    },
    demo: {
      eyebrow: "Демо",
      title: "Закулисный разбор.",
      intro: "Смотрите, как Lead Agent генерирует 30-дневную TikTok-кампанию за 43 секунды.",
      label: "Behind-the-Scenes Reveal",
      duration: "43 секунды",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Закрываем возражения.",
      items: [
        {
          q: "Это просто ChatGPT?",
          a: "Нет. Это координированная сеть обученных специализированных AI-моделей для конкретных маркетинговых задач.",
        },
        {
          q: "Как система узнает мой бренд?",
          a: "Через глубокий onboarding Brand Vault. Мы загружаем доказательства, офферы, аудиторию, голос, возражения и рыночные правила до генерации.",
        },
        {
          q: "Что если AI ошибется?",
          a: "Есть кнопка Human Override для мгновенного ручного контроля. Approvals, бюджеты и публикации остаются под вашими правилами.",
        },
      ],
    },
    pricing: {
      eyebrow: "ROI",
      title: "Покупайте не часы. Покупайте output.",
      intro: "Выберите уровень риска, который хотите убрать в этом месяце.",
      pilotBadge: "Пилот",
      tiers: [
        {
          name: "Basic",
          price: "$200",
          note: "Для малого бизнеса, чтобы проверить концепт и использовать только необходимое.",
          cta: "Начать Basic",
          features: [
            "Стартовая настройка Brand Vault",
            "Генерация копи и рекламных углов",
            "Ограниченное производство креативов",
            "Ручная очередь approvals",
          ],
        },
        {
          name: "Enterprise Pilot",
          price: "$500",
          note: "Возможности среднего маркетингового агентства. Полная кампания. Проверьте ROI сами.",
          cta: "Забронировать пилот",
          features: [
            "Полная сборка кампании",
            "Процесс генерации видео-рекламы",
            "Симуляция DM-ответов",
            "ROI-отчет после пилота",
          ],
        },
        {
          name: "The AI Operating System",
          price: "$1,500/мес",
          note: "Полный доступ ко всем 19 агентам, unlimited DM closing и выделенная мощность.",
          cta: "Связаться с sales",
          features: [
            "Все 19 специализированных агентов",
            "Unlimited закрытие входящих DM",
            "Выделенная вычислительная мощность",
            "Еженедельный обзор growth-системы",
          ],
        },
      ],
    },
    founders: {
      eyebrow: "Кто за Converza",
      title: "Создано операторами, которые думают системами.",
      people: [
        {
          name: "Nuriddin",
          role: "Founder & CEO",
          bio: "Системный архитектор и growth-стратег.",
          initials: "N",
        },
        {
          name: "Saidakbar Nosirov",
          role: "CTO & Co-founder",
          bio: "Специалист по сложной маршрутизации данных и backend-инфраструктуре.",
          initials: "SN",
        },
      ],
    },
    blog: {
      eyebrow: "Новости, кейсы и блог",
      title: "Полевые заметки revenue-машины.",
      readNote: "Читать",
      articles: [
        {
          title: "Как Converza снижает CAC на 40%",
          category: "Кейс",
          read: "6 мин",
        },
        {
          title: "Почему человеческий sales rep устаревает",
          category: "Мнение",
          read: "4 мин",
        },
        {
          title: "Revenue-команда из 19 агентов: что делает каждый",
          category: "Продукт",
          read: "8 мин",
        },
      ],
    },
    footer: {
      links: ["Privacy Policy", "Terms of Service", "Legal", "Contact", "Socials"],
    },
    modal: {
      title: "Доступ к пилоту",
      description:
        "Оставьте заявку на ранний доступ к Converza DM Closer. Мы рассмотрим и одобрим в течение 24 часов.",
      fields: {
        fullName: "Полное имя *",
        businessName: "Название бизнеса *",
        challenge: "Главная проблема *",
        phone: "Номер телефона *",
        telegram: "Telegram @username *",
      },
      placeholders: {
        fullName: "Ali Valiyev",
        businessName: "Nafis Beauty Salon",
        challenge: "Мы теряем лидов после рабочего времени...",
        phone: "+998901234567",
        telegram: "@username",
      },
      hint: "Используйте тот же @username, с которым будете входить.",
      submit: "Отправить заявку",
      successTitle: "Заявка получена",
      successBody:
        "Мы проверим данные и напишем в Telegram или позвоним в течение 24 часов.",
      close: "Закрыть",
      closeLabel: "Закрыть форму",
    },
  },
  uz: {
    nav: {
      items: [
        { href: "#problem", label: "Muammo" },
        { href: "#solution", label: "Tizim" },
        { href: "#pricing", label: "Narxlar" },
        { href: "#faq", label: "FAQ" },
      ],
      register: "Ro'yxatdan o'tish",
    },
    hero: {
      eyebrow: "Jiddiy operatorlar uchun avtonom revenue-jamoa",
      headline:
        "$5,000lik marketing agentlikni almashtiring. Uxlamaydigan 19 agentli AI jamoani ishga oling.",
      subheadline:
        "Converza — Go-To-Market jamoangiz avtopilotda. Mahsulot linklarini bering, biz video reklamalar yaratamiz va DMlarda leadlarni 24/7 yopamiz.",
      cta: "Pilotni band qilish",
      risk: ["2 soatda sozlanadi", "Istalgan payt bekor qilish", "Boshqaruv talab qilmaydi"],
    },
    mockup: {
      commandCenter: "Boshqaruv markazi",
      revenueRun: "Revenue jarayoni",
      campaign: "Spring Launch · Meta + DMs",
      live: "Live",
      inbound: "Kiruvchi DM",
      inboundMessage: '"Narxlarni yuborib, ertaga call band qila olasizmi?"',
      drafted: "AI javob tayyorladi",
      agentLabel: "agent",
      agents: [
        { name: "Strategiya", state: "Brief tayyor", pct: "100%" },
        { name: "Kopirayting", state: "42 hook tayyor", pct: "84%" },
        { name: "Video", state: "Roliklar renderda", pct: "62%" },
        { name: "DM Closer", state: "11 javob yuborildi", pct: "Live" },
      ],
      nodes: ["Vault", "Strategiya", "Copy", "Video", "DMs", "CRM", "Hisobot", "Budjet", "QA"],
    },
    problem: {
      eyebrow: "Eng og'riqli joy",
      title: "Qo'lda bajariladigan ish sales pipeline'ni o'ldiryapti.",
      cards: [
        {
          title: "Jamoa uxlayotgan payt.",
          body: "Lead soat 2:00 da yozadi. Jamoa 9:00 da javob beradi. Bitim ketdi.",
        },
        {
          title: "Xarajat tuzog'i.",
          body: "Siz kopirayter, montajchi va media buyer aralashmasi uchun $5,000+/oy to'layapsiz.",
        },
        {
          title: "Yo'qolgan bilim.",
          body: "Eng qimmat sales ma'lumotlari Google Docs va Telegram chatlarda unutilib yotibdi.",
        },
      ],
    },
    solution: {
      eyebrow: "Yechim",
      title: "Biz assetlarni quramiz. Meta trafik olib keladi.",
      intro:
        "Jamoangizga yana bitta dashboard kerak emas. Kerak narsa — inputlarni olib, revenue ishini chiqaradigan mashina.",
      steps: [
        {
          step: "01",
          title: "Brand Vault.",
          body: "Brand guideline, ranglar, offerlar, proof va tone of voice'ni olamiz, shunda AI aynan sizdek gapiradi.",
        },
        {
          step: "02",
          title: "19 agentli jamoa bajaradi.",
          body: "Maxsus AI mutaxassislar avtonom ravishda research qiladi, yozadi va video assetlar yaratadi.",
        },
        {
          step: "03",
          title: "24/7 Closer.",
          body: "AI kiruvchi DMlarga darhol javob beradi va 2 soniyadan kam vaqtda uchrashuv band qiladi.",
        },
      ],
    },
    integrations: {
      eyebrow: "Integratsiyalar",
      title: "Siz ishlatayotgan vositalarga to'g'ridan-to'g'ri ulanadi.",
    },
    advantage: {
      eyebrow: "Nega biz?",
      title: "Biz chatbot qurmadik. Biz raqamli jamoa qurdik.",
      body: "Oddiy AI wrapperlar taxmin qiladi va adashadi. Converza marketingni 19 aniq rolga ajratadi va qat'iy qoidalar bilan ishlaydi. Taxmin yo'q. Aniqlik yuqori.",
      roles: [
        ["Strategiya", "Offer burchaklari, bozor xaritasi, kampaniya briefi"],
        ["Kopirayting", "Hooklar, skriptlar, landing copy, DM javoblar"],
        ["Video", "Creative variantlar, captions, qisqa cutdownlar"],
        ["Revenue QA", "Approval qoidalari, budjet tekshiruvi, hisobotlar"],
      ],
    },
    demo: {
      eyebrow: "Demo",
      title: "Ichki jarayonni ko'ring.",
      intro: "Lead Agent 43 soniyada 30 kunlik TikTok kampaniyasini yaratishini ko'ring.",
      label: "Behind-the-Scenes Reveal",
      duration: "43 soniya",
    },
    faq: {
      eyebrow: "FAQ",
      title: "E'tirozlarga javob.",
      items: [
        {
          q: "Bu shunchaki ChatGPTmi?",
          a: "Yo'q. Bu aniq marketing vazifalari uchun qurilgan, maxsus o'qitilgan AI modellar tarmog'i.",
        },
        {
          q: "U mening brendimni qanday biladi?",
          a: "Brand Vault onboarding orqali. Biz proof, offerlar, auditoriya, voice, objections va bozor qoidalarini yuklaymiz.",
        },
        {
          q: "AI xato qilsa-chi?",
          a: "Bir klik Human Override bor. Approvals, budjet va publish qoidalari sizning nazoratingizda qoladi.",
        },
      ],
    },
    pricing: {
      eyebrow: "ROI",
      title: "Soat sotib olmang. Output sotib oling.",
      intro: "Bu oy qaysi riskni olib tashlamoqchi bo'lsangiz, shunga mos darajani tanlang.",
      pilotBadge: "Pilot",
      tiers: [
        {
          name: "Basic",
          price: "$200",
          note: "Kichik bizneslar uchun konseptni sinab ko'rish va faqat keraklisidan foydalanish.",
          cta: "Basic boshlash",
          features: [
            "Brand Vault boshlang'ich sozlash",
            "Copy va ad angle generatsiyasi",
            "Cheklangan creative ishlab chiqarish",
            "Qo'lda approval queue",
          ],
        },
        {
          name: "Enterprise Pilot",
          price: "$500",
          note: "O'rta marketing agentlik darajasidagi imkoniyat. To'liq kampaniya. ROI'ni o'zingiz isbotlang.",
          cta: "Pilotni band qilish",
          features: [
            "To'liq kampaniya qurilishi",
            "Video reklama generatsiya jarayoni",
            "DM javob simulyatsiyasi",
            "Pilotdan keyin ROI hisobot",
          ],
        },
        {
          name: "The AI Operating System",
          price: "$1,500/oy",
          note: "Barcha 19 agent, unlimited DM closing va dedikatsiyalangan processing power.",
          cta: "Sales bilan gaplashish",
          features: [
            "Barcha 19 maxsus agent",
            "Unlimited kiruvchi DM closing",
            "Dedikatsiyalangan hisoblash quvvati",
            "Haftalik growth-system review",
          ],
        },
      ],
    },
    founders: {
      eyebrow: "Converza ortida kim bor",
      title: "Tizimlar bilan fikrlaydigan operatorlar tomonidan qurilgan.",
      people: [
        {
          name: "Nuriddin",
          role: "Founder & CEO",
          bio: "Tizim arxitektori va growth strategi.",
          initials: "N",
        },
        {
          name: "Saidakbar Nosirov",
          role: "CTO & Co-founder",
          bio: "Murakkab data routing va backend infratuzilmasi bo'yicha mutaxassis.",
          initials: "SN",
        },
      ],
    },
    blog: {
      eyebrow: "Yangiliklar, keyslar va blog",
      title: "Revenue machine'dan field notes.",
      readNote: "O'qish",
      articles: [
        {
          title: "Converza CAC'ni 40%ga qanday kamaytiradi",
          category: "Keys",
          read: "6 daq",
        },
        {
          title: "Nega inson sales rep eskiryapti",
          category: "Fikr",
          read: "4 daq",
        },
        {
          title: "19 agentli revenue jamoa: har biri nima qiladi",
          category: "Product",
          read: "8 daq",
        },
      ],
    },
    footer: {
      links: ["Privacy Policy", "Terms of Service", "Legal", "Contact", "Socials"],
    },
    modal: {
      title: "Pilotga kirish",
      description:
        "Converza DM Closer'ga erta kirish uchun so'rov yuboring. 24 soat ichida ko'rib chiqamiz.",
      fields: {
        fullName: "To'liq ism *",
        businessName: "Biznes nomi *",
        challenge: "Asosiy muammo *",
        phone: "Telefon raqam *",
        telegram: "Telegram @username *",
      },
      placeholders: {
        fullName: "Ali Valiyev",
        businessName: "Nafis Beauty Salon",
        challenge: "Ish vaqtidan keyin leadlar yo'qolyapti...",
        phone: "+998901234567",
        telegram: "@username",
      },
      hint: "Kirish uchun ishlatadigan @username bilan bir xil bo'lsin.",
      submit: "So'rov yuborish",
      successTitle: "So'rov qabul qilindi",
      successBody:
        "Ma'lumotlaringizni tekshirib, 24 soat ichida Telegram yoki telefon orqali bog'lanamiz.",
      close: "Yopish",
      closeLabel: "Formani yopish",
    },
  },
} as const;

type LandingCopy = (typeof translations)[keyof typeof translations];

export default function ConverzaLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pilotRequestOpen, setPilotRequestOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>("en");
  const copy = translations[activeLanguage];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!authModalOpen && !pilotRequestOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAuthModalOpen(false);
        setPilotRequestOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [authModalOpen, pilotRequestOpen]);

  return (
    <main className="relative min-h-screen overflow-hidden text-[#1C1B19]">
      <Header
        scrolled={scrolled}
        copy={copy}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />
      <HeroSection copy={copy} onOpenPilotForm={() => setPilotRequestOpen(true)} />
      <ProblemSection copy={copy} />
      <SolutionSection copy={copy} />
      <IntegrationsSection copy={copy} />
      <AdvantageSection copy={copy} />
      <DemoSection copy={copy} />
      <FaqSection copy={copy} />
      <PricingSection copy={copy} onOpenPilotForm={() => setPilotRequestOpen(true)} />
      <FoundersSection copy={copy} />
      <BlogSection copy={copy} />
      <Footer copy={copy} />
      <AuthModal
        open={authModalOpen}
        copy={copy.modal}
        onClose={() => setAuthModalOpen(false)}
      />
      <PilotRequestModal
        open={pilotRequestOpen}
        onClose={() => setPilotRequestOpen(false)}
      />
    </main>
  );
}

function Header({
  scrolled,
  copy,
  activeLanguage,
  onLanguageChange,
  onOpenAuthModal,
}: {
  scrolled: boolean;
  copy: LandingCopy;
  activeLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onOpenAuthModal: () => void;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4">
      <nav
        className={`pointer-events-auto mx-auto flex w-full max-w-[980px] items-center justify-between rounded-full border px-2 py-2 transition-all duration-300 ${
          scrolled
            ? "border-stone-200 bg-white/88 shadow-sm backdrop-blur-xl"
            : "border-stone-200 bg-white/70 backdrop-blur-xl"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5 rounded-full px-2">
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#1b5bf7] text-white">
            <Workflow size={15} strokeWidth={2.3} />
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1b5bf7]" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">
            Converza
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {copy.nav.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-[13px] font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-[#1C1B19]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector
            activeLanguage={activeLanguage}
            onLanguageChange={onLanguageChange}
          />
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="group inline-flex items-center gap-2 rounded-full bg-[#1b5bf7] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-[1.025] active:scale-[0.98]"
          >
            {copy.nav.register}
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </nav>
    </header>
  );
}

function LanguageSelector({
  activeLanguage,
  onLanguageChange,
}: {
  activeLanguage: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeOption = languageOptions.find((option) => option.code === activeLanguage);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2.5 text-[12px] font-semibold text-stone-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-[#1C1B19]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe2 size={14} strokeWidth={2.1} />
        <span>{activeOption?.short}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-40 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm"
        >
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitem"
              onClick={() => {
                onLanguageChange(option.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                option.code === activeLanguage
                  ? "bg-[#F9F8F6] text-[#1C1B19]"
                  : "text-stone-500 hover:bg-stone-50 hover:text-[#1C1B19]"
              }`}
            >
              {option.label}
              {option.code === activeLanguage ? (
                <span className="h-1.5 w-1.5 rounded-full bg-[#1b5bf7]" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeroSection({
  copy,
  onOpenPilotForm,
}: {
  copy: LandingCopy;
  onOpenPilotForm: () => void;
}) {
  return (
    <section id="top" className="relative px-4 pb-24 pt-36 sm:px-6 lg:pb-32 lg:pt-44">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1b5bf7] shadow-sm" />
            {copy.hero.eyebrow}
          </div>

          <h1 className="max-w-[860px] text-[clamp(46px,6.8vw,94px)] font-semibold leading-[0.98] tracking-[-0.055em] text-[#1C1B19]">
            {copy.hero.headline}
          </h1>

          <p className="mt-7 max-w-[680px] text-[18px] leading-[1.65] text-stone-500 md:text-[20px]">
            {copy.hero.subheadline}
          </p>

          <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onOpenPilotForm}
              className="group inline-flex w-fit items-center gap-2.5 rounded-full bg-[#1b5bf7] px-6 py-4 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.015] active:translate-y-0 active:scale-[0.98]"
            >
              {copy.hero.cta}
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/14">
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
            </button>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-stone-500">
              {copy.hero.risk.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check size={14} strokeWidth={2.3} className="text-[#1b5bf7]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <SplitMockup copy={copy.mockup} />
      </div>
    </section>
  );
}

function SplitMockup({ copy }: { copy: LandingCopy["mockup"] }) {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[48px] bg-[radial-gradient(ellipse_at_center,rgba(27,91,247,0.08),transparent_70%)]" />
      <div className="grid overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1b5bf7]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#7aa2ff]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#b8ccff]" />
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              {copy.commandCenter}
            </span>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-[#F9F8F6] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  {copy.revenueRun}
                </p>
                <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.03em]">
                  {copy.campaign}
                </h3>
              </div>
              <span className="rounded-full border border-[#1b5bf7]/20 bg-[#1b5bf7]/8 px-2.5 py-1 text-[11px] font-semibold text-[#1b5bf7]">
                {copy.live}
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {copy.agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1b5bf7] opacity-25" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-[#1b5bf7]" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{agent.name}</p>
                      <p className="text-[12px] text-stone-500">{agent.state}</p>
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold tabular-nums text-stone-500">
                    {agent.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-stone-500">
              <MessageSquareText size={14} />
              {copy.inbound}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
              {copy.inboundMessage}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F9F8F6] px-3 py-2 text-[12px] text-stone-500">
              <span>{copy.drafted}</span>
              <span className="font-semibold text-[#1b5bf7]">1.8s</span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-[#F9F8F6] p-5">
          <div
            className="absolute inset-0 opacity-[0.42]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.045) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 360 420"
            aria-hidden
          >
            {[
              [180, 70, 95, 145],
              [180, 70, 180, 160],
              [180, 70, 265, 145],
              [95, 145, 74, 250],
              [180, 160, 180, 250],
              [265, 145, 286, 250],
              [74, 250, 180, 330],
              [180, 250, 180, 330],
              [286, 250, 180, 330],
            ].map(([x1, y1, x2, y2], index) => (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(0,0,0,0.14)"
                strokeWidth="1"
              />
            ))}
          </svg>

          <div className="relative grid h-full place-items-center">
            <div className="relative h-[360px] w-full max-w-[330px]">
              {copy.nodes.map((node, index) => {
                const coords = [
                  [50, 8],
                  [20, 28],
                  [50, 32],
                  [80, 28],
                  [14, 62],
                  [50, 62],
                  [86, 62],
                  [50, 86],
                  [50, 50],
                ][index];
                return (
                  <div
                    key={node}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-center shadow-sm ${
                      index === 8 ? "min-w-[124px]" : "min-w-[86px]"
                    }`}
                    style={{ left: `${coords[0]}%`, top: `${coords[1]}%` }}
                  >
                    <span className="block text-[11px] font-semibold text-stone-600">
                      {node}
                    </span>
                    <span className="mt-1 block text-[10px] text-stone-500">
                      {copy.agentLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="problem" eyebrow={copy.problem.eyebrow} title={copy.problem.title}>
      <div className="grid gap-4 md:grid-cols-3">
        {copy.problem.cards.map((card, index) => (
          <WarningCard
            key={card.title}
            {...card}
            icon={problemCards[index].icon}
          />
        ))}
      </div>
    </Section>
  );
}

function WarningCard({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-[24px] border border-[#dbe6ff] bg-[color-mix(in_oklab,#F9F8F6_78%,#dbe6ff)] p-6 shadow-sm">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dbe6ff] bg-white text-[#1b5bf7]">
        <Icon size={18} strokeWidth={2} />
      </div>
      <h3 className="text-[21px] font-semibold leading-[1.15] tracking-[-0.025em]">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-stone-500">{body}</p>
    </article>
  );
}

function SolutionSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section
      id="solution"
      eyebrow={copy.solution.eyebrow}
      title={copy.solution.title}
      intro={copy.solution.intro}
    >
      <div className="grid gap-px overflow-hidden rounded-[28px] border border-stone-200 bg-stone-200 md:grid-cols-3">
        {copy.solution.steps.map((item, index) => (
          <StepCard
            key={item.step}
            {...item}
            icon={solutionSteps[index].icon}
          />
        ))}
      </div>
    </Section>
  );
}

function StepCard({
  step,
  title,
  body,
  icon: Icon,
}: {
  step: string;
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <article className="bg-white p-7 md:p-8">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">
          {step}
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-[#F9F8F6] text-stone-600">
          <Icon size={18} />
        </span>
      </div>
      <h3 className="mt-12 text-[24px] font-semibold leading-[1.12] tracking-[-0.035em]">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-stone-500">{body}</p>
    </article>
  );
}

function IntegrationsSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="relative border-y border-stone-200 bg-[#F9F8F6] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-10 lg:grid-cols-[0.45fr_1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              {copy.integrations.eyebrow}
            </p>
            <h2 className="mt-3 max-w-[430px] text-[clamp(34px,4.5vw,58px)] font-semibold leading-[1.03] tracking-[-0.045em]">
              {copy.integrations.title}
            </h2>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white py-5 shadow-sm">
            <div className="flex animate-[marquee_24s_linear_infinite] gap-3 whitespace-nowrap px-5">
              {[...integrations, ...integrations].map((item, index) => (
                <IntegrationPill key={`${item.name}-${index}`} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}

function IntegrationPill({
  name,
  icon: Icon,
}: {
  name: string;
  icon: LucideIcon;
}) {
  return (
    <span className="inline-flex min-w-fit items-center gap-2 rounded-2xl border border-stone-200 bg-[#F9F8F6] px-4 py-3 text-[14px] font-semibold text-stone-500">
      <Icon size={17} strokeWidth={2} />
      {name}
    </span>
  );
}

function AdvantageSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section
      id="advantage"
      eyebrow={copy.advantage.eyebrow}
      title={copy.advantage.title}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <div className="rounded-[28px] border border-[#E5E3DA] bg-white p-8 shadow-sm">
          <div className="mb-12 grid h-12 w-12 place-items-center rounded-2xl border border-[#E5E3DA] bg-[#F9F8F6] text-[#1b5bf7]">
            <Bot size={22} />
          </div>
          <p className="max-w-[560px] text-[24px] font-medium leading-[1.35] tracking-[-0.025em] text-[#1C1B19]">
            {copy.advantage.body}
          </p>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.advantage.roles.map(([role, output]) => (
              <div
                key={role}
                className="rounded-2xl border border-stone-200 bg-[#F9F8F6] p-4"
              >
                <p className="text-[13px] font-semibold">{role}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
                  {output}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function DemoSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section
      id="demo"
      eyebrow={copy.demo.eyebrow}
      title={copy.demo.title}
      intro={copy.demo.intro}
    >
      <div className="group relative overflow-hidden rounded-[32px] border border-[#E5E3DA] bg-white shadow-sm">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(120,113,108,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,113,108,0.10) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative grid aspect-[16/9] min-h-[320px] place-items-center p-8">
          <button className="group/play grid h-20 w-20 place-items-center rounded-full border border-[#E5E3DA] bg-[#1b5bf7] text-white shadow-sm transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]">
            <Play
              size={25}
              fill="currentColor"
              className="ml-1 transition-transform duration-200 group-hover/play:translate-x-0.5"
            />
          </button>
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3 rounded-2xl border border-[#E5E3DA] bg-[#F9F8F6]/95 p-4 text-[#1C1B19] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[14px] font-medium text-[#1C1B19]">
              {copy.demo.label}
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              {copy.demo.duration}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

function FaqSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="faq" eyebrow={copy.faq.eyebrow} title={copy.faq.title}>
      <div className="divide-y divide-stone-200 rounded-[28px] border border-stone-200 bg-white px-5 shadow-sm md:px-8">
        {copy.faq.items.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
      </div>
    </Section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-6 py-6 text-left"
      >
        <span className="text-[18px] font-semibold tracking-[-0.02em]">{q}</span>
        <span
          className={`grid h-8 w-8 flex-none place-items-center rounded-full border border-stone-200 transition-all duration-200 ${
            open ? "rotate-180 bg-[#1b5bf7] text-white" : "bg-[#F9F8F6] text-[#1C1B19]"
          }`}
        >
          <ChevronDown size={16} />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[820px] pb-7 text-[15.5px] leading-relaxed text-stone-500">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function PricingSection({
  copy,
  onOpenPilotForm,
}: {
  copy: LandingCopy;
  onOpenPilotForm: () => void;
}) {
  return (
    <Section
      id="pricing"
      eyebrow={copy.pricing.eyebrow}
      title={copy.pricing.title}
      intro={copy.pricing.intro}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {copy.pricing.tiers.map((tier, index) => (
          <PricingCard
            key={tier.name}
            {...tier}
            featured={pricingTiers[index].featured}
            pilotBadge={copy.pricing.pilotBadge}
            onOpenPilotForm={onOpenPilotForm}
          />
        ))}
      </div>
    </Section>
  );
}

function PricingCard({
  name,
  price,
  note,
  cta,
  features,
  featured,
  pilotBadge,
  onOpenPilotForm,
}: {
  name: string;
  price: string;
  note: string;
  cta: string;
  features: readonly string[];
  featured: boolean;
  pilotBadge: string;
  onOpenPilotForm: () => void;
}) {
  return (
    <article
      className={`rounded-[28px] border p-7 shadow-sm ${
        featured
          ? "border-stone-300 bg-white shadow-sm"
          : "border-stone-200 bg-[#F9F8F6]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold uppercase tracking-[0.16em] text-stone-500">
          {name}
        </h3>
        {featured ? (
          <span className="rounded-full bg-[#1b5bf7]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1b5bf7]">
            {pilotBadge}
          </span>
        ) : null}
      </div>
      <p className="mt-7 text-[42px] font-semibold tracking-[-0.055em]">
        {price}
      </p>
      <p className="mt-4 min-h-[72px] text-[15px] leading-relaxed text-stone-500">
        {note}
      </p>
      <button
        type="button"
        onClick={onOpenPilotForm}
        className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] ${
          featured
            ? "bg-[#1b5bf7] text-white"
            : "border border-stone-200 bg-white text-[#1C1B19] hover:bg-stone-100"
        }`}
      >
        {cta}
        <ArrowRight size={14} />
      </button>
      <ul className="mt-7 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-[14px] text-stone-500">
            <CheckCircle2
              size={16}
              strokeWidth={2.2}
              className="mt-0.5 flex-none text-[#1b5bf7]"
            />
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}

function FoundersSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section
      id="founders"
      eyebrow={copy.founders.eyebrow}
      title={copy.founders.title}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {copy.founders.people.map((person) => (
          <FounderCard key={person.name} {...person} />
        ))}
      </div>
    </Section>
  );
}

function FounderCard({
  name,
  role,
  bio,
  initials,
}: {
  name: string;
  role: string;
  bio: string;
  initials: string;
}) {
  return (
    <article className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-sm">
      <div className="flex items-start gap-5">
        <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-[#1b5bf7] text-[17px] font-semibold text-white">
          {initials}
        </div>
        <div>
          <h3 className="text-[24px] font-semibold tracking-[-0.035em]">
            {name}
          </h3>
          <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {role}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500">{bio}</p>
        </div>
      </div>
    </article>
  );
}

function BlogSection({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="blog" eyebrow={copy.blog.eyebrow} title={copy.blog.title}>
      <div className="grid gap-4 md:grid-cols-3">
        {copy.blog.articles.map((article) => (
          <article
            key={article.title}
            className="group rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="mb-12 flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              <span>{article.category}</span>
              <span>{article.read}</span>
            </div>
            <h3 className="text-[21px] font-semibold leading-[1.18] tracking-[-0.03em]">
              {article.title}
            </h3>
            <div className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-stone-500 transition-colors group-hover:text-[#1b5bf7]">
              {copy.blog.readNote} <ArrowRight size={14} />
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Footer({ copy }: { copy: LandingCopy }) {
  return (
    <footer className="border-t border-stone-200 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1b5bf7] text-white">
            <Workflow size={15} />
          </span>
          <span className="text-[15px] font-semibold">Converza</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-[13px] font-medium text-stone-500">
          {copy.footer.links.map((link) => (
            <a key={link} href="#" className="hover:text-[#1C1B19]">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function AuthModal({
  open,
  copy,
  onClose,
}: {
  open: boolean;
  copy: LandingCopy["modal"];
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"choices" | "signIn" | "signUp">("choices");
  const [values, setValues] = useState({
    phone: "",
    email: "",
    password: "",
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const passwordChecks = {
    length: values.password.length >= 8,
    letter: /[A-Za-z]/.test(values.password),
    number: /\d/.test(values.password),
  };
  const passwordValid =
    passwordChecks.length && passwordChecks.letter && passwordChecks.number;
  const showPasswordHints = values.password.length > 0;
  const isFormStep = step === "signIn" || step === "signUp";
  const formValid =
    values.phone.trim().length > 0 &&
    values.password.length > 0 &&
    passwordValid &&
    (step === "signIn" || values.email.trim().length > 0);

  useEffect(() => {
    if (!open) return;

    setStep("choices");
    setValues({ phone: "", email: "", password: "" });
    setPasswordTouched(false);
    setSubmittedMessage("");
    setAuthLoading(false);
  }, [open]);

  function continueToDashboard() {
    setAuthLoading(true);
    setSubmittedMessage("");

    window.setTimeout(() => {
      onClose();
      router.push("/");
      setAuthLoading(false);
    }, 350);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C1B19]/35 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pilot-access-title"
        aria-describedby="pilot-access-description"
        className="relative mx-auto max-h-[calc(100vh-32px)] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.closeLabel}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 hover:text-[#1C1B19]"
        >
          <X size={20} strokeWidth={1.8} />
        </button>

        <div className="pr-12">
          <div
            id="pilot-access-title"
            className="font-serif text-[33px] font-normal leading-[0.98] tracking-[-0.045em] text-[#1C1B19] sm:text-[36px]"
          >
            {isFormStep
              ? step === "signUp"
                ? "Sign Up"
                : "Sign In"
              : "Sign Up or Sign In"}
          </div>
          <p
            id="pilot-access-description"
            className="mt-3 max-w-[360px] text-[16px] leading-[1.5] text-stone-500"
          >
            {isFormStep
              ? "Enter your details to continue into Converza."
              : "Choose how you want to access your Converza workspace."}
          </p>
        </div>

        {step === "choices" ? (
          <div className="mt-7">
            <button
              type="button"
              onClick={() => {
                setStep("signUp");
                setSubmittedMessage("");
                setPasswordTouched(false);
              }}
              className="w-full rounded-xl bg-[#1b5bf7] px-5 py-3 text-[15px] font-semibold uppercase tracking-wide text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("signIn");
                setSubmittedMessage("");
                setPasswordTouched(false);
              }}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-100 px-5 py-3 text-[15px] font-semibold uppercase tracking-wide text-stone-800 transition-colors hover:bg-stone-200/70"
            >
              Sign In
            </button>

            <div className="my-5 flex items-center gap-3 text-[14px] font-medium text-stone-500">
              <span className="h-px flex-1 bg-stone-200" />
              Or
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                aria-label="Continue with Google"
                onClick={continueToDashboard}
                className="flex flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 py-3 transition-colors hover:bg-stone-100"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Continue with Telegram"
                onClick={continueToDashboard}
                className="flex flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 py-3 transition-colors hover:bg-stone-100"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#1b5bf7"
                    d="M20.7 4.2 3.9 10.7c-1.15.46-1.14 1.1-.21 1.38l4.31 1.35 1.65 5.06c.2.56.1.78.68.78.45 0 .65-.2.9-.45l2.17-2.11 4.52 3.34c.83.46 1.43.22 1.64-.77l2.96-13.95c.3-1.21-.46-1.76-1.82-1.2Zm-2.66 3.2-8.14 7.35-.31 3.28-1.72-5.25 10.17-5.38Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setPasswordTouched(true);

              if (!formValid) {
                setSubmittedMessage("");
                return;
              }

              void continueToDashboard();
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStep("choices");
                setSubmittedMessage("");
                setPasswordTouched(false);
              }}
              className="mb-1 text-[13px] font-semibold text-stone-500 transition-colors hover:text-[#1C1B19]"
            >
              &larr; Back to choices
            </button>

            <AuthModalInput
              label="Phone Number"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+998901234567"
              value={values.phone}
              onChange={(value) => {
                setValues((current) => ({ ...current, phone: value }));
                setSubmittedMessage("");
              }}
              autoFocus
            />

            {step === "signUp" ? (
              <AuthModalInput
                label="Email Address"
                name="email"
                type="email"
                inputMode="email"
                placeholder="founder@company.com"
                value={values.email}
                onChange={(value) => {
                  setValues((current) => ({ ...current, email: value }));
                  setSubmittedMessage("");
                }}
              />
            ) : null}

            <AuthModalInput
              label="Password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={values.password}
              onChange={(value) => {
                setValues((current) => ({ ...current, password: value }));
                setSubmittedMessage("");
              }}
              onBlur={() => setPasswordTouched(true)}
              minLength={8}
            />

            {showPasswordHints ? (
              <div className="grid gap-1.5 rounded-xl border border-stone-200 bg-[#F9F8F6] p-3">
                {[
                  { label: "At least 8 characters", passed: passwordChecks.length },
                  { label: "One letter", passed: passwordChecks.letter },
                  { label: "One number", passed: passwordChecks.number },
                ].map(({ label, passed }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 text-[12px] font-medium ${
                      passed ? "text-[#1b5bf7]" : "text-stone-500"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border ${
                        passed
                          ? "border-[#1b5bf7] bg-[#1b5bf7] text-white"
                          : "border-stone-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            ) : null}

            {showPasswordHints && passwordTouched && !passwordValid ? (
              <p className="text-[13px] font-medium text-stone-500">
                Password must include 8 characters, one letter, and one number.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-[#1b5bf7] px-5 py-3 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {authLoading
                ? "Opening dashboard..."
                : step === "signUp"
                  ? "Create Account"
                  : "Sign In"}
            </button>

            {submittedMessage ? (
              <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[13px] font-medium text-[#1C1B19]">
                {submittedMessage}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}

function PilotRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({
    fullName: "",
    businessName: "",
    challenge: "",
    phone: "",
    telegram: "",
  });

  useEffect(() => {
    if (!open) return;

    setSubmitted(false);
    setValues({
      fullName: "",
      businessName: "",
      challenge: "",
      phone: "",
      telegram: "",
    });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C1B19]/45 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pilot-request-title"
        aria-describedby="pilot-request-description"
        className="relative max-h-[calc(100vh-32px)] w-full max-w-[600px] overflow-y-auto rounded-[32px] border border-stone-200 bg-white/96 p-6 shadow-sm backdrop-blur sm:rounded-[42px] md:p-10"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close pilot request form"
          className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-[#F9F8F6] text-stone-500 transition-colors hover:text-[#1C1B19]"
        >
          <X size={19} strokeWidth={2} />
        </button>

        <div className="pr-14">
          <div
            id="pilot-request-title"
            className="text-[30px] font-semibold leading-tight tracking-[-0.035em] text-[#1C1B19]"
            style={{ fontFamily: "var(--font-geist), Inter, system-ui, sans-serif" }}
          >
            Book Pilot Access
          </div>
          <p
            id="pilot-request-description"
            className="mt-3 max-w-[450px] text-[18px] leading-relaxed text-stone-400"
          >
            Request early access to Converza DM Closer. We&apos;ll review and
            approve within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="mt-9 rounded-3xl border border-stone-200 bg-[#F9F8F6] p-7">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#1b5bf7] text-white">
              <Check size={21} strokeWidth={2.4} />
            </div>
            <div
              className="mt-5 text-[24px] font-semibold tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-geist), Inter, system-ui, sans-serif" }}
            >
              Request received
            </div>
            <p className="mt-2 text-[16px] leading-relaxed text-stone-500">
              We&apos;ll check your details and reach out on Telegram or phone
              within 24 hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-[#1b5bf7] px-5 py-4 text-[16px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            className="mt-9 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <PilotRequestField
              label="Full name *"
              name="fullName"
              placeholder="Ali Valiyev"
              value={values.fullName}
              onChange={(value) =>
                setValues((current) => ({ ...current, fullName: value }))
              }
              autoFocus
            />
            <PilotRequestField
              label="Business name *"
              name="businessName"
              placeholder="Nafis Beauty Salon"
              value={values.businessName}
              onChange={(value) =>
                setValues((current) => ({ ...current, businessName: value }))
              }
            />
            <PilotRequestField
              label="Main challenge *"
              name="challenge"
              placeholder="We lose leads after hours..."
              value={values.challenge}
              onChange={(value) =>
                setValues((current) => ({ ...current, challenge: value }))
              }
              multiline
            />
            <PilotRequestField
              label="Phone number *"
              name="phone"
              placeholder="+998901234567"
              value={values.phone}
              onChange={(value) =>
                setValues((current) => ({ ...current, phone: value }))
              }
              inputMode="tel"
            />
            <PilotRequestField
              label="Telegram @username *"
              name="telegram"
              placeholder="@username"
              value={values.telegram}
              onChange={(value) =>
                setValues((current) => ({ ...current, telegram: value }))
              }
            />

            <p className="text-[16px] leading-relaxed text-stone-400">
              Use the same @username you&apos;ll log in with.
            </p>

            <button
              type="submit"
              className="w-full rounded-full bg-[#1b5bf7] px-6 py-4 text-[18px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PilotRequestField({
  label,
  name,
  placeholder,
  value,
  onChange,
  multiline = false,
  autoFocus = false,
  inputMode,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  autoFocus?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const fieldClasses =
    "mt-2 w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-[17px] text-[#1C1B19] outline-none transition-shadow placeholder:text-stone-400 focus:border-[#1b5bf7] focus:ring-4 focus:ring-[#1b5bf7]/15";

  return (
    <label className="block">
      <span className="text-[15px] font-semibold text-[#1C1B19]">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClasses} min-h-[122px] resize-y`}
        />
      ) : (
        <input
          name={name}
          placeholder={placeholder}
          required
          autoFocus={autoFocus}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClasses}
        />
      )}
    </label>
  );
}

function AuthModalInput({
  label,
  name,
  type,
  placeholder,
  autoFocus = false,
  inputMode,
  value,
  onChange,
  onBlur,
  minLength,
}: {
  label: string;
  name: string;
  type: "tel" | "email" | "password";
  placeholder: string;
  autoFocus?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  minLength?: number;
}) {
  const fieldClasses =
    "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 font-sans text-[15px] text-[#1C1B19] outline-none transition-shadow placeholder:text-stone-400 focus:border-[#1b5bf7] focus:ring-4 focus:ring-[#1b5bf7]/15";

  return (
    <label className="block">
      <span className="font-sans text-[14px] font-semibold text-[#1C1B19]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        autoFocus={autoFocus}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        minLength={minLength}
        className={fieldClasses}
      />
    </label>
  );
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-12 max-w-[820px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-[clamp(34px,4.6vw,62px)] font-semibold leading-[1.03] tracking-[-0.045em]">
            {title}
          </h2>
          {intro ? (
            <p className="mt-5 max-w-[680px] text-[17px] leading-relaxed text-stone-500">
              {intro}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}




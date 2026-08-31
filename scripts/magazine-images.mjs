// 매거진 본문 이미지 수집 — slug 키워드로 Pexels(우선)·Openverse(fallback) 검색 → RAIL 주석 images[]에 저장.
// 글당 서로 다른 최대 2장 수집(렌더에서 글 길이에 따라 짧으면 1장·길면 2장 사용). 무료·상업이용·중립 스톡.
// 이미 images 있으면 스킵(고정/캐시). 재수집은 --force. 사용: node scripts/magazine-images.mjs [--dry] [--force] [--limit=N]
import fs from "node:fs";
(function loadEnv() {
  try {
    const t = fs.readFileSync(`${import.meta.dirname}/../.env.local`, "utf8");
    for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim(); }
  } catch {}
})();
const S = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEX = process.env.PEXELS_API_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const rest = (p, i = {}) => fetch(`${S}/rest/v1/${p}`, { ...i, headers: { ...H, ...(i.headers || {}) } });
const UA = { "User-Agent": "todaydeals-magazine/1.0 (hello@todaydeals.co.kr)" };

const DRY = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0);
// 특정 slug만 재수집. `--slugs=a,b` 와 `--slugs a,b` 둘 다 받는다.
// (등호를 빼먹어 필터가 조용히 무시된 채 --force 가 걸려 전체 530편이 재수집된 사고가 있었다.)
const slugArgIdx = process.argv.findIndex((a) => a === "--slugs" || a.startsWith("--slugs="));
const slugArgRaw = slugArgIdx === -1 ? "" : (process.argv[slugArgIdx].includes("=") ? process.argv[slugArgIdx].split("=")[1] : (process.argv[slugArgIdx + 1] || ""));
if (slugArgIdx !== -1 && !slugArgRaw) { console.error("✖ --slugs 뒤에 slug 목록이 없다. 예: --slugs=a,b"); process.exit(1); }
const ONLY = slugArgRaw.split(",").filter(Boolean);

const DROP = new Set(["guide", "fact", "factcheck", "check", "compare", "trend", "longrun", "care", "vs", "buying", "types", "type", "dosage", "size", "capacity", "999", "refresh", "self", "selfcheck", "maintenance", "sweetener", "safety", "organic", "inbody", "worth", "it", "direct", "tank", "dose", "absorption", "ratio"]);
// 다의어·약자로 자동 키워드가 엉뚱한 이미지를 부르는 글은 수동 교정(drum=악기, msg=약자, scale=저울 등)
const KW_OVERRIDE = {
  // ── 2026-09-01 신규 9편 ──
  // 자동 추출은 slug 앞 두 단어를 쓴다. "green lipped"·"gout uric" 처럼
  // 성분·질환명이 잘리면 엉뚱한 그림이 온다. 장면으로 바꿔 지정한다.
  "green-lipped-mussel": "green shell seafood",
  "gout-uric-acid-diet": "healthy meal vegetables",
  "omega3-arthritis": "senior hands knee pain",     // 기존 vitamin-e 편과 중복이 나서 장면을 좁혔다
  "bedtime-procrastination": "person phone bed night",
  "elementary-school-bedtime": "child bedroom night",
  "exam-period-sleep-rhythm": "student desk late night study",
  "phone-notification-delay-selfcheck": "smartphone notification screen",
  "phone-gps-accuracy-selfcheck": "smartphone map navigation",
  "hdmi-connection-selfcheck": "hdmi cable tv port",

  // ── 잠자리연구소(수면·침구) 33편 ──
  "baby-sleep-cycle-development": "sleeping newborn baby",
  "baby-sleep-through-night": "baby sleeping crib",
  "sleep-training-methods-compare": "baby nursery crib",
  "toddler-nap-night-sleep": "toddler napping",
  "baby-sleep-environment-safety": "baby crib nursery room",
  "sleep-academic-achievement": "student studying desk",
  "teen-melatonin-phase-delay": "teenager sleeping bed",
  "school-start-time-grades": "student morning backpack",
  "sleep-growth-hormone-height": "child sleeping peacefully",
  "teen-bluelight-sleep": "teenager phone in bed night",
  "teen-sleep-deprivation-mood": "tired teenager",
  "allnighter-memory-consolidation": "student studying at night",
  "cramming-vs-regular-sleep": "student books studying",
  "caffeine-halflife-sleep": "coffee cup evening",
  "power-nap-cognition": "person napping on desk",
  "sleep-debt-cognitive-performance": "tired office worker desk",
  "sleep-deprivation-judgment": "exhausted person office",
  "shift-work-circadian": "night shift worker",
  "social-jetlag-monday": "tired person waking up",
  "post-lunch-dip-coffee-nap": "sleepy office afternoon",
  "burnout-insomnia-cycle": "stressed awake insomnia",
  "menstrual-cycle-sleep": "woman sleeping bed",
  "pregnancy-sleep-position": "pregnant woman sleeping",
  "menopause-insomnia-night-sweats": "woman awake at night",
  "aging-sleep-architecture": "elderly person sleeping",
  "senior-napping": "senior napping armchair",
  "long-term-sleeping-pills": "sleeping pills medication",
  "sleep-dementia-risk": "elderly resting bed",
  "daybed-family-bed-safety": "children bedroom bed",
  "sleep-tracker-accuracy": "smartwatch sleep tracking",
  "wake-up-light-effect": "sunrise bedroom morning window",
  "bedroom-temp-humidity": "cozy bedroom interior",
  "insomnia-sleep-hygiene": "person awake in bed night",
  // ── 잠자리연구소 batch2 +30편 ──
  "baby-sleep-regression-by-age": "baby crying crib night",
  "toddler-separation-anxiety-sleep": "toddler bedtime parent",
  "night-terror-vs-nightmare": "child scared dark bedroom",
  "baby-swaddle-when-stop": "swaddled newborn baby",
  "wake-window-by-age": "awake baby daytime play",
  "exam-anxiety-insomnia": "student stressed late night desk",
  "teen-morning-person-transition": "teenager bedroom curtains sunlight",
  "dream-memory-learning": "person dreaming peaceful sleep",
  "sleep-paralysis": "person lying awake dark bedroom",
  "business-trip-jetlag": "tired traveler airport",
  "remote-work-sleep-rhythm": "home office laptop night",
  "microsleep-danger": "drowsy person computer desk",
  "drowsy-driving-prevention": "tired driver car wheel",
  "exercise-timing-sleep": "evening running exercise city",
  "alcohol-sleep-quality": "wine glass night table",
  "sleep-weight-appetite": "late night snack fridge",
  "postpartum-sleep-deprivation": "tired mother newborn night",
  "breastfeeding-caffeine-sleep": "mother coffee morning baby",
  "birth-control-pill-sleep": "woman medication water morning",
  "pregnancy-early-fatigue": "tired pregnant woman resting sofa",
  "pregnancy-late-insomnia": "pregnant woman awake night bed",
  "nocturia-sleep": "bathroom door night light",
  "parkinson-rbd": "elderly man sleeping bed",
  "sleep-apnea-snoring": "man snoring sleeping bed",
  "restless-legs-syndrome": "legs blanket bed night",
  "seasonal-oversleep-winter": "person sleeping winter window",
  "sleep-immune-function": "sick person resting bed tea",
  "sleep-blood-sugar": "healthy breakfast glucose health",
  "bruxism-teeth-grinding": "man jaw pain morning",
  "melatonin-supplement-truth": "supplement pills bottle nightstand",
  // ── 잠자리연구소 batch3 +30편(예약 리저브) ──
  "child-bedwetting-enuresis": "child bed sheets morning",
  "kids-snoring-adenoids": "child sleeping mouth open",
  "adhd-sleep-children": "boy restless bedroom lamp",
  "toddler-bedtime-resistance": "upset child standing crib dark",
  "pacifier-sleep-weaning": "baby pacifier sleeping",
  "lucid-dreaming": "surreal dream clouds sleep",
  "sleep-8hour-myth": "alarm clock bed morning",
  "sleep-cycle-90min-myth": "bedside clock sleep night",
  "chronotype-productivity": "person working desk window morning",
  "sleep-inertia-grogginess": "man rubbing eyes tired morning",
  "racing-thoughts-bedtime": "man insomnia staring bedroom dark",
  "nap-culture-siesta": "person napping hammock afternoon",
  "night-eating-syndrome": "person eating kitchen night fridge",
  "athlete-sleep-recovery": "athlete resting recovery rest",
  "pcos-sleep": "woman tired lying bed morning",
  "pregnancy-restless-legs": "pregnant woman legs bed",
  "beauty-sleep-skin": "woman sleeping peaceful skin",
  "pregnancy-sleep-apnea": "pregnant woman sleeping side pillow",
  "narcolepsy": "person asleep daytime couch",
  "sleep-heart-health": "heart health monitor checkup",
  "sleep-migraine": "woman forehead pain migraine",
  "gerd-sleep": "person lying bed discomfort chest",
  "sleep-chronic-pain": "person back pain bed",
  "tinnitus-sleep": "man ear ringing hand head",
  "depression-insomnia-adult": "lonely person window night",
  "sleepwalking-parasomnia": "dark hallway night home",
  "thyroid-sleep": "tired woman touching neck",
  "aromatherapy-lavender-sleep": "lavender bedside relaxation",
  "polysomnography-guide": "sleep study clinic sensors",
  "nasal-congestion-sleep": "person tissue cold in bed",
  // ── 알약연구소(건강기능식품) ──
  "lutein-eye-supplement": "leafy greens kale spinach eggs",
  "astaxanthin-eye-fatigue": "tired eyes computer screen woman",
  "bilberry-anthocyanin-eye": "blueberries bowl fresh berries",
  "dry-eye-omega-supplement": "eye drops bottle hand",
  "vitamin-a-night-blindness": "carrots vegetables vitamin food",
  "blue-light-supplement-claim": "person laptop screen night glasses",
  "macular-degeneration-prevention": "senior eye exam optometrist",
  "msm-joint-supplement": "knee pain hands senior",
  "glucosamine-knee": "knee joint xray doctor",
  "chondroitin-joint": "supplement capsules white table",
  "boswellia-arthritis": "frankincense resin herbs",
  "vitamin-k2-bone": "natto fermented soybeans",
  "vitamin-d-deficiency-korea": "sunlight window morning person",
  "zinc-immune": "lozenge tablets cold tea",
  "probiotics-strain-guide": "yogurt probiotics healthy food",
  "propolis-throat": "honey propolis bee product",
  "beta-glucan-immune": "mushrooms shiitake healthy",
  "multivitamin-worth-it": "multivitamin pills variety",
  "gut-leaky-gut-claim": "stomach health digestion person",
  "nattokinase-blood-clot": "natto japanese fermented soybean",
  "red-yeast-rice-cholesterol": "red rice grains bowl",
  "policosanol-hdl": "sugarcane field plant",
  "ginkgo-circulation": "ginkgo leaves autumn tree",
  "berberine-blood-sugar": "blood glucose meter test",
  "omega3-form-rtg-ee": "fish oil capsules golden",
  "milk-thistle-liver": "milk thistle flower purple",
  "vitamin-b-complex-fatigue": "tired office worker desk morning",
  "coq10-energy": "softgel capsules supplement hand",
  "red-ginseng-ginsenoside": "korean red ginseng root",
  "nmn-nad-antiaging": "laboratory research science vials",
  "adrenal-fatigue-myth": "exhausted woman sofa tired",
  "folate-pregnancy": "pregnant woman vitamins healthy",
  "iron-supplement-anemia": "spinach leafy greens iron food",
  "saw-palmetto-prostate": "senior man doctor consultation",
  "soy-isoflavone-menopause": "middle aged woman window calm",
  "biotin-hair-nail": "hair brush healthy hair woman",
  "melatonin-vs-sleep-supplement": "pills bedside table night lamp",
  "cranberry-uti": "cranberries fresh red berries",
  "evening-primrose-gla": "evening primrose yellow flower",
  "turmeric-curcumin": "turmeric powder root spice",
  "muscle-cramp-magnesium": "leg calf stretch night",
  "hyaluronic-acid-oral": "water glass hydration skin",
  "collagen-joint-vs-skin": "collagen powder supplement scoop",
  "osteoporosis-supplement": "senior woman walking bone health",
  "hmb-sarcopenia": "elderly man exercise resistance band",
  "ceramide-barrier": "skincare cream texture close up",
  "hyaluronic-acid-topical": "serum dropper skincare bottle",
  "skin-barrier-basics": "woman touching cheek skin",
  "panthenol-madecassoside": "centella green leaves plant",
  "moisturizer-occlusive-humectant": "moisturizer jar cream white",
  "retinol-wrinkle": "night skincare routine mirror",
  "niacinamide-tone": "clear skin woman face natural",
  "vitamin-c-serum": "orange citrus vitamin serum",
  "tranexamic-azelaic-pigment": "woman face freckles pigment",
  "peptide-skincare": "laboratory skincare science dropper",
  "bha-salicylic-pore": "woman pores skin closeup",
  "benzoyl-peroxide-acne": "acne treatment skincare tube",
  "aha-pha-exfoliant": "exfoliating skincare toner pad",
  "sunscreen-spf-pa-science": "sunscreen tube beach sunny",
  "physical-vs-chemical-sunscreen": "applying sunscreen face outdoor",
  "minoxidil-hairloss": "hair loss comb scalp",
  "garcinia-weight": "weight scale measuring tape",
  "cla-body-fat": "fitness diet meal healthy",
  "hairloss-shampoo-ingredient": "shampoo bottle bathroom hair",
  "scalp-care-dandruff": "scalp hair brush closeup",
  // ── batch19 30편(30일치 비축) ──
  "nas-selfcheck": "network attached storage server",
  "tv-streaming-app-selfcheck": "smart tv streaming app",
  "handy-fan-selfcheck": "handheld portable fan",
  "ice-maker-selfcheck": "ice maker machine",
  "bread-maker-selfcheck": "bread machine home baking",
  "hair-clipper-selfcheck": "hair clipper grooming",
  "sewing-machine-selfcheck": "sewing machine",
  "electric-griddle-selfcheck": "electric griddle cooking",
  "electric-heater-selfcheck": "electric heater room",
  "electric-blanket-selfcheck": "electric blanket bed",
  "graphics-tablet-selfcheck": "drawing tablet stylus",
  "smart-plug-selfcheck": "smart plug outlet",
  "portable-power-station-selfcheck": "portable power station battery",
  "honey-crystallization-factcheck": "honey jar crystallized",
  "tap-water-safety-factcheck": "tap water glass faucet",
  "food-reheating-safety-factcheck": "reheating food microwave",
  "paper-cup-safety-factcheck": "paper coffee cup",
  "canned-food-safety-factcheck": "canned food tins",
  "refrigerated-egg-factcheck": "eggs refrigerator",
  "pet-dryroom-trend": "pet grooming dryer",
  "portable-blender-trend": "portable blender bottle",
  "pet-water-fountain-trend": "pet water fountain cat",
  "cordless-stick-vacuum-trend": "cordless stick vacuum",
  "car-air-purifier-trend": "car air purifier",
  "gaming-monitor-trend": "gaming monitor desk",
  "webcam-buying-guide": "webcam",
  "microphone-buying-guide": "studio microphone",
  "bookshelf-speaker-guide": "bookshelf speakers hifi",
  "air-purifier-buying-guide": "air purifier living room",
  "vacuum-cleaner-buying-guide": "vacuum cleaner home",
  // ── batch18 3일치 6편 ──
  "desktop-pc-power-selfcheck": "desktop computer tower",
  "car-aircon-selfcheck": "car air conditioner dashboard",
  "wine-fridge-selfcheck": "wine refrigerator cellar",
  "tripod-gimbal-guide": "camera tripod gimbal",
  "rug-carpet-guide": "living room rug carpet",
  "expiration-consumption-date-factcheck": "food expiration date label",
  // ── batch17 신규 38편: 약자·다의어 교정(자동추출이 애매한 것만) ──
  "portable-ac-trend": "portable air conditioner room",
  "window-ac-trend": "window air conditioner",
  "dishwasher-efficiency-factcheck": "dishwasher kitchen open",
  "mini-dishwasher-trend": "compact dishwasher countertop",
  "ereader-selfcheck": "e-reader tablet reading",
  "video-doorphone-selfcheck": "video door intercom",
  "ram-ssd-upgrade-guide": "computer ram memory module",
  "usb-hub-dock-guide": "usb-c hub dock laptop",
  "usb-mic-selfcheck": "usb microphone desk",
  "action-cam-selfcheck": "action camera",
  "ipl-epilator-selfcheck": "skincare beauty device home",
  "neckband-speaker-trend": "wearable neck speaker",
  "neck-massager-selfcheck": "neck massage device",
  "foot-spa-selfcheck": "foot bath spa home",
  "nebulizer-selfcheck": "nebulizer inhaler medical",
  "blood-pressure-monitor-selfcheck": "blood pressure monitor arm",
  "game-controller-selfcheck": "game controller gamepad",
  "gaming-mouse-guide": "gaming mouse desk",
  "large-air-fryer-trend": "air fryer kitchen",
  "bladeless-fan-trend": "bladeless fan room",
  "fabric-softener-factcheck": "laundry fabric softener",
  "laundry-detergent-factcheck": "laundry detergent washing",
  "coffee-bean-storage-factcheck": "coffee beans jar storage",
  "coffee-bean-guide": "coffee beans roasted",
  "coffee-grinder-selfcheck": "coffee grinder beans",
  "nonstick-pan-safety-factcheck": "nonstick frying pan",
  "samsung-dishwasher-error": "dishwasher kitchen open",
  "lg-styler-selfcheck": "clothes steamer closet",
  "winia-kimchi-fridge": "refrigerator kitchen storage",
  "lg-codezero-vacuum": "cordless vacuum home",
  "lg-purifier-selfcheck": "water dispenser home",
  "dyson-vacuum-selfcheck": "cordless vacuum cleaner",
  "samsung-tv-error": "television screen living room",
  "bidet-selfcheck": "modern bathroom toilet",
  "iphone-overheating": "smartphone hand sunlight",
  "galaxy-charging-issue": "usb charging port phone",
  "lg-dryer-error-code": "clothes dryer machine",
  "lg-fridge-error-code": "refrigerator modern kitchen",
  "cuchen-ricecooker-reset": "rice cooker kitchen",
  "coway-purifier-selfcheck": "water purifier dispenser",
  "samsung-dryer-error-code": "clothes dryer laundry room",
  // AS셀프체크 브랜드편 — 브랜드명은 스톡에 없으므로 일반 명사로 매핑
  "samsung-aircon-selfdiagnosis": "air conditioner remote control",
  "lg-whisen-aircon-error": "air conditioner indoor unit",
  "samsung-washer-error-code": "washing machine display panel",
  "lg-tromm-error-code": "washing machine drum laundry",
  "galaxy-battery-drain": "smartphone battery low",
  "iphone-battery-health": "smartphone settings screen",
  "cuckoo-ricecooker-reset": "rice cooker kitchen",
  "samsung-fridge-error": "refrigerator display panel",
  "galaxy-force-restart-safemode": "smartphone hand screen",
  "iphone-force-restart": "smartphone restart hand",
  // batch16 — AS·팩트체크·트렌드랩·가이드
  "home-cam-selfcheck": "security camera home",
  "phone-touch-selfcheck": "smartphone screen hand",
  "hair-styler-selfcheck": "hair styler curling",
  "water-flosser-selfcheck": "water flosser bathroom",
  "massage-gun-selfcheck": "massage gun muscle",
  "steam-iron-selfcheck": "steam iron clothes",
  "car-handy-vacuum-selfcheck": "handheld vacuum car",
  "toaster-selfcheck": "toaster bread kitchen",
  "smart-scale-selfcheck": "smart scale bathroom",
  "walking-pad-selfcheck": "walking pad treadmill home",
  "fan-death-factcheck": "electric fan bedroom",
  "microwave-safety-factcheck": "microwave oven kitchen",
  "fridge-electricity-factcheck": "refrigerator kitchen open",
  "bluetooth-radiation-factcheck": "wireless earbuds ear",
  "noise-cancelling-trend": "headphones over ear",
  "soda-maker-trend": "sparkling water soda maker",
  "smart-bulb-trend": "smart light bulb colorful",
  "mechanical-keyboard-guide": "mechanical keyboard desk",
  "monitor-arm-guide": "monitor arm desk setup",
  "tumbler-guide": "tumbler thermos flask",
  "standby-power-factcheck": "power outlet plug wall",
  // batch15 — AS·팩트체크·트렌드랩·가이드
  "bidet-selfcheck2": "modern bathroom toilet",
  "aircon-outdoor-unit-selfcheck": "air conditioner outdoor unit",
  "cordless-vacuum-battery-selfcheck": "cordless vacuum charging",
  "electric-kettle-selfcheck": "electric kettle kitchen",
  "earbuds-case-charging-selfcheck": "wireless earbuds case",
  "gas-range-selfcheck": "gas stove kitchen flame",
  "escooter-ebike-selfcheck": "electric scooter city",
  "smartband-selfcheck": "fitness tracker wrist",
  "electric-shaver-selfcheck": "electric shaver bathroom",
  "laptop-keyboard-selfcheck": "laptop keyboard closeup",
  "supplement-expiry-factcheck": "vitamin supplements bottle",
  "battery-charging-myth-factcheck": "smartphone charging battery",
  "air-purifier-usage-factcheck": "air purifier living room",
  "standby-power-factcheck": "power plug outlet",
  "smarttag-trend": "keychain tracker bag",
  "powerbank-trend": "power bank charging phone",
  "portable-induction-trend": "portable induction cooktop",
  "hdmi-cable-guide": "hdmi cable tv",
  "sdcard-usb-guide": "memory card sd usb",
  "powerstrip-guide": "power strip cables",
  // AS 35일치 배치 — 주방·디지털·계절가전
  "samsung-kimchi-fridge-selfcheck": "refrigerator kitchen modern",
  "skmagic-chungho-purifier-selfcheck": "water dispenser kitchen",
  "canon-epson-printer-selfcheck": "printer desk office",
  "highlight-cooktop-selfcheck": "electric cooktop kitchen",
  "oven-selfcheck": "oven kitchen baking",
  "dehumidifier-selfcheck": "dehumidifier home appliance",
  "fan-circulator-selfcheck": "electric fan room",
  "massage-chair-selfcheck": "massage chair living room",
  "food-waste-processor-selfcheck": "kitchen counter appliance",
  "soundbar-selfcheck": "soundbar tv living room",
  "iphone-faceid-camera-selfcheck": "smartphone camera hand",
  "galaxy-call-speaker-selfcheck": "smartphone call hand",
  "windows-boot-selfcheck": "computer screen error",
  "isp-router-selfcheck": "wifi router home",
  // AS 보충 배치 — 디지털·주방·자동차
  "macbook-selfcheck": "laptop desk coffee",
  "galaxy-tab-selfcheck": "tablet stylus desk",
  "air-fryer-selfcheck": "air fryer kitchen counter",
  "humidifier-selfcheck": "humidifier room mist",
  "lg-dishwasher-selfcheck": "dishwasher kitchen dishes",
  "nintendo-switch-selfcheck": "game console controller",
  "ps5-selfcheck": "game console living room",
  "bluetooth-speaker-selfcheck": "bluetooth speaker table",
  "monitor-no-signal-selfcheck": "computer monitor desk",
  "wireless-keyboard-mouse-selfcheck": "keyboard mouse desk",
  "external-drive-selfcheck": "external hard drive usb",
  "projector-selfcheck": "projector home cinema",
  "hair-dryer-selfcheck": "hair dryer bathroom",
  "electric-toothbrush-selfcheck": "electric toothbrush bathroom",
  "dashcam-selfcheck": "car dashboard camera",
  // 보충 배치 — AS·팩트체크·트렌드랩
  "ipad-charging-selfcheck": "tablet charging cable",
  "microwave-not-heating-selfcheck": "microwave oven kitchen",
  "rinnai-boiler-selfcheck": "boiler heating control panel",
  "galaxy-book-selfcheck": "laptop desk workspace",
  "coffee-machine-selfcheck": "coffee machine espresso",
  "water-purifier-filter-factcheck": "water purifier glass",
  "microwave-container-factcheck": "food container plastic kitchen",
  "vacuum-suction-spec-factcheck": "vacuum cleaner carpet",
  "steam-mop-robot-trend": "robot vacuum mop floor",
  "portable-fan-trend": "handheld fan summer",
  "dehumidifier-trend": "dehumidifier room humidity",
  // AS셀프체크(repair) — 증상형 slug라 자동 키워드가 엉뚱해 전부 수동 지정
  "lg-tv-selfcheck": "television living room",
  "robot-vacuum-selfcheck": "robot vacuum cleaner floor",
  "air-purifier-selfcheck": "air purifier living room",
  "lg-gram-selfcheck": "laptop computer desk",
  "galaxy-watch-selfcheck": "smartwatch wrist",
  "apple-watch-selfcheck": "smartwatch screen wrist",
  "induction-selfcheck": "induction cooktop kitchen",
  "hp-printer-selfcheck": "printer office paper",
  "doorlock-selfcheck": "door lock keypad entrance",
  "settop-box-selfcheck": "tv remote control living room",
  "aircon-weak-cooling-selfcheck": "air conditioner",
  "smartphone-battery-drain-selfcheck": "smartphone battery",
  "washer-drain-selfcheck": "washing machine",
  "wifi-disconnect-selfcheck": "wifi router",
  "smartphone-charging-selfcheck": "phone charging cable",
  "account-login-selfcheck": "laptop password security",
  "fridge-cooling-selfcheck": "refrigerator kitchen",
  "smartphone-storage-slow-selfcheck": "smartphone apps screen",
  "dryer-not-drying-selfcheck": "clothes dryer laundry",
  "tv-no-signal-selfcheck": "television living room",
  "laptop-overheat-selfcheck": "laptop computer desk",
  "printer-not-printing-selfcheck": "printer office",
  "water-purifier-selfcheck": "water dispenser kitchen",
  "mobile-data-call-selfcheck": "smartphone hand city",
  "car-battery-selfcheck": "car engine battery",
  "toploader-vs-drum-compare": "washing machine",
  "stick-vs-robot-vacuum": "vacuum cleaner",
  "induction-vs-highlight-vs-gas": "induction cooktop",
  "castiron-stainless-pan-care-longrun": "cast iron skillet",
  "msg-safety-fact": "seasoning powder",
  "smart-scale-inbody-trend": "bathroom scale",
  "open-ear-earbuds-trend": "wireless earbuds",
  "zero-drink-sweetener-fact": "soda can drink",
  "magnesium-vitamind-fact-check": "vitamin supplement pills",
  "solid-wood-furniture-care-longrun": "wooden furniture",
  "clothing-care-machine-trend": "clothes steamer",
  "smart-ring-trend": "smart ring wearable",
  "led-mask-fact": "led face mask beauty",
  "ai-speaker-trend": "smart speaker",
};
function keyword(slug) {
  if (KW_OVERRIDE[slug]) return KW_OVERRIDE[slug];
  const parts = slug.split("-").filter((w) => !DROP.has(w));
  return parts.slice(0, 2).join(" ").trim() || parts[0] || slug;
}
const hash = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

// 서로 다른 n장 균등 추출
function spread(list, n, mapper) {
  const out = [], seen = new Set();
  for (let i = 0; i < n; i++) {
    let k = Math.min(list.length - 1, Math.floor((i * list.length) / n));
    while (seen.has(k) && k < list.length) k++;
    if (k >= list.length || seen.has(k)) break;
    seen.add(k); out.push(mapper(list[k]));
  }
  return out;
}
async function pexels(q, page, n = 2) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=15&orientation=landscape`, { headers: { Authorization: PEX } });
  if (!r.ok) return [];
  const j = await r.json();
  return spread(j.photos || [], n, (p) => ({ url: p.src.large, credit: p.photographer, source: "Pexels", link: p.url }));
}
async function openverse(q, page, n = 2) {
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page=${page}&page_size=8&license_type=commercial,modification`, { headers: UA });
  if (!r.ok) return [];
  const j = await r.json();
  return spread(j.results || [], n, (x) => ({ url: x.thumbnail || x.url, credit: x.creator || "Unknown", source: `Openverse · ${x.license}`, link: x.foreign_landing_url }));
}

function railGet(bodyHtml) {
  const m = (bodyHtml || "").match(/^\s*<!--RAIL:([\s\S]*?)-->\s*/);
  if (!m) return { rail: {}, rest: bodyHtml || "" };
  let rail = {}; try { rail = JSON.parse(m[1]); } catch {}
  return { rail, rest: (bodyHtml || "").slice(m[0].length) };
}
function railSet(bodyHtml, images) {
  const { rail, rest } = railGet(bodyHtml);
  rail.images = images;
  delete rail.image; // 구 단수 필드 정리
  return `<!--RAIL:${JSON.stringify(rail)}-->\n` + rest.trim();
}

// ★안전장치 — 발행글 이미지는 고정이 원칙이다(글을 손댈 때마다 사진이 바뀌면 안 된다).
// --force 는 파괴적이라 대상을 반드시 좁혀야 한다. 전수 재수집은 --all 을 명시할 때만.
if (FORCE && !ONLY.length && !process.argv.includes("--all")) {
  console.error("✖ --force 를 전체에 걸려면 --all 을 함께 줘야 한다. 보통은 --slugs=a,b 로 대상을 좁혀라.");
  console.error("  (등호 누락으로 필터가 무시된 채 전체 530편이 재수집된 사고가 있었다.)");
  process.exit(1);
}

const rows = await (await rest("magazine?corner=neq.report&select=slug,corner,field,title,body_html&order=created_at.desc&limit=1000")).json();

// ── 브랜드 내 이미지 중복 방지 ──
// spread()는 한 글 안에서만 중복을 막는다. 그래서 같은 키워드가 나오는 글끼리는
// 같은 사진을 물어와 브랜드 전체에서 중복이 생겼다(실측 알약 5건·성분 1건·잠자리 1건).
// 이미 그 브랜드(field)에서 쓰인 URL을 모아두고, 새로 뽑을 때 걸러낸다.
const usedByField = new Map(); // field -> Set(url)
for (const r of rows) {
  const { rail } = railGet(r.body_html);
  const set = usedByField.get(r.field) || usedByField.set(r.field, new Set()).get(r.field);
  for (const im of rail.images || []) if (im?.url) set.add(im.url);
}
/** 이 글에 새로 넣을 이미지에서 같은 브랜드의 "다른 글"이 이미 쓴 것을 뺀다.
 *  자기 기존 이미지는 미리 used에서 빼고 부르므로 여기서 예외 처리하지 않는다.
 *  (예외를 두면 --force 재수집 때 바꾸려던 중복을 그대로 다시 넣는다. 실제로 겪었다.) */
function dedupeInField(imgs, field) {
  const used = usedByField.get(field) || new Set();
  return imgs.filter((im) => !used.has(im.url));
}

let done = 0, skip = 0, fail = 0, n = 0;
for (const row of rows) {
  if (LIMIT && n >= LIMIT) break;
  if (ONLY.length && !ONLY.includes(row.slug)) continue;
  const { rail } = railGet(row.body_html);
  if ((rail.images?.length >= 2 || (!FORCE && rail.images?.length)) && !FORCE) { skip++; continue; }
  n++;
  const kw = keyword(row.slug);
  // 자기 기존 이미지는 used에서 빼둔다. 그래야 다른 글이 쓴 것만 회피 대상이 되고,
  // 재수집일 때 자기 중복 이미지를 "이미 내 것"이라며 되집는 일이 없다.
  const ownUrls = new Set((railGet(row.body_html).rail.images || []).map((x) => x.url));
  { const set = usedByField.get(row.field); if (set) for (const u of ownUrls) set.delete(u); }
  let imgs = [];
  // 같은 브랜드에서 이미 쓴 사진이 걸리면 다음 페이지로 넘겨 다시 뽑는다(최대 4페이지).
  for (let page = (hash(row.slug) % 3) + 1; page <= 6 && imgs.length < 2; page++) {
    let batch = [];
    try { batch = await pexels(kw, page, 4); } catch {}
    if (batch.length < 2) { try { batch = batch.concat(await openverse(kw, page, 4 - batch.length)); } catch {} }
    for (const im of dedupeInField(batch, row.field)) {
      if (imgs.length >= 2) break;
      if (!imgs.some((x) => x.url === im.url)) imgs.push(im);
    }
  }
  if (!imgs.length) { console.log(`  ✖ [${row.slug}] "${kw}" 이미지 없음(브랜드 내 중복 제외 후)`); fail++; continue; }
  { const set = usedByField.get(row.field) || usedByField.set(row.field, new Set()).get(row.field);
    for (const im of imgs) set.add(im.url); } // 다음 글이 같은 걸 안 뽑도록 즉시 등록
  console.log(`  ✓ [${row.slug}] "${kw}" → ${imgs.length}장 (${imgs.map((x) => x.source.split(" ")[0]).join(",")})`);
  if (!DRY) {
    const body_html = railSet(row.body_html, imgs);
    const up = await rest(`magazine?slug=eq.${encodeURIComponent(row.slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ body_html }) });
    if (up.ok) done++; else { console.log(`      PATCH 실패 ${up.status}`); fail++; }
  } else done++;
  await new Promise((r) => setTimeout(r, 250));
}
console.log(`\n[magazine-images] ${DRY ? "DRY " : ""}수집 ${done} · 스킵 ${skip} · 실패 ${fail}`);

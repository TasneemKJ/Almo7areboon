# Next release (1.3): drafts for App Store Connect

Branch `ios/taskit-1.3`. The App Store copy lives in `ios/store/listing.json`; these are the drafts for this version.

## What changed for the player

- **Chapter 3 is free.** Chapters 1 to 3 (First Fires, Olive Terraces, Harbor Watch) are free. Full Journey, the same
  product at the same price, now opens chapters 4 to 6 (Lantern Quarter, Hillside Watch, Courtyards Beyond) and the
  harder timeline. The gate is `FREE_AGES = 3` in `src/ui/app-bridge.ts`; nothing about it is stored in the save.
- **The wall is said before it is met.** Once the company reaches chapter 3, Camp's footer line (the calm line above
  Battle) names what Full Journey opens; after chapter 3 is won it says the free chapters stay to replay. No dialog.
- **Saves from 1.2 load as they are.** A Full Journey owner's save plays on; a free save in chapter 2 finds chapter 3
  open (`tests/save-migration-1-2.test.ts`, raw 1.2 saves in `tests/fixtures/save-1.2-*.json`).
- **The smith's weapons hang from a rack** that stands on the ground, and the kept weapons stand in it, instead of
  floating over Camp.
- **The rating ask** follows only a chapter won for the first time in a timeline: never a defeat, a purchase, a launch,
  a replay or a dusk raid.

## What's New

**English (en-US)**

> Chapter 3 is now free. The Harbor Watch joins the First Fires and the Olive Terraces: three chapters to play before
> you decide anything. Full Journey now opens chapters 4 to 6 and the harder timeline. If you already own it, nothing
> changes, and your save carries on exactly where it was.
>
> The smith's weapons now hang from a proper rack instead of the evening air.

**Arabic (ar-SA)**

> صار الفصل الثالث مجّانياً. تنضمّ حراسة الميناء إلى النيران الأولى ومدرّجات الزيتون: ثلاثة فصول تلعبها قبل أن
> تقرّر أيّ شيء. و«الرحلة كاملة» تفتح الآن الفصول من الرابع إلى السادس والخطّ الزمني الأصعب. وإن كانت لك من قبل
> فلا يتغيّر شيء، ويبقى حفظك حيث تركته.
>
> وأسلحة الحدّاد معلّقة الآن على حاملٍ متين، لا في هواء المساء.

## App Review notes

**English** (paste into the version's Review Notes; the same text is in `listing.json` → `reviewNotes`)

> Almo7areboon is a single-player game that runs fully offline. There is no account, no sign-in, no ads and no data
> collection. Language: Settings (gear on Home) → Language (Arabic / English).
>
> Change in this version: chapter 3 is now free. The non-consumable Full Journey (product Tas.Almo7areboon.fullGame,
> price unchanged) now opens chapters 4 to 6 and the harder timeline; it used to open chapters 3 to 6. Existing owners
> lose nothing: ownership comes from StoreKit and the save is unchanged.
>
> To reach the Full Journey card: open Settings → Full Journey at any time; or win chapter 3 (the Harbor Watch) and
> choose The Full Journey on the victory card; or, with the Harbor Watch army, choose Move camp (Camp → Your company →
> The Road; it shows a lock and the price). The card shows the price, Restore purchases, Terms of Use and Privacy. In
> chapter 3, Camp's footer line says what Full Journey opens, before any lock is met.
>
> The Lamplighter (auto-renewable subscription, monthly or yearly, one group) is unchanged: Settings → The Lamplighter.
> Its benefit is visual only, a row of lit lanterns behind the player's gate; it changes no game number.

**Arabic** (for our own record; App Review reads the English)

> المحاربون لعبة لاعبٍ واحد تعمل دون اتصال كلّياً، بلا حساب ولا تسجيل دخول ولا إعلانات، ولا تجمع أيّ بيانات.
> اللغة: الإعدادات ← اللغة (العربية / الإنجليزية).
>
> الجديد في هذا الإصدار: صار الفصل الثالث مجّانياً. و«الرحلة كاملة» (شراء غير مستهلَك، بالسعر نفسه) تفتح الآن الفصول
> من الرابع إلى السادس والخطّ الزمني الأصعب، وكانت تفتح الفصول من الثالث إلى السادس. ولا يخسر من اشتراها شيئاً:
> الملكية يقرّرها StoreKit، والحفظ لا يتغيّر.
>
> للوصول إلى بطاقة «الرحلة كاملة»: الإعدادات ← الرحلة كاملة في أيّ وقت، أو انتصر في الفصل الثالث (حراسة الميناء)
> واختر «الرحلة كاملة» في بطاقة النصر، أو اختر «انقل المخيّم» بجيش حراسة الميناء (المخيّم ← سريّتك ← الطريق؛ يظهر
> عليه قفلٌ والسعر). في البطاقة السعر واستعادة المشتريات وشروط الاستخدام والخصوصية. وفي الفصل الثالث يذكر سطر
> المخيّم السفلي ما تفتحه «الرحلة كاملة» قبل أن يلقى اللاعب أيّ قفل.

## Before submitting (owner)

- **Product description (App Store Connect metadata, not the product):** the Arabic description of Full Journey
  changes from «الفصول من الثالث إلى السادس والخطّ الأصعب» to «الفصول من الرابع إلى السادس والخطّ الأصعب». The
  English one ("Every later chapter and the harder timeline") is still true. Product ID, type and price are unchanged.
- **IAP review screenshot** `ios/store/review/store-card.png` shows the 1.2 card ("first two chapters", "Twelve new
  troops"); retake it from the 1.3 build.
- **tas-games** (`store/almo7areboon/listing.json`, `almo7areboon/index.html`) still says the first two chapters are
  free; make it match `ios/store/listing.json`.
- **Version numbers:** `MARKETING_VERSION` in the Xcode project and `package.json` still read 1.1 although 1.2 is on
  sale; set 1.3 when cutting the build.

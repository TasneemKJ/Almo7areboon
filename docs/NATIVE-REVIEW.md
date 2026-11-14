# Arabic for a native read (1.1, 2026-11-13)

Every Arabic string added or changed for 1.1, for a native speaker to read before release. The register is the one in
`docs/i18n.md`: simple, warm Modern Standard Arabic (fusha), never colloquial. Numbers and prices are shown left to
right inside the text. `…` stands for a chapter name, a number or a price.

## 1. New names (see DESIGN.md, "names that belong to this tale")

| Where | English | Arabic (new) | Arabic (before) |
|---|---|---|---|
| First Fires heavy troop | Lizard Rider | فارس الضبّ | فارس الديناصور |
| Page title, bottom tab, Camp button | The Road | الطريق | الارتقاء |
| The action (buttons) | MOVE CAMP / Move camp | انقل المخيّم | ارتقِ |
| The Road, decision line | Move camp to **…**. | انقل المخيّم إلى **…**. | ارتقِ إلى **…**. |
| The Road, blocked by a battle | Finish the current battle to move camp. | أنهِ المعركة الحالية لتنقل المخيّم. | أنهِ المعركة الحالية لترتقي. |
| The Road, rival not yet beaten | Defeat the enemy before you move camp again. | اهزم العدوّ قبل أن تنقل المخيّم مرّة أخرى. | اهزم العدوّ لتواصل الارتقاء. |
| The Road, last chapter | THE LAST CAMP | المخيّم الأخير | العصر الأخير |
| Result details button | Move camp · … coins | انقل المخيّم · … من النقود | ارتقِ · … من النقود |
| Result details line | … is next. Your own camp moves separately. | التالي: …. ومخيّمك ينتقل وحده على حِدة. | … وجيشك يرتقي وحده على حِدة. |
| Regroup advice | Moving camp is affordable: … coins. It resets coins, camp upgrades and troop unlocks; review The Road before confirming. | تستطيع الآن نقل المخيّم: … من النقود. نقل المخيّم يعيد النقود وتطويرات المخيّم وفتح الجند إلى البداية؛ راجع «الطريق» قبل أن تؤكّد. | (الارتقاء، تطويرات العصر، «الارتقاء») |
| Regroup advice, cards | Cards … stay when you move camp and in new timelines. | البطاقات تُشترى بالجواهر وتبقى معك بعد نقل المخيّم وفي الخطوط الزمنية الجديدة. | … بعد الارتقاء … |
| New cards dialog | Cards stay when you move camp and in new timelines. | البطاقات تبقى بعد نقل المخيّم وفي الخطوط الزمنية الجديدة. | … بعد الارتقاء … |
| Legacy note | … before battle in The Road. | يمكنك تغيير اختيارك قبل المعركة في «الطريق». | … في الارتقاء. |
| New timeline, reset list | Army: first camp | الجيش: المخيّم الأوّل | الجيش: العصر الأوّل |
| New timeline, explanation | Coins, camp upgrades, troop unlocks and this timeline's seals reset; your army returns to the first camp. | أمّا النقود وتطويرات المخيّم وفتح الجنود وأختام هذا الخطّ الزمنيّ فتُصفَّر، ويعود جيشك إلى المخيّم الأوّل. | (تطويرات العصر، العصر الأوّل) |
| New timeline, preview | In this harder timeline, your camp, coins, upgrades … reset | في هذا الخطّ الأصعب يعود مخيّمك ونقودك وتطويراتك … إلى البداية | … يعود عصرك … |
| Earlier-chapter suggestion | an earlier unlocked opponent no later than your army | خصمٌ مفتوح أسبق، لا يتجاوز مخيّم جيشك. | … لا يتجاوز عصر جيشك. |
| Move camp dialog, title | Move camp to …? | أتنقل المخيّم إلى «…»؟ | أترتقي إلى «…»؟ |
| Move camp dialog, line | Your new army is stronger, but the new camp starts from nothing. | جيشك الجديد أقوى، لكنّ المخيّم الجديد يبدأ من الصفر. | … لكنّ اقتصاد عصرك يبدأ من جديد. |
| Move camp dialog, cost | Moving camp requires **… coins**. | نقل المخيّم يحتاج **… من النقود**. | الارتقاء يحتاج … |
| Move camp dialog, confirm | MOVE CAMP TO … | انقل المخيّم إلى … | ارتقِ إلى … |
| Move camp dialog, decline | STAY IN THIS CAMP | ابقَ في هذا المخيّم | أبقِني في عصري |
| Browser/page title | Almo7areboon — Through the Levant | المحاربون — عبر بلاد الشام | المحاربون — عبر العصور |
| Battle screen, ready banner | YOUR COMPANY. YOUR ROAD. | سريّتك. طريقك. | جيشك. عصرك. |
| Start over dialog | … your camp, coins, upgrades … | … مخيّمك ونقودك وتطويراتك … | … عصرك ونقودك … |
| App Store description (`ios/store/listing.json`) | … move camp to the next chapter and begin again stronger. | وحين تشتدّ سريّتك، انقل مخيّمك إلى الفصل التالي وابدأ من جديد أقوى. | … ارتقِ إلى الفصل التالي … |

Question for the reader: is «الضبّ» understood at once by a young player, or would «السحليّة» («فارس السحليّة») read
more easily? «الضبّ» was chosen because it is the region's own desert lizard.

## 2. New store lines

| Where | English | Arabic |
|---|---|---|
| Move camp control while locked (screen reader) | Locked. Opens with Full Journey, … | مقفل. يُفتح بالرحلة كاملة، … |
| Same, before the price has loaded | Locked. Opens with Full Journey | مقفل. يُفتح بالرحلة كاملة |
| Same, label when there is no price yet | Full Journey | الرحلة كاملة |
| Line under the locked control | This chapter opens with Full Journey, bought once. Moving camp then costs … coins. | هذا الفصل يُفتح بـ«الرحلة كاملة»، تشتريها مرّة واحدة. ثم يكلّف نقل المخيّم … من النقود. |
| Full Journey card, for an imported save past the free chapters | This save is past the free chapters. It is kept exactly as it is, and Full Journey opens it. | هذا الحفظ تجاوز الفصول المجّانية. يبقى محفوظاً كما هو، و«الرحلة كاملة» تفتحه. |
| Full Journey card, button back to a free chapter | Play the free chapters | العب الفصول المجّانية |
| Import confirmation, warning | This save is past the free chapters. It will be kept as it is, but it cannot be played until Full Journey is yours. | هذا الحفظ تجاوز الفصول المجّانية. سيبقى كما هو، لكن لا يمكن اللعب به قبل أن تصير «الرحلة كاملة» لك. |

## 3. Fusha audit of the existing Arabic (owner requirement, 2026-11-13)

Scope read: every Arabic string literal in `src/` (1,014 literals: interface, story, village voices, chronicle,
store cards), `index.html`, `ios/Almo7areboon/InfoPlist.xcstrings`, `ios/store/listing.json` (name, subtitle,
promotional text, description, product names, screenshot caption) and the film captions (`film/youtube/captions-ar.srt`,
`film/*.py`). Method: a search for the usual Levantine and Egyptian dialect words (شو، هيك، بدّي، مش، مو، ليش، هلّق،
لسّا، كتير، منيح، هاد، هاي، وين، إجا، رح/راح before a verb، عم، اللي، كمان، بسّ، هون، شوي، مين، عشان، منشان، لازم،
حدا، إشي …) and for present verbs with a بـ prefix, then a read of the full word list of the game (1,888 distinct
words) for anything colloquial the search could not name.

**Result: the game was already written in fusha; one string changed.**

| Where | Before | After | Why |
|---|---|---|---|
| Village voice, First Fires hearth-keeper (`src/ui/chapter-scouting.ts`) | الشوربة تنتظر. أمّا أنت فلا. | الحساء ينتظر. أمّا أنت فلا. | «شوربة» is the everyday borrowed word; «حساء» is the fusha one. |

Read and kept, for the native reader to confirm:

- «هلّا جرّبت ذلك على المدّ؟» (a village voice): «هلّا» here is the classical urging particle, not the colloquial greeting.
- «لا يمكن …»، «بدون»، «ريثما»، «للتوّ»: standard usage.
- App Store **keywords** (`ios/store/listing.json`): «بدون نت»، «اوفلاين»، «ابراج» are written the way people type
  in search, without hamza and in everyday form. They are never shown as text, so they were left as they are; the
  owner may prefer fusha there too («بلا إنترنت»، «أبراج») at some cost to search matching.

## 4. Chapter 3 free (1.3)

Chapters 1 to 3 are free; Full Journey opens chapters 4 to 6 and the harder timeline. Changed or new lines:

| Where | English | Arabic |
|---|---|---|
| Entry, journey path (app, not owned) | Chapters 1–3 free · 4–6 with Full Journey | الفصول 1–3 مجّاناً · 4–6 مع الرحلة كاملة |
| Full Journey card, opened early | The first three chapters are free. Full Journey opens the rest of the tale. | الفصول الثلاثة الأولى مجّانية. الرحلة كاملة تفتح بقيّة الحكاية. |
| Full Journey card, after chapter 3 is won | Your company has held the three free chapters. Full Journey opens the rest of the tale. | صمدت سريّتك في الفصول الثلاثة المجّانية. الرحلة كاملة تفتح بقيّة الحكاية. |
| Full Journey card, first item | Lantern Quarter and the two chapters after it | حيّ الفوانيس والفصلان اللذان يليانه |
| Full Journey card, second item | Nine new troops in new wardrobes | تسعة جنود جدد بأزياء جديدة |
| Camp footer, in chapter 3 (app, not owned) | Harbor Watch is the last free chapter. Full Journey opens the three after it, and the harder timeline. | حراسة الميناء آخر الفصول المجّانية. و«الرحلة كاملة» تفتح الفصول الثلاثة التي بعدها، والخطّ الزمني الأصعب. |
| Camp footer, after chapter 3 is won | The free chapters stay yours to replay. Full Journey opens Lantern Quarter and the two chapters after it. | الفصول المجّانية باقية لك تعيدها متى شئت. و«الرحلة كاملة» تفتح حيّ الفوانيس والفصلين اللذين يليانه. |
| App Store description | The first three chapters are free. Full Journey … opens chapters four to six … | الفصول الثلاثة الأولى مجّانية. «الرحلة كاملة» … يفتح الفصول من الرابع إلى السادس … |
| Full Journey product description (App Store Connect) | Every later chapter and the harder timeline | الفصول من الرابع إلى السادس والخطّ الأصعب |

# 🎓 Scholarship Agent (منصة وكيل المنح الذكي)

> **منصة متكاملة للمطابقة الذكية، التقييم الأكاديمي، وتوليد خرائط طريق التقديم للمنح الدراسية الدولية باستخدام الذكاء الاصطناعي.**

---

## 🌟 نظرة عامة (Overview)

تم بناء هذا المشروع ليكون وكيلاً ذكياً واستشارياً أكاديمياً متكاملاً للطلاب الراغبين في التقديم على المنح الجامعية والدراسات العليا. يجمع النظام بين:
1. **وكيل التقييم والتحليل الأكاديمي (Profile Analyst Agent)**: تشريح ملف الطالب واستخراج نقاط القوة، نقاط الضعف، والفجوات التنافسية.
2. **محرك المطابقة الهجين (Hybrid Matching Engine)**: خوارزمية ذكية تجمع بين الفلترة البرمجية الصارمة (GPA، الدرجة العلمية، اللغة، الجنسية، التخصص) وبين التقييم الدلالي لنموذج الذكاء الاصطناعي (Semantic Alignment) لمطابقة اهتمامات الطالب مع رسالة المنحة.
3. **التوجيه التلقائي للبحث الخارجي (External Search Trigger)**: تفعيل تلقائي لإشارة البحث الخارجي عند انخفاض نسب التطابق الداخلي عن 40%.
4. **أداة التخطيط الاستراتيجي للتقديم (Application Planner Tool)**: توليد جدول زمني وخارطة طريق مرتبة بحسب المواعيد النهائية مع قائمة وثائق مخصصة ونصائح استراتيجية لكل منحة.
5. **واجهة برمجة تطبيقات كاملة (FastAPI Backend)**: مبنية بمعمارية معيارية مع دعم قواعد بيانات SQLite غير المتزامنة (`aiosqlite`).
6. **واجهة مستخدم تفاعلية (React + TypeScript + Vite UI)**: واجهة عربية RTL أنيقة بنظام ألوان داكن متوافق مع معايير منصة أساس (Asaas UI).

---

## 🏗️ المعمارية وهيكل المشروع (Architecture)

```
scholarship-agent/
├── matcher_evaluator_agent.py         # المخرج 1: وكيل التقييم والمطابقة المستقل (CLI & Module)
├── application_planner_tool.py        # المخرج 2: أداة التخطيط الزمني المستقلة (CLI & Module)
│
├── ai/                                # نواة الذكاء الاصطناعي والوكلاء (AI Agents Core)
│   └── scholarship_agent/
│       ├── agents/
│       │   └── matcher_evaluator_agent.py   # منطق الوكيل والخوارزمية الهجينة
│       ├── tools/
│       │   └── application_planner_tool.py  # أداة التخطيط وجدولة التقديم
│       ├── schemas/
│       │   └── scholarship_schemas.py       # نماذج البيانات الموحدة (Pydantic Schemas)
│       └── evals/
│           └── matcher/cases.jsonl          # حالات التقييم
│
├── tests/                             # حزمة الاختبارات الشاملة (Pytest Test Suite)
│   └── test_agent.py                  # 8 اختبارات موثقة لمعادلة التطابق وقواعد القرار
│
├── app/                               # الواجهة الخلفية (FastAPI Backend)
│   ├── main.py                        # نقطة الانطلاق وإدارة دورة الحياة (Lifespan)
│   ├── config.py                      # إعدادات البيئة (Pydantic Settings)
│   ├── database.py                    # وسيط SQLite غير المتزامن (aiosqlite)
│   ├── requirements.txt               # متطلبات بايثون
│   ├── seed.py                        # بذر البيانات الأولية الواقعية
│   └── modules/
│       ├── students/                  # إدارة الطلاب (Router + Repository)
│       ├── scholarships/              # إدارة المنح الدراسية
│       ├── matching/                  # تشغيل وكيل المطابقة وحفظ النتائج
│       └── plans/                     # تشغيل وتخزين خطط التقديم
│
├── ui/                                # الواجهة الأمامية (React + Vite + TypeScript)
│   ├── src/
│   │   ├── asaas-ui/                  # طقم أساس الرسمي (Liquid Glass + Thmanyah Fonts)
│   │   ├── components/                # النوافذ المنبثقة والإعدادات
│   │   ├── pages/                     # صفحات النظام (طلاب، منح، مفاضلة، خطة)
│   │   └── main.tsx                   # شريط التنقل والتهيئة
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 التشغيل السريع (Quickstart)

### 1. تشغيل وكيل التقييم والمطابقة مباشرة (CLI):
```bash
python matcher_evaluator_agent.py
# أو إخراج النتائج بصيغة JSON:
python matcher_evaluator_agent.py --json
```

### 2. تشغيل أداة التخطيط الزمني مباشرة (CLI):
```bash
python application_planner_tool.py --top-n 3
# أو إخراج الخطة بصيغة JSON:
python application_planner_tool.py --json
```

### 3. تشغيل حزمة الاختبارات المؤتمتة (Automated Tests):
```bash
python -m pytest tests/ -v
```

### 4. تشغيل منصة الويب المتكاملة (Web App):
**الخادم الخلفي (FastAPI Backend):**
```bash
cd app
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**الواجهة الأمامية (React + Vite):**
```bash
cd ui
npm run dev
# افتح المتصفح على: http://localhost:5174
```

---

## ⚖️ معادلة المطابقة الهجينة (Hybrid Matching Score)

تحسب نسبة التطابق النهائية بناءً على المعادلة الموزونة التالية:

$$\text{Match \%} = \sum (\text{Sub-score}_i \times \text{Weight}_i)$$

| البعد (Dimension) | الوزن (Weight) | آلية الحساب (Calculation Method) |
| :--- | :---: | :--- |
| **المعدل التراكمي (GPA)** | 20% | فحص رياضي: استبعاد فوري إذا قل عن الأدنى، وتدرج نسبي حتى 4.0 |
| **الدرجة العلمية (Degree)** | 20% | فحص صارم (Hard Filter) لمطابقة المرحلة المستهدفة |
| **الكفاءة اللغوية (Language)** | 15% | مقارنة رقمية لمستويات الإطار الأوروبي (A1 إلى C2) مع درجات الاختبارات |
| **الجنسية والدول المؤهلة** | 10% | التحقق من قائمة الدول المسموح لها بالتقديم |
| **التخصص والمجال (Major)** | 10% | مطابقة دقيقة أو تقارب دلالي مع الحقول الدراسية للمنحة |
| 🤖 **التوافق الدلالي بالذكاء الاصطناعي** | 15% | تحليل LLM لمدى توافق الاهتمامات البحثية للطالب مع رسالة المنحة |
| **الخبرات السابقة (Experience)** | 5% | تقييم كمي ونوعي للمشاريع والتدريبات والأعمال التطوعية |
| **الأبحاث المنشورة (Publications)** | 5% | فحص شروط النشر العلمي مع احتساب نقاط إضافية |

> **⚠️ قاعدة التوجيه الذاتي (Autonomous Fallback):**  
> إذا كانت النسبة القصوى لجميع المنح المتوفرة داخلياً **أقل من 40%**، يُطلق الوكيل فوراً إشارة برمجية تلقائية:  
> `trigger_external_search = True` لتنبيه النظام ببدء البحث في مصادر خارجية.

---

## 🚀 دليل التشغيل السريع (Quickstart)

### 1. المتطلبات الأولية
* Python 3.10+
* Node.js 18+ & npm
* مفتاح Google Gemini API

---

### 2. تشغيل الـ Backend

```bash
cd app

# 1. إنشاء البيئة الافتراضية وتفعيلها
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 2. تثبيت الحزم
pip install -r requirements.txt

# 3. إعداد متغيرات البيئة
copy .env.example .env
# قم بتعديل ملف .env وأضف مفتاح GEMINI_API_KEY

# 4. تشغيل خادم التطوير
uvicorn main:app --reload --port 8000
```

* توثيق الـ API التفاعلي (Swagger UI): `http://localhost:8000/docs`
* فحص الحالة: `http://localhost:8000/health`

---

### 3. تشغيل الـ Frontend

في نافذة Terminal جديدة:

```bash
cd ui

# تثبيت الاعتماديات
npm install

# تشغيل خادم الواجهة
npm run dev
```

* افتح المتصفح على: `http://localhost:5173`

---

## 👨‍💻 المطور
* **المهندس:** عبد الغني علي الشيبامي (Abdulghani Ali Ashebami)
* **المسمى:** AI Engineer
* **البريد:** abdulghani@ai-asaas.com
* **GitHub:** [@Abdulghani780](https://github.com/Abdulghani780)

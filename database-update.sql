-- تحديث قاعدة البيانات لإضافة الفئات والموقع

-- إضافة أعمدة جديدة لجدول user_profiles
ALTER TABLE user_profiles 
ADD COLUMN category TEXT DEFAULT 'general',
ADD COLUMN subcategory TEXT DEFAULT 'general',
ADD COLUMN location TEXT DEFAULT '',
ADD COLUMN description TEXT DEFAULT '',
ADD COLUMN experience_level TEXT DEFAULT 'beginner',
ADD COLUMN hourly_rate NUMERIC DEFAULT 0,
ADD COLUMN availability TEXT DEFAULT 'available',
ADD COLUMN portfolio_url TEXT DEFAULT '',
ADD COLUMN social_links JSONB DEFAULT '{}',
ADD COLUMN languages JSONB DEFAULT '[]',
ADD COLUMN education TEXT DEFAULT '',
ADD COLUMN work_experience JSONB DEFAULT '[]';

-- إنشاء جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الفئات الفرعية
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تمكين RLS للجداول الجديدة
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للفئات
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view subcategories" ON subcategories
  FOR SELECT USING (true);

-- إدخال الفئات الأساسية
INSERT INTO categories (name, description, icon) VALUES
('تطوير البرمجيات', 'مطورو الويب، الموبايل، والبرمجيات', '💻'),
('التصميم', 'مصممون جرافيك، UI/UX، ومصممون ثلاثي الأبعاد', '🎨'),
('التسويق الرقمي', 'مسوقون، متخصصو SEO، ومديرو وسائل التواصل', '📱'),
('الكتابة والترجمة', 'كتاب محتوى، مترجمون، ومحررون', '✍️'),
('الفيديو والصوت', 'مونتيرون، منتجون صوت، ومصورون', '🎬'),
('الاستشارات', 'مستشارون أعمال، ماليون، وقانونيون', '💼'),
('التعليم والتدريب', 'مدربون، معلمون، ومطورو مناهج', '🎓'),
('الدعم الفني', 'فنيون دعم، خبراء تقنية، ومسؤولو أنظمة', '🔧');

-- إدخال الفئات الفرعية
INSERT INTO subcategories (category_id, name, description) VALUES
-- تطوير البرمجيات
((SELECT id FROM categories WHERE name = 'تطوير البرمجيات'), 'تطوير الويب', 'مطورو Frontend و Backend'),
((SELECT id FROM categories WHERE name = 'تطوير البرمجيات'), 'تطوير الموبايل', 'تطبيقات iOS و Android'),
((SELECT id FROM categories WHERE name = 'تطوير البرمجيات'), 'تطوير الألعاب', 'مطورو ألعاب الفيديو'),
((SELECT id FROM categories WHERE name = 'تطوير البرمجيات'), 'قواعد البيانات', 'مصممو ومديرو قواعد البيانات'),

-- التصميم
((SELECT id FROM categories WHERE name = 'التصميم'), 'التصميم الجرافيكي', 'شعارات، بروشورات، ومواد تسويقية'),
((SELECT id FROM categories WHERE name = 'التصميم'), 'تصميم UI/UX', 'واجهات المستخدم وتجربة المستخدم'),
((SELECT id FROM categories WHERE name = 'التصميم'), 'التصميم ثلاثي الأبعاد', 'نماذج 3D، رسوم متحركة، و VFX'),
((SELECT id FROM categories WHERE name = 'التصميم'), 'تصميم الأزياء', 'مصممون أزياء ومستشارون أسلوبيون'),

-- التسويق الرقمي
((SELECT id FROM categories WHERE name = 'التسويق الرقمي'), 'التسويق عبر وسائل التواصل', 'إدارة حسابات التواصل الاجتماعي'),
((SELECT id FROM categories WHERE name = 'التسويق الرقمي'), 'تحسين محركات البحث', 'SEO specialists و content marketers'),
((SELECT id FROM categories WHERE name = 'التسويق الرقمي'), 'الإعلانات المدفوعة', 'Google Ads و Facebook Ads'),
((SELECT id FROM categories WHERE name = 'التسويق الرقمي'), 'التسويق عبر البريد', 'Email marketing campaigns'),

-- الكتابة والترجمة
((SELECT id FROM categories WHERE name = 'الكتابة والترجمة'), 'كتابة المحتوى', 'مدونون، كتاب تقني، وكتاب إبداعيون'),
((SELECT id FROM categories WHERE name = 'الكتابة والترجمة'), 'الترجمة', 'مترجمون فوريون ومترجمو مستندات'),
((SELECT id FROM categories WHERE name = 'الكتابة والترجمة'), 'التحرير والمراجعة', 'editors و proofreaders'),
((SELECT id FROM categories WHERE name = 'الكتابة والترجمة'), 'الكتابة الإبداعية', 'كتاب قصص، شعر، وسيناريوهات'),

-- الفيديو والصوت
((SELECT id FROM categories WHERE name = 'الفيديو والصوت'), 'المونتاج', 'مونتير فيديو ومؤثرات بصرية'),
((SELECT id FROM categories WHERE name = 'الفيديو والصوت'), 'الإنتاج الصوتي', 'موسيقيون ومنتجون صوت'),
((SELECT id FROM categories WHERE name = 'الفيديو والصوت'), 'التصوير', 'مصورون فوتوغرافيون وفيديو'),
((SELECT id FROM categories WHERE name = 'الفيديو والصوت'), 'الرسوم المتحركة', 'animators و motion graphics'),

-- الاستشارات
((SELECT id FROM categories WHERE name = 'الاستشارات'), 'استشارات الأعمال', 'مستشارون استراتيجيون وإداريون'),
((SELECT id FROM categories WHERE name = 'الاستشارات'), 'الاستشارات المالية', 'محاسبون ومستشارون ماليون'),
((SELECT id FROM categories WHERE name = 'الاستشارات'), 'الاستشارات القانونية', 'محامون ومستشارون قانونيون'),
((SELECT id FROM categories WHERE name = 'الاستشارات'), 'التدريب المهني', 'مدربون تطوير مهني'),

-- التعليم والتدريب
((SELECT id FROM categories WHERE name = 'التعليم والتدريب'), 'التعليم عبر الإنترنت', 'معلمون ومدرسون عبر الإنترنت'),
((SELECT id FROM categories WHERE name = 'التعليم والتدريب'), 'تطوير المناهج', 'مطورو مناهج تعليمية'),
((SELECT id FROM categories WHERE name = 'التعليم والتدريب'), 'التدريب المهني', 'مدربون مهنيون'),
((SELECT id FROM categories WHERE name = 'التعليم والتدريب'), 'التعليم اللغات', 'معلمو لغات'),

-- الدعم الفني
((SELECT id FROM categories WHERE name = 'الدعم الفني'), 'د العملاء', 'موظفو دعم عملاء'),
((SELECT id FROM categories WHERE name = 'الدعم الفني'), 'الدعم التقني', 'فنيون دعم تقني'),
((SELECT id FROM categories WHERE name = 'الدعم الفني'), 'إدارة الأنظمة', 'مسؤولو أنظمة وشبكات'),
((SELECT id FROM categories WHERE name = 'الدعم الفني'), 'الأمن السيبراني', 'خبراء أمن معلومات');

-- إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تمكين RLS للرسائل
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للرسائل
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

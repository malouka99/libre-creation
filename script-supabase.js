// نظام إدارة المستخدمين مع Supabase
class SupabaseUserManager {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            // التحقق من تسجيل الدخول الحالي
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
            updateUI();
            
            // مستمع تغيير حالة المصادقة
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.currentUser = session?.user || null;
                updateUI();
                console.log('Auth state changed:', event, this.currentUser?.email);
            });
            
            console.log('Supabase initialized successfully');
        } catch (error) {
            console.error('Supabase initialization error:', error);
            showNotification('حدث خطأ في تهيئة النظام');
        }
    }

    // تسجيل مستخدم جديد
    async register(email, password, fullName, accountType) {
        try {
            // تسجيل المستخدم في Supabase Auth
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        account_type: accountType || 'talent'
                    }
                }
            });

            if (error) {
                let message = 'حدث خطأ أثناء إنشاء الحساب';
                if (error.message.includes('already registered')) {
                    message = 'البريد الإلكتروني مستخدم بالفعل';
                } else if (error.message.includes('weak password')) {
                    message = 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)';
                } else if (error.message.includes('Invalid email')) {
                    message = 'البريد الإلكتروني غير صالح';
                }
                return { success: false, message };
            }

            // إنشاء ملف المستخدم في قاعدة البيانات
            const { error: profileError } = await this.supabase
                .from('user_profiles')
                .insert([{
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    account_type: accountType || 'talent',
                    bio: '',
                    skills: [],
                    portfolio: [],
                    rating: 0,
                    reviews: [],
                    created_at: new Date().toISOString()
                }]);

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // لا نرجع خطأ هنا لأن المستخدم تم إنشاؤه
            }

            return { success: true, message: 'تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني', user: data.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'حدث خطأ غير متوقع' };
        }
    }

    // تسجيل الدخول
    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                let message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                if (error.message.includes('Invalid login credentials')) {
                    message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                } else if (error.message.includes('Email not confirmed')) {
                    message = 'يرجى تأكيد البريد الإلكتروني أولاً';
                }
                return { success: false, message };
            }

            return { success: true, message: 'تم تسجيل الدخول بنجاح', user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                return { success: false, message: 'حدث خطأ أثناء تسجيل الخروج' };
            }
            return { success: true, message: 'تم تسجيل الخروج بنجاح' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'حدث خطأ غير متوقع' };
        }
    }

    // جلب بيانات المستخدم الحالية
    async getCurrentUserData() {
        if (!this.currentUser) return null;
        
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('Error fetching user data:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // تحديث بيانات المستخدم
    async updateUserProfile(updates) {
        if (!this.currentUser) return { success: false, message: 'لم يتم تسجيل الدخول' };
        
        try {
            const { error } = await this.supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) {
                return { success: false, message: 'حدث خطأ أثناء تحديث البيانات' };
            }

            return { success: true, message: 'تم تحديث البيانات بنجاح' };
        } catch (error) {
            console.error('Update error:', error);
            return { success: false, message: 'حدث خطأ غير متوقع' };
        }
    }

    // إضافة مهارة للمستخدم
    async addSkill(skillName) {
        if (!this.currentUser) return { success: false, message: 'لم يتم تسجيل الدخول' };
        
        try {
            // جلب المهارات الحالية
            const { data: userData, error: fetchError } = await this.supabase
                .from('user_profiles')
                .select('skills')
                .eq('id', this.currentUser.id)
                .single();

            if (fetchError) {
                return { success: false, message: 'حدث خطأ أثناء جلب البيانات' };
            }

            const currentSkills = userData.skills || [];
            
            if (currentSkills.includes(skillName)) {
                return { success: false, message: 'المهارة موجودة بالفعل' };
            }

            // إضافة المهارة الجديدة
            const updatedSkills = [...currentSkills, skillName];
            
            const { error: updateError } = await this.supabase
                .from('user_profiles')
                .update({ skills: updatedSkills })
                .eq('id', this.currentUser.id);

            if (updateError) {
                return { success: false, message: 'حدث خطأ أثناء إضافة المهارة' };
            }

            return { success: true, message: 'تم إضافة المهارة بنجاح' };
        } catch (error) {
            console.error('Add skill error:', error);
            return { success: false, message: 'حدث خطأ غير متوقع' };
        }
    }

    // جلب جميع المواهب
    async getAllTalents() {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('account_type', 'talent')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching talents:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error getting talents:', error);
            return [];
        }
    }
}

// إنشاء مدير المستخدمين
const userManager = new SupabaseUserManager();

// انتظار تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    
    // تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
    setTimeout(() => {
        updateUI();
    }, 1000);
    
    // تأثيرات الحركة السلسة للتنقل
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // تأثيرات الأزرار
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // نظام التقييم بالنجوم التفاعلي
    const talentProfiles = document.querySelectorAll('.talent-profile');
    talentProfiles.forEach(profile => {
        const rating = profile.querySelector('.talent-rating');
        if (rating) {
            rating.style.cursor = 'pointer';
            rating.addEventListener('click', function() {
                if (userManager.currentUser) {
                    showNotification('شكراً لتقييمك! سيتم حفظه في النظام.');
                } else {
                    showNotification('يجب تسجيل الدخول أولاً للتقييم');
                    showLoginModal();
                }
            });
        }
    });

    // أزرار التواصل
    const contactButtons = document.querySelectorAll('.btn-contact');
    contactButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (userManager.currentUser) {
                const profileName = this.closest('.talent-profile').querySelector('h3').textContent;
                showNotification(`جاري فتح نافذة التواصل مع ${profileName}...`);
            } else {
                showNotification('يجب تسجيل الدخول للتواصل مع المواهب');
                showLoginModal();
            }
        });
    });

    // أزرار تسجيل الدخول وإنشاء الحساب
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            showLoginModal();
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            showSignupModal();
        });
    }

    // الأزرار الرئيسية
    const primaryBtn = document.querySelector('.btn-primary');
    const secondaryBtn = document.querySelector('.btn-secondary');
    
    if (primaryBtn) {
        primaryBtn.addEventListener('click', function() {
            document.querySelector('#talents').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
    
    if (secondaryBtn) {
        secondaryBtn.addEventListener('click', function() {
            if (userManager.currentUser) {
                showNotification('جاري فتح صفحتك الشخصية...');
                showProfileModal();
            } else {
                showNotification('قم بتسجيل الدخول أولاً لعرض أعمالك');
                showLoginModal();
            }
        });
    }

    // تأثيرات التمرير
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            header.style.backdropFilter = 'none';
        }
    });

    // تأثير الظهور التدريجي للعناصر
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // إضافة تأثير الظهور للبطاقات
    const cards = document.querySelectorAll('.feature-card, .talent-profile');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
});

// تحديث واجهة المستخدم
function updateUI() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    
    if (userManager.currentUser) {
        if (loginBtn) {
            loginBtn.textContent = 'الملف الشخصي';
            loginBtn.onclick = async function() {
                if (userManager.currentUser) {
                    // إعادة التوجيه إلى لوحة التحكم
                    window.location.href = 'dashboard.html';
                } else {
                    showLoginModal();
                }
            };
        }
        if (signupBtn) {
            signupBtn.textContent = 'تسجيل الخروج';
            signupBtn.onclick = async function() {
                const result = await userManager.logout();
                showNotification(result.message);
                updateUI();
            };
        }
    } else {
        if (loginBtn) {
            loginBtn.textContent = 'تسجيل الدخول';
            loginBtn.onclick = showLoginModal;
        }
        if (signupBtn) {
            signupBtn.textContent = 'إنشاء حساب';
            signupBtn.onclick = showSignupModal;
        }
    }
}

// وظيفة عرض الإشعارات
function showNotification(message) {
    // إزالة أي إشعارات موجودة
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    });
    
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease-out;
        font-weight: 600;
        max-width: 300px;
        text-align: center;
    `;
    
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // إخفاء الإشعار بعد 4 ثواني
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// وظيفة عرض نافذة تسجيل الدخول
function showLoginModal() {
    const modal = createModal('تسجيل الدخول', `
        <form class="auth-form" id="loginForm">
            <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" id="loginEmail" placeholder="أدخل بريدك الإلكتروني" required>
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" id="loginPassword" placeholder="أدخل كلمة المرور" required>
            </div>
            <button type="submit" class="btn-submit">دخول</button>
            <p class="auth-link">ليس لديك حساب؟ <a href="#" onclick="showSignupModal()">إنشاء حساب</a></p>
        </form>
    `);
    
    document.body.appendChild(modal);
    
    // إضافة مستمع الحدث للنموذج
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = await userManager.login(email, password);
        
        if (result.success) {
            showNotification(result.message);
            // إغلاق النافذة بطريقة آمنة
            setTimeout(() => {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeModal(closeBtn);
                }
            }, 1500);
            
            // إعادة التوجيه التلقائي إلى لوحة التحكم
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showNotification(result.message);
        }
    });
}

// وظيفة عرض نافذة إنشاء الحساب
function showSignupModal() {
    const modal = createModal('إنشاء حساب جديد', `
        <form class="auth-form" id="signupForm">
            <div class="form-group">
                <label>الاسم الكامل</label>
                <input type="text" id="signupName" placeholder="أدخل اسمك الكامل" required>
            </div>
            <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" id="signupEmail" placeholder="أدخل بريدك الإلكتروني" required>
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" id="signupPassword" placeholder="أدخل كلمة المرور (6 أحرف على الأقل)" required minlength="6">
            </div>
            <div class="form-group">
                <label>تأكيد كلمة المرور</label>
                <input type="password" id="signupConfirmPassword" placeholder="أعد إدخال كلمة المرور" required>
            </div>
            <div class="form-group">
                <label>نوع الحساب</label>
                <select id="accountType">
                    <option value="talent">موهبة (أعرض خدماتي)</option>
                    <option value="client">عميل (أبحث عن مواهب)</option>
                </select>
            </div>
            <button type="submit" class="btn-submit">إنشاء الحساب</button>
            <p class="auth-link">لديك حساب بالفعل؟ <a href="#" onclick="showLoginModal()">تسجيل الدخول</a></p>
        </form>
    `);
    
    document.body.appendChild(modal);
    
    // إضافة مستمع الحدث للنموذج
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const accountType = document.getElementById('accountType').value;
        
        // التحقق من تطابق كلمة المرور
        if (password !== confirmPassword) {
            showNotification('كلمات المرور غير متطابقة');
            return;
        }
        
        // إنشاء الحساب
        const result = await userManager.register(email, password, fullName, accountType);
        
        if (result.success) {
            showNotification(result.message);
            // إغلاق النافذة بطريقة آمنة
            setTimeout(() => {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeModal(closeBtn);
                }
            }, 2000);
            updateUI();
        } else {
            showNotification(result.message);
        }
    });
}

// وظيفة عرض نافذة الملف الشخصي
async function showProfileModal() {
    const userData = await userManager.getCurrentUserData();
    if (!userData) {
        showNotification('لم يتم العثور على بيانات المستخدم');
        return;
    }
    
    const modal = createModal('الملف الشخصي', `
        <div class="profile-content">
            <div class="profile-header">
                <h2>${userData.full_name}</h2>
                <p class="profile-type">${userData.account_type === 'talent' ? 'موهبة' : 'عميل'}</p>
            </div>
            <div class="profile-info">
                <div class="info-item">
                    <strong>البريد الإلكتروني:</strong>
                    <span>${userData.email}</span>
                </div>
                <div class="info-item">
                    <strong>تاريخ الانضمام:</strong>
                    <span>${new Date(userData.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                <div class="info-item">
                    <strong>التقييم:</strong>
                    <span>⭐ ${userData.rating || 0}</span>
                </div>
            </div>
            ${userData.account_type === 'talent' ? `
                <div class="talent-section">
                    <h3>مهاراتي</h3>
                    <div class="skills-container">
                        ${userData.skills && userData.skills.length > 0 ? userData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : '<p>لم تضف مهارات بعد</p>'}
                    </div>
                    <button class="btn-add-skill" onclick="showAddSkillModal()">إضافة مهارة</button>
                </div>
            ` : ''}
        </div>
    `);
    
    document.body.appendChild(modal);
}

// وظيفة إضافة مهارة
async function showAddSkillModal() {
    const modal = createModal('إضافة مهارة جديدة', `
        <form class="auth-form" id="addSkillForm">
            <div class="form-group">
                <label>اسم المهارة</label>
                <input type="text" id="skillName" placeholder="مثال: JavaScript, التصميم, المونتاج" required>
            </div>
            <button type="submit" class="btn-submit">إضافة المهارة</button>
        </form>
    `);
    
    document.body.appendChild(modal);
    
    document.getElementById('addSkillForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const skillName = document.getElementById('skillName').value;
        
        const result = await userManager.addSkill(skillName);
        
        if (result.success) {
            showNotification(result.message);
            closeModal(modal.querySelector('.modal-close'));
            showProfileModal(); // إعادة فتح الملف الشخصي المحدث
        } else {
            showNotification(result.message);
        }
    });
}

// وظيفة إنشاء النوافذ المنبثقة
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal(this)">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease-out;
    `;
    
    // إضافة أنماط CSS للنافذة
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.8);
            transition: transform 0.3s ease-out;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid #eee;
            padding-bottom: 1rem;
        }
        
        .modal-header h3 {
            color: #333;
            margin: 0;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
        }
        
        .modal-close:hover {
            color: #333;
        }
        
        .auth-form {
            text-align: right;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 600;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.8rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn-submit {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .auth-link {
            margin-top: 1rem;
            text-align: center;
            color: #666;
        }
        
        .auth-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .auth-link a:hover {
            text-decoration: underline;
        }
        
        .profile-content {
            text-align: right;
        }
        
        .profile-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .profile-header h2 {
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .profile-type {
            color: #667eea;
            font-weight: 600;
        }
        
        .profile-info {
            margin-bottom: 2rem;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-item strong {
            color: #333;
        }
        
        .info-item span {
            color: #666;
        }
        
        .talent-section {
            margin-top: 2rem;
        }
        
        .talent-section h3 {
            color: #333;
            margin-bottom: 1rem;
        }
        
        .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .skill-tag {
            background: #667eea;
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .btn-add-skill {
            background: #ffd700;
            color: #333;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn-add-skill:hover {
            background: #ffed4e;
            transform: translateY(-2px);
        }
    `;
    
    document.head.appendChild(style);
    
    // إظهار النافذة
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal').style.transform = 'scale(1)';
    }, 100);
    
    // إغلاق النافذة عند الضغط خارجها
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal.querySelector('.modal-close'));
        }
    });
    
    return modal;
}

// وظيفة إغلاق النوافذ المنبثقة
function closeModal(button) {
    const modal = button.closest('.modal-overlay');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal').style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

// وظيفة إغلاق النافذة بالمعرف
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal').style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

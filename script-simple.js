// نظام تسجيل دخول مبسط يعمل بدون تأكيد البريد
class SimpleUserManager {
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
            
            // مستمع تغيير حالة المصادقة
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.currentUser = session?.user || null;
                console.log('Auth state changed:', event, this.currentUser?.email);
                if (this.currentUser) {
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            });
            
            console.log('Simple auth initialized successfully');
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.showNotification('حدث خطأ في تهيئة النظام');
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
                    emailRedirectTo: 'https://malouka99.github.io/libre-creation/dashboard.html',
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

            // إنشاء ملف المستخدم مباشرة (بدون انتظار تأكيد البريد)
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
            }

            // تسجيل الدخول مباشرة
            await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            return { success: true, message: 'تم إنشاء الحساب بنجاح! جاري الانتقال...', user: data.user };
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
                    // إذا كان البريد غير مؤكد، نحاول تسجيل الدخول مباشرة
                    const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (!signInError) {
                        return { success: true, message: 'تم تسجيل الدخول بنجاح', user: signInData.user };
                    }
                    
                    message = 'يرجى تأكيد البريد الإلكتروني أولاً';
                } else if (error.message.includes('Invalid email')) {
                    message = 'البريد الإلكتروني غير صالح';
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

    showNotification(message) {
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
}

// إنشاء مدير المستخدمين
const userManager = new SimpleUserManager();

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
                userManager.showNotification(result.message);
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
    userManager.showNotification(message);
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
            }, 1500);
        } else {
            showNotification(result.message);
        }
    });
}

// وظيفة عرض نافذة الملف الشخصي
async function showProfileModal() {
    showNotification('جاري الانتقال إلى لوحة التحكم...');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
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

// ============================================================
//  Libre Creation — نظام المصادقة الكامل
//  يدعم Supabase مع LocalStorage كـ Fallback
// ============================================================

// ──────────────────────────────────────────────────────────
// إعدادات Supabase — ضع هنا مفاتيحك الصحيحة من لوحة Supabase
// ──────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://cgyqryrkaxcyeqwxoskv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNneXFyeXJrYXhjeWVxd29za3YiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwNDEwOTIxMiwiZXhwIjoyMDE5Njg1MjEyfQ.placeholder_key_replace_me';

// ──────────────────────────────────────────────────────────
// مدير المصادقة — يجمع Supabase + LocalStorage
// ──────────────────────────────────────────────────────────
class AuthManager {
    constructor() {
        this.mode        = 'local';  // 'supabase' | 'local'
        this.supabase    = null;
        this.currentUser = null;
        this._init();
    }

    // ── التهيئة — يستخدم LocalStorage دائماً لأن مفتاح Supabase غير مُعدّ بعد ──
    async _init() {
        // استخدام LocalStorage مباشرةً (آمن ويعمل دون إنترنت)
        this.mode        = 'local';
        this.currentUser = this._localGetCurrentUser();
        console.log('✅ النظام جاهز — الوضع: محلي (LocalStorage)');

        // تحديث الواجهة بعد تعريف authManager
        // نستخدم setTimeout لضمان أن authManager مُعرَّف بالكامل أولاً
        setTimeout(() => updateUI(), 0);
    }

    // ══════════════════════════════════════════════════════
    //  تسجيل الدخول
    // ══════════════════════════════════════════════════════
    async login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'يرجى ملء جميع الحقول' };
        }

        if (this.mode === 'supabase') {
            return await this._supabaseLogin(email, password);
        } else {
            return this._localLogin(email, password);
        }
    }

    async _supabaseLogin(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                let msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                if (error.message.includes('Email not confirmed')) msg = 'يرجى تأكيد بريدك الإلكتروني أولاً';
                if (error.message.includes('Invalid email'))       msg = 'البريد الإلكتروني غير صالح';
                return { success: false, message: msg };
            }
            this.currentUser = data.user;
            return { success: true, message: 'تم تسجيل الدخول بنجاح 🎉', user: data.user };
        } catch (err) {
            console.error('خطأ في تسجيل الدخول:', err);
            return { success: false, message: 'حدث خطأ في الاتصال، جارٍ المحاولة محلياً...' };
        }
    }

    _localLogin(email, password) {
        const users = this._localGetUsers();
        const user  = users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('lc_currentUser', JSON.stringify(user));
            return { success: true, message: 'تم تسجيل الدخول بنجاح 🎉', user };
        }
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // ══════════════════════════════════════════════════════
    //  إنشاء حساب
    // ══════════════════════════════════════════════════════
    async register(email, password, fullName, accountType) {
        if (!email || !password || !fullName) {
            return { success: false, message: 'يرجى ملء جميع الحقول' };
        }
        if (password.length < 6) {
            return { success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
        }

        if (this.mode === 'supabase') {
            return await this._supabaseRegister(email, password, fullName, accountType);
        } else {
            return this._localRegister(email, password, fullName, accountType);
        }
    }

    async _supabaseRegister(email, password, fullName, accountType) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName, account_type: accountType || 'talent' } }
            });

            if (error) {
                let msg = 'حدث خطأ أثناء إنشاء الحساب';
                if (error.message.includes('already registered')) msg = 'البريد الإلكتروني مستخدم بالفعل';
                if (error.message.includes('weak password'))       msg = 'كلمة المرور ضعيفة جداً';
                if (error.message.includes('Invalid email'))       msg = 'البريد الإلكتروني غير صالح';
                return { success: false, message: msg };
            }

            // تسجيل دخول مباشر بعد إنشاء الحساب
            await this.supabase.auth.signInWithPassword({ email, password });
            return { success: true, message: 'تم إنشاء الحساب بنجاح! جاري الانتقال... 🚀' };
        } catch (err) {
            console.error('خطأ في إنشاء الحساب:', err);
            return { success: false, message: 'حدث خطأ في الاتصال، سيتم الحفظ محلياً...' };
        }
    }

    _localRegister(email, password, fullName, accountType) {
        const users = this._localGetUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'البريد الإلكتروني مستخدم بالفعل' };
        }

        const newUser = {
            id          : Date.now().toString(),
            email, password, fullName, accountType: accountType || 'talent',
            createdAt   : new Date().toISOString(),
            profile     : { name: fullName, bio: '', skills: [], portfolio: [], rating: 0 }
        };

        users.push(newUser);
        localStorage.setItem('lc_users', JSON.stringify(users));
        this.currentUser = newUser;
        localStorage.setItem('lc_currentUser', JSON.stringify(newUser));
        return { success: true, message: 'تم إنشاء الحساب بنجاح! 🎉', user: newUser };
    }

    // ══════════════════════════════════════════════════════
    //  تسجيل الخروج
    // ══════════════════════════════════════════════════════
    async logout() {
        if (this.mode === 'supabase' && this.supabase) {
            await this.supabase.auth.signOut();
        }
        this.currentUser = null;
        localStorage.removeItem('lc_currentUser');
        updateUI();
        return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    }

    // ══════════════════════════════════════════════════════
    //  مساعدات LocalStorage
    // ══════════════════════════════════════════════════════
    _localGetUsers() {
        try { return JSON.parse(localStorage.getItem('lc_users') || '[]'); }
        catch { return []; }
    }
    _localGetCurrentUser() {
        try { return JSON.parse(localStorage.getItem('lc_currentUser') || 'null'); }
        catch { return null; }
    }

    // ══════════════════════════════════════════════════════
    //  عرض الإشعارات
    // ══════════════════════════════════════════════════════
    showNotification(message, type = 'info') {
        document.querySelectorAll('.lc-notification').forEach(n => n.remove());

        const colors = {
            success : 'linear-gradient(135deg,#43a047,#1b5e20)',
            error   : 'linear-gradient(135deg,#e53935,#b71c1c)',
            info    : 'linear-gradient(135deg,#667eea,#764ba2)'
        };

        const el = document.createElement('div');
        el.className  = 'lc-notification';
        el.textContent = message;
        el.style.cssText = `
            position:fixed; top:90px; right:20px;
            background:${colors[type] || colors.info};
            color:#fff; padding:1rem 1.5rem;
            border-radius:12px; font-weight:600;
            box-shadow:0 8px 25px rgba(0,0,0,.25);
            z-index:99999; max-width:320px;
            opacity:0; transform:translateX(110%);
            transition:all .35s cubic-bezier(.175,.885,.32,1.275);
            font-family:'Tajawal',sans-serif; font-size:1rem;
            line-height:1.5; text-align:center; direction:rtl;
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.opacity   = '1';
            el.style.transform = 'translateX(0)';
        });
        setTimeout(() => {
            el.style.opacity   = '0';
            el.style.transform = 'translateX(110%)';
            setTimeout(() => el.remove(), 400);
        }, 4000);
    }
}

// ── إنشاء المدير العام ──
const authManager = new AuthManager();

// ══════════════════════════════════════════════════════════
//  DOM جاهز
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {

    // ── تنقل سلس ──
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ── أزرار التبار الموهوبين ──
    document.querySelectorAll('.btn-contact').forEach(btn => {
        btn.addEventListener('click', function () {
            if (authManager.currentUser) {
                const name = this.closest('.talent-profile')?.querySelector('h3')?.textContent || '';
                authManager.showNotification(`جاري فتح نافذة التواصل مع ${name}...`);
            } else {
                authManager.showNotification('يجب تسجيل الدخول للتواصل مع المواهب', 'error');
                showLoginModal();
            }
        });
    });

    // ── أزرار التقييم ──
    document.querySelectorAll('.talent-rating').forEach(rating => {
        rating.style.cursor = 'pointer';
        rating.addEventListener('click', () => {
            if (authManager.currentUser) {
                authManager.showNotification('شكراً لتقييمك!', 'success');
            } else {
                authManager.showNotification('يجب تسجيل الدخول أولاً للتقييم', 'error');
                showLoginModal();
            }
        });
    });

    // ── زر "ابحث عن موهبة" ──
    const primaryBtn = document.querySelector('.btn-primary');
    if (primaryBtn) {
        primaryBtn.addEventListener('click', () => {
            document.querySelector('#talents')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ── زر "عرض أعمالك" ──
    const secondaryBtn = document.querySelector('.btn-secondary');
    if (secondaryBtn) {
        secondaryBtn.addEventListener('click', () => {
            if (authManager.currentUser) {
                window.location.href = 'dashboard.html';
            } else {
                authManager.showNotification('قم بتسجيل الدخول أولاً لعرض أعمالك', 'info');
                showLoginModal();
            }
        });
    }

    // ── تأثير Scroll على الهيدر ──
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
            header.style.boxShadow = window.scrollY > 80
                ? '0 4px 20px rgba(0,0,0,.25)'
                : 'none';
        }
    });

    // ── Intersection Observer للبطاقات ──
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity   = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.feature-card, .talent-profile').forEach(card => {
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(30px)';
        card.style.transition = 'opacity .6s ease, transform .6s ease';
        observer.observe(card);
    });
});

// ══════════════════════════════════════════════════════════
//  تحديث الواجهة حسب حالة الدخول
// ══════════════════════════════════════════════════════════
function updateUI() {
    const loginBtn  = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (authManager.currentUser) {
        const displayName = authManager.currentUser.user_metadata?.full_name
                         || authManager.currentUser.fullName
                         || authManager.currentUser.email
                         || 'حسابي';

        if (loginBtn) {
            loginBtn.textContent = '👤 ' + displayName.split(' ')[0];
            loginBtn.onclick     = () => { window.location.href = 'dashboard.html'; };
        }
        if (signupBtn) {
            signupBtn.textContent = 'تسجيل الخروج';
            signupBtn.onclick     = async () => {
                const res = await authManager.logout();
                authManager.showNotification(res.message);
            };
        }
    } else {
        if (loginBtn) {
            loginBtn.textContent = 'تسجيل الدخول';
            loginBtn.onclick     = showLoginModal;
        }
        if (signupBtn) {
            signupBtn.textContent = 'إنشاء حساب';
            signupBtn.onclick     = showSignupModal;
        }
    }
}

// ══════════════════════════════════════════════════════════
//  دالة مساعدة للإشعارات (متوافقة مع الكود القديم)
// ══════════════════════════════════════════════════════════
function showNotification(message) {
    authManager.showNotification(message);
}

// ══════════════════════════════════════════════════════════
//  نافذة تسجيل الدخول
// ══════════════════════════════════════════════════════════
function showLoginModal() {
    // إغلاق أي نافذة مفتوحة
    document.querySelector('.modal-overlay')?.remove();

    const modal = createModal('تسجيل الدخول', `
        <form class="auth-form" id="loginForm" novalidate>
            <div class="form-group">
                <label for="loginEmail">البريد الإلكتروني</label>
                <input type="email" id="loginEmail"
                       placeholder="example@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
                <label for="loginPassword">كلمة المرور</label>
                <input type="password" id="loginPassword"
                       placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn-submit" id="loginSubmitBtn">
                <span class="btn-text">دخول</span>
                <span class="btn-spinner" style="display:none">⏳ جاري الدخول...</span>
            </button>
            <p class="auth-link">ليس لديك حساب؟
                <a href="#" onclick="event.preventDefault(); closeAllModals(); showSignupModal();">إنشاء حساب</a>
            </p>
        </form>
    `);

    document.body.appendChild(modal);

    // Focus على حقل الإيميل
    setTimeout(() => { document.getElementById('loginEmail')?.focus(); }, 200);

    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn      = document.getElementById('loginSubmitBtn');
        const btnText  = btn.querySelector('.btn-text');
        const spinner  = btn.querySelector('.btn-spinner');

        if (!email || !password) {
            authManager.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        // إظهار حالة التحميل
        btn.disabled        = true;
        btnText.style.display  = 'none';
        spinner.style.display  = 'inline';

        const result = await authManager.login(email, password);

        // إعادة الزر
        btn.disabled        = false;
        btnText.style.display  = 'inline';
        spinner.style.display  = 'none';

        if (result.success) {
            authManager.showNotification(result.message, 'success');
            updateUI();
            setTimeout(() => {
                closeAllModals();
                window.location.href = 'dashboard.html';
            }, 1200);
        } else {
            authManager.showNotification(result.message, 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════
//  نافذة إنشاء حساب
// ══════════════════════════════════════════════════════════
function showSignupModal() {
    document.querySelector('.modal-overlay')?.remove();

    const modal = createModal('إنشاء حساب جديد', `
        <form class="auth-form" id="signupForm" novalidate>
            <div class="form-group">
                <label for="signupName">الاسم الكامل</label>
                <input type="text" id="signupName"
                       placeholder="اسمك الكامل" required autocomplete="name">
            </div>
            <div class="form-group">
                <label for="signupEmail">البريد الإلكتروني</label>
                <input type="email" id="signupEmail"
                       placeholder="example@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
                <label for="signupPassword">كلمة المرور <small style="color:#999">(6 أحرف على الأقل)</small></label>
                <input type="password" id="signupPassword"
                       placeholder="••••••••" required minlength="6" autocomplete="new-password">
            </div>
            <div class="form-group">
                <label for="signupConfirmPassword">تأكيد كلمة المرور</label>
                <input type="password" id="signupConfirmPassword"
                       placeholder="••••••••" required autocomplete="new-password">
            </div>
            <div class="form-group">
                <label for="accountType">نوع الحساب</label>
                <select id="accountType">
                    <option value="talent">🎨 موهبة — أعرض خدماتي</option>
                    <option value="client">💼 عميل — أبحث عن مواهب</option>
                </select>
            </div>
            <button type="submit" class="btn-submit" id="signupSubmitBtn">
                <span class="btn-text">إنشاء الحساب</span>
                <span class="btn-spinner" style="display:none">⏳ جاري الإنشاء...</span>
            </button>
            <p class="auth-link">لديك حساب بالفعل؟
                <a href="#" onclick="event.preventDefault(); closeAllModals(); showLoginModal();">تسجيل الدخول</a>
            </p>
        </form>
    `);

    document.body.appendChild(modal);
    setTimeout(() => { document.getElementById('signupName')?.focus(); }, 200);

    document.getElementById('signupForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const fullName        = document.getElementById('signupName').value.trim();
        const email           = document.getElementById('signupEmail').value.trim();
        const password        = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const accountType     = document.getElementById('accountType').value;
        const btn             = document.getElementById('signupSubmitBtn');
        const btnText         = btn.querySelector('.btn-text');
        const spinner         = btn.querySelector('.btn-spinner');

        if (!fullName || !email || !password || !confirmPassword) {
            authManager.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }
        if (password !== confirmPassword) {
            authManager.showNotification('كلمات المرور غير متطابقة', 'error');
            return;
        }
        if (password.length < 6) {
            authManager.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        btn.disabled           = true;
        btnText.style.display  = 'none';
        spinner.style.display  = 'inline';

        const result = await authManager.register(email, password, fullName, accountType);

        btn.disabled           = false;
        btnText.style.display  = 'inline';
        spinner.style.display  = 'none';

        if (result.success) {
            authManager.showNotification(result.message, 'success');
            updateUI();
            setTimeout(() => {
                closeAllModals();
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            authManager.showNotification(result.message, 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════
//  إنشاء النافذة المنبثقة
// ══════════════════════════════════════════════════════════
function createModal(title, content) {
    // إضافة أنماط CSS مرة واحدة
    if (!document.getElementById('lc-modal-styles')) {
        const style = document.createElement('style');
        style.id    = 'lc-modal-styles';
        style.textContent = `
            .modal-overlay {
                position:fixed; inset:0;
                background:rgba(0,0,0,.55);
                display:flex; justify-content:center; align-items:center;
                z-index:9999;
                opacity:0; transition:opacity .3s ease;
                backdrop-filter:blur(4px);
                padding:1rem;
            }
            .modal-overlay.show { opacity:1; }
            .modal {
                background:#fff; border-radius:20px;
                padding:2rem; width:100%; max-width:480px;
                max-height:90vh; overflow-y:auto;
                transform:scale(.85) translateY(20px);
                transition:transform .35s cubic-bezier(.175,.885,.32,1.275);
                box-shadow:0 25px 60px rgba(0,0,0,.3);
                direction:rtl;
            }
            .modal-overlay.show .modal { transform:scale(1) translateY(0); }
            .modal-header {
                display:flex; justify-content:space-between; align-items:center;
                margin-bottom:1.5rem; border-bottom:2px solid #f0f0f0;
                padding-bottom:1rem;
            }
            .modal-header h3 { margin:0; color:#333; font-size:1.3rem; }
            .modal-close {
                background:none; border:none;
                font-size:1.6rem; cursor:pointer;
                color:#aaa; line-height:1;
                padding:.2rem .5rem; border-radius:6px;
                transition:all .2s;
            }
            .modal-close:hover { color:#e53935; background:#fce4ec; }
            .auth-form { text-align:right; }
            .form-group { margin-bottom:1.4rem; }
            .form-group label {
                display:block; margin-bottom:.5rem;
                color:#444; font-weight:600; font-size:.95rem;
            }
            .form-group input, .form-group select {
                width:100%; padding:.85rem 1rem;
                border:2px solid #e9ecef; border-radius:10px;
                font-size:1rem; transition:border-color .25s, box-shadow .25s;
                font-family:'Tajawal',sans-serif; direction:rtl;
                box-sizing:border-box;
            }
            .form-group input:focus, .form-group select:focus {
                outline:none; border-color:#667eea;
                box-shadow:0 0 0 3px rgba(102,126,234,.15);
            }
            .btn-submit {
                width:100%; padding:1rem;
                background:linear-gradient(135deg,#667eea,#764ba2);
                color:#fff; border:none; border-radius:10px;
                font-size:1.05rem; font-weight:700; cursor:pointer;
                transition:all .3s; font-family:'Tajawal',sans-serif;
                margin-top:.5rem;
            }
            .btn-submit:hover:not(:disabled) {
                transform:translateY(-2px);
                box-shadow:0 8px 20px rgba(102,126,234,.4);
            }
            .btn-submit:disabled { opacity:.7; cursor:not-allowed; }
            .auth-link { margin-top:1.2rem; text-align:center; color:#666; font-size:.95rem; }
            .auth-link a { color:#667eea; text-decoration:none; font-weight:700; }
            .auth-link a:hover { text-decoration:underline; }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" aria-label="إغلاق" onclick="closeAllModals()">×</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;

    // إغلاق عند النقر خارج النافذة
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAllModals(); });

    // إغلاق بـ Escape
    const onKeydown = e => { if (e.key === 'Escape') { closeAllModals(); document.removeEventListener('keydown', onKeydown); } };
    document.addEventListener('keydown', onKeydown);

    // إظهار بتأثير
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));

    return overlay;
}

// ══════════════════════════════════════════════════════════
//  إغلاق النوافذ
// ══════════════════════════════════════════════════════════
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove('show');
        setTimeout(() => m.remove(), 350);
    });
}

// للتوافق مع الكود القديم
function closeModal(btn) { closeAllModals(); }
function showProfileModal() { window.location.href = 'dashboard.html'; }

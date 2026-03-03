// نظام إدارة المستخدمين
class UserManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.getCurrentUser();
    }

    // تحميل المستخدمين من LocalStorage
    loadUsers() {
        const users = localStorage.getItem('libreCreationUsers');
        return users ? JSON.parse(users) : [];
    }

    // حفظ المستخدمين في LocalStorage
    saveUsers() {
        localStorage.setItem('libreCreationUsers', JSON.stringify(this.users));
    }

    // تسجيل مستخدم جديد
    register(userData) {
        // التحقق إذا كان البريد الإلكتروني موجوداً
        if (this.users.find(user => user.email === userData.email)) {
            return { success: false, message: 'البريد الإلكتروني مستخدم بالفعل' };
        }

        // إنشاء مستخدم جديد
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            createdAt: new Date().toISOString(),
            profile: {
                name: userData.fullName,
                bio: '',
                skills: [],
                portfolio: [],
                rating: 0,
                reviews: []
            }
        };

        this.users.push(newUser);
        this.saveUsers();
        
        return { success: true, message: 'تم إنشاء الحساب بنجاح', user: newUser };
    }

    // تسجيل الدخول
    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.setCurrentUser(user);
            return { success: true, message: 'تم تسجيل الدخول بنجاح', user };
        }
        
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // تسجيل الخروج
    logout() {
        localStorage.removeItem('libreCreationCurrentUser');
        this.currentUser = null;
    }

    // حفظ المستخدم الحالي
    setCurrentUser(user) {
        localStorage.setItem('libreCreationCurrentUser', JSON.stringify(user));
        this.currentUser = user;
    }

    // جلب المستخدم الحالي
    getCurrentUser() {
        const user = localStorage.getItem('libreCreationCurrentUser');
        return user ? JSON.parse(user) : null;
    }

    // تحديث بيانات المستخدم
    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsers();
            
            if (this.currentUser && this.currentUser.id === userId) {
                this.setCurrentUser(this.users[userIndex]);
            }
            
            return { success: true, message: 'تم تحديث البيانات بنجاح' };
        }
        
        return { success: false, message: 'لم يتم العثور على المستخدم' };
    }
}

// إنشاء مدير المستخدمين
const userManager = new UserManager();

// انتظار تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    
    // تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
    updateUI();
    
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
                // هنا سيتم إضافة منطق التواصل الفعلي
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
            loginBtn.onclick = showProfileModal;
        }
        if (signupBtn) {
            signupBtn.textContent = 'تسجيل الخروج';
            signupBtn.onclick = function() {
                userManager.logout();
                updateUI();
                showNotification('تم تسجيل الخروج بنجاح');
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
    
    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = userManager.login(email, password);
        
        if (result.success) {
            showNotification(result.message);
            // إغلاق النافذة بطريقة آمنة
            setTimeout(() => {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeModal(closeBtn);
                }
            }, 1000);
            updateUI();
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
                <input type="password" id="signupPassword" placeholder="أدخل كلمة المرور" required>
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
    document.getElementById('signupForm').addEventListener('submit', function(e) {
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
        const result = userManager.register({
            fullName,
            email,
            password,
            accountType
        });
        
        if (result.success) {
            showNotification(result.message);
            // إغلاق النافذة بطريقة آمنة
            setTimeout(() => {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeModal(closeBtn);
                }
            }, 1000);
            updateUI();
        } else {
            showNotification(result.message);
        }
    });
}

// وظيفة عرض نافذة الملف الشخصي
function showProfileModal() {
    const user = userManager.currentUser;
    if (!user) return;
    
    const modal = createModal('الملف الشخصي', `
        <div class="profile-content">
            <div class="profile-header">
                <h2>${user.profile.name}</h2>
                <p class="profile-type">${user.accountType === 'talent' ? 'موهبة' : 'عميل'}</p>
            </div>
            <div class="profile-info">
                <div class="info-item">
                    <strong>البريد الإلكتروني:</strong>
                    <span>${user.email}</span>
                </div>
                <div class="info-item">
                    <strong>تاريخ الانضمام:</strong>
                    <span>${new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
                <div class="info-item">
                    <strong>التقييم:</strong>
                    <span>⭐ ${user.profile.rating || 0}</span>
                </div>
            </div>
            ${user.accountType === 'talent' ? `
                <div class="talent-section">
                    <h3>مهاراتي</h3>
                    <div class="skills-container">
                        ${user.profile.skills.length > 0 ? user.profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : '<p>لم تضف مهارات بعد</p>'}
                    </div>
                    <button class="btn-add-skill" onclick="showAddSkillModal()">إضافة مهارة</button>
                </div>
            ` : ''}
        </div>
    `);
    
    document.body.appendChild(modal);
}

// وظيفة إضافة مهارة
function showAddSkillModal() {
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
    
    document.getElementById('addSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const skillName = document.getElementById('skillName').value;
        const user = userManager.currentUser;
        
        if (user && user.accountType === 'talent') {
            const updatedSkills = [...user.profile.skills, skillName];
            const result = userManager.updateUser(user.id, {
                profile: { ...user.profile, skills: updatedSkills }
            });
            
            if (result.success) {
                showNotification('تم إضافة المهارة بنجاح');
                closeModal(modal.querySelector('.modal-close'));
                showProfileModal(); // إعادة فتح الملف الشخصي المحدث
            }
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

// انتظار تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    
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
                showNotification('شكراً لتقييمك! سيتم حفظه في النظام.');
            });
        }
    });

    // أزرار التواصل
    const contactButtons = document.querySelectorAll('.btn-contact');
    contactButtons.forEach(button => {
        button.addEventListener('click', function() {
            const profileName = this.closest('.talent-profile').querySelector('h3').textContent;
            showNotification(`جاري فتح نافذة التواصل مع ${profileName}...`);
            // هنا سيتم إضافة منطق التواصل الفعلي
        });
    });

    // أزرار تسجيل الدخول وإنشاء الحساب
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    
    loginBtn.addEventListener('click', function() {
        showLoginModal();
    });
    
    signupBtn.addEventListener('click', function() {
        showSignupModal();
    });

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
            showNotification('قم بتسجيل الدخول أولاً لعرض أعمالك');
            showLoginModal();
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

// وظيفة عرض الإشعارات
function showNotification(message) {
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// وظيفة عرض نافذة تسجيل الدخول
function showLoginModal() {
    const modal = createModal('تسجيل الدخول', `
        <form class="auth-form">
            <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" placeholder="أدخل بريدك الإلكتروني" required>
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" placeholder="أدخل كلمة المرور" required>
            </div>
            <button type="submit" class="btn-submit">دخول</button>
            <p class="auth-link">ليس لديك حساب؟ <a href="#" onclick="showSignupModal()">إنشاء حساب</a></p>
        </form>
    `);
    
    document.body.appendChild(modal);
}

// وظيفة عرض نافذة إنشاء الحساب
function showSignupModal() {
    const modal = createModal('إنشاء حساب جديد', `
        <form class="auth-form">
            <div class="form-group">
                <label>الاسم الكامل</label>
                <input type="text" placeholder="أدخل اسمك الكامل" required>
            </div>
            <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" placeholder="أدخل بريدك الإلكتروني" required>
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="password" placeholder="أدخل كلمة المرور" required>
            </div>
            <div class="form-group">
                <label>تأكيد كلمة المرور</label>
                <input type="password" placeholder="أعد إدخال كلمة المرور" required>
            </div>
            <div class="form-group">
                <label>نوع الحساب</label>
                <select>
                    <option value="talent">موهبة (أعرض خدماتي)</option>
                    <option value="client">عميل (أبحث عن مواهب)</option>
                </select>
            </div>
            <button type="submit" class="btn-submit">إنشاء الحساب</button>
            <p class="auth-link">لديك حساب بالفعل؟ <a href="#" onclick="showLoginModal()">تسجيل الدخول</a></p>
        </form>
    `);
    
    document.body.appendChild(modal);
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
    modal.style.opacity = '0';
    modal.querySelector('.modal').style.transform = 'scale(0.8)';
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

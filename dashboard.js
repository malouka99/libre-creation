// ============================================================
//  Libre Creation — لوحة التحكم (LocalStorage)
// ============================================================

// ── قراءة المستخدم الحالي من LocalStorage ──
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('lc_currentUser') || 'null');
    } catch {
        return null;
    }
}

function saveCurrentUser(user) {
    localStorage.setItem('lc_currentUser', JSON.stringify(user));
}

function getAllUsers() {
    try {
        return JSON.parse(localStorage.getItem('lc_users') || '[]');
    } catch {
        return [];
    }
}

function saveAllUsers(users) {
    localStorage.setItem('lc_users', JSON.stringify(users));
}

// ── التحقق من تسجيل الدخول ──
const currentUser = getCurrentUser();
if (!currentUser) {
    window.location.href = 'index.html';
}

// ══════════════════════════════════════════════════════════
//  بناء لوحة التحكم
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    if (!currentUser) return;

    // اسم المستخدم في الهيدر
    const welcomeTitle = document.querySelector('.dashboard-header h1');
    const displayName  = currentUser.fullName || currentUser.email || 'مستخدم';
    if (welcomeTitle) {
        welcomeTitle.textContent = `مرحباً ${displayName} 👋`;
    }

    // زر تسجيل الخروج
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('lc_currentUser');
            window.location.href = 'index.html';
        });
    }

    // بناء التبويبات حسب نوع الحساب
    buildDashboard(currentUser);
});

// ══════════════════════════════════════════════════════════
//  بناء التبويبات والمحتوى
// ══════════════════════════════════════════════════════════
function buildDashboard(user) {
    const nav      = document.getElementById('dashboardNav');
    const contents = document.getElementById('tabContents');
    if (!nav || !contents) return;

    const isTalent = user.accountType === 'talent';

    // التبويبات
    const tabs = isTalent
        ? [
            { id: 'profile',   label: '👤 ملفي الشخصي' },
            { id: 'portfolio', label: '🖼️ أعمالي' },
            { id: 'skills',    label: '⚡ مهاراتي' },
            { id: 'messages',  label: '💬 الرسائل' },
          ]
        : [
            { id: 'browse',    label: '🔍 تصفح المواهب' },
            { id: 'favorites', label: '❤️ المفضلة' },
            { id: 'messages',  label: '💬 الرسائل' },
          ];

    // رسم التبويبات
    nav.innerHTML = tabs.map((t, i) => `
        <button class="nav-tab ${i === 0 ? 'active' : ''}"
                onclick="switchTab('${t.id}')" id="tab-${t.id}">
            ${t.label}
        </button>
    `).join('');

    // رسم المحتوى
    contents.innerHTML = tabs.map((t, i) => `
        <div class="tab-content ${i === 0 ? 'active' : ''}" id="content-${t.id}">
            ${renderTabContent(t.id, user)}
        </div>
    `).join('');

    // أنماط CSS للتبويبات
    injectTabStyles();

    // تفعيل الأحداث بعد رسم الـ DOM
    bindEvents(user);
}

// ══════════════════════════════════════════════════════════
//  محتوى كل تبويب
// ══════════════════════════════════════════════════════════
function renderTabContent(tabId, user) {
    const profile = user.profile || {};

    switch (tabId) {

        // ── الملف الشخصي ──
        case 'profile':
            return `
                <div class="card">
                    <h2 class="card-title">✏️ تعديل الملف الشخصي</h2>
                    <form id="profileForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>الاسم الكامل</label>
                                <input type="text" id="pf-name"
                                       value="${escHtml(user.fullName || '')}"
                                       placeholder="اسمك الكامل">
                            </div>
                            <div class="form-group">
                                <label>البريد الإلكتروني</label>
                                <input type="email" id="pf-email"
                                       value="${escHtml(user.email || '')}" readonly
                                       style="background:#f5f5f5;cursor:not-allowed">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>نبذة عنك</label>
                            <textarea id="pf-bio" rows="4"
                                      placeholder="اكتب نبذة تعريفية عنك...">${escHtml(profile.bio || '')}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>المدينة</label>
                                <input type="text" id="pf-city"
                                       value="${escHtml(profile.city || '')}"
                                       placeholder="مثال: الرياض، القاهرة">
                            </div>
                            <div class="form-group">
                                <label>رقم الهاتف</label>
                                <input type="tel" id="pf-phone"
                                       value="${escHtml(profile.phone || '')}"
                                       placeholder="+966 5xxxxxxx">
                            </div>
                        </div>
                        <button type="submit" class="btn-primary-dash">💾 حفظ التغييرات</button>
                    </form>
                </div>
                <div class="card" style="margin-top:1.5rem">
                    <h2 class="card-title">📊 إحصائياتي</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${(profile.skills || []).length}</div>
                            <div class="stat-label">المهارات</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${(profile.portfolio || []).length}</div>
                            <div class="stat-label">الأعمال</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">⭐ ${profile.rating || 0}</div>
                            <div class="stat-label">التقييم</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${user.accountType === 'talent' ? '🎨 موهبة' : '💼 عميل'}</div>
                            <div class="stat-label">نوع الحساب</div>
                        </div>
                    </div>
                </div>
            `;

        // ── المهارات ──
        case 'skills':
            const skills = profile.skills || [];
            return `
                <div class="card">
                    <h2 class="card-title">⚡ مهاراتي</h2>
                    <div class="skills-container" id="skillsContainer">
                        ${skills.length
                            ? skills.map((s, i) => `
                                <span class="skill-tag">
                                    ${escHtml(s)}
                                    <button class="skill-remove" onclick="removeSkill(${i})" title="حذف">×</button>
                                </span>`).join('')
                            : '<p class="empty-msg">لم تضف أي مهارات بعد</p>'
                        }
                    </div>
                    <div class="add-skill-form" style="margin-top:1.5rem;display:flex;gap:.8rem;flex-wrap:wrap">
                        <input type="text" id="newSkillInput"
                               placeholder="مثال: Photoshop، JavaScript، التصميم..."
                               style="flex:1;min-width:200px;padding:.8rem;border:2px solid #e9ecef;border-radius:10px;font-family:'Tajawal',sans-serif">
                        <button onclick="addSkill()" class="btn-primary-dash" style="white-space:nowrap">
                            ➕ إضافة مهارة
                        </button>
                    </div>
                </div>
            `;

        // ── الأعمال ──
        case 'portfolio':
            const works = profile.portfolio || [];
            return `
                <div class="card">
                    <h2 class="card-title">🖼️ معرض أعمالي</h2>
                    <button onclick="showAddWorkModal()" class="btn-primary-dash" style="margin-bottom:1.5rem">
                        ➕ إضافة عمل جديد
                    </button>
                    <div class="portfolio-grid" id="portfolioGrid">
                        ${works.length
                            ? works.map((w, i) => `
                                <div class="work-card">
                                    ${w.image
                                        ? `<img src="${escHtml(w.image)}" alt="${escHtml(w.title)}" class="work-img">`
                                        : `<div class="work-img-placeholder">🖼️</div>`
                                    }
                                    <div class="work-info">
                                        <h3>${escHtml(w.title)}</h3>
                                        <p>${escHtml(w.description || '')}</p>
                                        <button onclick="removeWork(${i})" class="btn-danger-sm">🗑️ حذف</button>
                                    </div>
                                </div>`).join('')
                            : '<p class="empty-msg">لم تضف أي أعمال بعد — أضف عملك الأول!</p>'
                        }
                    </div>
                </div>
            `;

        // ── تصفح المواهب (للعملاء) ──
        case 'browse':
            const allUsers   = getAllUsers();
            const talents    = allUsers.filter(u => u.accountType === 'talent');
            return `
                <div class="card">
                    <h2 class="card-title">🔍 تصفح المواهب المسجلة</h2>
                    ${talents.length
                        ? `<div class="talents-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;margin-top:1rem">
                            ${talents.map(t => `
                                <div class="talent-card-dash">
                                    <div class="talent-avatar">${(t.fullName || 'م')[0].toUpperCase()}</div>
                                    <h3>${escHtml(t.fullName || 'موهبة')}</h3>
                                    <p style="color:#667eea;margin:.3rem 0">${escHtml(t.email)}</p>
                                    <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0;justify-content:center">
                                        ${(t.profile?.skills || []).slice(0,4).map(s =>
                                            `<span class="skill-tag-sm">${escHtml(s)}</span>`
                                        ).join('') || '<span style="color:#aaa;font-size:.85rem">لا توجد مهارات</span>'}
                                    </div>
                                    <p style="color:#888;font-size:.85rem;text-align:center">${escHtml(t.profile?.bio?.slice(0,80) || '') || 'لا توجد نبذة'}</p>
                                </div>`
                            ).join('')}
                          </div>`
                        : '<p class="empty-msg">لا يوجد مواهب مسجلة حتى الآن</p>'
                    }
                </div>
            `;

        // ── المفضلة ──
        case 'favorites':
            return `
                <div class="card">
                    <h2 class="card-title">❤️ المواهب المفضلة</h2>
                    <p class="empty-msg">لم تضف أي موهبة إلى المفضلة بعد</p>
                </div>
            `;

        // ── الرسائل ──
        case 'messages':
            return `
                <div class="card">
                    <h2 class="card-title">💬 الرسائل</h2>
                    <p class="empty-msg">لا توجد رسائل حتى الآن — ستظهر رسائلك هنا</p>
                </div>
            `;

        default:
            return '<p>المحتوى غير متاح</p>';
    }
}

// ══════════════════════════════════════════════════════════
//  التبديل بين التبويبات
// ══════════════════════════════════════════════════════════
function switchTab(id) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + id)?.classList.add('active');
    document.getElementById('content-' + id)?.classList.add('active');
}

// ══════════════════════════════════════════════════════════
//  ربط الأحداث
// ══════════════════════════════════════════════════════════
function bindEvents(user) {

    // ── حفظ الملف الشخصي ──
    document.getElementById('profileForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const name  = document.getElementById('pf-name')?.value.trim()  || '';
        const bio   = document.getElementById('pf-bio')?.value.trim()   || '';
        const city  = document.getElementById('pf-city')?.value.trim()  || '';
        const phone = document.getElementById('pf-phone')?.value.trim() || '';

        // تحديث في LocalStorage
        const users   = getAllUsers();
        const idx     = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].fullName      = name;
            users[idx].profile       = { ...users[idx].profile, bio, city, phone };
            user.fullName            = name;
            user.profile             = users[idx].profile;
            saveAllUsers(users);
            saveCurrentUser(users[idx]);
        }

        showDashNotif('✅ تم حفظ التغييرات بنجاح!', 'success');
    });
}

// ══════════════════════════════════════════════════════════
//  إضافة / حذف مهارة
// ══════════════════════════════════════════════════════════
function addSkill() {
    const input = document.getElementById('newSkillInput');
    const skill = input?.value.trim();
    if (!skill) { showDashNotif('أدخل اسم المهارة أولاً', 'error'); return; }

    const user   = getCurrentUser();
    const skills = user.profile?.skills || [];
    if (skills.includes(skill)) { showDashNotif('هذه المهارة موجودة بالفعل', 'error'); return; }

    skills.push(skill);
    updateProfile(user, { skills });
    input.value = '';

    // تحديث العرض
    refreshSkills(user);
    showDashNotif('✅ تمت إضافة المهارة!', 'success');
}

function removeSkill(index) {
    const user   = getCurrentUser();
    const skills = user.profile?.skills || [];
    skills.splice(index, 1);
    updateProfile(user, { skills });
    refreshSkills(user);
    showDashNotif('تم حذف المهارة', 'info');
}

function refreshSkills(user) {
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    const skills = user.profile?.skills || [];
    container.innerHTML = skills.length
        ? skills.map((s, i) => `
            <span class="skill-tag">
                ${escHtml(s)}
                <button class="skill-remove" onclick="removeSkill(${i})" title="حذف">×</button>
            </span>`).join('')
        : '<p class="empty-msg">لم تضف أي مهارات بعد</p>';
}

// ══════════════════════════════════════════════════════════
//  إضافة / حذف عمل
// ══════════════════════════════════════════════════════════
function showAddWorkModal() {
    // إزالة أي نافذة قائمة
    document.querySelector('.work-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'work-modal-overlay';
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,.55);
        display:flex;justify-content:center;align-items:center;
        z-index:9999;backdrop-filter:blur(3px);padding:1rem;
    `;
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:20px;padding:2rem;
                    width:100%;max-width:500px;max-height:90vh;overflow-y:auto;
                    direction:rtl;font-family:'Tajawal',sans-serif">
            <div style="display:flex;justify-content:space-between;align-items:center;
                        margin-bottom:1.5rem;border-bottom:2px solid #f0f0f0;padding-bottom:1rem">
                <h3 style="margin:0;color:#333">➕ إضافة عمل جديد</h3>
                <button onclick="this.closest('.work-modal-overlay').remove()"
                        style="background:none;border:none;font-size:1.8rem;cursor:pointer;color:#aaa">×</button>
            </div>
            <form id="addWorkForm">
                <div style="margin-bottom:1rem">
                    <label style="display:block;margin-bottom:.4rem;font-weight:600;color:#444">عنوان العمل *</label>
                    <input type="text" id="wk-title" required
                           placeholder="مثال: تصميم شعار شركة XYZ"
                           style="width:100%;padding:.8rem;border:2px solid #e9ecef;border-radius:10px;
                                  font-family:'Tajawal',sans-serif;font-size:1rem;box-sizing:border-box">
                </div>
                <div style="margin-bottom:1rem">
                    <label style="display:block;margin-bottom:.4rem;font-weight:600;color:#444">وصف العمل</label>
                    <textarea id="wk-desc" rows="3"
                              placeholder="صف العمل بإيجاز..."
                              style="width:100%;padding:.8rem;border:2px solid #e9ecef;border-radius:10px;
                                     font-family:'Tajawal',sans-serif;font-size:1rem;resize:vertical;box-sizing:border-box"></textarea>
                </div>
                <div style="margin-bottom:1.5rem">
                    <label style="display:block;margin-bottom:.4rem;font-weight:600;color:#444">رابط الصورة (اختياري)</label>
                    <input type="url" id="wk-image"
                           placeholder="https://..."
                           style="width:100%;padding:.8rem;border:2px solid #e9ecef;border-radius:10px;
                                  font-family:'Tajawal',sans-serif;font-size:1rem;box-sizing:border-box">
                </div>
                <button type="submit"
                        style="width:100%;padding:1rem;background:linear-gradient(135deg,#667eea,#764ba2);
                               color:#fff;border:none;border-radius:10px;font-size:1.05rem;font-weight:700;
                               cursor:pointer;font-family:'Tajawal',sans-serif">
                    💾 إضافة العمل
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('addWorkForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const title = document.getElementById('wk-title').value.trim();
        const desc  = document.getElementById('wk-desc').value.trim();
        const image = document.getElementById('wk-image').value.trim();

        if (!title) { showDashNotif('أدخل عنوان العمل أولاً', 'error'); return; }

        const user      = getCurrentUser();
        const portfolio = user.profile?.portfolio || [];
        portfolio.push({ title, description: desc, image: image || null, date: new Date().toISOString() });
        updateProfile(user, { portfolio });
        overlay.remove();

        // تحديث العرض
        const grid = document.getElementById('portfolioGrid');
        if (grid) {
            const w = portfolio[portfolio.length - 1];
            const i = portfolio.length - 1;
            if (portfolio.length === 1) grid.innerHTML = '';
            grid.insertAdjacentHTML('beforeend', `
                <div class="work-card">
                    ${w.image
                        ? `<img src="${escHtml(w.image)}" alt="${escHtml(w.title)}" class="work-img">`
                        : `<div class="work-img-placeholder">🖼️</div>`}
                    <div class="work-info">
                        <h3>${escHtml(w.title)}</h3>
                        <p>${escHtml(w.description || '')}</p>
                        <button onclick="removeWork(${i})" class="btn-danger-sm">🗑️ حذف</button>
                    </div>
                </div>
            `);
        }
        showDashNotif('✅ تمت إضافة العمل!', 'success');
    });
}

function removeWork(index) {
    const user      = getCurrentUser();
    const portfolio = user.profile?.portfolio || [];
    portfolio.splice(index, 1);
    updateProfile(user, { portfolio });

    // إعادة رسم
    const grid = document.getElementById('portfolioGrid');
    if (grid) {
        grid.innerHTML = portfolio.length
            ? portfolio.map((w, i) => `
                <div class="work-card">
                    ${w.image
                        ? `<img src="${escHtml(w.image)}" alt="${escHtml(w.title)}" class="work-img">`
                        : `<div class="work-img-placeholder">🖼️</div>`}
                    <div class="work-info">
                        <h3>${escHtml(w.title)}</h3>
                        <p>${escHtml(w.description || '')}</p>
                        <button onclick="removeWork(${i})" class="btn-danger-sm">🗑️ حذف</button>
                    </div>
                </div>`).join('')
            : '<p class="empty-msg">لم تضف أي أعمال بعد — أضف عملك الأول!</p>';
    }
    showDashNotif('تم حذف العمل', 'info');
}

// ══════════════════════════════════════════════════════════
//  تحديث بيانات الملف الشخصي في LocalStorage
// ══════════════════════════════════════════════════════════
function updateProfile(user, profileUpdates) {
    const users = getAllUsers();
    const idx   = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
        users[idx].profile = { ...users[idx].profile, ...profileUpdates };
        user.profile       = users[idx].profile;
        saveAllUsers(users);
        saveCurrentUser(users[idx]);
    }
}

// ══════════════════════════════════════════════════════════
//  الإشعارات
// ══════════════════════════════════════════════════════════
function showDashNotif(message, type = 'info') {
    document.querySelectorAll('.dash-notif').forEach(n => n.remove());
    const colors = {
        success: 'linear-gradient(135deg,#43a047,#1b5e20)',
        error  : 'linear-gradient(135deg,#e53935,#b71c1c)',
        info   : 'linear-gradient(135deg,#667eea,#764ba2)'
    };
    const el = document.createElement('div');
    el.className = 'dash-notif';
    el.textContent = message;
    el.style.cssText = `
        position:fixed;top:90px;right:20px;
        background:${colors[type]||colors.info};
        color:#fff;padding:1rem 1.5rem;border-radius:12px;
        font-weight:600;font-family:'Tajawal',sans-serif;
        box-shadow:0 8px 25px rgba(0,0,0,.25);z-index:99999;
        max-width:320px;text-align:center;direction:rtl;
        opacity:0;transform:translateX(110%);
        transition:all .35s cubic-bezier(.175,.885,.32,1.275);
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
    }, 3500);
}

// ══════════════════════════════════════════════════════════
//  أنماط CSS الإضافية
// ══════════════════════════════════════════════════════════
function injectTabStyles() {
    if (document.getElementById('dash-extra-styles')) return;
    const s = document.createElement('style');
    s.id = 'dash-extra-styles';
    s.textContent = `
        .nav-tab {
            padding:.75rem 1.5rem;background:#f0f0f0;border:none;
            border-radius:10px;cursor:pointer;font-weight:600;
            font-family:'Tajawal',sans-serif;font-size:1rem;
            transition:all .25s;color:#555;
        }
        .nav-tab.active,.nav-tab:hover {
            background:linear-gradient(135deg,#667eea,#764ba2);
            color:#fff;transform:translateY(-2px);
            box-shadow:0 6px 15px rgba(102,126,234,.35);
        }
        .tab-content { display:none; }
        .tab-content.active { display:block; }

        .card {
            background:#fff;border-radius:16px;padding:2rem;
            box-shadow:0 4px 20px rgba(0,0,0,.08);
        }
        .card-title { margin:0 0 1.5rem;color:#333;font-size:1.3rem; }

        .form-row { display:grid;grid-template-columns:1fr 1fr;gap:1.2rem; }
        @media(max-width:600px){ .form-row{grid-template-columns:1fr;} }

        .form-group { margin-bottom:1.2rem; }
        .form-group label { display:block;margin-bottom:.45rem;color:#444;font-weight:600; }
        .form-group input,.form-group textarea,.form-group select {
            width:100%;padding:.8rem 1rem;border:2px solid #e9ecef;border-radius:10px;
            font-family:'Tajawal',sans-serif;font-size:1rem;
            transition:border-color .25s;box-sizing:border-box;
        }
        .form-group input:focus,.form-group textarea:focus {
            outline:none;border-color:#667eea;
            box-shadow:0 0 0 3px rgba(102,126,234,.12);
        }

        .btn-primary-dash {
            padding:.85rem 2rem;background:linear-gradient(135deg,#667eea,#764ba2);
            color:#fff;border:none;border-radius:10px;cursor:pointer;
            font-family:'Tajawal',sans-serif;font-size:1rem;font-weight:700;
            transition:all .3s;
        }
        .btn-primary-dash:hover {
            transform:translateY(-2px);
            box-shadow:0 8px 20px rgba(102,126,234,.4);
        }
        .btn-danger-sm {
            padding:.4rem .9rem;background:#ffebee;color:#c62828;border:none;
            border-radius:8px;cursor:pointer;font-family:'Tajawal',sans-serif;
            font-size:.85rem;font-weight:600;transition:all .2s;margin-top:.5rem;
        }
        .btn-danger-sm:hover { background:#c62828;color:#fff; }

        .stats-grid {
            display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1rem;
        }
        .stat-card {
            background:linear-gradient(135deg,#667eea,#764ba2);
            color:#fff;border-radius:12px;padding:1.5rem;text-align:center;
        }
        .stat-number { font-size:1.6rem;font-weight:700;margin-bottom:.3rem; }
        .stat-label  { font-size:.9rem;opacity:.85; }

        .skills-container { display:flex;flex-wrap:wrap;gap:.7rem; }
        .skill-tag {
            display:inline-flex;align-items:center;gap:.4rem;
            background:linear-gradient(135deg,#667eea,#764ba2);
            color:#fff;padding:.4rem .9rem;border-radius:20px;font-size:.9rem;font-weight:600;
        }
        .skill-tag-sm {
            background:#e8eaf6;color:#3949ab;padding:.25rem .7rem;
            border-radius:12px;font-size:.8rem;font-weight:600;
        }
        .skill-remove {
            background:rgba(255,255,255,.3);border:none;cursor:pointer;
            color:#fff;width:18px;height:18px;border-radius:50%;
            font-size:.85rem;line-height:1;padding:0;display:flex;
            align-items:center;justify-content:center;
        }
        .skill-remove:hover { background:rgba(255,255,255,.6);color:#333; }

        .portfolio-grid {
            display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.2rem;
        }
        .work-card {
            border:2px solid #e9ecef;border-radius:14px;overflow:hidden;
            transition:all .3s;
        }
        .work-card:hover { transform:translateY(-4px);box-shadow:0 10px 25px rgba(0,0,0,.1); }
        .work-img { width:100%;height:150px;object-fit:cover; }
        .work-img-placeholder {
            width:100%;height:150px;background:#f3f4f6;
            display:flex;align-items:center;justify-content:center;font-size:3rem;
        }
        .work-info { padding:1rem; }
        .work-info h3 { margin:0 0 .4rem;color:#333;font-size:1rem; }
        .work-info p  { margin:0;color:#666;font-size:.85rem; }

        .talent-card-dash {
            background:#fff;border:2px solid #e9ecef;border-radius:16px;
            padding:1.5rem;text-align:center;transition:all .3s;
        }
        .talent-card-dash:hover {
            border-color:#667eea;transform:translateY(-4px);
            box-shadow:0 10px 25px rgba(102,126,234,.15);
        }
        .talent-avatar {
            width:60px;height:60px;border-radius:50%;margin:0 auto .8rem;
            background:linear-gradient(135deg,#667eea,#764ba2);
            display:flex;align-items:center;justify-content:center;
            font-size:1.5rem;font-weight:700;color:#fff;
        }
        .talent-card-dash h3 { margin:0;color:#333;font-size:1.1rem; }

        .empty-msg { color:#aaa;text-align:center;padding:2rem;font-style:italic; }
    `;
    document.head.appendChild(s);
}

// ══════════════════════════════════════════════════════════
//  مساعدات
// ══════════════════════════════════════════════════════════
function escHtml(str) {
    return String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

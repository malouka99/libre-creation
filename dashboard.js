// نظام لوحة التحكم
class DashboardManager {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.userData = null;
        this.categories = [];
        this.subcategories = [];
        this.init();
    }

    async init() {
        try {
            // التحقق من تسجيل الدخول
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            this.currentUser = user;
            
            // جلب بيانات المستخدم
            await this.loadUserData();
            
            // جلب الفئات
            await this.loadCategories();
            
            // إعداد الواجهة
            this.setupDashboard();
            
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showNotification('حدث خطأ في تحميل لوحة التحكم');
        }
    }

    async loadUserData() {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('Error loading user data:', error);
                return;
            }

            this.userData = data;
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadCategories() {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error loading categories:', error);
                return;
            }

            this.categories = data;
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    setupDashboard() {
        const user_type = this.userData.account_type;
        const navContainer = document.getElementById('dashboardNav');
        const tabContents = document.getElementById('tabContents');

        if (user_type === 'talent') {
            this.setupTalentDashboard(navContainer, tabContents);
        } else {
            this.setupClientDashboard(navContainer, tabContents);
        }

        // إعداد تسجيل الخروج
        document.querySelector('.btn-logout').addEventListener('click', () => {
            this.logout();
        });
    }

    setupTalentDashboard(navContainer, tabContents) {
        // إنشاء تبويبات الموهبة
        navContainer.innerHTML = `
            <div class="nav-tab active" data-tab="profile">الملف الشخصي</div>
            <div class="nav-tab" data-tab="skills">المهارات والخبرات</div>
            <div class="nav-tab" data-tab="portfolio">أعمالي</div>
            <div class="nav-tab" data-tab="messages">الرسائل</div>
        `;

        // إنشاء محتوى التبويبات
        tabContents.innerHTML = `
            <div class="tab-content active" id="profile-tab">
                ${this.getProfileForm()}
            </div>
            <div class="tab-content" id="skills-tab">
                ${this.getSkillsForm()}
            </div>
            <div class="tab-content" id="portfolio-tab">
                ${this.getPortfolioForm()}
            </div>
            <div class="tab-content" id="messages-tab">
                ${this.getMessagesContainer()}
            </div>
        `;

        this.setupTabNavigation();
        this.setupProfileForm();
        this.setupSkillsForm();
        this.setupPortfolioForm();
        this.loadMessages();
    }

    setupClientDashboard(navContainer, tabContents) {
        // إنشاء تبويبات العميل
        navContainer.innerHTML = `
            <div class="nav-tab active" data-tab="search">البحث عن المواهب</div>
            <div class="nav-tab" data-tab="messages">الرسائل</div>
            <div class="nav-tab" data-tab="saved">المواهب المحفوظة</div>
        `;

        // إنشاء محتوى التبويبات
        tabContents.innerHTML = `
            <div class="tab-content active" id="search-tab">
                ${this.getSearchForm()}
            </div>
            <div class="tab-content" id="messages-tab">
                ${this.getMessagesContainer()}
            </div>
            <div class="tab-content" id="saved-tab">
                ${this.getSavedTalents()}
            </div>
        `;

        this.setupTabNavigation();
        this.setupSearchForm();
        this.loadMessages();
        this.loadSavedTalents();
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // تحديث التبويبات النشطة
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // تحديث المحتوى النشط
                contents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    getProfileForm() {
        return `
            <div class="form-section">
                <h2>معلوماتك الشخصية</h2>
                <form id="profileForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>الاسم الكامل</label>
                            <input type="text" id="fullName" value="${this.userData.full_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>البريد الإلكتروني</label>
                            <input type="email" id="email" value="${this.userData.email || ''}" readonly>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>الفئة الرئيسية</label>
                            <select id="category" required>
                                <option value="">اختر الفئة</option>
                                ${this.categories.map(cat => `
                                    <option value="${cat.name}" ${this.userData.category === cat.name ? 'selected' : ''}>
                                        ${cat.icon} ${cat.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>الموقع</label>
                            <input type="text" id="location" value="${this.userData.location || ''}" placeholder="مثال: الجزائر، الجزائر العاصمة">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>الوصف</label>
                        <textarea id="description" placeholder="صف نفسك ومواهبك بشكل موجز">${this.userData.description || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>مستوى الخبرة</label>
                            <select id="experienceLevel">
                                <option value="beginner" ${this.userData.experience_level === 'beginner' ? 'selected' : ''}>مبتدئ</option>
                                <option value="intermediate" ${this.userData.experience_level === 'intermediate' ? 'selected' : ''}>متوسط</option>
                                <option value="expert" ${this.userData.experience_level === 'expert' ? 'selected' : ''}>خبير</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>سعر الساعة (بالدينار)</label>
                            <input type="number" id="hourlyRate" value="${this.userData.hourly_rate || ''}" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>متاح للعمل</label>
                        <select id="availability">
                            <option value="available" ${this.userData.availability === 'available' ? 'selected' : ''}>متاح</option>
                            <option value="busy" ${this.userData.availability === 'busy' ? 'selected' : ''}>مشغول</option>
                            <option value="unavailable" ${this.userData.availability === 'unavailable' ? 'selected' : ''}>غير متاح</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn-primary">حفظ المعلومات</button>
                </form>
            </div>
        `;
    }

    getSkillsForm() {
        const skills = this.userData.skills || [];
        return `
            <div class="form-section">
                <h2>مهاراتك</h2>
                <form id="skillsForm">
                    <div class="form-group">
                        <label>المهارات الحالية</label>
                        <div class="skills-container">
                            ${skills.length > 0 ? skills.map(skill => `
                                <span class="skill-tag">
                                    ${skill}
                                    <button type="button" class="remove-skill" data-skill="${skill}">×</button>
                                </span>
                            `).join('') : '<p>لم تضف مهارات بعد</p>'}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>إضافة مهارة جديدة</label>
                        <div class="form-row">
                            <input type="text" id="newSkill" placeholder="مثال: JavaScript, التصميم، المونتاج">
                            <button type="button" id="addSkill" class="btn-primary">إضافة</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>اللغات</label>
                        <div class="languages-container">
                            ${this.userData.languages && this.userData.languages.length > 0 ? 
                                this.userData.languages.map(lang => `<span class="skill-tag">${lang}</span>`).join('') : 
                                '<p>لم تضف لغات بعد</p>'
                            }
                        </div>
                        <div class="form-row">
                            <input type="text" id="newLanguage" placeholder="مثال: العربية، الإنجليزية، الفرنسية">
                            <button type="button" id="addLanguage" class="btn-primary">إضافة</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>التعليم</label>
                        <textarea id="education" placeholder="معلومات تعليمك وخبراتك">${this.userData.education || ''}</textarea>
                    </div>
                </form>
            </div>
        `;
    }

    getPortfolioForm() {
        return `
            <div class="form-section">
                <h2>أعمالك</h2>
                <form id="portfolioForm">
                    <div class="form-group">
                        <label>رابط معرض الأعمال</label>
                        <input type="url" id="portfolioUrl" value="${this.userData.portfolio_url || ''}" placeholder="https://behance.net/yourname">
                    </div>
                    
                    <div class="form-group">
                        <label>روابط التواصل الاجتماعي</label>
                        <div class="form-row">
                            <input type="url" id="linkedin" placeholder="LinkedIn" value="${this.userData.social_links?.linkedin || ''}">
                            <input type="url" id="twitter" placeholder="Twitter" value="${this.userData.social_links?.twitter || ''}">
                        </div>
                        <div class="form-row">
                            <input type="url" id="instagram" placeholder="Instagram" value="${this.userData.social_links?.instagram || ''}">
                            <input type="url" id="github" placeholder="GitHub" value="${this.userData.social_links?.github || ''}">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary">حفظ معرض الأعمال</button>
                </form>
            </div>
        `;
    }

    getSearchForm() {
        return `
            <div class="form-section">
                <h2>البحث عن المواهب</h2>
                <form id="searchForm">
                    <div class="form-group">
                        <label>البحث حسب الفئة</label>
                        <select id="searchCategory">
                            <option value="">جميع الفئات</option>
                            ${this.categories.map(cat => `
                                <option value="${cat.name}">${cat.icon} ${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>البحث حسب الموقع</label>
                        <input type="text" id="searchLocation" placeholder="مثال: الجزائر، الجزائر العاصمة">
                    </div>
                    
                    <div class="form-group">
                        <label>البحث حسب المهارة</label>
                        <input type="text" id="searchSkill" placeholder="مثال: JavaScript, التصميم">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>مستوى الخبرة</label>
                            <select id="searchExperience">
                                <option value="">الكل</option>
                                <option value="beginner">مبتدئ</option>
                                <option value="intermediate">متوسط</option>
                                <option value="expert">خبير</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>سعر الساعة الأقصى</label>
                            <input type="number" id="maxPrice" placeholder="بالدينار">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary">بحث</button>
                </form>
            </div>
            
            <div class="form-section">
                <h2>الفئات المتاحة</h2>
                <div class="categories-grid" id="categoriesGrid">
                    ${this.categories.map(cat => `
                        <div class="category-card" data-category="${cat.name}">
                            <div class="category-icon">${cat.icon}</div>
                            <div class="category-name">${cat.name}</div>
                            <div class="category-description">${cat.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-section">
                <h2>نتائج البحث</h2>
                <div id="searchResults" class="talents-grid">
                    <div class="loading">جاري البحث...</div>
                </div>
            </div>
        `;
    }

    getMessagesContainer() {
        return `
            <div class="messages-container">
                <div class="messages-header">
                    <h3>الرسائل</h3>
                </div>
                <div class="messages-list" id="messagesList">
                    <div class="loading">جاري تحميل الرسائل...</div>
                </div>
            </div>
        `;
    }

    getSavedTalents() {
        return `
            <div class="form-section">
                <h2>المواهب المحفوظة</h2>
                <div id="savedTalentsList" class="talents-grid">
                    <div class="loading">جاري تحميل المواهب المحفوظة...</div>
                </div>
            </div>
        `;
    }

    setupProfileForm() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                full_name: document.getElementById('fullName').value,
                category: document.getElementById('category').value,
                location: document.getElementById('location').value,
                description: document.getElementById('description').value,
                experience_level: document.getElementById('experienceLevel').value,
                hourly_rate: parseFloat(document.getElementById('hourlyRate').value) || 0,
                availability: document.getElementById('availability').value
            };

            try {
                const { error } = await this.supabase
                    .from('user_profiles')
                    .update(formData)
                    .eq('id', this.currentUser.id);

                if (error) {
                    this.showNotification('حدث خطأ أثناء حفظ المعلومات');
                    return;
                }

                this.showNotification('تم حفظ المعلومات بنجاح');
                await this.loadUserData(); // إعادة تحميل البيانات
            } catch (error) {
                console.error('Error saving profile:', error);
                this.showNotification('حدث خطأ غير متوقع');
            }
        });
    }

    setupSkillsForm() {
        // إضافة مهارة جديدة
        const addSkillBtn = document.getElementById('addSkill');
        const newSkillInput = document.getElementById('newSkill');
        
        if (addSkillBtn && newSkillInput) {
            addSkillBtn.addEventListener('click', async () => {
                const skill = newSkillInput.value.trim();
                if (!skill) return;

                const currentSkills = this.userData.skills || [];
                if (currentSkills.includes(skill)) {
                    this.showNotification('المهارة موجودة بالفعل');
                    return;
                }

                const updatedSkills = [...currentSkills, skill];
                
                try {
                    const { error } = await this.supabase
                        .from('user_profiles')
                        .update({ skills: updatedSkills })
                        .eq('id', this.currentUser.id);

                    if (error) {
                        this.showNotification('حدث خطأ أثناء إضافة المهارة');
                        return;
                    }

                    this.showNotification('تم إضافة المهارة بنجاح');
                    newSkillInput.value = '';
                    await this.loadUserData();
                    this.setupSkillsForm(); // إعادة تحميل النموذج
                } catch (error) {
                    console.error('Error adding skill:', error);
                    this.showNotification('حدث خطأ غير متوقع');
                }
            });
        }

        // إضافة لغة جديدة
        const addLanguageBtn = document.getElementById('addLanguage');
        const newLanguageInput = document.getElementById('newLanguage');
        
        if (addLanguageBtn && newLanguageInput) {
            addLanguageBtn.addEventListener('click', async () => {
                const language = newLanguageInput.value.trim();
                if (!language) return;

                const currentLanguages = this.userData.languages || [];
                if (currentLanguages.includes(language)) {
                    this.showNotification('اللغة موجودة بالفعل');
                    return;
                }

                const updatedLanguages = [...currentLanguages, language];
                
                try {
                    const { error } = await this.supabase
                        .from('user_profiles')
                        .update({ languages: updatedLanguages })
                        .eq('id', this.currentUser.id);

                    if (error) {
                        this.showNotification('حدث خطأ أثناء إضافة اللغة');
                        return;
                    }

                    this.showNotification('تم إضافة اللغة بنجاح');
                    newLanguageInput.value = '';
                    await this.loadUserData();
                    this.setupSkillsForm();
                } catch (error) {
                    console.error('Error adding language:', error);
                    this.showNotification('حدث خطأ غير متوقع');
                }
            });
        }
    }

    setupPortfolioForm() {
        const form = document.getElementById('portfolioForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const socialLinks = {
                linkedin: document.getElementById('linkedin').value,
                twitter: document.getElementById('twitter').value,
                instagram: document.getElementById('instagram').value,
                github: document.getElementById('github').value
            };

            const formData = {
                portfolio_url: document.getElementById('portfolioUrl').value,
                social_links: socialLinks
            };

            try {
                const { error } = await this.supabase
                    .from('user_profiles')
                    .update(formData)
                    .eq('id', this.currentUser.id);

                if (error) {
                    this.showNotification('حدث خطأ أثناء حفظ معرض الأعمال');
                    return;
                }

                this.showNotification('تم حفظ معرض الأعمال بنجاح');
                await this.loadUserData();
            } catch (error) {
                console.error('Error saving portfolio:', error);
                this.showNotification('حدث خطأ غير متوقع');
            }
        });
    }

    setupSearchForm() {
        const form = document.getElementById('searchForm');
        const categoriesGrid = document.getElementById('categoriesGrid');
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.searchTalents();
            });
        }

        if (categoriesGrid) {
            categoriesGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.category-card');
                if (card) {
                    const category = card.dataset.category;
                    document.getElementById('searchCategory').value = category;
                    this.searchTalents();
                }
            });
        }

        // تحميل النتائج الأولية
        this.searchTalents();
    }

    async searchTalents() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '<div class="loading">جاري البحث...</div>';

        try {
            let query = this.supabase
                .from('user_profiles')
                .select('*')
                .eq('account_type', 'talent');

            // تطبيق فلاتر البحث
            const category = document.getElementById('searchCategory')?.value;
            const location = document.getElementById('searchLocation')?.value;
            const skill = document.getElementById('searchSkill')?.value;
            const experience = document.getElementById('searchExperience')?.value;
            const maxPrice = document.getElementById('maxPrice')?.value;

            if (category) {
                query = query.eq('category', category);
            }

            if (location) {
                query = query.ilike('location', `%${location}%`);
            }

            if (skill) {
                query = query.contains('skills', [skill]);
            }

            if (experience) {
                query = query.eq('experience_level', experience);
            }

            if (maxPrice) {
                query = query.lte('hourly_rate', parseFloat(maxPrice));
            }

            const { data, error } = await query.order('rating', { ascending: false });

            if (error) {
                console.error('Error searching talents:', error);
                resultsContainer.innerHTML = '<div class="empty-state"><h3>حدث خطأ في البحث</h3><p>يرجى المحاولة مرة أخرى</p></div>';
                return;
            }

            this.displaySearchResults(data || []);
        } catch (error) {
            console.error('Error searching talents:', error);
            resultsContainer.innerHTML = '<div class="empty-state"><h3>حدث خطأ في البحث</h3><p>يرجى المحاولة مرة أخرى</p></div>';
        }
    }

    displaySearchResults(talents) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (talents.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>لم يتم العثور على مواهب</h3>
                    <p>جرب تغيير معايير البحث</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = talents.map(talent => `
            <div class="talent-card">
                <div class="talent-header">
                    <div class="talent-name">${talent.full_name}</div>
                    <div class="talent-category">${talent.category}</div>
                </div>
                <div class="talent-body">
                    <div class="talent-info">
                        <div class="talent-info-item">
                            <strong>الموقع:</strong>
                            <span>${talent.location || 'غير محدد'}</span>
                        </div>
                        <div class="talent-info-item">
                            <strong>الخبرة:</strong>
                            <span>${this.getExperienceLevelText(talent.experience_level)}</span>
                        </div>
                        <div class="talent-info-item">
                            <strong>الساعة:</strong>
                            <span>${talent.hourly_rate || 0} دج</span>
                        </div>
                        <div class="talent-info-item">
                            <strong>التقييم:</strong>
                            <span>⭐ ${talent.rating || 0}</span>
                        </div>
                    </div>
                    <div class="talent-skills">
                        ${(talent.skills || []).slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                    <div class="talent-description">
                        ${talent.description ? talent.description.substring(0, 100) + '...' : 'لا يوجد وصف'}
                    </div>
                    <div class="talent-actions">
                        <button class="btn-contact" onclick="dashboardManager.contactTalent('${talent.id}')">تواصل</button>
                        <button class="btn-view" onclick="dashboardManager.viewTalent('${talent.id}')">عرض الملف</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadMessages() {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)')
                .or(`sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.currentUser.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading messages:', error);
                messagesList.innerHTML = '<div class="empty-state"><h3>حدث خطأ في تحميل الرسائل</h3></div>';
                return;
            }

            this.displayMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesList.innerHTML = '<div class="empty-state"><h3>حدث خطأ في تحميل الرسائل</h3></div>';
        }
    }

    displayMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        if (messages.length === 0) {
            messagesList.innerHTML = '<div class="empty-state"><h3>لا توجد رسائل</h3></div>';
            return;
        }

        messagesList.innerHTML = messages.map(message => {
            const isFromMe = message.sender_id === this.currentUser.id;
            const senderName = isFromMe ? 'أنت' : message.sender.full_name;
            const isRead = message.is_read || isFromMe;

            return `
                <div class="message-item ${!isRead ? 'unread' : ''}">
                    <div class="message-sender">${senderName} ${isFromMe ? '(إلى ' + message.receiver.full_name + ')' : '(إليك)'}</div>
                    <div class="message-text">${message.message}</div>
                    <div class="message-time">${new Date(message.created_at).toLocaleString('ar-SA')}</div>
                </div>
            `;
        }).join('');
    }

    async loadSavedTalents() {
        const savedTalentsList = document.getElementById('savedTalentsList');
        if (!savedTalentsList) return;

        savedTalentsList.innerHTML = '<div class="loading">جاري تحميل المواهب المحفوظة...</div>';

        // هذه الدالة ستحتاج لجدول saved_talents في قاعدة البيانات
        // حالياً سنعرض رسالة مؤقتة
        savedTalentsList.innerHTML = `
            <div class="empty-state">
                <h3>المواهب المحفوظة</h3>
                <p>سيتم إضافة هذه الميزة قريباً</p>
            </div>
        `;
    }

    async contactTalent(talentId) {
        const message = prompt('اكتب رسالتك:');
        if (!message) return;

        try {
            const { error } = await this.supabase
                .from('messages')
                .insert([{
                    sender_id: this.currentUser.id,
                    receiver_id: talentId,
                    message: message
                }]);

            if (error) {
                this.showNotification('حدث خطأ أثناء إرسال الرسالة');
                return;
            }

            this.showNotification('تم إرسال الرسالة بنجاح');
            this.loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('حدث خطأ غير متوقع');
        }
    }

    viewTalent(talentId) {
        // فتح صفحة الملف الشخصي للموهبة
        window.open(`talent-profile.html?id=${talentId}`, '_blank');
    }

    getExperienceLevelText(level) {
        const levels = {
            'beginner': 'مبتدئ',
            'intermediate': 'متوسط',
            'expert': 'خبير'
        };
        return levels[level] || level;
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error logging out:', error);
            this.showNotification('حدث خطأ أثناء تسجيل الخروج');
        }
    }

    showNotification(message) {
        // إزالة الإشعارات الموجودة
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });

        // إنشاء إشعار جديد
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

// تهيئة لوحة التحكم
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
});

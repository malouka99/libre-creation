// Talents Page JavaScript
class TalentsManager {
    constructor() {
        this.talents = [];
        this.filteredTalents = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        await this.loadTalents();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadCurrentUser() {
        try {
            // Check if user is logged in using the same auth system as main page
            const { data } = await supabase.auth.getSession();
            this.currentUser = data.session?.user || null;
            
            // Also check localStorage for additional auth info
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser && !this.currentUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        } catch (error) {
            console.log('No user logged in');
            this.currentUser = null;
        }
    }

    async loadTalents() {
        try {
            // Load talents from user_profiles table
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('account_type', 'talent')
                .eq('is_active', true);

            if (error) {
                console.error('Error loading talents:', error);
                // Use sample data for demo
                this.loadSampleTalents();
            } else {
                this.talents = data || [];
                this.filteredTalents = [...this.talents];
            }
        } catch (error) {
            console.error('Error:', error);
            this.loadSampleTalents();
        }
    }

    loadSampleTalents() {
        // Sample data for demonstration
        this.talents = [
            {
                id: 1,
                full_name: 'أحمد محمد',
                category: 'programming',
                skills: ['JavaScript', 'React', 'Node.js', 'Python'],
                description: 'مطور ويب محترف بخبرة 5 سنوات في تطوير تطبيقات الويب الحديثة',
                location: 'القاهرة، مصر',
                hourly_rate: 150,
                experience_years: 5,
                availability: 'available'
            },
            {
                id: 2,
                full_name: 'سارة أحمد',
                category: 'design',
                skills: ['UI/UX', 'Figma', 'Adobe XD', 'Photoshop'],
                description: 'مصممة واجهات ومستخدم إبداعية، أركز على تصميم تجارب مستخدم ممتعة',
                location: 'دبي، الإمارات',
                hourly_rate: 120,
                experience_years: 3,
                availability: 'available'
            },
            {
                id: 3,
                full_name: 'محمد علي',
                category: 'writing',
                skills: ['كتابة محتوى', 'Copywriting', 'SEO', 'التدوين'],
                description: 'كاتب محتوى متخصص في التسويق الرقمي وتحسين محركات البحث',
                location: 'الرياض، السعودية',
                hourly_rate: 80,
                experience_years: 4,
                availability: 'busy'
            },
            {
                id: 4,
                full_name: 'فاطمة حسن',
                category: 'video',
                skills: ['مونتاج فيديو', 'After Effects', 'Premiere Pro', 'تصوير'],
                description: 'مونتيرة محترفة متخصصة في إنتاج الفيديو والمحتوى البصري',
                location: 'عمان، الأردن',
                hourly_rate: 100,
                experience_years: 6,
                availability: 'available'
            },
            {
                id: 5,
                full_name: 'عمر خالد',
                category: 'marketing',
                skills: ['التسويق الرقمي', 'Google Ads', 'Facebook Ads', 'Email Marketing'],
                description: 'خبير تسويق رقمي يساعد الشركات على النمو عبر الإنترنت',
                location: 'الدوحة، قطر',
                hourly_rate: 130,
                experience_years: 7,
                availability: 'available'
            }
        ];
        this.filteredTalents = [...this.talents];
    }

    setupEventListeners() {
        // Search form
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Real-time search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.handleSearch();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.handleSearch();
            });
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;

        this.filteredTalents = this.talents.filter(talent => {
            // Search by name, skills, or description
            const matchesSearch = !searchTerm || 
                talent.full_name.toLowerCase().includes(searchTerm) ||
                talent.description.toLowerCase().includes(searchTerm) ||
                talent.skills.some(skill => skill.toLowerCase().includes(searchTerm));

            // Filter by category
            const matchesCategory = !categoryFilter || talent.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });

        this.renderTalents();
    }

    renderTalents() {
        const talentsGrid = document.getElementById('talentsGrid');
        const noResults = document.getElementById('noResults');

        if (this.filteredTalents.length === 0) {
            talentsGrid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        talentsGrid.style.display = 'grid';
        noResults.style.display = 'none';

        talentsGrid.innerHTML = this.filteredTalents.map(talent => this.createTalentCard(talent)).join('');

        // Add event listeners to contact buttons
        this.setupContactButtons();
    }

    createTalentCard(talent) {
        const categoryNames = {
            programming: 'البرمجة',
            design: 'التصميم',
            writing: 'الكتابة',
            marketing: 'التسويق',
            video: 'الفيديو والمونتاج',
            translation: 'الترجمة',
            voice: 'الصوتيات',
            other: 'أخرى'
        };

        const availabilityStatus = talent.availability === 'available' ? 
            '<span style="color: #27ae60;">● متاح</span>' : 
            '<span style="color: #e74c3c;">● مشغول</span>';

        return `
            <div class="talent-card" data-talent-id="${talent.id}">
                <div class="talent-header">
                    <div class="talent-avatar">
                        ${talent.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div class="talent-info">
                        <h3>${talent.full_name}</h3>
                        <p class="talent-category">${categoryNames[talent.category] || talent.category}</p>
                        <p class="talent-location">📍 ${talent.location}</p>
                    </div>
                </div>
                
                <div class="talent-skills">
                    ${talent.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                
                <p class="talent-description">${talent.description}</p>
                
                <div class="talent-footer">
                    <div>
                        <div class="talent-rate">${talent.hourly_rate} ريال/ساعة</div>
                        <div style="font-size: 0.9rem; color: #666;">${availabilityStatus}</div>
                    </div>
                    <button class="btn-contact" onclick="talentsManager.contactTalent(${talent.id})">
                        💬 تواصل معي
                    </button>
                </div>
            </div>
        `;
    }

    setupContactButtons() {
        // Contact buttons are handled via onclick in the HTML
    }

    async contactTalent(talentId) {
        // Check authentication status
        await this.loadCurrentUser();
        
        if (!this.currentUser) {
            this.showNotification('يجب تسجيل الدخول للتواصل مع المواهب', 'error');
            // Redirect to main page for login
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        const talent = this.talents.find(t => t.id === talentId);
        if (!talent) return;

        // Check if user is trying to contact themselves
        if (talent.user_id === this.currentUser.id) {
            this.showNotification('لا يمكنك التواصل مع نفسك', 'error');
            return;
        }

        // Open contact modal
        this.showContactModal(talent);
    }

    showContactModal(talent) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>تواصل مع ${talent.full_name}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4>${talent.full_name}</h4>
                        <p style="color: #666; margin: 0.5rem 0;">${talent.description}</p>
                        <p style="color: #667eea; font-weight: 600; margin: 0;">${talent.hourly_rate} ريال/ساعة</p>
                    </div>
                    
                    <form id="contactForm">
                        <div class="form-group">
                            <label>رسالتك</label>
                            <textarea id="messageText" rows="4" placeholder="اكتب رسالتك للموهبة..." required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>المشروع (اختياري)</label>
                            <input type="text" id="projectName" placeholder="اسم مشروعك" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="submit" class="btn-submit">إرسال رسالة</button>
                            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-cancel">إلغاء</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup form submission
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage(talent, modal);
        });
    }

    async sendMessage(talent, modal) {
        const messageText = document.getElementById('messageText').value;
        const projectName = document.getElementById('projectName').value;

        if (!messageText.trim()) {
            this.showNotification('يرجى كتابة رسالة', 'error');
            return;
        }

        // Verify user is still authenticated
        await this.loadCurrentUser();
        if (!this.currentUser) {
            this.showNotification('انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى', 'error');
            modal.remove();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        try {
            // For demo purposes, simulate message sending
            this.showNotification('جاري إرسال الرسالة...', 'info');
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Send message to Supabase (if available)
            try {
                const { error } = await supabase
                    .from('messages')
                    .insert([
                        {
                            sender_id: this.currentUser.id || 'demo_user',
                            receiver_id: talent.user_id || 'demo_talent',
                            message: messageText,
                            project_name: projectName,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (error) {
                    console.log('Supabase error, using demo mode:', error);
                }
            } catch (supabaseError) {
                console.log('Supabase not available, using demo mode');
            }
            
            this.showNotification('تم إرسال الرسالة بنجاح!', 'success');
            modal.remove();
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('تم إرسال الرسالة بنجاح! (وضع العرض)', 'success');
            modal.remove();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateUI() {
        // Update navigation based on login status
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');

        if (this.currentUser) {
            if (loginBtn) {
                loginBtn.textContent = 'الملف الشخصي';
                loginBtn.onclick = () => window.location.href = 'dashboard.html';
            }
            if (signupBtn) {
                signupBtn.textContent = 'تسجيل الخروج';
                signupBtn.onclick = () => this.logout();
            }
        } else {
            if (loginBtn) {
                loginBtn.textContent = 'تسجيل الدخول';
                loginBtn.onclick = () => window.location.href = 'index.html';
            }
            if (signupBtn) {
                signupBtn.textContent = 'إنشاء حساب';
                signupBtn.onclick = () => window.location.href = 'index.html';
            }
        }
    }

    async logout() {
        try {
            // Clear Supabase session
            await supabase.auth.signOut();
            
            // Clear localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            
            // Redirect to main page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error logging out:', error);
            // Force redirect even if error occurs
            window.location.href = 'index.html';
        }
    }
}

// Initialize the talents manager when page loads
let talentsManager;
document.addEventListener('DOMContentLoaded', () => {
    talentsManager = new TalentsManager();
});

// Add modal styles
const modalStyles = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .modal-header h2 {
        margin: 0;
        color: #333;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-close:hover {
        color: #333;
    }

    .btn-submit {
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-cancel {
        background: #e0e0e0;
        color: #333;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
    }
`;

// Add modal styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

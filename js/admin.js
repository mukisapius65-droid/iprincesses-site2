// Admin Panel for Database Management
class AdminPanel {
    constructor() {
        this.db = princessDB;
        this.init();
    }

    async init() {
        // Wait for database to be ready
        setTimeout(() => {
            this.setupEventListeners();
        }, 1000);
    }

    setupEventListeners() {
        // Admin button (you can add this to your header)
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.showAdminPanel());
        }
    }

    // Show admin panel modal
    showAdminPanel() {
        if (!this.checkAdminAccess()) {
            alert('Admin access required');
            return;
        }

        this.createAdminModal();
    }

    // Check if user has admin access (basic check)
    checkAdminAccess() {
        // In production, this would check user role from database
        return localStorage.getItem('admin_access') === 'true' || 
               prompt('Enter admin password:') === 'iprincesses2023';
    }

    // Create admin modal
    async createAdminPanel() {
        const stats = await this.db.getStatistics();
        
        const adminHTML = `
            <div class="modal" id="admin-modal">
                <div class="modal-content" style="max-width: 800px;">
                    <span class="close-modal" id="close-admin">&times;</span>
                    <h2 class="modal-title">Admin Panel</h2>
                    
                    <div class="admin-stats">
                        <div class="stat-card">
                            <h3>${stats.totalPrincesses}</h3>
                            <p>Total Princesses</p>
                        </div>
                        <div class="stat-card">
                            <h3>${stats.availablePrincesses}</h3>
                            <p>Available</p>
                        </div>
                        <div class="stat-card">
                            <h3>${stats.totalUsers}</h3>
                            <p>Total Users</p>
                        </div>
                        <div class="stat-card">
                            <h3>UGX ${stats.revenue}</h3>
                            <p>Revenue</p>
                        </div>
                    </div>

                    <div class="admin-actions">
                        <button class="btn btn-primary" onclick="adminPanel.exportData()">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                        <button class="btn btn-outline" onclick="adminPanel.importData()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-danger" onclick="adminPanel.clearData()">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>

                    <div class="add-princess-form">
                        <h3>Add New Princess</h3>
                        <form id="add-princess-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Name</label>
                                    <input type="text" id="princess-name" required>
                                </div>
                                <div class="form-group">
                                    <label>Age</label>
                                    <input type="number" id="princess-age" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Location</label>
                                <input type="text" id="princess-location" required>
                            </div>
                            <div class="form-group">
                                <label>Services (comma separated)</label>
                                <input type="text" id="princess-services" placeholder="Dinner Dates, Travel Companion, Events">
                            </div>
                            <div class="form-group">
                                <label>Remark</label>
                                <textarea id="princess-remark" required></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Phone</label>
                                    <input type="tel" id="princess-phone" required>
                                </div>
                                <div class="form-group">
                                    <label>Status</label>
                                    <select id="princess-status">
                                        <option value="available">Available</option>
                                        <option value="unavailable">Unavailable</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">Add Princess</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', adminHTML);
        this.setupAdminEventListeners();
        document.getElementById('admin-modal').style.display = 'flex';
    }

    setupAdminEventListeners() {
        // Close admin modal
        document.getElementById('close-admin').addEventListener('click', () => {
            document.getElementById('admin-modal').remove();
        });

        // Add princess form
        document.getElementById('add-princess-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewPrincess();
        });

        // Close on outside click
        document.getElementById('admin-modal').addEventListener('click', (e) => {
            if (e.target.id === 'admin-modal') {
                document.getElementById('admin-modal').remove();
            }
        });
    }

    // Add new princess from admin panel
    async addNewPrincess() {
        const formData = {
            name: document.getElementById('princess-name').value,
            age: parseInt(document.getElementById('princess-age').value),
            location: document.getElementById('princess-location').value,
            services: document.getElementById('princess-services').value.split(',').map(s => s.trim()),
            remark: document.getElementById('princess-remark').value,
            phone: document.getElementById('princess-phone').value,
            status: document.getElementById('princess-status').value,
            daysLeft: document.getElementById('princess-status').value === 'available' ? 7 : 0,
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
            shy: false,
            verified: true,
            rating: 4.5
        };

        try {
            await this.db.addPrincess(formData);
            this.showSuccess('Princess added successfully!');
            document.getElementById('add-princess-form').reset();
            
            // Refresh the princess display
            if (window.princessManager) {
                await princessManager.loadPrincesses();
            }
        } catch (error) {
            this.showError('Failed to add princess: ' + error);
        }
    }

    // Export data
    async exportData() {
        try {
            const data = await this.db.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `iprincesses-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showSuccess('Data exported successfully!');
        } catch (error) {
            this.showError('Export failed: ' + error);
        }
    }

    // Import data
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const success = await this.db.importData(data);
                    
                    if (success) {
                        this.showSuccess('Data imported successfully!');
                        // Refresh data
                        if (window.princessManager) {
                            await princessManager.loadPrincesses();
                        }
                    } else {
                        this.showError('Import failed');
                    }
                } catch (error) {
                    this.showError('Invalid file format');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Clear all data (with confirmation)
    async clearData() {
        if (confirm('⚠️ WARNING: This will delete ALL data including princesses, users, and payments. This action cannot be undone. Are you sure?')) {
            if (confirm('Type "DELETE ALL" to confirm:')) {
                try {
                    await this.db.clearDatabase();
                    this.showSuccess('All data cleared successfully!');
                    // Refresh
                    if (window.princessManager) {
                        await princessManager.loadPrincesses();
                    }
                } catch (error) {
                    this.showError('Failed to clear data: ' + error);
                }
            }
        }
    }

    // Utility functions
    showSuccess(message) {
        alert('✅ ' + message); // Replace with better notification
    }

    showError(message) {
        alert('❌ ' + message); // Replace with better notification
    }
}

// Create global admin panel instance
const adminPanel = new AdminPanel();

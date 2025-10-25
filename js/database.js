// Database Management System for Princesses
class PrincessDatabase {
    constructor() {
        this.dbName = 'iPrincessesDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject('Database error');
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create princesses object store
                if (!db.objectStoreNames.contains('princesses')) {
                    const princessStore = db.createObjectStore('princesses', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Create indexes for efficient searching
                    princessStore.createIndex('name', 'name', { unique: false });
                    princessStore.createIndex('location', 'location', { unique: false });
                    princessStore.createIndex('status', 'status', { unique: false });
                    princessStore.createIndex('services', 'services', { unique: false, multiEntry: true });
                    princessStore.createIndex('age', 'age', { unique: false });
                }

                // Create users object store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    userStore.createIndex('phone', 'phone', { unique: true });
                    userStore.createIndex('name', 'name', { unique: false });
                }

                // Create payments object store
                if (!db.objectStoreNames.contains('payments')) {
                    const paymentStore = db.createObjectStore('payments', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    paymentStore.createIndex('userId', 'userId', { unique: false });
                    paymentStore.createIndex('status', 'status', { unique: false });
                    paymentStore.createIndex('date', 'date', { unique: false });
                }

                console.log('Database setup complete');
            };
        });
    }

    // PRINCESSES CRUD OPERATIONS

    // Add a new princess
    async addPrincess(princessData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['princesses'], 'readwrite');
            const store = transaction.objectStore('princesses');
            
            // Add timestamp
            princessData.createdAt = new Date().toISOString();
            princessData.updatedAt = new Date().toISOString();
            
            const request = store.add(princessData);

            request.onsuccess = () => {
                console.log('Princess added successfully:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error adding princess:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all princesses
    async getAllPrincesses() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['princesses'], 'readonly');
            const store = transaction.objectStore('princesses');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get princess by ID
    async getPrincess(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['princesses'], 'readonly');
            const store = transaction.objectStore('princesses');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Update princess
    async updatePrincess(id, updates) {
        return new Promise(async (resolve, reject) => {
            // First get the existing princess
            const existingPrincess = await this.getPrincess(id);
            if (!existingPrincess) {
                reject('Princess not found');
                return;
            }

            const transaction = this.db.transaction(['princesses'], 'readwrite');
            const store = transaction.objectStore('princesses');
            
            // Merge updates and update timestamp
            const updatedPrincess = {
                ...existingPrincess,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(updatedPrincess);

            request.onsuccess = () => {
                console.log('Princess updated successfully:', id);
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Delete princess
    async deletePrincess(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['princesses'], 'readwrite');
            const store = transaction.objectStore('princesses');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Princess deleted successfully:', id);
                resolve(true);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // SEARCH AND FILTER OPERATIONS

    // Search princesses by multiple criteria
    async searchPrincesses(searchTerm) {
        const allPrincesses = await this.getAllPrincesses();
        
        return allPrincesses.filter(princess => {
            const searchLower = searchTerm.toLowerCase();
            
            return (
                princess.name.toLowerCase().includes(searchLower) ||
                princess.location.toLowerCase().includes(searchLower) ||
                princess.remark.toLowerCase().includes(searchLower) ||
                princess.services.some(service => 
                    service.toLowerCase().includes(searchLower)
                )
            );
        });
    }

    // Filter princesses by status
    async filterPrincessesByStatus(status) {
        if (status === 'all') {
            return this.getAllPrincesses();
        }

        const allPrincesses = await this.getAllPrincesses();
        return allPrincesses.filter(princess => princess.status === status);
    }

    // Filter princesses by location
    async filterPrincessesByLocation(location) {
        const allPrincesses = await this.getAllPrincesses();
        return allPrincesses.filter(princess => 
            princess.location.toLowerCase().includes(location.toLowerCase())
        );
    }

    // Filter princesses by services
    async filterPrincessesByServices(services) {
        const allPrincesses = await this.getAllPrincesses();
        return allPrincesses.filter(princess => 
            services.every(service => 
                princess.services.includes(service)
            )
        );
    }

    // Get princesses with pagination
    async getPrincessesPaginated(page = 1, limit = 12) {
        const allPrincesses = await this.getAllPrincesses();
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
            princesses: allPrincesses.slice(startIndex, endIndex),
            total: allPrincesses.length,
            page,
            totalPages: Math.ceil(allPrincesses.length / limit),
            hasNext: endIndex < allPrincesses.length,
            hasPrev: page > 1
        };
    }

    // USER MANAGEMENT

    // Add user
    async addUser(userData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            userData.createdAt = new Date().toISOString();
            userData.updatedAt = new Date().toISOString();
            
            const request = store.add(userData);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get user by phone
    async getUserByPhone(phone) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('phone');
            const request = index.get(phone);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Update user
    async updateUser(id, updates) {
        return new Promise(async (resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const user = await this.getUser(id);
            if (!user) {
                reject('User not found');
                return;
            }

            const updatedUser = {
                ...user,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(updatedUser);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get user by ID
    async getUser(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // PAYMENT MANAGEMENT

    // Add payment record
    async addPayment(paymentData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['payments'], 'readwrite');
            const store = transaction.objectStore('payments');
            
            paymentData.date = new Date().toISOString();
            paymentData.createdAt = new Date().toISOString();
            
            const request = store.add(paymentData);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get user payments
    async getUserPayments(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['payments'], 'readonly');
            const store = transaction.objectStore('payments');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // STATISTICS

    // Get database statistics
    async getStatistics() {
        const [princesses, users, payments] = await Promise.all([
            this.getAllPrincesses(),
            this.getAllUsers(),
            this.getAllPayments()
        ]);

        return {
            totalPrincesses: princesses.length,
            availablePrincesses: princesses.filter(p => p.status === 'available').length,
            totalUsers: users.length,
            totalPayments: payments.length,
            revenue: payments.filter(p => p.status === 'completed')
                          .reduce((sum, payment) => sum + (payment.amount || 0), 0)
        };
    }

    // Get all users
    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get all payments
    async getAllPayments() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['payments'], 'readonly');
            const store = transaction.objectStore('payments');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // DATA EXPORT/IMPORT

    // Export all data
    async exportData() {
        const [princesses, users, payments] = await Promise.all([
            this.getAllPrincesses(),
            this.getAllUsers(),
            this.getAllPayments()
        ]);

        return {
            princesses,
            users,
            payments,
            exportDate: new Date().toISOString(),
            version: this.version
        };
    }

    // Import data
    async importData(data) {
        try {
            // Import princesses
            if (data.princesses && Array.isArray(data.princesses)) {
                for (const princess of data.princesses) {
                    await this.addPrincess(princess);
                }
            }

            // Import users
            if (data.users && Array.isArray(data.users)) {
                for (const user of data.users) {
                    await this.addUser(user);
                }
            }

            // Import payments
            if (data.payments && Array.isArray(data.payments)) {
                for (const payment of data.payments) {
                    await this.addPayment(payment);
                }
            }

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    // Clear all data (use with caution!)
    async clearDatabase() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                ['princesses', 'users', 'payments'], 
                'readwrite'
            );

            transaction.objectStore('princesses').clear();
            transaction.objectStore('users').clear();
            transaction.objectStore('payments').clear();

            transaction.oncomplete = () => {
                console.log('Database cleared successfully');
                resolve(true);
            };

            transaction.onerror = () => {
                reject('Failed to clear database');
            };
        });
    }
}

// Create global database instance
const princessDB = new PrincessDatabase();

// Sample data for initial population
const samplePrincesses = [
    {
        name: "Sophia",
        age: 24,
        location: "Kampala",
        services: ["Dinner Dates", "Travel Companion", "Events"],
        remark: "Elegant and charming with a passion for art and travel",
        phone: "+256703055329",
        daysLeft: 5,
        status: "available",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
        shy: false,
        verified: true,
        rating: 4.8
    },
    {
        name: "Isabella",
        age: 22,
        location: "Entebbe",
        services: ["Weekend Getaways", "Social Events", "Business Dinners"],
        remark: "Adventurous soul with a love for nature and photography",
        phone: "+256703055329",
        daysLeft: 0,
        status: "expired",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        shy: true,
        verified: true,
        rating: 4.5
    },
    {
        name: "Emma",
        age: 26,
        location: "Jinja",
        services: ["Music Events", "Dance Parties", "Cultural Tours"],
        remark: "Creative spirit with a passion for music and dance",
        phone: "+256703055329",
        daysLeft: 3,
        status: "available",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=688&q=80",
        shy: false,
        verified: true,
        rating: 4.9
    },
    {
        name: "Olivia",
        age: 28,
        location: "Mbarara",
        services: ["Intellectual Conversations", "Book Clubs", "Museum Tours"],
        remark: "Intellectual beauty with a love for literature and philosophy",
        phone: "+256703055329",
        daysLeft: 15,
        status: "unavailable",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80",
        shy: true,
        verified: false,
        rating: 4.7
    }
];

// Initialize database with sample data
async function initializeDatabase() {
    try {
        await princessDB.init();
        
        // Check if we need to add sample data
        const existingPrincesses = await princessDB.getAllPrincesses();
        if (existingPrincesses.length === 0) {
            console.log('Adding sample princess data...');
            for (const princess of samplePrincesses) {
                await princessDB.addPrincess(princess);
            }
            console.log('Sample data added successfully');
        }
        
        return princessDB;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

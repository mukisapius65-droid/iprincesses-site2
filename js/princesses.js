// Princesses Management with Database Integration
class PrincessManager {
    constructor() {
        this.db = null;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.init();
    }

    async init() {
        try {
            this.db = await initializeDatabase();
            await this.loadPrincesses();
        } catch (error) {
            console.error('Princess manager initialization failed:', error);
        }
    }

    // Load princesses from database
    async loadPrincesses(filter = 'all', searchTerm = '') {
        try {
            let princesses;
            
            if (searchTerm) {
                princesses = await this.db.searchPrincesses(searchTerm);
            } else if (filter !== 'all') {
                princesses = await this.db.filterPrincessesByStatus(filter);
            } else {
                princesses = await this.db.getAllPrincesses();
            }

            this.renderPrincesses(princesses);
            return princesses;
        } catch (error) {
            console.error('Error loading princesses:', error);
            this.showError('Failed to load princesses');
            return [];
        }
    }

    // Load princesses with pagination
    async loadPrincessesPaginated(page = 1) {
        try {
            const result = await this.db.getPrincessesPaginated(page, this.itemsPerPage);
            this.renderPrincesses(result.princesses);
            this.renderPagination(result);
            return result;
        } catch (error) {
            console.error('Error loading paginated princesses:', error);
            this.showError('Failed to load princesses');
        }
    }

    // Render princesses to the page
    renderPrincesses(princessesToRender) {
        const container = document.getElementById('princesses-container');
        if (!container) return;

        if (princessesToRender.length === 0) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No princesses found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = princessesToRender.map(princess => this.createPrincessCard(princess)).join('');
    }

    // Render pagination controls
    renderPagination(paginationData) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;

        if (paginationData.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="pagination">
                <button class="btn btn-outline ${!paginationData.hasPrev ? 'disabled' : ''}" 
                        onclick="princessManager.previousPage()" 
                        ${!paginationData.hasPrev ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                
                <div class="page-info">
                    Page ${paginationData.page} of ${paginationData.totalPages}
                </div>
                
                <button class="btn btn-outline ${!paginationData.hasNext ? 'disabled' : ''}" 
                        onclick="princessManager.nextPage()" 
                        ${!paginationData.hasNext ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // Next page
    async nextPage() {
        this.currentPage++;
        await this.loadPrincessesPaginated(this.currentPage);
    }

    // Previous page
    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadPrincessesPaginated(this.currentPage);
        }
    }

    // Create princess card HTML (enhanced with database data)
    createPrincessCard(princess) {
        const timeColor = princess.daysLeft <= 3 ? 'var(--danger)' : 'var(--warning)';
        const statusClass = `status-${princess.status}`;
        const statusText = princess.status.charAt(0).toUpperCase() + princess.status.slice(1);
        
        const displayPhone = princess.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        const servicesHTML = princess.services.map(service => 
            `<span class="service-tag">${service}</span>`
        ).join('');

        const verifiedBadge = princess.verified ? 
            '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : '';

        const ratingStars = this.generateRatingStars(princess.rating || 4.5);

        return `
            <div class="princess-card" data-id="${princess.id}" data-status="${princess.status}">
                ${verifiedBadge}
                <div class="princess-status ${statusClass}">${statusText}</div>
                
                <div class="princess-img-container">
                    <img src="${princess.image}" alt="${princess.name}" class="princess-img" 
                         onerror="this.src='https://via.placeholder.com/300x400/667eea/ffffff?text=iPrincess'">
                    ${princess.shy ? `
                        <div class="face-cover">
                            <div class="face-cover-logo">iP</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="princess-info">
                    <div class="princess-name">
                        ${princess.name}
                        <span class="princess-age">${princess.age}</span>
                    </div>
                    
                    <div class="princess-location">
                        <i class="fas fa-map-marker-alt"></i> ${princess.location}
                    </div>
                    
                    <div class="princess-rating">
                        ${ratingStars}
                        <span class="rating-value">${princess.rating || 4.5}</span>
                    </div>
                    
                    <p class="princess-remark">${princess.remark}</p>
                    
                    <div class="princess-services">
                        <div class="services-title">Services:</div>
                        <div class="services-list">${servicesHTML}</div>
                    </div>
                    
                    <div class="princess-contact">
                        ${princess.status === "available" ? `
                            <div class="princess-phone">
                                <i class="fas fa-phone"></i> ${displayPhone}
                                <div class="contact-options">
                                    <a href="https://wa.me/${princess.phone.replace('+', '')}" 
                                       class="contact-option whatsapp" target="_blank">
                                        <i class="fab fa-whatsapp"></i> WhatsApp
                                    </a>
                                    <a href="tel:${princess.phone}" class="contact-option call">
                                        <i class="fas fa-phone"></i> Call Now
                                    </a>
                                    <button class="contact-option report" onclick="princessManager.reportPrincess(${princess.id})">
                                        <i class="fas fa-flag"></i> Report
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <span class="princess-phone" style="color: var(--danger)">Not Available</span>
                        `}
                        
                        ${princess.status !== "expired" ? `
                            <span class="princess-time" style="color: ${timeColor}">
                                ${princess.daysLeft} days left
                            </span>
                        ` : `
                            <span class="princess-time" style="color: var(--danger)">Expired</span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    // Filter princesses
    async filterPrincesses(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        await this.loadPrincesses(filter, this.currentSearch);
    }

    // Search princesses
    async searchPrincesses(query) {
        this.currentSearch = query;
        this.currentPage = 1;
        await this.loadPrincesses(this.currentFilter, query);
    }

    // Report princess
    async reportPrincess(princessId) {
        const princess = await this.db.getPrincess(princessId);
        if (!princess) return;

        const reason = prompt(`Report ${princess.name} for:\n1. Fake Profile\n2. Inappropriate Behavior\n3. Safety Concern\n4. Other\n\nPlease specify reason:`);
        
        if (reason) {
            // In production, this would be saved to the database
            console.log(`Report submitted for ${princess.name}: ${reason}`);
            this.showSuccessMessage('Thank you for your report. We will review it within 24 hours.');
        }
    }

    // Utility functions
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    showError(message) {
        alert(message); // Replace with better error UI
    }
}

// Create global princess manager instance
const princessManager = new PrincessManager();

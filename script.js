// Configuration - Update these with your actual values
const CONFIG = {
    apiUrl: 'https://product-scan-backend-production.up.railway.app/api',
    // apiUrl: 'http://localhost:3000/api',

    // You'll need to set these in your backend .env file
};

// DOM Elements
const form = document.getElementById('skincare-form');
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photo-preview');
const submitBtn = document.getElementById('submit-btn');
const formSection = document.getElementById('form-section');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const productGrid = document.getElementById('product-grid');
const backToFormBtn = document.getElementById('back-to-form-btn');
const suggestionToggleBtn = document.getElementById('suggestion-toggle-btn');
const suggestionCanvas = document.getElementById('suggestion-canvas');
const suggestionContent = document.getElementById('suggestion-content');

// State
let uploadedImageData = null;
const DEFAULT_SUGGESTIONS = [
    "Incorporate more leafy greens and omega-3 rich foods like salmon into your diet to help reduce inflammation.",
    "Drink at least 8 glasses of water daily to maintain skin hydration and balance oil production.",
    "Limit dairy and high-glycemic foods which can exacerbate acne and oiliness."
];

const analysisPanel = document.getElementById('analysis-panel');

// Photo Preview Handler
photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
        photoPreview.innerHTML = `<img src="${event.target.result}" alt="Face selfie preview">`;
        photoPreview.classList.add('has-image');
        uploadedImageData = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Convert condition checkboxes into pill-style toggles
function initConditionPills() {
    const items = document.querySelectorAll('.checkbox-item');
    items.forEach(item => {
        const input = item.querySelector('input[type="checkbox"]');
        // initialize active class
        if (input && input.checked) item.classList.add('active');

        // Make pill focusable and accessible
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-pressed', input && input.checked ? 'true' : 'false');

        // Handle click on the label/pill
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (!input) return;
            input.checked = !input.checked;
            item.classList.toggle('active', input.checked);
            item.setAttribute('aria-pressed', input.checked ? 'true' : 'false');
        });

        // Keyboard toggle (Space / Enter)
        item.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
                e.preventDefault();
                item.click();
            }
        });

        // Keep classes in sync if input changes programmatically
        if (input) {
            input.addEventListener('change', () => {
                item.classList.toggle('active', input.checked);
            });
        }
    });
}

// Initialize pills on load
initConditionPills();

// Dummy products removed — backend-driven data expected

// Form Submit Handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const conditions = Array.from(document.querySelectorAll('input[name="conditions"]:checked'))
        .map(cb => cb.value);

    const budget = document.getElementById('budget').value;
    const description = document.getElementById('description').value;

    // Validation
    if (conditions.length === 0) {
        alert('Please select at least one skin condition');
        return;
    }

    if (!uploadedImageData) {
        alert('Please upload a face selfie');
        return;
    }

    // Show loading state
    formSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    productGrid.innerHTML = '';
    showSkeletons(6);
    submitBtn.disabled = true;

    try {
        // Call backend API
        const response = await fetch(`${CONFIG.apiUrl}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: uploadedImageData,
                conditions,
                budget,
                description
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to analyze skin and fetch products');
        }

        const data = await response.json();

        // Display analysis and results
        loadingSection.classList.add('hidden');
        displayAnalysis(data.skinAnalysis || {}, data.suggestions || DEFAULT_SUGGESTIONS);
        displayProducts(data.products || []);
        // Show suggestion toggle and populate with observations, recommendations, and suggestions
        if (suggestionToggleBtn) {
            suggestionToggleBtn.classList.remove('hidden');
            populateSuggestionCanvas(data.skinAnalysis || {}, data.suggestions || DEFAULT_SUGGESTIONS);
        }
        submitBtn.disabled = false;

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Error:', error);
        showResultsMessage(`An error occurred: ${error.message}. Please ensure backend is running and CORS is configured.`, 'error');
    }
});

// Display Products in Grid
function displayProducts(products) {
    if (!products || products.length === 0) {
        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No matching products found. Try adjusting your criteria.</p>';
        resultsSection.classList.remove('hidden');
        document.querySelector('header').classList.add('hidden');
        return;
    }

    productGrid.innerHTML = products.map(product => createProductCard(product)).join('');

    // Show results section, hide header
    resultsSection.classList.remove('hidden');
    document.querySelector('header').classList.add('hidden');

    // Add event listeners for wishlist and cart buttons
    attachProductEventListeners();
}

// Render skeleton placeholders
function showSkeletons(count = 6) {
    const skeletons = Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-line long"></div>
            <div class="skeleton-line med"></div>
            <div class="skeleton-line short"></div>
        </div>
    `).join('');

    productGrid.innerHTML = skeletons;
}

// Show a message inside the results section (used for errors and informational states)
function showResultsMessage(message, type = 'info') {
    // Ensure loading is hidden and results visible
    loadingSection.classList.add('hidden');
    formSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    submitBtn.disabled = false;

    const color = type === 'error' ? 'var(--error)' : 'var(--text-secondary)';
    productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <p style="font-size: 1.05rem; color: ${color}; margin-bottom: 0.5rem;">${message}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">You can click "Analyze Again" to retry or adjust your inputs.</p>
        </div>
    `;

    // Scroll into view for the user
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Analysis panel no longer needed - all content moved to sidebar
// Keeping function stub for compatibility
function displayAnalysis(skinAnalysis = {}, suggestions = []) {
    // Rendering moved entirely to suggestion canvas
}

// Suggestion off-canvas controls
function openSuggestionCanvas() {
    if (!suggestionCanvas) return;
    suggestionCanvas.classList.add('open');
    suggestionCanvas.setAttribute('aria-hidden', 'false');
    suggestionToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeSuggestionCanvas() {
    if (!suggestionCanvas) return;
    suggestionCanvas.classList.remove('open');
    suggestionCanvas.setAttribute('aria-hidden', 'true');
    suggestionToggleBtn.setAttribute('aria-expanded', 'false');
}

function populateSuggestionCanvas(skinAnalysis = {}, suggestions = []) {
    if (!suggestionContent) return;

    let html = '';

    // Render observations
    const observations = skinAnalysis.observations || [];
    if (Array.isArray(observations) && observations.length > 0) {
        html += `
            <div class="suggestion-item">
                <div class="title">Skin Observations</div>
                <p>${observations.join(', ')}</p>
                <div class="divider"></div>
            </div>
        `;
    }

    // Render recommendations
    const recommendations = skinAnalysis.recommendations || [];
    if (Array.isArray(recommendations) && recommendations.length > 0) {
        html += `
            <div class="suggestion-item">
                <div class="title">Recommendations</div>
                <p>${recommendations.join(', ')}</p>
                <div class="divider"></div>
            </div>
        `;
    }

    // Render suggestions
    if (!suggestions || suggestions.length === 0) {
        html += '<p style="color:var(--text-secondary)">No suggestions available.</p>';
    } else {
        // sanitize suggestion strings (remove code fences and stray JSON fragments)
        const sanitize = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/```/g, '')
                .replace(/[{}]/g, '')
                .replace(/^"|"$/g, '')
                .replace(/\,$/, '')
                .trim();
        };

        const clean = suggestions.map(sanitize).filter(s => s.length > 0);

        html += clean.map((s, idx) => `
            <div class="suggestion-item" data-idx="${idx}">
                <div class="title">Tips ${idx + 1}</div>
                <p>${s}</p>
                <div class="divider"></div>
            </div>
        `).join('');
    }

    suggestionContent.innerHTML = html;
}

// Wire up toggle button and close handlers (delegated for backdrop)
if (suggestionToggleBtn) {
    suggestionToggleBtn.addEventListener('click', () => openSuggestionCanvas());
}

document.addEventListener('click', (e) => {
    // close when clicking any element with data-suggestion-close attribute
    if (e.target.matches('[data-suggestion-close]') || e.target.closest('[data-suggestion-close]')) {
        closeSuggestionCanvas();
    }
});

// Create Product Card HTML
function createProductCard(product) {
    // Handle product image - support both old (objects with src) and new (direct URLs) formats
    let imageUrl = 'https://via.placeholder.com/300x300?text=No+Image';
    if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
            imageUrl = firstImage;
        } else if (firstImage.src) {
            imageUrl = firstImage.src;
        }
    } else if (product.image) {
        imageUrl = product.image;
    }
    
    // Get product link - support multiple field names
    const productLink = product.info_url || product.permalink || product.url || '#';
    
    // Get product name - support both 'title' and 'name'
    const productName = product.title || product.name || 'Unknown Product';
    
    // Format price for Philippine Peso
    let price = 'N/A';
    if (product.price) {
        const p = parseFloat(product.price);
        if (!Number.isNaN(p)) {
            price = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(p);
        }
    }

    const matchScore = product.matchScore ? `${Math.round(product.matchScore)}% Match` : 'Recommended';
    
    // Handle category
    let category = 'Skincare';
    if (product.categories && product.categories.length > 0) {
        category = typeof product.categories[0] === 'string' 
            ? product.categories[0] 
            : product.categories[0].name;
    } else if (product.category) {
        category = product.category;
    }
    
    // Handle ingredients - could be array or string
    let ingredients = 'No ingredients listed';
    if (product.ingredients) {
        if (Array.isArray(product.ingredients)) {
            // Clean up ingredients - remove quotes if present
            const cleanIngredients = product.ingredients.map(ing => typeof ing === 'string' ? ing.replace(/["']/g, '').trim() : ing).filter(ing => ing);
            ingredients = cleanIngredients.slice(0, 3).join(', ') + (cleanIngredients.length > 3 ? '...' : '');
        } else if (typeof product.ingredients === 'string') {
            const ingArray = product.ingredients.split(',').map(i => i.trim().replace(/["']/g, '')).filter(i => i);
            ingredients = ingArray.slice(0, 3).join(', ') + (ingArray.length > 3 ? '...' : '');
        }
    }

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-badge">${matchScore}</div>
            <div class="product-image-wrapper">
                <a href="${productLink}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; height: 100%; cursor: pointer;">
                    <img src="${imageUrl}" alt="${productName}" class="product-image" loading="lazy">
                </a>
                <button class="btn-wishlist-icon" data-product-id="${product.id}" title="Add to Wishlist">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="product-content">
                <div class="product-header">
                    <h3 class="product-title">
                        <a href="${productLink}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${productName}</a>
                    </h3>
                    <div class="product-match">${matchScore}</div>
                </div>
                <div class="product-price">${price}</div>
                <div class="product-category">${category}</div>
                <div class="product-ingredients">
                    <strong>Key Ingredients:</strong> ${ingredients}
                </div>
                <button class="btn-cart" data-product-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Product Buttons
function attachProductEventListeners() {
    // Add to Cart buttons
    document.querySelectorAll('.btn-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = e.target.dataset.productId || e.target.closest('.btn-cart').dataset.productId;
            await addToCart(productId);
        });
    });

    // Wishlist icon buttons
    document.querySelectorAll('.btn-wishlist-icon').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const productId = e.target.closest('.btn-wishlist-icon').dataset.productId;
            await toggleWishlist(productId, e.target.closest('.btn-wishlist-icon'));
        });
    });

    // Quick view: click image to open modal
    document.querySelectorAll('.product-image').forEach(img => {
        img.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const id = card.dataset.productId;
            // find product data from DOM (assuming product info exists in dataset) - fallback: fetch from server
            openQuickView(card);
        });
    });
}

// Add to Cart Function
async function addToCart(productId) {
    // For now, just show success (dummy functionality)
    showNotification('Product added to cart!', 'success');

    // In production, you would call the API:
    /*
    try {
        const response = await fetch(`${CONFIG.apiUrl}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
            throw new Error('Failed to add to cart');
        }

        showNotification('Product added to cart!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add to cart. Please try again.', 'error');
    }
    */
}

// Toggle Wishlist Function
async function toggleWishlist(productId, button) {
    const isActive = button.classList.contains('active');

    // For now, just toggle locally (dummy functionality)
    button.classList.toggle('active');
    
    const message = isActive
        ? 'Removed from wishlist'
        : 'Added to wishlist!';
    showNotification(message, 'success');

    // In production, you would call the API:
    /*
    try {
        const endpoint = isActive ? '/wishlist/remove' : '/wishlist/add';
        const response = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
            throw new Error('Failed to update wishlist');
        }

        button.classList.toggle('active');
        showNotification(message, 'success');
    } catch (error) {
        console.error('Error updating wishlist:', error);
        showNotification('Failed to update wishlist. Please try again.', 'error');
    }
    */
}

// Quick view modal
function openQuickView(cardElement) {
    const modal = document.getElementById('quick-view-modal');
    const content = document.getElementById('modal-content');
    const name = cardElement.querySelector('.product-title')?.textContent || '';
    const img = cardElement.querySelector('.product-image')?.src || '';
    const price = cardElement.querySelector('.product-price')?.textContent || '';
    const ingredients = cardElement.querySelector('.product-ingredients')?.textContent || '';

    content.innerHTML = `
        <div style="display:flex; gap:1rem; align-items:flex-start;">
            <img src="${img}" alt="${name}" style="width:260px; height:260px; object-fit:cover; border-radius:10px;" />
            <div style="flex:1;">
                <h3 style="margin-top:0">${name}</h3>
                <div style="font-size:1.25rem; color:var(--primary-color); font-weight:700">${price}</div>
                <p style="color:var(--text-secondary); margin-top:0.5rem">${ingredients}</p>
                <div style="margin-top:1rem;"><button class="btn-primary" onclick="document.getElementById('quick-view-modal').querySelector('[data-modal-close]').click()">Add to Cart</button></div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

// Modal close handlers
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-modal-close]') || e.target.closest('[data-modal-close]')) {
        const modal = document.getElementById('quick-view-modal');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
});

// Show Notification
function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Back to Form Button Handler
if (backToFormBtn) {
    backToFormBtn.addEventListener('click', () => {
        // Reset form
        form.reset();
        photoPreview.innerHTML = '';
        photoPreview.classList.remove('has-image');
        uploadedImageData = null;
        
        // Show form, hide results
        resultsSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        document.querySelector('header').classList.remove('hidden');
        // Hide suggestion toggle and close canvas when returning to form
        if (suggestionToggleBtn) suggestionToggleBtn.classList.add('hidden');
        try { closeSuggestionCanvas(); } catch (e) { /* ignore */ }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

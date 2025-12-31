# Skincare Product Analyzer with WooCommerce Integration

A vanilla JavaScript application that analyzes user skin conditions and recommends products from your WooCommerce store based on ingredient matching.

## Features

- 📸 Photo upload (camera or gallery)
- 🖼️ Image optimization (resized and compressed)
- ✅ Multi-select skin conditions
- 💰 Budget range filtering
- 🔍 Intelligent product matching based on ingredients
- 🛒 WooCommerce integration (cart & wishlist)
- 📱 Fully responsive design

## Project Structure

```
/home/vibecode/workspace/
├── index.html          # Main frontend
├── style.css           # Styling
├── script.js           # Frontend JavaScript
└── backend/
    ├── server.js       # Express API server
    ├── package.json    # Dependencies
    └── .env           # Configuration (create from .env.example)
```

## Setup Instructions

### 1. WooCommerce Configuration

First, you need to generate API credentials from your WooCommerce store:

1. Log in to your WordPress admin panel
2. Go to **WooCommerce > Settings > Advanced > REST API**
3. Click **Add Key**
4. Set these options:
   - Description: "Skincare Analyzer"
   - User: Select your admin user
   - Permissions: Read/Write
5. Click **Generate API Key**
6. Copy the **Consumer Key** and **Consumer Secret**

### 2. Backend Setup

```bash
cd /home/vibecode/workspace/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your WooCommerce credentials
nano .env
```

Update your `.env` file:

```env
PORT=3000
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx

# OpenAI API Key (Optional but recommended for AI image analysis)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2.1. OpenAI Configuration (Optional but Recommended)

For AI-powered skin image analysis, you'll need an OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Click **Create new secret key**
4. Copy the API key (starts with `sk-`)
5. Add it to your `.env` file as `OPENAI_API_KEY`

**Note:** Without an OpenAI API key, the system will still work but won't perform AI image analysis. It will use only the user-selected conditions for product matching.

### 3. WooCommerce Product Setup

For best results, your WooCommerce products should have ingredient data. You can add this in two ways:

#### Option A: Using Product Meta Data (Recommended)

Add a custom field to your products:
- Key: `ingredients` or `_ingredients`
- Value: Comma-separated list of ingredients

Example: `hyaluronic acid, niacinamide, glycerin, vitamin c`

#### Option B: Using Product Description

Include ingredients in the product description. The system will scan the description for ingredient matches.

### 4. Product Categories

Create or use these categories in WooCommerce for better matching:
- Acne Treatment
- Moisturizer
- Cleanser
- Toner
- Serum
- Anti-Aging
- Brightening
- Sensitive Skin

### 5. Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

### 6. Update Frontend Configuration

If your backend runs on a different port or domain, update `script.js`:

```javascript
const CONFIG = {
    apiUrl: 'http://localhost:3000/api',
};
```

## How It Works

### 1. Image Upload & Optimization
- User uploads skin photo
- Backend optimizes image using Sharp (resize, compress)
- **AI Analysis:** Image is analyzed using OpenAI Vision API (GPT-4o) to detect:
  - Visible skin conditions (acne, dark spots, wrinkles, etc.)
  - Skin type (oily, dry, combination, sensitive)
  - Overall skin health assessment
  - Specific concerns and recommendations
- AI-detected conditions are merged with user-selected conditions for better matching

### 2. Product Matching Algorithm

The system uses an ingredient database to match products:

```javascript
// Example: Acne-prone skin
beneficial: ['salicylic acid', 'benzoyl peroxide', 'niacinamide']
avoid: ['coconut oil', 'cocoa butter']
```

**Match Score Calculation:**
- +15 points per beneficial ingredient found
- -20 points per ingredient to avoid
- +10 points if product name/category matches condition
- Results sorted by score (0-100)

### 3. Budget Filtering

Products are filtered by price ranges:
- **Low**: $0-$20
- **Mid**: $20-$50
- **High**: $50-$100
- **Luxury**: $100+

### 4. WooCommerce Integration

#### Cart Integration
The system uses WooCommerce REST API to:
- Fetch products by category
- Filter by price range
- Read product meta data for ingredients

For cart functionality, you need:
- WooCommerce session management
- Cookie-based cart tracking
- Or custom cart implementation

#### Wishlist Integration
For wishlist functionality, install a WooCommerce wishlist plugin:
- **YITH WooCommerce Wishlist** (has REST API)
- **TI WooCommerce Wishlist**

Then update the wishlist endpoints in `server.js` to call the plugin's API.

## WordPress Integration

### Option 1: Embed as Custom Page

1. Create a new page in WordPress
2. Use a page builder or custom template
3. Include the files:

```html
<link rel="stylesheet" href="/path-to/style.css">
<div id="skincare-analyzer">
    <!-- Copy content from index.html body -->
</div>
<script src="/path-to/script.js"></script>
```

### Option 2: Create a Custom Plugin

Create a WordPress plugin that:
1. Registers a shortcode `[skincare_analyzer]`
2. Enqueues the CSS and JS files
3. Renders the HTML content

Example plugin structure:
```php
<?php
/*
Plugin Name: Skincare Analyzer
*/

function skincare_analyzer_shortcode() {
    wp_enqueue_style('skincare-css', plugins_url('style.css', __FILE__));
    wp_enqueue_script('skincare-js', plugins_url('script.js', __FILE__));

    ob_start();
    include 'template.html';
    return ob_get_clean();
}
add_shortcode('skincare_analyzer', 'skincare_analyzer_shortcode');
```

### Option 3: Use as Standalone Page

Host the frontend on a subdomain and embed via iframe in WordPress.

## API Endpoints

### POST /api/analyze
Analyzes skin and returns recommended products.

**Request:**
```json
{
  "image": "base64_encoded_image",
  "conditions": ["acne", "oily"],
  "budget": "mid",
  "description": "Oily T-zone with occasional breakouts"
}
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": 123,
      "name": "Salicylic Acid Cleanser",
      "price": "29.99",
      "matchScore": 85,
      "ingredients": ["salicylic acid", "niacinamide"],
      "images": [...]
    }
  ]
}
```

### POST /api/cart/add
Adds product to cart.

### POST /api/wishlist/add
Adds product to wishlist.

### POST /api/wishlist/remove
Removes product from wishlist.

## Customization

### Add More Skin Conditions

Edit `INGREDIENT_DATABASE` in `server.js`:

```javascript
INGREDIENT_DATABASE.rosacea = {
    beneficial: ['azelaic acid', 'centella asiatica', 'niacinamide'],
    avoid: ['fragrance', 'alcohol', 'retinol']
};
```

Also add checkbox in `index.html`.

### Change Budget Ranges

Edit `BUDGET_RANGES` in `server.js`:

```javascript
BUDGET_RANGES.budget = { min: 0, max: 15 };
BUDGET_RANGES.midrange = { min: 15, max: 40 };
```

### AI Image Analysis (Already Integrated!)

The system uses **OpenAI Vision API (GPT-4o)** for intelligent skin analysis:

- **Automatic Condition Detection:** Identifies visible skin conditions from uploaded images
- **Skin Type Classification:** Determines skin type (oily, dry, combination, sensitive, normal)
- **Smart Recommendations:** Provides specific observations and recommendations
- **Enhanced Matching:** AI-detected conditions are automatically merged with user selections

**How it works:**
1. User uploads skin photo
2. Image is optimized and sent to OpenAI Vision API
3. GPT-4o analyzes the image and returns structured JSON with:
   - Detected conditions
   - Skin type
   - Confidence score
   - Observations and recommendations
4. AI findings are combined with user-selected conditions
5. Products are matched using the enhanced condition list

**Cost:** OpenAI Vision API charges per image analyzed. Check [OpenAI Pricing](https://openai.com/pricing) for current rates.

## Troubleshooting

### CORS Errors
If you get CORS errors, ensure your backend has CORS enabled:
```javascript
app.use(cors());
```

### WooCommerce API Errors
- Check your API credentials
- Ensure API is enabled in WooCommerce settings
- Verify SSL certificate if using HTTPS

### No Products Returned
- Check if products have the correct categories
- Verify products are published
- Check price ranges match your budget settings

### Images Not Loading
- Check product images are set in WooCommerce
- Verify image URLs are accessible
- Check for mixed content (HTTP/HTTPS) issues

## Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use HTTPS** in production
3. **Validate all user input** server-side
4. **Rate limit API endpoints** to prevent abuse
5. **Sanitize product data** before displaying

## Future Enhancements

- [ ] Real AI skin analysis integration
- [ ] User accounts and saved preferences
- [ ] Product reviews and ratings
- [ ] Routine builder (multi-product recommendations)
- [ ] Email recommendations
- [ ] Social sharing
- [ ] Before/after photo tracking

## Support

For issues or questions, please check:
- WooCommerce REST API Documentation
- Express.js Documentation
- Sharp image processing library docs

## License

MIT

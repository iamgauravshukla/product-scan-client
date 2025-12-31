# WordPress Integration Guide

This guide explains how to integrate the Skincare Product Analyzer into your WordPress site with WooCommerce.

## Prerequisites

- WordPress site with WooCommerce installed and active
- Access to WordPress admin panel
- FTP/SFTP access or file manager
- Node.js installed on your server (for backend API)

## Method 1: Custom WordPress Plugin (Recommended)

### Step 1: Create Plugin Structure

Create a new folder in `wp-content/plugins/` called `skincare-analyzer`:

```
wp-content/plugins/skincare-analyzer/
├── skincare-analyzer.php
├── assets/
│   ├── style.css
│   ├── script.js
│   └── template.html
```

### Step 2: Create Main Plugin File

Create `skincare-analyzer.php`:

```php
<?php
/**
 * Plugin Name: Skincare Product Analyzer
 * Plugin URI: https://yoursite.com
 * Description: AI-powered skincare product recommendations based on skin analysis
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL2
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Skincare_Analyzer {

    public function __construct() {
        add_shortcode('skincare_analyzer', array($this, 'render_analyzer'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }

    public function enqueue_assets() {
        // Only load on pages with shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'skincare_analyzer')) {
            wp_enqueue_style(
                'skincare-analyzer-css',
                plugins_url('assets/style.css', __FILE__),
                array(),
                '1.0.0'
            );

            wp_enqueue_script(
                'skincare-analyzer-js',
                plugins_url('assets/script.js', __FILE__),
                array(),
                '1.0.0',
                true
            );

            // Pass WordPress data to JavaScript
            wp_localize_script('skincare-analyzer-js', 'skincareConfig', array(
                'apiUrl' => site_url('/wp-json/skincare/v1'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('skincare_nonce')
            ));
        }
    }

    public function render_analyzer($atts) {
        ob_start();
        include plugin_dir_path(__FILE__) . 'assets/template.html';
        return ob_get_clean();
    }
}

// Initialize plugin
new Skincare_Analyzer();

// Register REST API endpoints
add_action('rest_api_init', function () {
    register_rest_route('skincare/v1', '/analyze', array(
        'methods' => 'POST',
        'callback' => 'skincare_analyze_endpoint',
        'permission_callback' => '__return_true'
    ));
});

function skincare_analyze_endpoint($request) {
    // Forward request to your Node.js backend
    $params = $request->get_json_params();

    // Your Node.js backend URL
    $backend_url = 'http://localhost:3000/api/analyze';

    $response = wp_remote_post($backend_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($params),
        'timeout' => 60
    ));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to connect to analysis service', array('status' => 500));
    }

    $body = wp_remote_retrieve_body($response);
    return json_decode($body);
}
```

### Step 3: Copy Files

1. Copy `style.css` to `assets/style.css`
2. Copy `script.js` to `assets/script.js`
3. Create `template.html` from the body content of `index.html`

Update `script.js` API configuration:

```javascript
// Get API URL from WordPress
const CONFIG = {
    apiUrl: typeof skincareConfig !== 'undefined'
        ? skincareConfig.apiUrl
        : 'http://localhost:3000/api',
};
```

### Step 4: Activate Plugin

1. Go to WordPress admin panel
2. Navigate to **Plugins > Installed Plugins**
3. Find "Skincare Product Analyzer"
4. Click **Activate**

### Step 5: Use Shortcode

Add this shortcode to any page or post:

```
[skincare_analyzer]
```

## Method 2: Custom Page Template

### Step 1: Create Template File

In your theme folder, create `template-skincare.php`:

```php
<?php
/*
Template Name: Skincare Analyzer
*/

get_header();
?>

<link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/skincare/style.css">

<div class="skincare-analyzer-page">
    <?php
    // Include your HTML here or use include
    include get_template_directory() . '/skincare/template.html';
    ?>
</div>

<script src="<?php echo get_template_directory_uri(); ?>/skincare/script.js"></script>

<?php get_footer(); ?>
```

### Step 2: Create Page

1. Create new page in WordPress
2. Set template to "Skincare Analyzer"
3. Publish

## Method 3: Elementor/Page Builder Integration

### Using Elementor

1. Install Elementor (if not already)
2. Create new page
3. Add **HTML Widget**
4. Paste the content from `index.html`
5. Add **Custom CSS** widget with content from `style.css`
6. Add **Custom JavaScript** widget with content from `script.js`

### Using Divi Builder

1. Create new page
2. Add **Code Module**
3. Paste complete HTML/CSS/JS

## Backend Setup on WordPress Server

### Option A: Same Server as WordPress

If your WordPress site is on a VPS/dedicated server:

```bash
# Upload backend folder to your server
cd /var/www/your-site/
mkdir skincare-backend
cd skincare-backend

# Upload files and install
npm install

# Create .env file with WooCommerce credentials
nano .env

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start server.js --name skincare-api
pm2 save
pm2 startup
```

### Option B: Separate Server/Service

Host backend on:
- **Heroku**: Free tier available
- **DigitalOcean App Platform**
- **AWS Lambda** (serverless)
- **Vercel/Netlify** (serverless functions)

Update API URL in frontend to point to your backend.

## WooCommerce Setup

### 1. Generate API Keys

1. Go to **WooCommerce > Settings > Advanced > REST API**
2. Click **Add Key**
3. Settings:
   - Description: "Skincare Analyzer"
   - User: Your admin user
   - Permissions: Read/Write
4. Copy credentials to backend `.env` file

### 2. Add Product Ingredients

For each product, add custom field:

**Method A: Using Custom Fields**
1. Edit product
2. Scroll to **Custom Fields** section
3. Add new field:
   - Name: `ingredients`
   - Value: `hyaluronic acid, niacinamide, glycerin`

**Method B: Using ACF (Advanced Custom Fields)**
1. Install ACF plugin
2. Create field group for products
3. Add textarea field for ingredients
4. Update backend to read from ACF field

**Method C: Using Product Description**
Just include ingredients in product description. The system will scan it.

### 3. Set Up Categories

Create these product categories:
- Cleanser
- Moisturizer
- Serum
- Toner
- Treatment
- Acne Treatment
- Anti-Aging
- Brightening
- Sensitive Skin

Assign products to relevant categories.

### 4. Configure Wishlist (Optional)

Install a wishlist plugin:

**YITH WooCommerce Wishlist:**
1. Install and activate
2. Configure settings
3. Note the REST API endpoints
4. Update backend `server.js` wishlist endpoints

## Security Considerations

### 1. Protect Backend API

Add authentication to your backend:

```javascript
// In server.js
const validateRequest = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.use('/api', validateRequest);
```

Update frontend:

```javascript
fetch(`${CONFIG.apiUrl}/analyze`, {
    headers: {
        'X-API-Key': 'your-secret-key',
        'Content-Type': 'application/json'
    },
    // ...
});
```

### 2. Rate Limiting

Install express-rate-limit:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. CORS Configuration

Update CORS for WordPress domain:

```javascript
app.use(cors({
    origin: 'https://your-wordpress-site.com',
    credentials: true
}));
```

## Testing

1. Navigate to your analyzer page
2. Upload a test image
3. Select skin conditions
4. Choose budget
5. Add description
6. Submit and verify:
   - Products load
   - Match scores appear
   - Add to cart works
   - Wishlist works

## Troubleshooting

### Products Not Loading

**Check WooCommerce API:**
```bash
curl https://your-site.com/wp-json/wc/v3/products \
  -u consumer_key:consumer_secret
```

**Check backend logs:**
```bash
pm2 logs skincare-api
```

### CORS Errors

Add to WordPress `functions.php`:

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

### Styling Conflicts

If WordPress theme conflicts with styles, add more specific selectors:

```css
.skincare-analyzer-page .container {
    /* Your styles */
}
```

Or wrap everything in a unique class.

## Maintenance

### Update Product Ingredients

Create a bulk update script:

```php
// Add to functions.php or create admin page
function bulk_update_ingredients() {
    $products = wc_get_products(array('limit' => -1));

    foreach ($products as $product) {
        // Extract ingredients from description or set manually
        $ingredients = 'ingredient1, ingredient2, ingredient3';
        update_post_meta($product->get_id(), 'ingredients', $ingredients);
    }
}
```

### Monitor API Usage

Add logging:

```javascript
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
```

## Advanced: Add AI Image Analysis

### Google Cloud Vision

```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
    keyFilename: 'path/to/keyfile.json'
});

async function analyzeSkinImage(imageData) {
    const [result] = await client.labelDetection(imageData);
    const labels = result.labelAnnotations;

    // Process labels to detect skin conditions
    return {
        detectedConditions: labels.map(l => l.description),
        confidence: labels[0]?.score || 0
    };
}
```

## Support

For issues:
1. Check browser console for errors
2. Check server logs: `pm2 logs skincare-api`
3. Verify WooCommerce API credentials
4. Test API endpoint directly with curl/Postman

## Next Steps

- [ ] Add user accounts for saving preferences
- [ ] Create routine builder (multiple products)
- [ ] Add product comparison feature
- [ ] Integrate email recommendations
- [ ] Add before/after photo tracking
- [ ] Create mobile app version

# Testing Product Ingredients Guide

This guide will help you verify that product ingredients added in WooCommerce are accessible via the API.

## Quick Test Methods

### Method 1: Using the Test Endpoint (Recommended)

The backend includes a test endpoint that you can use to check if ingredients are accessible.

#### Test All Products
```bash
curl http://localhost:3000/api/test/products
```

#### Test Specific Product
```bash
curl http://localhost:3000/api/test/products?productId=123
```

#### Test Multiple Products
```bash
curl http://localhost:3000/api/test/products?limit=10
```

### Method 2: Using the Test Script

A Node.js script is provided for detailed testing:

```bash
cd backend

# Test first 5 products
node test-ingredients.js

# Test specific product ID
node test-ingredients.js 123

# Test 10 products
node test-ingredients.js --limit 10
```

### Method 3: Using Browser or Postman

1. **Test Endpoint:** `GET http://localhost:3000/api/test/products`
2. **With Product ID:** `GET http://localhost:3000/api/test/products?productId=123`
3. **With Limit:** `GET http://localhost:3000/api/test/products?limit=10`

## How Ingredients Are Stored in WooCommerce

The system looks for ingredients in product **meta_data** with these keys:
- `ingredients` (preferred)
- `_ingredients` (alternative)

### Adding Ingredients to Products

#### Option A: Using Custom Fields (Recommended)

1. Go to **WooCommerce > Products**
2. Click **Edit** on a product
3. Scroll down to **Custom Fields** section
4. If Custom Fields section is not visible:
   - Click **Screen Options** (top right)
   - Check **Custom Fields**
5. Click **Add Custom Field**
6. Enter:
   - **Name:** `ingredients`
   - **Value:** `hyaluronic acid, niacinamide, glycerin, vitamin c`
7. Click **Add Custom Field**
8. Click **Update** to save the product

#### Option B: Using ACF (Advanced Custom Fields) Plugin

1. Install **Advanced Custom Fields** plugin
2. Create a field group for products
3. Add a textarea field named `ingredients`
4. The field will automatically appear in product edit page
5. Add ingredients as comma-separated values

#### Option C: Using Product Description

Ingredients can also be extracted from the product description, but this is less reliable.

## Expected Response Format

### Successful Response (Product with Ingredients)

```json
{
  "success": true,
  "message": "Product ingredients test",
  "product": {
    "productId": 123,
    "name": "Hyaluronic Acid Serum",
    "price": "29.99",
    "meta_data_keys": ["_price", "ingredients", "_regular_price"],
    "ingredients_meta": {
      "id": 456,
      "key": "ingredients",
      "value": "hyaluronic acid, niacinamide, glycerin, vitamin c"
    },
    "ingredients_value": "hyaluronic acid, niacinamide, glycerin, vitamin c",
    "ingredients_array": [
      "hyaluronic acid",
      "niacinamide",
      "glycerin",
      "vitamin c"
    ],
    "has_ingredients": true
  }
}
```

### Response (Product without Ingredients)

```json
{
  "success": true,
  "message": "Product ingredients test",
  "product": {
    "productId": 123,
    "name": "Hyaluronic Acid Serum",
    "price": "29.99",
    "meta_data_keys": ["_price", "_regular_price"],
    "ingredients_meta": null,
    "ingredients_value": null,
    "ingredients_array": [],
    "has_ingredients": false
  }
}
```

## Troubleshooting

### Issue: Ingredients Not Found

**Possible Causes:**

1. **Wrong Meta Key Name**
   - ✅ Correct: `ingredients` or `_ingredients`
   - ❌ Wrong: `Ingredients`, `INGREDIENTS`, `product_ingredients`

2. **Custom Fields Not Saved**
   - Make sure you clicked "Add Custom Field" AND "Update" product

3. **API Not Fetching Meta Data**
   - WooCommerce REST API should include meta_data by default
   - Check if your API credentials have read permissions

4. **Product Not Published**
   - Only published products are fetched
   - Check product status in WooCommerce

### Issue: API Connection Error

**Check:**
1. Backend server is running: `npm start` in backend directory
2. WooCommerce URL is correct in `.env` file
3. API credentials are valid
4. WooCommerce REST API is enabled in WooCommerce settings

### Issue: Ingredients Not Parsing Correctly

**Format Requirements:**
- ✅ Good: `hyaluronic acid, niacinamide, glycerin`
- ✅ Good: `hyaluronic acid,niacinamide,glycerin` (spaces optional)
- ❌ Bad: `hyaluronic acid; niacinamide` (semicolon not supported)

## Testing Checklist

- [ ] Backend server is running
- [ ] WooCommerce API credentials are configured
- [ ] At least one product has ingredients in Custom Fields
- [ ] Product is published (not draft)
- [ ] Test endpoint returns products
- [ ] Ingredients are visible in response
- [ ] Ingredients array is properly parsed

## Example Test Flow

1. **Add ingredients to a test product:**
   ```
   Product ID: 123
   Custom Field Name: ingredients
   Custom Field Value: salicylic acid, niacinamide, tea tree
   ```

2. **Test via script:**
   ```bash
   cd backend
   node test-ingredients.js 123
   ```

3. **Expected output:**
   ```
   ✅ Ingredients Found!
      Key: ingredients
      Value: salicylic acid, niacinamide, tea tree
      Parsed: salicylic acid, niacinamide, tea tree
   ```

4. **Test via API:**
   ```bash
   curl http://localhost:3000/api/test/products?productId=123
   ```

5. **Verify in actual analyze endpoint:**
   - Upload image and select conditions
   - Check if products with ingredients have higher match scores
   - Verify ingredients appear in product cards

## Additional Notes

- Ingredients are case-insensitive when matching
- The system falls back to product description if no ingredients meta_data is found
- Multiple products can be tested at once using the limit parameter
- The test endpoint is safe to use in production (read-only)


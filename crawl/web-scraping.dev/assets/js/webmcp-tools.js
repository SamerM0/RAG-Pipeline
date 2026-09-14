/**
 * WebMCP Tool Registration for web-scraping.dev
 *
 * Registers MCP tools via navigator.modelContext so AI agents
 * can discover and call them through the WebMCP CDP domain.
 *
 * These tools are available when the page is loaded in a
 * Scrapfly Cloud Browser session with enable_mcp=true.
 */
(function () {
  if (!navigator.modelContext) return;

  // Tool 1: searchProducts - search products by keyword
  navigator.modelContext.registerTool({
    name: 'searchProducts',
    description: 'Search products on the page by keyword. Returns matching product names and prices.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword to match against product titles' }
      },
      required: ['query']
    },
    execute: async ({ query }) => {
      const products = document.querySelectorAll('.product-item, .product');
      const results = [];
      products.forEach((el) => {
        const title = (el.querySelector('.product-title, h3, h2') || {}).textContent || '';
        if (title.toLowerCase().includes(query.toLowerCase())) {
          const price = (el.querySelector('.product-price, .price') || {}).textContent || '';
          results.push({ title: title.trim(), price: price.trim() });
        }
      });
      return { matches: results.length, products: results };
    }
  });

  // Tool 2: getProductCount - count products on the page
  navigator.modelContext.registerTool({
    name: 'getProductCount',
    description: 'Returns the total number of products displayed on the current page.',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      const products = document.querySelectorAll('.product-item, .product');
      return { count: products.length };
    }
  });

  // Tool 3: getProductDetails - get structured data for a product by index
  navigator.modelContext.registerTool({
    name: 'getProductDetails',
    description: 'Get structured details (title, price, description, image URL) for a product by its index on the page (0-based).',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Zero-based index of the product on the page' }
      },
      required: ['index']
    },
    execute: async ({ index }) => {
      const products = document.querySelectorAll('.product-item, .product');
      if (index < 0 || index >= products.length) {
        return { error: 'Index out of range', total: products.length };
      }
      const el = products[index];
      return {
        title: (el.querySelector('.product-title, h3, h2') || {}).textContent?.trim() || '',
        price: (el.querySelector('.product-price, .price') || {}).textContent?.trim() || '',
        description: (el.querySelector('.product-description, p') || {}).textContent?.trim() || '',
        image: (el.querySelector('img') || {}).src || null
      };
    }
  });

  // Tool 4: addToCart - add a product to the cart by title
  navigator.modelContext.registerTool({
    name: 'addToCart',
    description: 'Add a product to the shopping cart by clicking its Add to Cart button. Matches by product title.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Product title to add to cart' }
      },
      required: ['title']
    },
    execute: async ({ title }) => {
      const products = document.querySelectorAll('.product-item, .product');
      for (const el of products) {
        const elTitle = (el.querySelector('.product-title, h3, h2') || {}).textContent || '';
        if (elTitle.toLowerCase().includes(title.toLowerCase())) {
          const btn = el.querySelector('.add-to-cart, button[data-product-id]');
          if (btn) {
            btn.click();
            return { added: true, product: elTitle.trim() };
          }
          return { added: false, reason: 'No add-to-cart button found for this product' };
        }
      }
      return { added: false, reason: 'Product not found: ' + title };
    }
  });

  // Tool 5: getPageInfo - get metadata about the current page
  navigator.modelContext.registerTool({
    name: 'getPageInfo',
    description: 'Get metadata about the current page: URL, title, product count, and available navigation links.',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      const navLinks = document.querySelectorAll('.navbar-nav a.nav-link');
      const links = [];
      navLinks.forEach((a) => {
        const raw = a.getAttribute('href') || '';
        if (a.classList.contains('dropdown-toggle') || !raw || raw.startsWith('#')) return;
        const text = a.textContent.trim();
        if (text) links.push({ text, href: a.href });
      });
      const products = document.querySelectorAll('.product-item, .product');
      return {
        url: window.location.href,
        title: document.title,
        productCount: products.length,
        navigationLinks: links
      };
    }
  });
})();

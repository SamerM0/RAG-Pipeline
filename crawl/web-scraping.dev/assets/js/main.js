/**
 * Add all even listeners for product and cart related tasks
 */
function add_product_listeners() {
    $(".product-img").on("click", function () {
        $(".product-img").removeClass("active");
        $(this).addClass("active");
        console.log("swapping img");
    })
    $(".main").on("click", function () {
        $(".cart-data").removeClass("open");
    })

    $(".add-to-cart").on("click", function () {
        let productId = $(this).data("product-id");
        let variantId = $(this).data("variant-id");
        addToCart(productId, variantId);
        $(this).addClass('btn-success');
        setTimeout(() => $(this).removeClass('btn-success'), 500);
    })
    $(".cart-clear").on("click", function () {
        confirm("Are you sure you want to clear your cart?") && localStorage.setItem('cart', "{}");
        document.dispatchEvent(new Event('cart-cleared'));
    })
    $(".cart-preview").on("click", function () {
        toggleCartPreview();
    })
}

/**
 * Toggle cart preview open/closed
 */
function toggleCartPreview() {
    if ($(".cart-data.open").length > 0) {
        $(".cart-data").removeClass("open");
    } else {
        $(".cart-data").addClass("open");
        loadCart(5);
    }
}

/**
 * Load cart data to a provided container; limit>0 will limit the number of items shown
 */
function loadCart(limit = 5, container = '.cart-preview') {
    var cart = JSON.parse(localStorage.getItem('cart') || "{}");
    var cartItems = Object.keys(cart).map(key => {
        let [productId, variantId] = key.split("_");
        return { productId, variantId, quantity: cart[key] };
    });
    var $cart = $(container);
    $cart.find(".cart-items").empty();
    $cart.find(".cart-meta").empty();
    var total = 0;
    var fetchIds = [... new Set(cartItems.map(item => item.productId))];
    if (fetchIds.length == 0) {
        $cart.find(".cart-items").append(`<p class="text-center mt-5 mb-5">Your cart is empty</p>`);
        return []
    }
    fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "id": fetchIds }),
    }).then(response => response.json()).then(products => {
        (limit ? cartItems.slice(0, limit) : cartItems).forEach(item => {
            var data = products.find(product => product.id == parseInt(item.productId));
            total += data.price * item.quantity;
            $cart.find(".cart-items").append(`<a class="cart-item" data-id="${item.productId}" data-variant="${item.variantId}" data-quantity="${item.quantity}" href="/product/${item.productId}?variant=${item.variantId}">
                <img src="${data.thumbnail}" alt="${data.title} photo"/>
                <span class="cart-title">${data.title} <span class="variant">(${item.variantId})</span></span>
                <span class="cart-quantity">${item.quantity}</span>
                <span class="cart-price">$${data.price.toFixed(2)}</span>
                </a>`);
        });
        if (limit > 0 && cartItems.length > limit) {
            $cart.find(".cart-meta").append(`<div class="cart-warning">+${cartItems.length - limit} more items</div>`)
        }
        $cart.find(".cart-meta").append(`<div class="cart-total">total: $${total.toFixed(2)}</div>`)
    });
}

/**
 * Add product to local storage cart 
 * @param {int} productId 
 * @param {str} variantId 
 */
function addToCart(productId, variantId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    let _key = `${productId}_${variantId}`;
    cart[_key] = (cart[_key] || 0) + 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    refreshCartIcon();
}

/**
 * Refresh product cart icon
 */
function refreshCartIcon() {
    $(".cart-count").text(Object.values(JSON.parse(localStorage.getItem('cart') || "{}")).reduce((a, b) => a + b, 0));
}

document.addEventListener('cart-cleared', function() {
    refreshCartIcon();
});

addEventListener('load', () => {
    add_product_listeners();
    // add cart
    refreshCartIcon();
    // add copy buttons to code blocks
    addCopyButtons();
    // toggle tutorial button
    $(".toggle-tutorial").on("click", function () {
        $(".tutorial").toggleClass("hidden");
        // also add tutorial=true|false to url parameters for sharing
        const url = new URL(window.location.href);
        const val = (!$(".tutorial").hasClass("hidden")).toString();
        url.searchParams.set('tutorial', val);
        window.history.replaceState(null, null, url);
    })


    // Catch all htmx failures and set target to failure response body with statuc code prefix
    document.body.addEventListener('htmx:responseError', function (evt) {
        if (evt.detail.target) {
            evt.detail.target.innerText = `${evt.detail.xhr.status}: ${evt.detail.xhr.responseText}`
        }
    });

    $("[data-hover]").on('mouseover', function (e) {
        $(e.currentTarget.dataset['hover']).css({
            top: (e.pageY + 30) + "px",
            left: (e.pageX - 30) + "px"
        });
        $(e.currentTarget.dataset['hover']).show();
    });
    $("[data-hover]").on('mouseout', function (e) {
        $(e.currentTarget.dataset['hover']).hide();
    });
    $(".tabs div[data-tab]").on("click", function (e) {
        // clear active classes and set current tab button as active
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
        // activate tab page with the same index as the tab button
        let tabIndex = $(this).index();
        $($(this).siblings("div:not([data-tab])")[tabIndex]).addClass("active");
    });
});

/**
 * Add copy-to-clipboard functionality to all code blocks
 */
function addCopyButtons() {
    // Add copy button to each pre > code block
    document.querySelectorAll('pre > code').forEach((codeBlock) => {
        // Skip if button already added
        if (codeBlock.parentElement.querySelector('.copy-code-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'copy-code-btn btn btn-sm btn-outline-secondary';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');

        button.addEventListener('click', async () => {
            const code = codeBlock.textContent;
            try {
                await navigator.clipboard.writeText(code);
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg> Copied!';
                button.classList.add('btn-success');
                button.classList.remove('btn-outline-secondary');

                setTimeout(() => {
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> Copy';
                    button.classList.remove('btn-success');
                    button.classList.add('btn-outline-secondary');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg> Failed';
            }
        });

        // Create wrapper for positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        codeBlock.parentElement.insertBefore(wrapper, codeBlock.parentElement.firstChild);
        wrapper.appendChild(button);
    });
}

document.dispatchEvent(new Event('mainjsloaded'));

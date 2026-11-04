document.addEventListener('DOMContentLoaded', () => {
    // --- Cart System ---
    const cartBadge = document.getElementById('cart-badge');
    const toast = document.getElementById('toast');
    const addToCartBtns = document.querySelectorAll('.btn-add-cart');
    
    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('aura_cart')) || [];
    
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            if (totalItems > 0) {
                cartBadge.classList.add('visible');
            } else {
                cartBadge.classList.remove('visible');
            }
        }
    }
    
    function showToast() {
        if(toast) {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    // Initialize cart count
    updateCartCount();

    // Add to cart functionality
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Check if we are on product page or shop page
            const card = e.target.closest('.product-card') || e.target.closest('.product-detail-container');
            const id = e.target.getAttribute('data-id') || Date.now().toString(); // Fallback ID
            
            // Get size if selected
            const sizeSelect = document.getElementById('product-size');
            const size = sizeSelect && card.contains(sizeSelect) ? ` (Size: ${sizeSelect.value})` : '';
            
            const name = card.querySelector('.product-name').textContent + size;
            
            // Strip out original price if it exists (e.g. if it has a span with line-through)
            const priceEl = card.querySelector('.product-price');
            const clonedPrice = priceEl.cloneNode(true);
            const originalPriceSpan = clonedPrice.querySelector('span');
            if (originalPriceSpan) originalPriceSpan.remove();
            const price = clonedPrice.textContent.trim();
            
            const image = card.querySelector('.product-image').src;
            
            // Check if item exists
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, image, quantity: 1 });
            }
            
            localStorage.setItem('aura_cart', JSON.stringify(cart));
            updateCartCount();
            showToast();
        });
    });

    // --- Cart Page Rendering ---
    const cartContainer = document.getElementById('cart-container');
    const cartSummary = document.getElementById('cart-summary');
    const cartTotal = document.getElementById('cart-total');
    const emptyCartMsg = document.getElementById('empty-cart-message');

    if (cartContainer) {
        renderCartPage();
    }

    function renderCartPage() {
        cartContainer.innerHTML = '';
        
        if (cart.length === 0) {
            if(emptyCartMsg) emptyCartMsg.style.display = 'block';
            if(cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if(emptyCartMsg) emptyCartMsg.style.display = 'none';
        if(cartSummary) cartSummary.style.display = 'block';

        let total = 0;

        cart.forEach((item, index) => {
            // Parse price string (e.g. "₹9600" -> 9600)
            const priceNum = parseFloat(item.price.replace('₹', '').replace(/,/g, ''));
            total += priceNum * item.quantity;

            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">${item.price}</p>
                    <div class="cart-item-actions">
                        <span style="margin-right: 1rem; color: var(--secondary);">Qty: ${item.quantity}</span>
                        <button class="btn-remove" data-index="${index}">Remove</button>
                    </div>
                </div>
            `;
            cartContainer.appendChild(itemEl);
        });

        if(cartTotal) cartTotal.textContent = `₹${total.toFixed(2)}`;

        // Attach remove listeners
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                cart.splice(idx, 1);
                localStorage.setItem('aura_cart', JSON.stringify(cart));
                updateCartCount();
                renderCartPage();
            });
        });
    }

    // --- Newsletter Form ---
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterSuccess = document.getElementById('newsletter-success');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            if (emailInput.value) {
                // Simulate API call
                newsletterForm.style.display = 'none';
                newsletterSuccess.style.display = 'block';
                emailInput.value = '';
            }
        });
    }
    // --- Search Overlay ---
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = searchOverlay ? searchOverlay.querySelector('input') : null;

    if (searchToggle && searchOverlay && searchClose) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            if (searchInput) searchInput.focus();
        });

        searchClose.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                searchOverlay.classList.remove('active');
            }
        });
    }

    // --- Checkout Flow ---
    const step1Content = document.getElementById('step1-content');
    const step2Content = document.getElementById('step2-content');
    const step3Content = document.getElementById('step3-content');
    const addressForm = document.getElementById('address-form');
    const backToAddressBtn = document.getElementById('back-to-address');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const applyCouponBtn = document.getElementById('apply-coupon');
    
    if (step1Content && addressForm) {
        // Load cart total into checkout summary
        let checkoutTotal = 0;
        let checkoutSubtotal = 0;
        let discount = 0;

        function updateCheckoutSummary() {
            checkoutSubtotal = cart.reduce((sum, item) => {
                return sum + (parseFloat(item.price.replace('₹', '').replace(/,/g, '')) * item.quantity);
            }, 0);
            
            checkoutTotal = checkoutSubtotal - discount;
            
            document.getElementById('checkout-subtotal').textContent = '₹' + checkoutSubtotal.toFixed(2);
            document.getElementById('checkout-total').textContent = '₹' + checkoutTotal.toFixed(2);
            
            if (discount > 0) {
                document.getElementById('discount-row').style.display = 'flex';
                document.getElementById('checkout-discount').textContent = '-₹' + discount.toFixed(2);
            }
            
            if (document.querySelector('.payment-method.active[data-target="emi-msg"]')) {
                calculateEMI();
            }
        }

        function calculateEMI() {
            const emiSelect = document.getElementById('emi-months');
            if(!emiSelect) return;
            const emiMonths = parseInt(emiSelect.value) || 3;
            const interestRate = 0.15; // 15% pa
            const monthlyRate = interestRate / 12;
            const principal = checkoutTotal;
            if (principal === 0) return;
            const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, emiMonths)) / (Math.pow(1 + monthlyRate, emiMonths) - 1);
            document.getElementById('emi-calculated-amount').textContent = '₹' + emi.toFixed(2) + ' / month';
        }

        const emiSelect = document.getElementById('emi-months');
        if (emiSelect) {
            emiSelect.addEventListener('change', calculateEMI);
        }

        updateCheckoutSummary();

        // Calculate expected delivery date
        const deliveryDateElement = document.getElementById('delivery-date');
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 4); // 4 days from now
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        if(deliveryDateElement) deliveryDateElement.textContent = deliveryDate.toLocaleDateString('en-US', options);

        // Address Form Submit
        addressForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Capture address details
            const name = document.getElementById('checkout-name').value;
            const street = document.getElementById('checkout-street').value;
            const city = document.getElementById('checkout-city').value;
            const zip = document.getElementById('checkout-zip').value;
            
            const reviewAddress = document.getElementById('review-address');
            if (reviewAddress) {
                reviewAddress.innerHTML = `<strong>${name}</strong><br>${street}<br>${city}, ${zip}`;
            }

            step1Content.style.display = 'none';
            step2Content.style.display = 'block';
            document.getElementById('step1-indicator').classList.remove('active');
            document.getElementById('step2-indicator').classList.add('active');
        });

        // Back to Address
        backToAddressBtn.addEventListener('click', () => {
            step2Content.style.display = 'none';
            step1Content.style.display = 'block';
            document.getElementById('step2-indicator').classList.remove('active');
            document.getElementById('step1-indicator').classList.add('active');
        });

        // Payment Method Selection
        const paypalMsg = document.getElementById('paypal-msg');
        const podMsg = document.getElementById('pod-msg');
        const emiMsg = document.getElementById('emi-msg');

        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                paymentMethods.forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                
                const target = method.getAttribute('data-target');
                const pForm = document.getElementById('payment-form');
                if (pForm) pForm.style.display = target === 'cc-form' ? 'grid' : 'none';
                if (paypalMsg) paypalMsg.style.display = target === 'paypal-msg' ? 'block' : 'none';
                if (podMsg) podMsg.style.display = target === 'pod-msg' ? 'block' : 'none';
                if (emiMsg) emiMsg.style.display = target === 'emi-msg' ? 'block' : 'none';
                
                if (target === 'emi-msg') calculateEMI();
            });
        });

        // Apply Coupon
        if (applyCouponBtn) {
            applyCouponBtn.addEventListener('click', () => {
                const code = document.getElementById('coupon-code').value.trim().toUpperCase();
                if (code === 'AURA20') {
                    discount = checkoutSubtotal * 0.20; // 20% off
                    document.getElementById('coupon-message').style.display = 'block';
                    document.getElementById('coupon-message').style.color = 'green';
                    document.getElementById('coupon-message').textContent = '20% off applied!';
                    updateCheckoutSummary();
                } else {
                    document.getElementById('coupon-message').style.display = 'block';
                    document.getElementById('coupon-message').style.color = 'red';
                    document.getElementById('coupon-message').textContent = 'Invalid promo code.';
                    setTimeout(() => { document.getElementById('coupon-message').style.display = 'none'; }, 3000);
                }
            });
        }

        // Payment Form Submit (if user hits enter)
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (placeOrderBtn) placeOrderBtn.click();
            });
        }

        // Place Order
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => {
                const activeMethod = document.querySelector('.payment-method.active');
                const isCreditCard = activeMethod && activeMethod.getAttribute('data-target') === 'cc-form';
                const pForm = document.getElementById('payment-form');
                
                if (isCreditCard && pForm && !pForm.checkValidity()) {
                    pForm.reportValidity();
                    return;
                }
                
                const orderData = {
                    customer_name: document.getElementById('checkout-name').value,
                    items: cart,
                    total: '₹' + checkoutTotal.toFixed(2),
                    payment_method: activeMethod ? activeMethod.textContent.trim() : 'Unknown'
                };
                
                fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                }).then(res => res.json()).then(data => {
                    // Show success
                    step2Content.style.display = 'none';
                    step3Content.style.display = 'block';
                    document.getElementById('step2-indicator').classList.remove('active');
                    document.getElementById('step3-indicator').classList.add('active');
                    
                    document.getElementById('order-number').textContent = data.order_id || Math.floor(100000 + Math.random() * 900000);
                    
                    // Clear cart
                    cart = [];
                    localStorage.removeItem('aura_cart');
                    updateCartCount();
                }).catch(err => console.error(err));
            });
        }
    }
});

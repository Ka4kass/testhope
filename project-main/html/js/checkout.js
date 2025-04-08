document.addEventListener("DOMContentLoaded", () => {
    const orderItemsList = document.getElementById("order-items");
    const totalPriceElement = document.getElementById("total-price");
    const countrySelect = document.getElementById("country");
    
    // Отримуємо список товарів з LocalStorage
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    
    // Якщо кошик порожній, показуємо повідомлення
    if (orders.length === 0) {
        orderItemsList.innerHTML = "<li>Your cart is empty</li>";
        totalPriceElement.textContent = "$0.00";
        return;
    }
    
    // Очищаємо список перед додаванням товарів
    orderItemsList.innerHTML = "";
    let subtotal = 0;
    
    orders.forEach(order => {
        let listItem = document.createElement("li");
        listItem.textContent = `${order.name} - $${order.price.toFixed(2)}`;
        orderItemsList.appendChild(listItem);
        subtotal += order.price;
    });
    
    // Add shipping cost calculation based on country selection
    let shippingCost = 0;
    
    // Initial calculation based on default selected country
    calculateTotalWithShipping();
    
    // Add event listener to country select to update shipping cost
    countrySelect.addEventListener("change", calculateTotalWithShipping);
    
    function calculateTotalWithShipping() {
        const selectedCountry = countrySelect.value;
        
        // If Germany is selected, shipping is 5 euros, otherwise 6 euros
        shippingCost = selectedCountry === "Germany" ? 5 : 6;
        
        // Add shipping cost line item
        updateShippingDisplay();
        
        // Calculate final total amount
        const totalAmount = subtotal + shippingCost;
        
        // Update total price display
        totalPriceElement.textContent = `$${totalAmount.toFixed(2)}`;
    }
    
    function updateShippingDisplay() {
        // Remove any existing shipping line item
        const existingShipping = document.querySelector(".shipping-cost");
        if (existingShipping) {
            existingShipping.remove();
        }
        
        // Create new shipping line item
        const shippingItem = document.createElement("li");
        shippingItem.className = "shipping-cost";
        shippingItem.textContent = `Shipping - $${shippingCost.toFixed(2)}`;
        orderItemsList.appendChild(shippingItem);
    }
});

function getTotalAmount() {
    // Extract the numeric value from total price element
    const totalPriceText = document.getElementById("total-price").textContent;
    return parseFloat(totalPriceText.replace("$", "")) * 100; // Convert to cents for Stripe
}

// Function to get complete order information as JSON
function getOrderJson() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const country = document.getElementById("country").value;
    const shippingCost = country === "Germany" ? 5 : 6;
    
    // Calculate subtotal
    let subtotal = 0;
    orders.forEach(item => {
        subtotal += item.price;
    });
    
    // Calculate total with shipping
    const total = subtotal + shippingCost;
    
    // Get customer information
    const customerInfo = {
        firstName: document.getElementById("first-name").value,
        lastName: document.getElementById("last-name").value,
        company: document.getElementById("company").value,
        phone: document.getElementById("phone").value,
        address1: document.getElementById("address1").value,
        address2: document.getElementById("address2").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        postalCode: document.getElementById("postal-code").value,
        country: country,
        paymentMethod: document.getElementById("payment-method").value
    };
    
    // Create complete order object
    const completeOrder = {
        orderNumber: generateOrderNumber(),
        orderDate: new Date().toISOString(),
        customer: customerInfo,
        items: orders,
        shipping: {
            method: "Standard Shipping",
            cost: shippingCost
        },
        payment: {
            method: customerInfo.paymentMethod,
            subtotal: subtotal,
            shipping: shippingCost,
            total: total
        }
    };
    
    return JSON.stringify(completeOrder, null, 2);
}

// Generate a unique order number
function generateOrderNumber() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
}

let stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkoutForm");
    
    checkoutForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Запобігаємо перезавантаженню сторінки
        
        // Get complete order JSON
        const orderJson = getOrderJson();
        
        // Log the order JSON to console (for debugging)
        console.log("Order JSON:", orderJson);
        
        // Save the order JSON to localStorage
        localStorage.setItem("currentOrder", orderJson);
        
        // Here you can send the orderJson to your backend API
        // For example:
        // sendOrderToBackend(orderJson);
        
        // ✅ Process payment with Stripe
        processStripePayment();
    });
});

// Example function to send order to backend
function sendOrderToBackend(orderJson) {
    fetch('https://yourbackend.com/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: orderJson
    })
    .then(response => response.json())
    .then(data => {
        console.log('Order submitted successfully:', data);
    })
    .catch((error) => {
        console.error('Error submitting order:', error);
    });
}

function processStripePayment() {
    const stripe = Stripe("pk_test_51QzyvB045Es1ke66ebpdj4cFIvQft3ClhY6kgUSxLfc8plkJR2qAuNRVXnJdWRmS9xiJUsvFWVz4cqjFB2Zx2Zy200YpSYvJA2");
    const totalPrice = getTotalAmount();
    
    stripe.redirectToCheckout({
        lineItems: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "3D Architecture Models",
                    },
                    unit_amount: totalPrice, // Dynamic price in cents
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        successUrl: "https://yourwebsite.com/success",
        cancelUrl: "https://yourwebsite.com/cancel"
    }).then(function (result) {
        if (result.error) {
            alert(result.error.message);
        }
    });
}
const quantityInput = document.getElementById("quantity");
const totalDueElement = document.getElementById("total-due");
const subtotalElement = document.getElementById("subtotal");
const quantityDisplayElement = document.getElementById("quantity-display");

const ticketPrice = 320000;
const vatRate = 0.27;

function updateTotalDue() {
    const quantity = parseInt(quantityInput.value);
    const subtotal = ticketPrice * quantity;
    const totalDue = subtotal;
    const formattedPrice1 = subtotal.toLocaleString('vi-VN');
    const formattedPrice2 = totalDue.toLocaleString('vi-VN');

    subtotalElement.textContent = `${formattedPrice1} VNĐ`;
    totalDueElement.textContent = `${formattedPrice2} VNĐ`;
    quantityDisplayElement.textContent = quantity;
}


quantityInput.addEventListener("input", updateTotalDue);


updateTotalDue();

function showConfirmedPopup(message) {
    return new Promise((resolve) => {
        const popupOverlay = document.getElementById("confirmation-popup");
        const popupMessage = document.getElementById("popup-cf-message");
        const popupConfirmBtn = document.getElementById("popup-confirm-btn");
        const popupCloseBtn = document.getElementById("popup-cf-close");

        popupMessage.textContent = message;
        popupOverlay.style.display = 'flex';

        popupConfirmBtn.onclick = function () {
            resolve('confirmed');
            popupOverlay.style.display = 'none';
        };

        popupCloseBtn.onclick = function () {
            resolve('canceled');
            popupOverlay.style.display = 'none';
        };
    });
}

document.getElementById('form').onsubmit = async function (event) {
    event.preventDefault();

    const customer = document.getElementById('customer').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const linkfb = document.getElementById('linkfb').value;
    const referrer = document.getElementById('referrer') ? document.getElementById('referrer').value : '';
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    const imageFile = document.getElementById('image') ? document.getElementById('image').files[0] : null;
    const imgbbApiKey = "720f1453f14c2cc6ba0b68214720705f";
    const url = this.action;

    // Validation for phone number (must be 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showPopup("Số điện thoại bao gồm 10 ký tự");
        return;
    }

    // Validation for quantity (must be between 1 and 5)
    if (quantity <= 0 || quantity > 5) {
        showPopup("Bạn chỉ được mua tôi đa 5 vé.");
        return;
    }

    // Calculate total price
    // const totalPrice = ticketPrice * quantity;
    // const confirmSubmission = confirm(`Bạn xác nhận thanh toán: ${totalPrice.toFixed(3)} VNĐ. Bạn có muốn tiếp tục ?`);
    // if (!confirmSubmission) return;

    if (!customer || !phone || !email || !linkfb || quantity <= 0) {
        showPopup("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    const emailValidationResult = validateEmail(email);
    if (!emailValidationResult.isValid) {
        showPopup(emailValidationResult.message); 
        return;
    }
    
    if (!isValidFacebookLink(linkfb)) {
        showPopup("Vui lòng nhập link Facebook hợp lệ.");
        event.preventDefault();
        return;
    }

    const totalPrice = ticketPrice * quantity;
    const formattedPrice = totalPrice.toLocaleString('vi-VN');
    const message = `Bạn xác nhận thanh toán: ${formattedPrice}đ. Bạn có muốn tiếp tục?`;
    const result = await showConfirmedPopup(message);

    if (result === 'confirmed') {
        if (imageFile) {
            const formData = new FormData();
            formData.append("Customer", customer);
            formData.append("Phone", phone);
            formData.append("Email", email);
            formData.append("Facebook", linkfb);
            formData.append("Quantity", quantity);
            formData.append("Referrer", referrer);
            formData.append("image", imageFile);

            const loadingMessage = `
                                    <p>Đang chờ hệ thống xử lý...</p>
                                    <p>(Có thể mất 5 - 10s)</p>
                                    <img src="./images/loading.gif" alt="Success GIF" style="max-width: 100%; max-height: 100px; object-fit: contain;" />
                            `;
            showPopup(loadingMessage, true, true);

            try {

                const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                    method: "POST",
                    body: formData
                });

                const imgbbData = await imgbbResponse.json();

                if (imgbbData.success) {
                    const imageUrl = imgbbData.data.url;
                    formData.append("Image", imageUrl);

                    // Submit form data
                    await fetch(url, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(result => {
                            console.log(result);
                            const successMessage = `
                                    <p>Bạn đã đặt vé thành công!</p>
                                    <img src="./images/success.gif" alt="Success GIF" style="max-width: 100%; max-height: 100px; object-fit: contain;" />
                            `;
                            showPopup(successMessage, true, true);
                            setTimeout(() => {
                                window.location.href = `thanks.html?customer=${encodeURIComponent(customer)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&quantity=${encodeURIComponent(quantity)}`;
                            }, 3000);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showPopup('Error submitting data.');
                        });

                    document.getElementById('form').reset();
                } else {
                    showPopup("Failed to upload image to imgbb.");
                }
            } catch (error) {
                console.error("Error uploading image:", error);
                showPopup("Error uploading image to imgbb.");
            }
        } else {
            showPopup("Please select an image to upload.");
        }
    }
};


function showPopup(message, isHtml = false, hideCloseButton = false) {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popup-message");
    const popupCloseButton = document.getElementById("popup-close");

    if (isHtml) {
        popupMessage.innerHTML = message;
    } else {
        popupMessage.textContent = message;
    }

    if (hideCloseButton) {
        popupCloseButton.style.display = "none";
    }

    popup.style.display = "flex";
}


function closePopup() {
    const popup = document.getElementById("popup");
    popup.style.display = "none";
}

document.getElementById("popup-close").addEventListener("click", closePopup);

function isValidFacebookLink(link) {
    const facebookLinkRegex = /^https?:\/\/(www\.)?facebook\.com\/.+$/;
    return facebookLinkRegex.test(link);
}

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});


document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();

    }
});

function validateEmail(email) {
    const commonDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return { isValid: false, message: "Vui lòng nhập email hợp lệ." };
    }

    const domain = email.split('@')[1];
    if (domain) {
        if (!commonDomains.includes(domain) && !domain.endsWith('.edu.vn')) {
            return { isValid: false, message: `Mail của bạn không hợp lệ` };
        }
    }

    return { isValid: true, message: "" };
}





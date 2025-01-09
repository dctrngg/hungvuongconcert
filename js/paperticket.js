const quantityInput = document.getElementById("quantity");
const totalDueElement = document.getElementById("total-due");
const subtotalElement = document.getElementById("subtotal");
const quantityDisplayElement = document.getElementById("quantity-display");

const ticketPrice = 320000;

function updateTotalDue() {
    const quantity = parseInt(quantityInput.value);
    const subtotal = ticketPrice * quantity;
    const totalDue = subtotal;

    subtotalElement.textContent = `${subtotal.toLocaleString()} VNĐ`;
    totalDueElement.textContent = `${totalDue.toLocaleString()} VNĐ`;
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

const paymentMethodSelect = document.getElementById("payment-method");
const transferSection = document.getElementById("transfer-section");
const bankingDetail = document.getElementById("banking-detail");

paymentMethodSelect.addEventListener("change", function () {
    if (this.value === "transfer") {
        transferSection.style.display = "block";
        bankingDetail.style.display = "block";
        document.getElementById("image").required = true;
    } else {
        transferSection.style.display = "none";
        bankingDetail.style.display = "none";
        document.getElementById("image").required = false;
    }
});

document.getElementById('form').onsubmit = async function (event) {
    event.preventDefault();
    console.log("Submit button clicked");
    const customer = document.getElementById('customer').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const linkfb = document.getElementById('linkfb').value;
    const address = document.getElementById('address').value;
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    const type = document.getElementById('payment-method').value;
    const imageFile = document.getElementById('image') ? document.getElementById('image').files[0] : null;
    const imgbbApiKey = "720f1453f14c2cc6ba0b68214720705f";
    const note = document.getElementById('note').value;
    const referrer = document.getElementById('referrer') ? document.getElementById('referrer').value : '';
    const url = this.action;

    const currentTime = new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showPopup("Số điện thoại bao gồm 10 ký tự");
        return;
    }

    if (quantity <= 0 || quantity > 5) {
        showPopup("Bạn chỉ được mua tối đa 5 vé.");
        return;
    }

    if (!customer || !phone || !email || !address || quantity <= 0) {
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
        const formData = new FormData();
        formData.append("Time", currentTime);
        formData.append("Customer", customer);
        formData.append("Phone", phone);
        formData.append("Email", email);
        formData.append("Facebook", linkfb);
        formData.append("Address", address);
        formData.append("Quantity", quantity);
        formData.append("Type", type);
        formData.append("Note", note);
        formData.append("Referrer", referrer);

        if (type === 'transfer') {
            if (imageFile) {
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

                        await submitFormData(formData, url, customer, email, phone, quantity);
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
        } else {
            const loadingMessage = `
                <p>Đang chờ hệ thống xử lý...</p>
                <p>(Có thể mất 5 - 10s)</p>
                <img src="./images/loading.gif" alt="Success GIF" style="max-width: 100%; max-height: 100px; object-fit: contain;" />
            `;
            showPopup(loadingMessage, true, true);

            await submitFormData(formData, url, customer, email, phone, quantity);
        }
    }
};

async function submitFormData(formData, url, customer, email, phone, quantity) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log(result);
        
        const successMessage = `
            <p>Bạn đã đặt vé thành công!</p>
            <img src="./images/success.gif" alt="Success GIF" style="max-width: 100%; max-height: 100px; object-fit: contain;" />
        `;
        showPopup(successMessage, true, true);
        
        setTimeout(() => {
            window.location.href = `thanks.html?customer=${encodeURIComponent(customer)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&quantity=${encodeURIComponent(quantity)}`;
        }, 3000);
        
        document.getElementById('form').reset();
    } catch (error) {
        console.error('Error:', error);
        showPopup('Error submitting data.');
    }
}

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

document.addEventListener('keydown', function (event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCommand = isMac ? event.metaKey : event.ctrlKey;

    if (isCtrlOrCommand && event.key.toLowerCase() === 's') {
        event.preventDefault(); 
        alert("Chức năng lưu trang đã bị vô hiệu hóa!"); 
    }
});
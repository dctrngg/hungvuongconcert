const quantityInput = document.getElementById("quantity");
const totalDueElement = document.getElementById("total-due");
const subtotalElement = document.getElementById("subtotal");
const quantityDisplayElement = document.getElementById("quantity-display");

const ticketPrice = 320000; // Giá vé

function updateTotalDue() {
    const quantity = parseInt(quantityInput.value);
    const subtotal = ticketPrice * quantity;
    const totalDue = subtotal;

    // Update the displayed values
    subtotalElement.textContent = `${subtotal.toLocaleString()} VNĐ`;
    totalDueElement.textContent = `${totalDue.toLocaleString()} VNĐ`;
    quantityDisplayElement.textContent = quantity; // Update quantity display
}

// Listen for quantity changes
quantityInput.addEventListener("input", updateTotalDue);

// Initialize the total due on page load
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

// payment method
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
    event.preventDefault(); // Prevent default form submission
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

    // Validation for phone number (must be 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showPopup("Số điện thoại bao gồm 10 ký tự");
        return;
    }

    // Validation for quantity (must be between 1 and 5)
    if (quantity <= 0 || quantity > 5) {
        showPopup("Bạn chỉ được mua tối đa 5 vé.");
        return;
    }

    if (!customer || !phone || !email || !address || quantity <= 0) {
        showPopup("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showPopup("Vui lòng nhập email hợp lệ.");
        return;
    }

    if (!isValidFacebookLink(linkfb)) {
        showPopup("Vui lòng nhập link Facebook hợp lệ.");
        event.preventDefault();
        return;
    }



    // Calculate total price
    const totalPrice = ticketPrice * quantity;
    const formattedPrice = totalPrice.toLocaleString('vi-VN');  // Định dạng số theo cách Việt Nam (có dấu chấm)
    const message = `Bạn xác nhận thanh toán: ${formattedPrice}đ. Bạn có muốn tiếp tục?`;

    const result = await showConfirmedPopup(message); // Wait until user confirms

    if (result === 'confirmed') {
        if (type === 'transfer') {
            if (imageFile) {
                const formData = new FormData();
                formData.append("Customer", customer);
                formData.append("Phone", phone);
                formData.append("Email", email);
                formData.append("Facebook", linkfb);
                formData.append("Address", address);
                formData.append("Quantity", quantity);
                formData.append("Type", type);
                formData.append("image", imageFile);
                formData.append("Note", note);
                formData.append("Referrer", referrer);

                console.log("Nội dung FormData:");
                for (const pair of formData.entries()) {
                    console.log(pair[0] + ": " + pair[1]);
                }

                const loadingMessage = `
                                    <p>Đang chờ hệ thống xử lý...</p>
                                    <p>(Có thể mất 5 - 10s)</p>
                                    <img src="./images/loading.gif" alt="Success GIF" style="max-width: 100%; max-height: 100px; object-fit: contain;" />
                            `;
                showPopup(loadingMessage, true, true);

                try {
                    // Upload image to imgbb
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
        } else {
            const formData = new FormData();
            formData.append("Customer", customer);
            formData.append("Phone", phone);
            formData.append("Email", email);
            formData.append("Facebook", linkfb);
            formData.append("Address", address);
            formData.append("Quantity", quantity);
            formData.append("Type", type);
            formData.append("image", imageFile);
            formData.append("Note", note);
            formData.append("Referrer", referrer);

            const loadingMessage = `
                                    <p>Đang chờ hệ thống xử lý...</p>
                                    <p>(Có thể mất 5 - 10s)</p>
                                    <img src="./images/loading.gif" alt="Success GIF" style="max-width: 100%; max-height: 100px; object-fit: contain;" />
                            `;
            showPopup(loadingMessage, true, true);

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
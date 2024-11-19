// Get elements
const modal = document.getElementById("modal");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");

// Open modal on button click
openModalButton.onclick = function() {
    modal.style.display = "flex";
}

// Close modal on 'x' button click
closeModalButton.onclick = function() {
    modal.style.display = "none";
}

// Close modal when clicking outside of modal content
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

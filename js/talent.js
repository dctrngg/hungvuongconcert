const galleryContainer = document.querySelector(".gallery");
const galleryItems = galleryContainer.querySelectorAll(".gallery-item");
const indicator = document.querySelector(".indicator");

const defaultItemFlex = "0 1 20rem";
const hoverItemFlex = "1 1 100rem";

const updateGalleryItems = () => {
    galleryItems.forEach((item) => {
        let flex = defaultItemFlex;
        
        if (item.isHovered) {
            flex = hoverItemFlex;
        }

        item.style.flex = flex;
    });
};

// Initialize the first item as hovered
galleryItems[0].isHovered = true;
updateGalleryItems();

// Add hover event listeners
galleryItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
        galleryItems.forEach((otherItem) => {
            otherItem.isHovered = otherItem === item;
        });
        updateGalleryItems();
    });
});

// Update the indicator position on mousemove
galleryContainer.addEventListener("mousemove", (e) => {
    const rect = galleryContainer.getBoundingClientRect();
    indicator.style.left = `${e.clientX - rect.left}px`;
});

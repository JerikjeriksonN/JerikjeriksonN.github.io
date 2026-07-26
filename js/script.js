console.log("Website loaded");


const sliders = document.querySelectorAll(".slider");


sliders.forEach(slider => {

    const slides = slider.querySelectorAll(".slide");

    const next = slider.querySelector(".next");
    const prev = slider.querySelector(".prev");

    let current = 0;


    next.addEventListener("click", () => {

        slides[current].classList.remove("active");

        current = (current + 1) % slides.length;

        slides[current].classList.add("active");

    });


    prev.addEventListener("click", () => {

        slides[current].classList.remove("active");

        current = (current - 1 + slides.length) % slides.length;

        slides[current].classList.add("active");

    });


});
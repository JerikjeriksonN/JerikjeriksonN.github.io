console.log("Website loaded");

const slides = document.querySelectorAll(".slide");

const next = document.querySelector(".next");
const prev = document.querySelector(".prev");

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
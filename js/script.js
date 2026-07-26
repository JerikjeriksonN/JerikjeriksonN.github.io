document.querySelectorAll(".slider").forEach(slider => {

    const slides = slider.querySelectorAll(".slide");
    const next = slider.querySelector(".next");
    const prev = slider.querySelector(".prev");
    const counter = slider.querySelector(".slide-counter");

    let current = 0;


    function updateSlider() {

        slides.forEach(slide => {
            slide.classList.remove("active");
        });

        slides[current].classList.add("active");

       counter.textContent = 
       `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;

    }


    next.addEventListener("click", () => {

        current++;

        if (current >= slides.length) {
            current = 0;
        }

        updateSlider();

    });


    prev.addEventListener("click", () => {

        current--;

        if (current < 0) {
            current = slides.length - 1;
        }

        updateSlider();

    });


});
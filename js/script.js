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


        if (counter) {

            counter.textContent =
            `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;

        }

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



    // Mobile swipe support

    let startX = 0;
    let endX = 0;


    slider.addEventListener("touchstart", (e) => {

        startX = e.touches[0].clientX;

    }, { passive:true });



    slider.addEventListener("touchend", (e) => {

        endX = e.changedTouches[0].clientX;

        let difference = startX - endX;


        // Swipe left → next image

        if (difference > 50) {

            current++;

            if (current >= slides.length) {
                current = 0;
            }

            updateSlider();

        }


        // Swipe right → previous image

        if (difference < -50) {

            current--;

            if (current < 0) {
                current = slides.length - 1;
            }

            updateSlider();

        }


    }, { passive:true });



    // Make sure first slide is displayed correctly

    updateSlider();

});
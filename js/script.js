document.querySelectorAll(".slider").forEach(slider => {

    const slides = slider.querySelectorAll(".slide");
    const next = slider.querySelector(".next");
    const prev = slider.querySelector(".prev");
    const counter = slider.querySelector(".slide-counter");

    let current = 0;
    let isAnimating = false;


    // Setup slides
    slides.forEach((slide, index) => {

        slide.style.position = "absolute";
        slide.style.top = "0";
        slide.style.left = "0";
        slide.style.width = "100%";
        slide.style.height = "100%";
        slide.style.objectFit = "contain";
        slide.style.transition = "transform 0.45s ease, opacity 0.45s ease";
        slide.style.opacity = index === 0 ? "1" : "0";
        slide.style.transform = index === 0 
            ? "translateX(0)" 
            : "translateX(100%)";

    });



    function updateCounter() {

        if (counter) {

            counter.textContent =
            `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;

        }

    }



    function goToSlide(nextIndex, direction) {

        if (isAnimating || slides.length <= 1) return;

        isAnimating = true;


        const currentSlide = slides[current];
        const nextSlide = slides[nextIndex];


        // Put incoming slide in starting position

        nextSlide.style.transition = "none";

        nextSlide.style.opacity = "1";

        nextSlide.style.transform =
            direction === "next"
            ? "translateX(100%)"
            : "translateX(-100%)";


        // Force browser refresh

        nextSlide.offsetHeight;


        // Animate

        nextSlide.style.transition =
            "transform 0.45s ease, opacity 0.45s ease";

        currentSlide.style.transform =
            direction === "next"
            ? "translateX(-100%)"
            : "translateX(100%)";

        currentSlide.style.opacity = "0";


        nextSlide.style.transform = "translateX(0)";


        setTimeout(() => {

            currentSlide.style.transform =
                direction === "next"
                ? "translateX(100%)"
                : "translateX(-100%)";


            current = nextIndex;

            isAnimating = false;

            updateCounter();


        }, 450);

    }




    next.addEventListener("click", () => {

        let nextIndex = current + 1;

        if (nextIndex >= slides.length) {
            nextIndex = 0;
        }

        goToSlide(nextIndex, "next");

    });



    prev.addEventListener("click", () => {

        let prevIndex = current - 1;

        if (prevIndex < 0) {
            prevIndex = slides.length - 1;
        }

        goToSlide(prevIndex, "prev");

    });





    // Swipe support

    let startX = 0;
    let endX = 0;


    slider.addEventListener("touchstart", e => {

        startX = e.touches[0].clientX;

    }, {passive:true});



    slider.addEventListener("touchend", e => {

        endX = e.changedTouches[0].clientX;


        const difference = startX - endX;


        if (difference > 50) {

            next.click();

        }


        if (difference < -50) {

            prev.click();

        }


    }, {passive:true});



    updateCounter();

});

document.querySelectorAll(".custom-player").forEach(player => {

    const audio = player.querySelector(".audio-file");
    const button = player.querySelector(".play-button");
    const progress = player.querySelector(".progress-bar");
    const time = player.querySelector(".player-time");


    button.addEventListener("click", () => {

        if(audio.paused){

            audio.play();
            button.textContent = "Ⅱ";

        } else {

            audio.pause();
            button.textContent = "▶";

        }

    });


    audio.addEventListener("loadedmetadata", () => {

        time.textContent =
        `0:00 / ${formatTime(audio.duration)}`;

    });


    audio.addEventListener("timeupdate", () => {

        const percent =
        (audio.currentTime / audio.duration) * 100;

        progress.style.width = percent + "%";


        time.textContent =
        `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

    });

    const progressContainer = progress.parentElement;


function setProgress(e) {

    const rect = progressContainer.getBoundingClientRect();

    let position = e.clientX - rect.left;

    if(position < 0) position = 0;
    if(position > rect.width) position = rect.width;

    const percentage = position / rect.width;

    audio.currentTime = percentage * audio.duration;

}


// Desktop click

progressContainer.addEventListener("click", (e) => {

    setProgress(e);

});


// Mobile drag

let dragging = false;


progressContainer.addEventListener("pointerdown", (e) => {

    dragging = true;

    audio.pause();

    button.textContent = "▶";

    progressContainer.setPointerCapture(e.pointerId);

    setProgress(e);

});


progressContainer.addEventListener("pointermove", (e) => {

    if(!dragging) return;

    setProgress(e);

});


progressContainer.addEventListener("pointerup", () => {

    dragging = false;

});


progressContainer.addEventListener("pointercancel", () => {

    dragging = false;

});

    audio.addEventListener("ended", () => {

        button.textContent="▶";

    });


});


function formatTime(seconds){

    if(isNaN(seconds)) return "0:00";

    let min = Math.floor(seconds / 60);

    let sec = Math.floor(seconds % 60);

    if(sec < 10){
        sec = "0" + sec;
    }

    return `${min}:${sec}`;

}
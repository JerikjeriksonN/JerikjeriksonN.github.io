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
        slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");
        slide.style.transform = index === 0 
            ? "translateX(0)" 
            : "translateX(100%)";

    });

    if (slides.length <= 1) {

        prev.hidden = true;
        next.hidden = true;

    }



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

        currentSlide.setAttribute("aria-hidden", "true");
        nextSlide.setAttribute("aria-hidden", "false");


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
    const progressContainer = progress.parentElement;
    const trackTitle = player.dataset.trackTitle || player.querySelector(".player-title").textContent.trim();
    const hasAudio = Boolean(audio.querySelector("source[src]"));


    if (!hasAudio) {

        player.classList.add("audio-unavailable");
        button.disabled = true;
        button.setAttribute("aria-label", `Audio coming soon for ${trackTitle}`);
        time.textContent = "Audio coming soon";
        progressContainer.tabIndex = -1;
        progressContainer.setAttribute("aria-disabled", "true");
        progressContainer.setAttribute("aria-valuetext", "Audio coming soon");

        return;

    }


    function updatePlayerAccessibility() {

        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        const percent = duration ? (audio.currentTime / duration) * 100 : 0;

        button.setAttribute(
            "aria-label",
            `${audio.paused ? "Play" : "Pause"} ${trackTitle}`
        );

        progressContainer.setAttribute("aria-valuenow", String(Math.round(percent)));
        progressContainer.setAttribute(
            "aria-valuetext",
            `${formatTime(audio.currentTime)} of ${formatTime(duration)}`
        );

    }


    button.addEventListener("click", () => {

        if(audio.paused){

            audio.play();
            button.textContent = "Ⅱ";

        } else {

            audio.pause();
            button.textContent = "▶";

        }

        updatePlayerAccessibility();

    });


    audio.addEventListener("loadedmetadata", () => {

        time.textContent =
        `0:00 / ${formatTime(audio.duration)}`;

        updatePlayerAccessibility();

    });


audio.addEventListener("timeupdate", () => {

    const percent =
    (audio.currentTime / audio.duration) * 100;


    if (!dragging) {

        progress.style.width = percent + "%";

    }


    time.textContent =
    `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

    updatePlayerAccessibility();

});

let dragging = false;
let wasPlaying = false;


function getPercentage(e) {

    const rect = progressContainer.getBoundingClientRect();

    let position = e.clientX - rect.left;

    position = Math.max(0, Math.min(position, rect.width));

    return position / rect.width;

}


progressContainer.addEventListener("pointerdown", (e) => {

    dragging = true;

    wasPlaying = !audio.paused;

    audio.pause();

    button.textContent = "▶";

    progressContainer.setPointerCapture(e.pointerId);


    const percentage = getPercentage(e);

    progress.style.width = (percentage * 100) + "%";

});


let latestPercentage = 0;
let animationFrame;


progressContainer.addEventListener("pointermove", (e) => {

    if(!dragging) return;


    latestPercentage = getPercentage(e);


    if(!animationFrame){

        animationFrame = requestAnimationFrame(updateVisualProgress);

    }

});


function updateVisualProgress(){

    progress.style.width = (latestPercentage * 100) + "%";

    animationFrame = null;

}

progressContainer.addEventListener("pointerup", (e) => {

    dragging = false;


    const percentage = getPercentage(e);

    audio.currentTime = percentage * audio.duration;


    if(wasPlaying){

        audio.play();

        button.textContent = "Ⅱ";

    }

});


progressContainer.addEventListener("pointercancel", () => {

    dragging = false;

});

progressContainer.addEventListener("keydown", (event) => {

    if (!Number.isFinite(audio.duration)) return;

    let nextTime = audio.currentTime;

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextTime -= 5;
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextTime += 5;
    } else if (event.key === "Home") {
        nextTime = 0;
    } else if (event.key === "End") {
        nextTime = audio.duration;
    } else {
        return;
    }

    event.preventDefault();

    audio.currentTime = Math.max(0, Math.min(nextTime, audio.duration));
    progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    updatePlayerAccessibility();

});

    audio.addEventListener("ended", () => {

        button.textContent="▶";
        updatePlayerAccessibility();

    });

    updatePlayerAccessibility();


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


const contactForm = document.querySelector(".contact-form");

if (contactForm) {

    const submitButton = contactForm.querySelector(".contact-submit");
    const formStatus = contactForm.querySelector(".form-status");

    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
        formStatus.textContent = "";

        const formData = new FormData(contactForm);
        const formValues = Object.fromEntries(formData.entries());

        try {

            const response = await fetch(contactForm.action, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formValues)
            });

            if (!response.ok) {
                throw new Error("The message could not be sent.");
            }

            contactForm.reset();
            formStatus.textContent = "Thank you — your request has been sent.";

        } catch (error) {

            formStatus.textContent = "Something went wrong. Please email Erik directly instead.";

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Send request";

        }

    });

}

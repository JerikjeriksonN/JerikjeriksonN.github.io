const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const workSection = document.querySelector("#work");
const additionalWork = workSection?.querySelector(".additional-work");

if (additionalWork) {
    ["dorsy", "suite-spot", "vst", "paradiso"].forEach(projectName => {
        const project = workSection.querySelector(`[data-work-project="${projectName}"]`);
        if (project) additionalWork.before(project);
    });
}

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
        slide.style.transition = reducedMotion.matches ? "none" : "transform 0.45s ease, opacity 0.45s ease";
        slide.style.opacity = index === 0 ? "1" : "0";
        slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");
        slide.tabIndex = index === 0 ? 0 : -1;

        if (slide instanceof HTMLImageElement) {
            slide.setAttribute("role", "button");
            slide.setAttribute("aria-label", `Open larger preview: ${slide.alt || "gallery image"}`);
        }

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
        const duration = reducedMotion.matches ? 0 : 450;

        if (nextSlide instanceof HTMLImageElement) nextSlide.loading = "eager";

        if (currentSlide instanceof HTMLVideoElement) {
            currentSlide.pause();
        }

        currentSlide.tabIndex = -1;
        nextSlide.tabIndex = 0;

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

        nextSlide.style.transition = duration
            ? "transform 0.45s ease, opacity 0.45s ease"
            : "none";
        currentSlide.style.transition = nextSlide.style.transition;

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


        }, duration);

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


const mediaLightbox = document.querySelector(".media-lightbox");

if (mediaLightbox) {

    const lightboxStage = mediaLightbox.querySelector(".media-lightbox-stage");
    const lightboxClose = mediaLightbox.querySelector(".media-lightbox-close");
    const lightboxPrev = mediaLightbox.querySelector(".media-lightbox-prev");
    const lightboxNext = mediaLightbox.querySelector(".media-lightbox-next");
    const lightboxCounter = mediaLightbox.querySelector(".media-lightbox-counter");

    let lightboxTrigger = null;
    let lightboxSlides = [];
    let lightboxIndex = 0;
    let lightboxTouchStartX = 0;
    let backgroundState = [];


    function renderLightboxMedia() {

        const previousVideo = lightboxStage.querySelector("video");
        const replacingFocusedMedia = lightboxStage.contains(document.activeElement);

        if (previousVideo) previousVideo.pause();

        lightboxStage.replaceChildren();

        const slide = lightboxSlides[lightboxIndex];

        if (!slide) return;

        let preview;

        if (slide instanceof HTMLVideoElement) {

            const startTime = slide.currentTime;

            slide.pause();

            preview = document.createElement("video");
            preview.controls = true;
            preview.autoplay = true;
            preview.playsInline = true;
            preview.preload = "metadata";
            preview.poster = slide.poster;
            preview.setAttribute(
                "aria-label",
                slide.getAttribute("aria-label") || "Enlarged video preview"
            );

            slide.querySelectorAll("source").forEach(source => {

                preview.appendChild(source.cloneNode(true));

            });

            if (slide.src && !preview.querySelector("source")) {

                preview.src = slide.currentSrc || slide.src;

            }

            preview.addEventListener("loadedmetadata", () => {

                if (Number.isFinite(startTime)) {

                    const maximumTime = Number.isFinite(preview.duration)
                        ? preview.duration
                        : startTime;

                    preview.currentTime = Math.min(startTime, maximumTime);

                }

                preview.play().catch(() => {});

            }, {once:true});

        } else {

            preview = document.createElement("img");
            preview.src = slide.currentSrc || slide.src;
            preview.alt = slide.alt || "Enlarged gallery image";

        }

        preview.className = "media-lightbox-content";
        lightboxStage.appendChild(preview);

        lightboxCounter.textContent =
            `${String(lightboxIndex + 1).padStart(2, "0")} / ${String(lightboxSlides.length).padStart(2, "0")}`;

        const hasMultipleSlides = lightboxSlides.length > 1;

        lightboxPrev.hidden = !hasMultipleSlides;
        lightboxNext.hidden = !hasMultipleSlides;

        mediaLightbox.setAttribute(
            "aria-label",
            `Media preview ${lightboxIndex + 1} of ${lightboxSlides.length}`
        );

        if (replacingFocusedMedia) lightboxClose.focus();

    }


    function openMediaLightbox(slide) {

        if (!mediaLightbox.hidden || slide.getAttribute("aria-hidden") === "true") return;

        const slider = slide.closest(".slider");

        lightboxTrigger = slide;
        lightboxSlides = Array.from(slider.querySelectorAll(".slide"));
        lightboxIndex = lightboxSlides.indexOf(slide);

        mediaLightbox.hidden = false;
        mediaLightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("media-lightbox-open");

        renderLightboxMedia();
        lightboxClose.focus();

        // Keep the underlying page out of both keyboard and assistive navigation.
        backgroundState = Array.from(document.querySelectorAll("body > header, body > main, body > footer"))
            .map(element => ({ element, inert: element.inert }));
        backgroundState.forEach(({ element }) => { element.inert = true; });

    }


    function moveMediaLightbox(direction) {

        if (lightboxSlides.length <= 1) return;

        lightboxIndex =
            (lightboxIndex + direction + lightboxSlides.length) % lightboxSlides.length;

        renderLightboxMedia();

    }


    function closeMediaLightbox() {

        const previewVideo = lightboxStage.querySelector("video");

        if (previewVideo) previewVideo.pause();

        mediaLightbox.hidden = true;
        mediaLightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("media-lightbox-open");
        lightboxStage.replaceChildren();
        lightboxCounter.textContent = "";
        lightboxSlides = [];
        lightboxIndex = 0;
        backgroundState.forEach(({ element, inert }) => { element.inert = inert; });
        backgroundState = [];

        if (lightboxTrigger) {

            lightboxTrigger.focus({preventScroll:true});
            lightboxTrigger = null;

        }

    }


    document.querySelectorAll(".slider .slide").forEach(slide => {

        slide.addEventListener("click", event => {

            event.preventDefault();
            openMediaLightbox(slide);

        });

        if (slide instanceof HTMLImageElement) {

            slide.addEventListener("keydown", event => {

                if (event.key !== "Enter" && event.key !== " ") return;

                event.preventDefault();
                openMediaLightbox(slide);

            });

        }

    });


    lightboxClose.addEventListener("click", closeMediaLightbox);
    lightboxPrev.addEventListener("click", () => moveMediaLightbox(-1));
    lightboxNext.addEventListener("click", () => moveMediaLightbox(1));

    lightboxStage.addEventListener("touchstart", event => {

        lightboxTouchStartX = event.touches[0].clientX;

    }, {passive:true});

    lightboxStage.addEventListener("touchend", event => {

        const difference = lightboxTouchStartX - event.changedTouches[0].clientX;

        if (Math.abs(difference) < 50) return;

        moveMediaLightbox(difference > 0 ? 1 : -1);

    }, {passive:true});

    mediaLightbox.addEventListener("click", event => {

        if (event.target === mediaLightbox || event.target === lightboxStage) {

            closeMediaLightbox();

        }

    });

    document.addEventListener("keydown", event => {

        if (mediaLightbox.hidden) return;

        if (event.key === "Escape") {

            event.preventDefault();
            closeMediaLightbox();
            return;

        }

        if (event.key === "Tab") {
            const focusable = Array.from(mediaLightbox.querySelectorAll("button:not([disabled]), video[controls]"))
                .filter(element => !element.hidden);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const outside = !mediaLightbox.contains(document.activeElement);

            if (event.shiftKey && (document.activeElement === first || outside)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || outside)) {
                event.preventDefault();
                first.focus();
            }
            return;
        }

        if (event.target instanceof HTMLVideoElement) return;

        if (event.key === "ArrowLeft") {

            event.preventDefault();
            moveMediaLightbox(-1);

        }

        if (event.key === "ArrowRight") {

            event.preventDefault();
            moveMediaLightbox(1);

        }

    });

    document.addEventListener("focusin", event => {
        if (!mediaLightbox.hidden && !mediaLightbox.contains(event.target)) {
            lightboxClose.focus();
        }
    });

}

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

            document.querySelectorAll(".audio-file").forEach(otherAudio => {

                if (otherAudio === audio || otherAudio.paused) return;

                otherAudio.pause();

                const otherPlayer = otherAudio.closest(".custom-player");
                const otherButton = otherPlayer.querySelector(".play-button");
                const otherTitle = otherPlayer.dataset.trackTitle || otherPlayer.querySelector(".player-title").textContent.trim();

                otherButton.textContent = "▶";
                otherButton.setAttribute("aria-label", `Play ${otherTitle}`);

            });

            audio.play();
            button.textContent = "Ⅱ";

        } else {

            audio.pause();
            button.textContent = "▶";

        }

        updatePlayerAccessibility();

    });


    function updateLoadedMetadata() {

        time.textContent =
        `0:00 / ${formatTime(audio.duration)}`;

        updatePlayerAccessibility();

    }


    audio.addEventListener("loadedmetadata", updateLoadedMetadata);

    if (audio.readyState >= 1) {

        updateLoadedMetadata();

    }


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

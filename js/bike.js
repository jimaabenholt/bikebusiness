const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const IMAGE_BUCKET =
    "bike-images";


const CATEGORY_NAMES = {

    MEN: "Herrecykel",

    WOMEN: "Damecykel",

    KIDS: "Børnecykel",

    OTHER: "Diverse"

};


// --------------------------------------------------
// PRIS
// --------------------------------------------------

function formatPrice(price) {

    if (
        price === null ||
        price === undefined
    ) {

        return "Pris ikke angivet";
    }


    return (
        Number(price).toLocaleString(
            "da-DK"
        ) +
        " kr."
    );
}


// --------------------------------------------------
// PUBLIC IMAGE URL
// --------------------------------------------------

function getPublicImageUrl(path) {

    const { data } =
        db.storage
            .from(IMAGE_BUCKET)
            .getPublicUrl(path);


    return data.publicUrl;
}


// --------------------------------------------------
// CACHE-SIKKER BILLED-URL
// --------------------------------------------------

function getVersionedImageUrl(
    bikeNumber,
    file
) {

    const path =
        `${bikeNumber}/${file.name}`;


    const publicUrl =
        getPublicImageUrl(path);


    const version =
        file.updated_at ||
        file.created_at ||
        file.id ||
        "";


    if (!version) {

        return publicUrl;
    }


    return (
        publicUrl +
        "?v=" +
        encodeURIComponent(version)
    );
}


// --------------------------------------------------
// FIND OG SORTER BILLEDER
// --------------------------------------------------

async function getBikeImages(
    bikeNumber
) {

    const { data, error } =
        await db.storage
            .from(IMAGE_BUCKET)
            .list(
                bikeNumber,
                {
                    limit: 100
                }
            );


    if (error) {

        console.error(
            "Kunne ikke hente billeder:",
            error
        );

        return [];
    }


    if (!data) {

        return [];
    }


    // --------------------------------------------------
    // KUN BILLEDFILER
    // --------------------------------------------------

    const imageFiles =
        data.filter(file =>
            /\.(webp|jpg|jpeg|png)$/i.test(
                file.name
            )
        );


    if (imageFiles.length === 0) {

        return [];
    }


    // --------------------------------------------------
    // FORETRÆK WEBP-SERIEN
    // --------------------------------------------------

    const webpFiles =
        imageFiles.filter(file =>
            /\.webp$/i.test(
                file.name
            )
        );


    const selectedFiles =
        webpFiles.length > 0
            ? webpFiles
            : imageFiles;


    // --------------------------------------------------
    // SORTER NUMERISK
    // --------------------------------------------------

    selectedFiles.sort(
        (a, b) => {

            const numberA =
                parseInt(
                    a.name,
                    10
                );


            const numberB =
                parseInt(
                    b.name,
                    10
                );


            if (
                !Number.isNaN(numberA) &&
                !Number.isNaN(numberB)
            ) {

                return numberA - numberB;
            }


            return a.name.localeCompare(
                b.name,
                "da",
                {
                    numeric: true
                }
            );
        }
    );


    // --------------------------------------------------
    // OPRET VERSIONEREDE URL'ER
    // --------------------------------------------------

    return selectedFiles.map(
        file =>
            getVersionedImageUrl(
                bikeNumber,
                file
            )
    );
}


// --------------------------------------------------
// HENT BIKE ID FRA URL
// --------------------------------------------------

const params =
    new URLSearchParams(
        window.location.search
    );


const bikeNumber =
    params.get("bike");


// --------------------------------------------------
// BYG SPECIFIKATIONSRÆKKE
// --------------------------------------------------

function buildSpecRow(
    label,
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";
    }


    return `
        <div class="bike-detail-spec-row">

            <span>
                ${label}
            </span>

            <strong>
                ${value}
            </strong>

        </div>
    `;
}


// --------------------------------------------------
// HENT CYKEL
// --------------------------------------------------

async function loadBike() {

    const container =
        document.getElementById(
            "bike-detail"
        );


    // --------------------------------------------------
    // INGEN CYKEL I URL
    // --------------------------------------------------

    if (!bikeNumber) {

        container.innerHTML = `
            <div class="bike-error">

                <p>
                    Ingen cykel valgt.
                </p>

                <a href="index.html">
                    ← Tilbage til cykler
                </a>

            </div>
        `;

        return;
    }


    container.innerHTML = `
        <div class="bike-loading">
            <p>Henter cykel...</p>
        </div>
    `;


    // --------------------------------------------------
    // HENT CYKEL FRA PUBLIC VIEW
    // --------------------------------------------------

    const { data: bike, error } =
        await db
            .from("public_bikes")
            .select("*")
            .eq(
                "bike_number",
                bikeNumber
            )
            .single();


    if (error) {

        console.error(
            "Kunne ikke hente cykel:",
            error
        );


        container.innerHTML = `
            <div class="bike-error">

                <p>
                    Cyklen kunne ikke findes.
                </p>

                <a href="index.html">
                    ← Tilbage til cykler
                </a>

            </div>
        `;

        return;
    }


    // --------------------------------------------------
    // HENT BILLEDER
    // --------------------------------------------------

    const images =
        await getBikeImages(
            bike.bike_number
        );


    // --------------------------------------------------
    // HOVEDBILLEDE
    // --------------------------------------------------

    let mainImageHtml;


    if (images.length > 0) {

        mainImageHtml = `
            <img
                src="${images[0]}"
                alt="${bike.brand} ${bike.model ?? ""}"
                class="bike-detail-main-image lightbox-image"
                data-image-index="0"
            >
        `;

    } else {

        mainImageHtml = `
            <div class="bike-detail-no-image">
                Ingen billeder endnu
            </div>
        `;
    }


    // --------------------------------------------------
    // ØVRIGE BILLEDER
    // --------------------------------------------------

    let galleryHtml = "";


    if (images.length > 1) {

        galleryHtml = `
            <section class="bike-detail-gallery-section">

                <div class="bike-detail-section-heading">

                    <p class="section-eyebrow">
                        Galleri
                    </p>

                    <h2>
                        Flere billeder
                    </h2>

                </div>


                <div class="bike-detail-gallery">

                    ${
                        images
                            .slice(1)
                            .map(
                                (
                                    imageUrl,
                                    index
                                ) => `
                                    <img
                                        src="${imageUrl}"
                                        alt="${bike.brand} ${bike.model ?? ""} - billede ${index + 2}"
                                        class="lightbox-image"
                                        data-image-index="${index + 1}"
                                        loading="lazy"
                                    >
                                `
                            )
                            .join("")
                    }

                </div>

            </section>
        `;
    }


    // --------------------------------------------------
    // SPECIFIKATIONER
    // --------------------------------------------------

    const specificationsHtml = `

        ${buildSpecRow(
            "Type",
            bike.category
        )}

        ${buildSpecRow(
            "Stel",
            bike.frame_size
        )}

        ${buildSpecRow(
            "Hjul",
            bike.wheel_size
        )}

        ${buildSpecRow(
            "Gear",
            bike.gears
        )}

        ${buildSpecRow(
            "Farve",
            bike.color
        )}

        ${buildSpecRow(
            "Bike ID",
            bike.bike_number
        )}
    `;


    // --------------------------------------------------
    // SIDETITEL
    // --------------------------------------------------

    document.title =
        `${bike.brand} ${bike.model ?? ""} | Bikebusiness`;


    // --------------------------------------------------
    // VIS CYKEL
    // --------------------------------------------------

    container.innerHTML = `

        <div class="bike-detail-back">

            <a href="index.html#bikes">
                ← Tilbage til cykler
            </a>

        </div>


        <article class="bike-detail-product">


            <!-- VENSTRE / BILLEDE -->

            <div class="bike-detail-image-column">

                <div class="bike-detail-main-image-wrapper">

                    ${mainImageHtml}

                </div>

            </div>


            <!-- HØJRE / INFORMATION -->

            <div class="bike-detail-info-column">

                <p class="bike-detail-category">

                    ${
                        CATEGORY_NAMES[
                            bike.main_category
                        ] ?? ""
                    }

                    ${
                        bike.category
                            ? ` · ${bike.category}`
                            : ""
                    }

                </p>


                <h1>
                    ${bike.brand}
                    ${bike.model ?? ""}
                </h1>


                <p class="bike-detail-price">

                    ${formatPrice(
                        bike.asking_price
                    )}

                </p>


                <div class="bike-detail-specs">

                    ${specificationsHtml}

                </div>


                <div class="bike-detail-viewing">

                    <strong>
                        Interesseret i cyklen?
                    </strong>

                    <p>
                        Cyklen kan ses og prøves
                        efter aftale i Ringe.
                    </p>

                </div>

            </div>

        </article>


        ${
            bike.sales_description
                ? `
                    <section class="bike-detail-text-section">

                        <div class="bike-detail-section-heading">

                            <p class="section-eyebrow">
                                Beskrivelse
                            </p>

                            <h2>
                                Om cyklen
                            </h2>

                        </div>


                        <div class="bike-detail-text">

                            <p>
                                ${bike.sales_description}
                            </p>

                        </div>

                    </section>
                `
                : ""
        }


        ${
            bike.work_done
                ? `
                    <section class="bike-detail-work-section">

                        <div class="bike-detail-section-heading">

                            <p class="section-eyebrow">
                                Gennemgået
                            </p>

                            <h2>
                                Klargøring
                            </h2>

                        </div>


                        <div class="bike-detail-work">

                            <p>
                                ${bike.work_done}
                            </p>

                        </div>

                    </section>
                `
                : ""
        }


        ${galleryHtml}


        <!-- =========================================
             LIGHTBOX
             ========================================= -->

        <div
            id="image-lightbox"
            class="image-lightbox"
            hidden
        >

            <button
                type="button"
                class="lightbox-close"
                aria-label="Luk billede"
            >
                ×
            </button>


            <button
                type="button"
                class="lightbox-navigation lightbox-previous"
                aria-label="Forrige billede"
            >
                ‹
            </button>


            <div class="lightbox-content">

                <img
                    id="lightbox-image"
                    src=""
                    alt=""
                >

                <div
                    id="lightbox-counter"
                    class="lightbox-counter"
                ></div>

            </div>


            <button
                type="button"
                class="lightbox-navigation lightbox-next"
                aria-label="Næste billede"
            >
                ›
            </button>

        </div>
    `;


    // --------------------------------------------------
    // LIGHTBOX
    // --------------------------------------------------

    if (images.length === 0) {

        return;
    }


    const lightbox =
        document.getElementById(
            "image-lightbox"
        );


    const lightboxImage =
        document.getElementById(
            "lightbox-image"
        );


    const lightboxCounter =
        document.getElementById(
            "lightbox-counter"
        );


    const lightboxImages =
        document.querySelectorAll(
            ".lightbox-image"
        );


    const closeButton =
        document.querySelector(
            ".lightbox-close"
        );


    const previousButton =
        document.querySelector(
            ".lightbox-previous"
        );


    const nextButton =
        document.querySelector(
            ".lightbox-next"
        );


    let currentImageIndex = 0;


    // --------------------------------------------------
    // TOUCH / SWIPE
    // --------------------------------------------------

    let touchStartX = 0;
    let touchStartY = 0;

    const SWIPE_MIN_DISTANCE = 50;


    // --------------------------------------------------
    // VIS BILLEDE I LIGHTBOX
    // --------------------------------------------------

    function showLightboxImage(index) {

        if (images.length === 0) {

            return;
        }


        // GÅ FRA FØRSTE TIL SIDSTE

        if (index < 0) {

            index =
                images.length - 1;
        }


        // GÅ FRA SIDSTE TIL FØRSTE

        if (index >= images.length) {

            index = 0;
        }


        currentImageIndex =
            index;


        lightboxImage.src =
            images[
                currentImageIndex
            ];


        lightboxImage.alt =
            `${bike.brand} ${bike.model ?? ""} - billede ${currentImageIndex + 1}`;


        lightboxCounter.textContent =
            `${currentImageIndex + 1} / ${images.length}`;


        // SKJUL NAVIGATION HVIS DER KUN ER ÉT BILLEDE

        const hideNavigation =
            images.length <= 1;


        previousButton.hidden =
            hideNavigation;


        nextButton.hidden =
            hideNavigation;
    }


    // --------------------------------------------------
    // ÅBN LIGHTBOX
    // --------------------------------------------------

    function openLightbox(index) {

        showLightboxImage(
            index
        );


        lightbox.hidden =
            false;


        document.body.classList.add(
            "lightbox-open"
        );
    }


    // --------------------------------------------------
    // LUK LIGHTBOX
    // --------------------------------------------------

    function closeLightbox() {

        lightbox.hidden =
            true;


        document.body.classList.remove(
            "lightbox-open"
        );


        lightboxImage.src =
            "";
    }


    // --------------------------------------------------
    // KLIK PÅ BILLEDER
    // --------------------------------------------------

    lightboxImages.forEach(
        image => {

            image.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            image.dataset
                                .imageIndex
                        );


                    openLightbox(
                        index
                    );
                }
            );
        }
    );


    // --------------------------------------------------
    // LUK-KNAP
    // --------------------------------------------------

    closeButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            closeLightbox();
        }
    );


    // --------------------------------------------------
    // FORRIGE
    // --------------------------------------------------

    previousButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            showLightboxImage(
                currentImageIndex - 1
            );
        }
    );


    // --------------------------------------------------
    // NÆSTE
    // --------------------------------------------------

    nextButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            showLightboxImage(
                currentImageIndex + 1
            );
        }
    );


    // --------------------------------------------------
    // KLIK PÅ BAGGRUND
    // --------------------------------------------------

    lightbox.addEventListener(
        "click",
        event => {

            if (
                event.target === lightbox ||
                event.target.classList.contains(
                    "lightbox-content"
                )
            ) {

                closeLightbox();
            }
        }
    );


    // --------------------------------------------------
    // SWIPE - START
    // --------------------------------------------------

    lightboxImage.addEventListener(
        "touchstart",
        event => {

            if (
                event.touches.length !== 1
            ) {

                return;
            }


            touchStartX =
                event.touches[0].clientX;


            touchStartY =
                event.touches[0].clientY;
        },
        {
            passive: true
        }
    );


    // --------------------------------------------------
    // SWIPE - SLUT
    // --------------------------------------------------

    lightboxImage.addEventListener(
        "touchend",
        event => {

            if (
                event.changedTouches.length !== 1 ||
                images.length <= 1
            ) {

                return;
            }


            const touchEndX =
                event.changedTouches[0]
                    .clientX;


            const touchEndY =
                event.changedTouches[0]
                    .clientY;


            const differenceX =
                touchEndX -
                touchStartX;


            const differenceY =
                touchEndY -
                touchStartY;


            // --------------------------------------------------
            // IGNORER PRIMÆRT LODRET BEVÆGELSE
            // --------------------------------------------------

            if (
                Math.abs(differenceY) >
                Math.abs(differenceX)
            ) {

                return;
            }


            // --------------------------------------------------
            // IGNORER FOR KORTE BEVÆGELSER
            // --------------------------------------------------

            if (
                Math.abs(differenceX) <
                SWIPE_MIN_DISTANCE
            ) {

                return;
            }


            // --------------------------------------------------
            // SWIPE MOD VENSTRE = NÆSTE
            // --------------------------------------------------

            if (differenceX < 0) {

                showLightboxImage(
                    currentImageIndex + 1
                );

                return;
            }


            // --------------------------------------------------
            // SWIPE MOD HØJRE = FORRIGE
            // --------------------------------------------------

            showLightboxImage(
                currentImageIndex - 1
            );
        },
        {
            passive: true
        }
    );


    // --------------------------------------------------
    // TASTATUR
    // --------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (lightbox.hidden) {

                return;
            }


            // ESC = LUK

            if (event.key === "Escape") {

                closeLightbox();

                return;
            }


            // VENSTRE PIL

            if (
                event.key === "ArrowLeft" &&
                images.length > 1
            ) {

                showLightboxImage(
                    currentImageIndex - 1
                );

                return;
            }


            // HØJRE PIL

            if (
                event.key === "ArrowRight" &&
                images.length > 1
            ) {

                showLightboxImage(
                    currentImageIndex + 1
                );
            }
        }
    );
}


// --------------------------------------------------
// START
// --------------------------------------------------

loadBike();
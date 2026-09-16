const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";


const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const IMAGE_BUCKET =
    "bike-images";


let allBikes = [];


// --------------------------------------------------
// KATEGORIER
// --------------------------------------------------

const CATEGORY_NAMES = {

    MEN: "Herrecykler",

    WOMEN: "Damecykler",

    KIDS: "Børnecykler",

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
// FIND HOVEDBILLEDE
// --------------------------------------------------

async function getMainBikeImage(
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
            `Kunne ikke hente billeder for ${bikeNumber}:`,
            error
        );

        return null;
    }


    if (!data) {

        return null;
    }


    const imageFiles =
        data.filter(file =>
            /\.(webp|jpg|jpeg|png)$/i.test(
                file.name
            )
        );


    if (imageFiles.length === 0) {

        return null;
    }


    // --------------------------------------------------
    // FORETRÆK WEBP
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
    // 01 ER ALTID HOVEDBILLEDE
    // --------------------------------------------------

    let mainImage =
        selectedFiles.find(
            file =>
                /^01\.(webp|jpg|jpeg|png)$/i.test(
                    file.name
                )
        );


    if (!mainImage) {

        mainImage =
            selectedFiles[0];
    }


    return getVersionedImageUrl(
        bikeNumber,
        mainImage
    );
}


// --------------------------------------------------
// VIS CYKLER
// --------------------------------------------------

async function renderBikes(
    bikes
) {

    const bikeList =
        document.getElementById(
            "bike-list"
        );


    bikeList.innerHTML = "";


    if (
        !bikes ||
        bikes.length === 0
    ) {

        bikeList.innerHTML = `
            <div class="empty-bike-list">

                <h3>
                    Ingen cykler i denne kategori lige nu
                </h3>

                <p>
                    Der kommer løbende nye
                    istandsatte cykler til salg.
                </p>

            </div>
        `;

        return;
    }


    for (const bike of bikes) {

        const mainImageUrl =
            await getMainBikeImage(
                bike.bike_number
            );


        const bikeCard =
            document.createElement(
                "article"
            );


        bikeCard.classList.add(
            "bike-card"
        );


        let imageHtml;


        if (mainImageUrl) {

            imageHtml = `
                <a
                    href="bike.html?bike=${encodeURIComponent(
                        bike.bike_number
                    )}"
                    class="bike-card-image-link"
                >
                    <img
                        src="${mainImageUrl}"
                        alt="${bike.brand} ${bike.model ?? ""}"
                        loading="lazy"
                    >
                </a>
            `;

        } else {

            imageHtml = `
                <a
                    href="bike.html?bike=${encodeURIComponent(
                        bike.bike_number
                    )}"
                    class="bike-card-image-link"
                >
                    <div class="bike-no-image">
                        Ingen billeder endnu
                    </div>
                </a>
            `;
        }


        bikeCard.innerHTML = `

            ${imageHtml}


            <div class="bike-card-content">

                <p class="bike-card-category">

                    ${
                        CATEGORY_NAMES[
                            bike.main_category
                        ] ?? ""
                    }

                </p>


                <h3>

                    <a
                        href="bike.html?bike=${encodeURIComponent(
                            bike.bike_number
                        )}"
                    >
                        ${bike.brand}
                        ${bike.model ?? ""}
                    </a>

                </h3>


                <div class="bike-card-specs">

                    ${
                        bike.category
                            ? `
                                <div class="bike-spec-row">
                                    <span>Type</span>
                                    <strong>${bike.category}</strong>
                                </div>
                            `
                            : ""
                    }

                    ${
                        bike.frame_size
                            ? `
                                <div class="bike-spec-row">
                                    <span>Stel</span>
                                    <strong>${bike.frame_size}</strong>
                                </div>
                            `
                            : ""
                    }

                    ${
                        bike.wheel_size
                            ? `
                                <div class="bike-spec-row">
                                    <span>Hjul</span>
                                    <strong>${bike.wheel_size}</strong>
                                </div>
                            `
                            : ""
                    }

                    ${
                        bike.gears !== null &&
                        bike.gears !== undefined
                            ? `
                                <div class="bike-spec-row">
                                    <span>Gear</span>
                                    <strong>${bike.gears}</strong>
                                </div>
                            `
                            : ""
                    }

                </div>


                <p class="bike-card-price">

                    ${formatPrice(
                        bike.asking_price
                    )}

                </p>


                <a
                    class="bike-link"
                    href="bike.html?bike=${encodeURIComponent(
                        bike.bike_number
                    )}"
                >
                    Se cykel
                </a>

            </div>
        `;


        bikeList.appendChild(
            bikeCard
        );
    }
}


// --------------------------------------------------
// FILTRER KATEGORI
// --------------------------------------------------

async function filterByCategory(
    category
) {

    const filteredBikes =
        allBikes.filter(
            bike =>
                bike.main_category ===
                category
        );


    const bikeListTitle =
        document.getElementById(
            "bike-list-title"
        );


    bikeListTitle.textContent =
        CATEGORY_NAMES[category] ??
        "Cykler";


    document.getElementById(
        "show-all-bikes"
    ).hidden = false;


    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(card => {

            card.classList.toggle(
                "active",
                card.dataset.category ===
                    category
            );
        });


    await renderBikes(
        filteredBikes
    );


    document.getElementById(
        "bikes"
    ).scrollIntoView({
        behavior: "smooth"
    });
}


// --------------------------------------------------
// VIS ALLE
// --------------------------------------------------

async function showAllBikes() {

    document.getElementById(
        "bike-list-title"
    ).textContent =
        "Nyeste cykler";


    document.getElementById(
        "show-all-bikes"
    ).hidden =
        true;


    document
        .querySelectorAll(
            ".category-card"
        )
        .forEach(card => {

            card.classList.remove(
                "active"
            );
        });


    await renderBikes(
        allBikes
    );
}


// --------------------------------------------------
// HENT CYKLER
// --------------------------------------------------

async function loadBikes() {

    const bikeList =
        document.getElementById(
            "bike-list"
        );


    bikeList.innerHTML =
        "<p>Henter cykler...</p>";


    const { data: bikes, error } =
        await db
            .from("public_bikes")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Kunne ikke hente cykler:",
            error
        );


        bikeList.innerHTML =
            "<p>Cyklerne kunne ikke hentes.</p>";

        return;
    }


    allBikes =
        bikes ?? [];


    await renderBikes(
        allBikes
    );
}


// --------------------------------------------------
// EVENTS
// --------------------------------------------------

document
    .querySelectorAll(
        ".category-card"
    )
    .forEach(card => {

        card.addEventListener(
            "click",
            async () => {

                await filterByCategory(
                    card.dataset.category
                );
            }
        );
    });


document
    .getElementById(
        "show-all-bikes"
    )
    .addEventListener(
        "click",
        showAllBikes
    );


// --------------------------------------------------
// START
// --------------------------------------------------

loadBikes();
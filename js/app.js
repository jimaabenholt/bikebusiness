const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const IMAGE_BUCKET = "bike-images";


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
        Number(price).toLocaleString("da-DK") +
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


    // Fallback hvis 01 mod forventning mangler

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


    if (
        !bikes ||
        bikes.length === 0
    ) {

        bikeList.innerHTML =
            "<p>Der er ingen cykler til salg lige nu.</p>";

        return;
    }


    bikeList.innerHTML =
        "";


    // --------------------------------------------------
    // BYG CYKELKORT
    // --------------------------------------------------

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
                <img
                    src="${mainImageUrl}"
                    alt="${bike.brand} ${bike.model ?? ""}"
                    loading="lazy"
                >
            `;

        } else {

            imageHtml = `
                <div class="bike-no-image">
                    Ingen billeder endnu
                </div>
            `;
        }


        bikeCard.innerHTML = `

            ${imageHtml}


            <h2>
                ${bike.brand}
                ${bike.model ?? ""}
            </h2>


            <p>
                <strong>
                    ${formatPrice(
                        bike.asking_price
                    )}
                </strong>
            </p>


            ${
                bike.category
                    ? `
                        <p>
                            ${bike.category}
                        </p>
                    `
                    : ""
            }


            ${
                bike.frame_size
                    ? `
                        <p>
                            Stel:
                            ${bike.frame_size}
                        </p>
                    `
                    : ""
            }


            <p>
                <a
                    href="bike.html?bike=${encodeURIComponent(
                        bike.bike_number
                    )}"
                >
                    Se cykel
                </a>
            </p>
        `;


        bikeList.appendChild(
            bikeCard
        );
    }
}


// --------------------------------------------------
// START
// --------------------------------------------------

loadBikes();
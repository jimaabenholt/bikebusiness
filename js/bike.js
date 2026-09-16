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


    // Supabase giver os et tidspunkt for,
    // hvornår filen sidst blev ændret.
    //
    // Når fx 01.webp bliver erstattet,
    // ændres denne værdi og dermed URL'en.

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


    // Kun egentlige billedfiler

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
    //
    // 01.webp
    // 02.webp
    // 03.webp
    // ...
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


    console.log(
        `Billedrækkefølge for ${bikeNumber}:`,
        selectedFiles.map(file => ({
            name: file.name,
            updated_at: file.updated_at
        }))
    );


    // --------------------------------------------------
    // OPRET VERSIONEREDE URL'ER
    // --------------------------------------------------

    return selectedFiles.map(file =>
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
// HENT CYKEL
// --------------------------------------------------

async function loadBike() {

    const container =
        document.getElementById(
            "bike-detail"
        );


    if (!bikeNumber) {

        container.innerHTML =
            "<p>Ingen cykel valgt.</p>";

        return;
    }


    container.innerHTML =
        "<p>Henter cykel...</p>";


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

        container.innerHTML =
            "<p>Cyklen kunne ikke findes.</p>";

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
    // BYG BILLEDGALLERI
    // --------------------------------------------------

    let imageHtml;


    if (images.length > 0) {

        imageHtml =
            images
                .map(
                    (imageUrl, index) => {

                        const imageNumber =
                            index + 1;

                        const imageClass =
                            index === 0
                                ? "main-bike-image"
                                : "bike-gallery-image";


                        return `
                            <img
                                src="${imageUrl}"
                                alt="${bike.brand} ${bike.model ?? ""} - billede ${imageNumber}"
                                class="${imageClass}"
                                loading="${index === 0 ? "eager" : "lazy"}"
                            >
                        `;
                    }
                )
                .join("");

    } else {

        imageHtml = `
            <div class="bike-no-image">
                Ingen billeder endnu
            </div>
        `;
    }


    // --------------------------------------------------
    // VIS CYKEL
    // --------------------------------------------------

    container.innerHTML = `

        <p>
            <a href="index.html">
                ← Tilbage til cykler
            </a>
        </p>


        <h1>
            ${bike.brand}
            ${bike.model ?? ""}
        </h1>


        <p>
            <strong>
                ${formatPrice(
                    bike.asking_price
                )}
            </strong>
        </p>


        <div class="bike-images">

            ${imageHtml}

        </div>


        <h2>
            Om cyklen
        </h2>


        <p>
            ${
                bike.sales_description ??
                ""
            }
        </p>


        <h2>
            Specifikationer
        </h2>


        <p>
            Bike ID:
            ${bike.bike_number}
        </p>


        ${
            bike.category
                ? `
                    <p>
                        Kategori:
                        ${bike.category}
                    </p>
                `
                : ""
        }


        ${
            bike.frame_size
                ? `
                    <p>
                        Stelstørrelse:
                        ${bike.frame_size}
                    </p>
                `
                : ""
        }


        ${
            bike.wheel_size
                ? `
                    <p>
                        Hjulstørrelse:
                        ${bike.wheel_size}
                    </p>
                `
                : ""
        }


        ${
            bike.gears !== null &&
            bike.gears !== undefined
                ? `
                    <p>
                        Gear:
                        ${bike.gears}
                    </p>
                `
                : ""
        }


        ${
            bike.color
                ? `
                    <p>
                        Farve:
                        ${bike.color}
                    </p>
                `
                : ""
        }


        ${
            bike.work_done
                ? `
                    <h2>
                        Klargøring
                    </h2>

                    <p>
                        ${bike.work_done}
                    </p>
                `
                : ""
        }
    `;
}


// --------------------------------------------------
// START
// --------------------------------------------------

loadBike();
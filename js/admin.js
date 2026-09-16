const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// --------------------------------------------------
// INDSTILLINGER
// --------------------------------------------------

const IMAGE_BUCKET = "bike-images";
const MAX_IMAGES = 12;
const MAX_IMAGE_SIZE = 1600;
const IMAGE_QUALITY = 0.82;


// --------------------------------------------------
// ELEMENTER
// --------------------------------------------------

const loginSection =
    document.getElementById("login-section");

const adminSection =
    document.getElementById("admin-section");

const loginForm =
    document.getElementById("login-form");

const loginMessage =
    document.getElementById("login-message");

const logoutButton =
    document.getElementById("logout-button");

const newBikeButton =
    document.getElementById("new-bike-button");

const bikeFormSection =
    document.getElementById("bike-form-section");

const bikeForm =
    document.getElementById("bike-form");

const bikeFormTitle =
    document.getElementById("bike-form-title");

const cancelBikeFormButton =
    document.getElementById("cancel-bike-form");

const bikeFormMessage =
    document.getElementById("bike-form-message");

const bikeImagesInput =
    document.getElementById("bike-images");

const uploadImagesButton =
    document.getElementById("upload-images-button");

const imageUploadMessage =
    document.getElementById("image-upload-message");

const currentBikeImages =
    document.getElementById("current-bike-images");


// --------------------------------------------------
// HJÆLPEFUNKTIONER
// --------------------------------------------------

function formatPrice(price) {

    if (
        price === null ||
        price === undefined
    ) {
        return "-";
    }

    return (
        Number(price).toLocaleString("da-DK") +
        " kr."
    );
}


function getTextValue(id) {

    const value =
        document.getElementById(id)
            .value
            .trim();

    return value || null;
}


function getNumberValue(id) {

    const value =
        document.getElementById(id).value;

    if (value === "") {
        return null;
    }

    return Number(value);
}


function imageFileNumber(fileName) {

    const number =
        parseInt(fileName, 10);

    return Number.isNaN(number)
        ? 999
        : number;
}


function imageFileName(index) {

    return (
        String(index).padStart(2, "0") +
        ".webp"
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
// HENT BILLEDER
// --------------------------------------------------

async function getBikeImages(bikeNumber) {

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


    const images =
        data.filter(file =>
            /\.(webp|jpg|jpeg|png)$/i.test(
                file.name
            )
        );


    const webpImages =
        images.filter(file =>
            /\.webp$/i.test(file.name)
        );


    const selectedImages =
        webpImages.length > 0
            ? webpImages
            : images;


    selectedImages.sort(
        (a, b) =>
            imageFileNumber(a.name) -
            imageFileNumber(b.name)
    );


    return selectedImages.map(file => ({
        name: file.name,
        path: `${bikeNumber}/${file.name}`
    }));
}


// --------------------------------------------------
// VIS BILLEDER I ADMIN
// --------------------------------------------------

async function showCurrentBikeImages(
    bikeNumber
) {

    currentBikeImages.innerHTML =
        "<p>Henter billeder...</p>";


    const images =
        await getBikeImages(
            bikeNumber
        );


    currentBikeImages.innerHTML = "";


    if (images.length === 0) {

        currentBikeImages.innerHTML =
            "<p>Ingen billeder uploadet endnu.</p>";

        return;
    }


    images.forEach(
        (imageInfo, index) => {

            const wrapper =
                document.createElement("div");


            wrapper.style.display =
                "inline-block";

            wrapper.style.margin =
                "0 14px 20px 0";

            wrapper.style.verticalAlign =
                "top";

            wrapper.style.width =
                "210px";


            // ------------------------------
            // BILLEDE
            // ------------------------------

            const image =
                document.createElement("img");


            image.src =
                getPublicImageUrl(
                    imageInfo.path
                ) +
                `?v=${Date.now()}-${Math.random()}`;


            image.alt =
                `${bikeNumber} billede ${index + 1}`;


            image.style.width =
                "210px";

            image.style.height =
                "150px";

            image.style.objectFit =
                "cover";

            image.style.display =
                "block";


            // ------------------------------
            // LABEL
            // ------------------------------

            const label =
                document.createElement("p");


            label.style.margin =
                "6px 0";


            if (index === 0) {

                label.innerHTML =
                    "<strong>★ Hovedbillede</strong>";

            } else {

                label.textContent =
                    `Billede ${index + 1}`;
            }


            // ------------------------------
            // KNAPPER
            // ------------------------------

            const controls =
                document.createElement("div");


            // FLYT TIDLIGERE

            const leftButton =
                document.createElement("button");

            leftButton.type =
                "button";

            leftButton.textContent =
                "← Tidligere";

            leftButton.disabled =
                index === 0;


            leftButton.addEventListener(
                "click",
                async () => {

                    await moveBikeImage(
                        bikeNumber,
                        index,
                        index - 1
                    );
                }
            );


            // FLYT SENERE

            const rightButton =
                document.createElement("button");

            rightButton.type =
                "button";

            rightButton.textContent =
                "→ Senere";

            rightButton.disabled =
                index === images.length - 1;


            rightButton.addEventListener(
                "click",
                async () => {

                    await moveBikeImage(
                        bikeNumber,
                        index,
                        index + 1
                    );
                }
            );


            controls.appendChild(
                leftButton
            );

            controls.appendChild(
                rightButton
            );


            // ------------------------------
            // GØR TIL HOVEDBILLEDE
            // ------------------------------

            if (index > 0) {

                const mainButton =
                    document.createElement("button");

                mainButton.type =
                    "button";

                mainButton.textContent =
                    "★ Hovedbillede";

                mainButton.style.display =
                    "block";

                mainButton.style.marginTop =
                    "6px";


                mainButton.addEventListener(
                    "click",
                    async () => {

                        await makeMainImage(
                            bikeNumber,
                            index
                        );
                    }
                );


                controls.appendChild(
                    mainButton
                );
            }


            // ------------------------------
            // SLET
            // ------------------------------

            const deleteButton =
                document.createElement("button");

            deleteButton.type =
                "button";

            deleteButton.textContent =
                "Slet";

            deleteButton.style.display =
                "block";

            deleteButton.style.marginTop =
                "6px";


            deleteButton.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            `Vil du slette billede ${index + 1}?`
                        );


                    if (!confirmed) {
                        return;
                    }


                    await deleteBikeImage(
                        bikeNumber,
                        index
                    );
                }
            );


            controls.appendChild(
                deleteButton
            );


            wrapper.appendChild(
                image
            );

            wrapper.appendChild(
                label
            );

            wrapper.appendChild(
                controls
            );


            currentBikeImages.appendChild(
                wrapper
            );
        }
    );
}


// --------------------------------------------------
// KOMPRESSER BILLEDE
// --------------------------------------------------

function compressImage(file) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            const objectUrl =
                URL.createObjectURL(file);


            image.onload = () => {

                let width =
                    image.width;

                let height =
                    image.height;


                if (
                    width > MAX_IMAGE_SIZE ||
                    height > MAX_IMAGE_SIZE
                ) {

                    const scale =
                        Math.min(
                            MAX_IMAGE_SIZE / width,
                            MAX_IMAGE_SIZE / height
                        );


                    width =
                        Math.round(
                            width * scale
                        );

                    height =
                        Math.round(
                            height * scale
                        );
                }


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    width;

                canvas.height =
                    height;


                const context =
                    canvas.getContext("2d");


                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );


                canvas.toBlob(
                    blob => {

                        URL.revokeObjectURL(
                            objectUrl
                        );


                        if (!blob) {

                            reject(
                                new Error(
                                    "Billedet kunne ikke komprimeres."
                                )
                            );

                            return;
                        }


                        resolve(blob);

                    },
                    "image/webp",
                    IMAGE_QUALITY
                );
            };


            image.onerror = () => {

                URL.revokeObjectURL(
                    objectUrl
                );


                reject(
                    new Error(
                        "Billedet kunne ikke læses."
                    )
                );
            };


            image.src =
                objectUrl;
        }
    );
}


// --------------------------------------------------
// DOWNLOAD BILLEDE
// --------------------------------------------------

async function downloadBikeImage(path) {

    const { data, error } =
        await db.storage
            .from(IMAGE_BUCKET)
            .download(path);


    if (error) {
        throw error;
    }


    return data;
}


// --------------------------------------------------
// HENT ALLE BILLEDER SOM BLOBS
// --------------------------------------------------

async function getBikeImageBlobs(
    bikeNumber
) {

    const images =
        await getBikeImages(
            bikeNumber
        );


    const blobs = [];


    for (const image of images) {

        const blob =
            await downloadBikeImage(
                image.path
            );


        blobs.push(blob);
    }


    return {
        images,
        blobs
    };
}


// --------------------------------------------------
// SKRIV BILLEDSERIE ROBUST
// --------------------------------------------------

async function rewriteBikeImages(
    bikeNumber,
    blobs
) {

    // --------------------------------------------------
    // 1. FIND NUVÆRENDE FILER
    // --------------------------------------------------

    const currentImages =
        await getBikeImages(
            bikeNumber
        );


    // --------------------------------------------------
    // 2. UPLOAD MIDLERTIDIGE FILER
    //
    // Dermed har vi en kopi i Storage,
    // før de gamle 01/02/03-filer slettes.
    // --------------------------------------------------

    const operationId =
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;


    const temporaryPaths = [];


    for (
        let i = 0;
        i < blobs.length;
        i++
    ) {

        const temporaryPath =
            `${bikeNumber}/temp-${operationId}-${i + 1}.webp`;


        const { error } =
            await db.storage
                .from(IMAGE_BUCKET)
                .upload(
                    temporaryPath,
                    blobs[i],
                    {
                        upsert: false,
                        contentType:
                            "image/webp"
                    }
                );


        if (error) {

            // Ryd eventuelle temp-filer op

            if (
                temporaryPaths.length >
                0
            ) {

                await db.storage
                    .from(IMAGE_BUCKET)
                    .remove(
                        temporaryPaths
                    );
            }


            throw error;
        }


        temporaryPaths.push(
            temporaryPath
        );
    }


    // --------------------------------------------------
    // 3. SLET DE GAMLE NUMMEREREDE BILLEDER
    // --------------------------------------------------

    if (
        currentImages.length >
        0
    ) {

        const oldPaths =
            currentImages.map(
                image => image.path
            );


        const { error } =
            await db.storage
                .from(IMAGE_BUCKET)
                .remove(
                    oldPaths
                );


        if (error) {

            await db.storage
                .from(IMAGE_BUCKET)
                .remove(
                    temporaryPaths
                );


            throw error;
        }
    }


    // --------------------------------------------------
    // 4. DOWNLOAD TEMP-FILERNE
    //
    // Vi bruger dem som sikker kilde til
    // den nye nummererede serie.
    // --------------------------------------------------

    const safeBlobs = [];


    for (
        const temporaryPath
        of temporaryPaths
    ) {

        const blob =
            await downloadBikeImage(
                temporaryPath
            );


        safeBlobs.push(blob);
    }


    // --------------------------------------------------
    // 5. OPRET NY 01, 02, 03...
    // --------------------------------------------------

    const createdPaths = [];


    try {

        for (
            let i = 0;
            i < safeBlobs.length;
            i++
        ) {

            const filePath =
                `${bikeNumber}/${imageFileName(i + 1)}`;


            const { error } =
                await db.storage
                    .from(IMAGE_BUCKET)
                    .upload(
                        filePath,
                        safeBlobs[i],
                        {
                            upsert: false,
                            contentType:
                                "image/webp"
                        }
                    );


            if (error) {
                throw error;
            }


            createdPaths.push(
                filePath
            );
        }

    } catch (error) {

        console.error(
            "Fejl under oprettelse af ny billedserie:",
            error
        );


        throw error;
    }


    // --------------------------------------------------
    // 6. SLET TEMP-FILER
    // --------------------------------------------------

    if (
        temporaryPaths.length >
        0
    ) {

        const { error } =
            await db.storage
                .from(IMAGE_BUCKET)
                .remove(
                    temporaryPaths
                );


        if (error) {

            console.warn(
                "Temp-filer kunne ikke slettes:",
                error
            );
        }
    }
}


// --------------------------------------------------
// FLYT BILLEDE ÉN POSITION
// --------------------------------------------------

async function moveBikeImage(
    bikeNumber,
    fromIndex,
    toIndex
) {

    imageUploadMessage.textContent =
        "Ændrer billedrækkefølge...";


    try {

        const {
            blobs
        } =
            await getBikeImageBlobs(
                bikeNumber
            );


        if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= blobs.length ||
            toIndex >= blobs.length
        ) {

            imageUploadMessage.textContent =
                "";

            return;
        }


        const movedBlob =
            blobs.splice(
                fromIndex,
                1
            )[0];


        blobs.splice(
            toIndex,
            0,
            movedBlob
        );


        await rewriteBikeImages(
            bikeNumber,
            blobs
        );


        imageUploadMessage.textContent =
            "Billedrækkefølgen er ændret.";


        await showCurrentBikeImages(
            bikeNumber
        );

    } catch (error) {

        console.error(error);


        imageUploadMessage.textContent =
            "Kunne ikke ændre billedrækkefølgen.";
    }
}


// --------------------------------------------------
// GØR TIL HOVEDBILLEDE
// --------------------------------------------------

async function makeMainImage(
    bikeNumber,
    imageIndex
) {

    if (imageIndex === 0) {
        return;
    }


    imageUploadMessage.textContent =
        "Ændrer hovedbillede...";


    try {

        const {
            blobs
        } =
            await getBikeImageBlobs(
                bikeNumber
            );


        if (
            imageIndex < 0 ||
            imageIndex >= blobs.length
        ) {

            return;
        }


        // Fjern valgt billede fra dets position

        const selectedBlob =
            blobs.splice(
                imageIndex,
                1
            )[0];


        // Sæt det først

        blobs.unshift(
            selectedBlob
        );


        await rewriteBikeImages(
            bikeNumber,
            blobs
        );


        imageUploadMessage.textContent =
            "Hovedbilledet er ændret.";


        await showCurrentBikeImages(
            bikeNumber
        );

    } catch (error) {

        console.error(error);


        imageUploadMessage.textContent =
            "Hovedbilledet kunne ikke ændres.";
    }
}


// --------------------------------------------------
// SLET BILLEDE
// --------------------------------------------------

async function deleteBikeImage(
    bikeNumber,
    deleteIndex
) {

    imageUploadMessage.textContent =
        "Sletter billede...";


    try {

        const {
            blobs
        } =
            await getBikeImageBlobs(
                bikeNumber
            );


        if (
            deleteIndex < 0 ||
            deleteIndex >= blobs.length
        ) {

            return;
        }


        blobs.splice(
            deleteIndex,
            1
        );


        await rewriteBikeImages(
            bikeNumber,
            blobs
        );


        imageUploadMessage.textContent =
            "Billedet er slettet.";


        await showCurrentBikeImages(
            bikeNumber
        );

    } catch (error) {

        console.error(error);


        imageUploadMessage.textContent =
            "Billedet kunne ikke slettes.";
    }
}


// --------------------------------------------------
// ADMIN LISTE
// --------------------------------------------------

async function loadAdminBikes() {

    const bikeList =
        document.getElementById(
            "admin-bike-list"
        );


    bikeList.innerHTML =
        "<p>Henter cykler...</p>";


    const { data, error } =
        await db
            .from("bikes")
            .select(`
                id,
                bike_number,
                brand,
                model,
                purchase_price,
                asking_price,
                status
            `)
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);


        bikeList.innerHTML =
            "<p>Kunne ikke hente cykler.</p>";

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        bikeList.innerHTML =
            "<p>Ingen cykler oprettet endnu.</p>";

        return;
    }


    bikeList.innerHTML =
        "";


    data.forEach(bike => {

        const bikeElement =
            document.createElement(
                "div"
            );


        bikeElement.classList.add(
            "admin-bike"
        );


        bikeElement.innerHTML = `
            <h3>
                ${bike.bike_number} ·
                ${bike.brand}
                ${bike.model ?? ""}
            </h3>

            <p>
                Status:
                <strong>
                    ${bike.status}
                </strong>
            </p>

            <p>
                Indkøb:
                ${formatPrice(
                    bike.purchase_price
                )}
            </p>

            <p>
                Salgspris:
                ${formatPrice(
                    bike.asking_price
                )}
            </p>

            <p>
                <button
                    type="button"
                    class="edit-bike-button"
                    data-bike-id="${bike.id}"
                >
                    Rediger
                </button>
            </p>

            <hr>
        `;


        bikeList.appendChild(
            bikeElement
        );
    });


    document
        .querySelectorAll(
            ".edit-bike-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await openEditBikeForm(
                        button.dataset.bikeId
                    );
                }
            );
        });
}


// --------------------------------------------------
// NÆSTE BIKE ID
// --------------------------------------------------

async function getNextBikeNumber() {

    const { data, error } =
        await db
            .from("bikes")
            .select("bike_number");


    if (error) {
        throw error;
    }


    let highestNumber = 0;


    data.forEach(bike => {

        const match =
            bike.bike_number.match(
                /^B(\d+)$/
            );


        if (match) {

            highestNumber =
                Math.max(
                    highestNumber,
                    Number(match[1])
                );
        }
    });


    return (
        "B" +
        String(
            highestNumber + 1
        ).padStart(
            4,
            "0"
        )
    );
}


// --------------------------------------------------
// NY CYKEL
// --------------------------------------------------

async function openNewBikeForm() {

    bikeForm.reset();

    currentBikeImages.innerHTML =
        "";

    imageUploadMessage.textContent =
        "";

    bikeFormMessage.textContent =
        "";


    document.getElementById(
        "bike-id"
    ).value = "";


    bikeFormTitle.textContent =
        "Ny cykel";


    try {

        document.getElementById(
            "bike-number"
        ).value =
            await getNextBikeNumber();

    } catch (error) {

        console.error(error);


        bikeFormMessage.textContent =
            "Kunne ikke generere Bike ID.";

        return;
    }


    document.getElementById(
        "status"
    ).value =
        "DRAFT";


    bikeFormSection.hidden =
        false;


    bikeFormSection.scrollIntoView({
        behavior: "smooth"
    });
}


// --------------------------------------------------
// REDIGER CYKEL
// --------------------------------------------------

async function openEditBikeForm(
    bikeId
) {

    bikeFormMessage.textContent =
        "";

    imageUploadMessage.textContent =
        "";

    bikeImagesInput.value =
        "";


    const { data: bike, error } =
        await db
            .from("bikes")
            .select("*")
            .eq(
                "id",
                bikeId
            )
            .single();


    if (error) {

        console.error(error);

        alert(
            "Cyklen kunne ikke hentes."
        );

        return;
    }


    bikeForm.reset();


    document.getElementById(
        "bike-id"
    ).value =
        bike.id;


    document.getElementById(
        "bike-number"
    ).value =
        bike.bike_number ?? "";


    document.getElementById(
        "brand"
    ).value =
        bike.brand ?? "";


    document.getElementById(
        "model"
    ).value =
        bike.model ?? "";


    document.getElementById(
        "main-category"
    ).value =
        bike.main_category ?? "";


    document.getElementById(
        "category"
    ).value =
        bike.category ?? "";


    document.getElementById(
        "frame-size"
    ).value =
        bike.frame_size ?? "";


    document.getElementById(
        "wheel-size"
    ).value =
        bike.wheel_size ?? "";


    document.getElementById(
        "gears"
    ).value =
        bike.gears ?? "";


    document.getElementById(
        "color"
    ).value =
        bike.color ?? "";


    document.getElementById(
        "frame-number"
    ).value =
        bike.frame_number ?? "";


    document.getElementById(
        "purchase-price"
    ).value =
        bike.purchase_price ?? "";


    document.getElementById(
        "purchase-source"
    ).value =
        bike.purchase_source ?? "";


    document.getElementById(
        "sales-description"
    ).value =
        bike.sales_description ?? "";


    document.getElementById(
        "asking-price"
    ).value =
        bike.asking_price ?? "";


    document.getElementById(
        "status"
    ).value =
        bike.status ?? "DRAFT";


    bikeFormTitle.textContent =
        `Rediger ${bike.bike_number}`;


    bikeFormSection.hidden =
        false;


    await showCurrentBikeImages(
        bike.bike_number
    );


    bikeFormSection.scrollIntoView({
        behavior: "smooth"
    });
}


// --------------------------------------------------
// LUK FORMULAR
// --------------------------------------------------

function closeBikeForm() {

    bikeFormSection.hidden =
        true;


    bikeForm.reset();


    document.getElementById(
        "bike-id"
    ).value =
        "";


    currentBikeImages.innerHTML =
        "";

    imageUploadMessage.textContent =
        "";

    bikeFormMessage.textContent =
        "";
}


// --------------------------------------------------
// BYG CYKELDATA
// --------------------------------------------------

function buildBikeData() {

    return {

        bike_number:
            document.getElementById(
                "bike-number"
            ).value,

        brand:
            document.getElementById(
                "brand"
            ).value.trim(),

        model:
            getTextValue(
                "model"
            ),

        main_category:
            document.getElementById(
                "main-category"
            ).value,

        category:
            getTextValue(
                "category"
            ),

        frame_size:
            getTextValue(
                "frame-size"
            ),

        wheel_size:
            getTextValue(
                "wheel-size"
            ),

        gears:
            getNumberValue(
                "gears"
            ),

        color:
            getTextValue(
                "color"
            ),

        frame_number:
            getTextValue(
                "frame-number"
            ),

        purchase_price:
            getNumberValue(
                "purchase-price"
            ),

        purchase_source:
            getTextValue(
                "purchase-source"
            ),

        sales_description:
            getTextValue(
                "sales-description"
            ),

        asking_price:
            getNumberValue(
                "asking-price"
            ),

        status:
            document.getElementById(
                "status"
            ).value
    };
}


// --------------------------------------------------
// UPLOAD NYE BILLEDER
// --------------------------------------------------

uploadImagesButton.addEventListener(
    "click",
    async () => {

        imageUploadMessage.textContent =
            "";


        const bikeId =
            document.getElementById(
                "bike-id"
            ).value;


        const bikeNumber =
            document.getElementById(
                "bike-number"
            ).value;


        if (!bikeId) {

            imageUploadMessage.textContent =
                "Gem cyklen først, før du uploader billeder.";

            return;
        }


        const selectedFiles =
            Array.from(
                bikeImagesInput.files
            );


        if (
            selectedFiles.length === 0
        ) {

            imageUploadMessage.textContent =
                "Vælg mindst ét billede.";

            return;
        }


        const existingImages =
            await getBikeImages(
                bikeNumber
            );


        if (
            existingImages.length +
            selectedFiles.length >
            MAX_IMAGES
        ) {

            imageUploadMessage.textContent =
                `Der må højst være ${MAX_IMAGES} billeder.`;

            return;
        }


        uploadImagesButton.disabled =
            true;


        try {

            for (
                let i = 0;
                i < selectedFiles.length;
                i++
            ) {

                imageUploadMessage.textContent =
                    `Behandler billede ${
                        i + 1
                    } af ${
                        selectedFiles.length
                    }...`;


                const compressedImage =
                    await compressImage(
                        selectedFiles[i]
                    );


                const imageNumber =
                    existingImages.length +
                    i +
                    1;


                const filePath =
                    `${bikeNumber}/${imageFileName(
                        imageNumber
                    )}`;


                const { error } =
                    await db.storage
                        .from(
                            IMAGE_BUCKET
                        )
                        .upload(
                            filePath,
                            compressedImage,
                            {
                                upsert: false,
                                contentType:
                                    "image/webp"
                            }
                        );


                if (error) {
                    throw error;
                }
            }


            imageUploadMessage.textContent =
                `${selectedFiles.length} billede(r) uploadet.`;


            bikeImagesInput.value =
                "";


            await showCurrentBikeImages(
                bikeNumber
            );

        } catch (error) {

            console.error(error);


            imageUploadMessage.textContent =
                "Et eller flere billeder kunne ikke uploades.";

        } finally {

            uploadImagesButton.disabled =
                false;
        }
    }
);


// --------------------------------------------------
// LOGIN-VISNING
// --------------------------------------------------

async function showCorrectView() {

    const {
        data: {
            session
        }
    } =
        await db.auth.getSession();


    if (session) {

        loginSection.hidden =
            true;

        adminSection.hidden =
            false;


        await loadAdminBikes();

    } else {

        loginSection.hidden =
            false;

        adminSection.hidden =
            true;
    }
}


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        loginMessage.textContent =
            "Logger ind...";


        const email =
            document.getElementById(
                "email"
            ).value;


        const password =
            document.getElementById(
                "password"
            ).value;


        const { error } =
            await db.auth
                .signInWithPassword({
                    email,
                    password
                });


        if (error) {

            console.error(error);


            loginMessage.textContent =
                "Login mislykkedes.";

            return;
        }


        loginMessage.textContent =
            "";


        await showCorrectView();
    }
);


// --------------------------------------------------
// LOG UD
// --------------------------------------------------

logoutButton.addEventListener(
    "click",
    async () => {

        await db.auth.signOut();

        closeBikeForm();

        await showCorrectView();
    }
);


// --------------------------------------------------
// KNAPPER
// --------------------------------------------------

newBikeButton.addEventListener(
    "click",
    openNewBikeForm
);


cancelBikeFormButton.addEventListener(
    "click",
    closeBikeForm
);


// --------------------------------------------------
// GEM CYKEL
// --------------------------------------------------

bikeForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        bikeFormMessage.textContent =
            "Gemmer...";


        const bikeId =
            document.getElementById(
                "bike-id"
            ).value;


        const bikeData =
            buildBikeData();


        let error;


        if (bikeId) {

            const result =
                await db
                    .from("bikes")
                    .update(
                        bikeData
                    )
                    .eq(
                        "id",
                        bikeId
                    );


            error =
                result.error;

        } else {

            const result =
                await db
                    .from("bikes")
                    .insert(
                        bikeData
                    );


            error =
                result.error;
        }


        if (error) {

            console.error(error);


            bikeFormMessage.textContent =
                "Cyklen kunne ikke gemmes.";

            return;
        }


        await loadAdminBikes();

        closeBikeForm();
    }
);


// --------------------------------------------------
// START
// --------------------------------------------------

showCorrectView();
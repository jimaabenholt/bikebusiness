const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


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


const bikeImageInput =
    document.getElementById("bike-image");

const uploadImageButton =
    document.getElementById("upload-image-button");

const imageUploadMessage =
    document.getElementById("image-upload-message");

const currentBikeImage =
    document.getElementById("current-bike-image");


// --------------------------------------------------
// HJÆLPEFUNKTIONER
// --------------------------------------------------

function formatPrice(price) {

    if (price === null || price === undefined) {
        return "-";
    }

    return (
        Number(price).toLocaleString("da-DK") +
        " kr."
    );
}


function getTextValue(id) {

    const value =
        document.getElementById(id).value.trim();

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


// --------------------------------------------------
// VIS HOVEDBILLEDE
// --------------------------------------------------

function showCurrentBikeImage(bikeNumber) {

    currentBikeImage.innerHTML = "";

    if (!bikeNumber) {
        return;
    }


    const imagePath =
        `${bikeNumber}/01.png`;


    const { data } = db.storage
        .from("bike-images")
        .getPublicUrl(imagePath);


    const image =
        document.createElement("img");


    image.src =
        data.publicUrl;

    image.alt =
        `Hovedbillede af ${bikeNumber}`;

    image.style.maxWidth =
        "300px";

    image.style.height =
        "auto";

    image.style.display =
        "block";

    image.style.marginTop =
        "10px";


    image.onerror = () => {

        currentBikeImage.innerHTML =
            "<p>Intet hovedbillede uploadet.</p>";
    };


    currentBikeImage.appendChild(image);
}


// --------------------------------------------------
// HENT CYKLER TIL ADMIN
// --------------------------------------------------

async function loadAdminBikes() {

    const bikeList =
        document.getElementById("admin-bike-list");


    bikeList.innerHTML =
        "<p>Henter cykler...</p>";


    const { data, error } = await db
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
        .order("id", { ascending: true });


    if (error) {

        console.error(error);

        bikeList.innerHTML =
            "<p>Kunne ikke hente cykler.</p>";

        return;
    }


    if (data.length === 0) {

        bikeList.innerHTML =
            "<p>Ingen cykler oprettet endnu.</p>";

        return;
    }


    bikeList.innerHTML = "";


    data.forEach(bike => {

        const bikeElement =
            document.createElement("div");


        bikeElement.classList.add("admin-bike");


        bikeElement.innerHTML = `
            <h3>
                ${bike.bike_number} ·
                ${bike.brand}
                ${bike.model ?? ""}
            </h3>

            <p>
                Status:
                <strong>${bike.status}</strong>
            </p>

            <p>
                Indkøb:
                ${formatPrice(bike.purchase_price)}
            </p>

            <p>
                Salgspris:
                ${formatPrice(bike.asking_price)}
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


    const editButtons =
        document.querySelectorAll(
            ".edit-bike-button"
        );


    editButtons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const bikeId =
                    button.dataset.bikeId;

                await openEditBikeForm(
                    bikeId
                );
            }
        );
    });
}


// --------------------------------------------------
// FIND NÆSTE BIKE ID
// --------------------------------------------------

async function getNextBikeNumber() {

    const { data, error } = await db
        .from("bikes")
        .select("bike_number");


    if (error) {

        console.error(error);

        throw new Error(
            "Kunne ikke finde næste Bike ID."
        );
    }


    let highestNumber = 0;


    data.forEach(bike => {

        const match =
            bike.bike_number.match(
                /^B(\d+)$/
            );


        if (match) {

            highestNumber = Math.max(
                highestNumber,
                Number(match[1])
            );
        }
    });


    const nextNumber =
        highestNumber + 1;


    return (
        "B" +
        String(nextNumber).padStart(
            4,
            "0"
        )
    );
}


// --------------------------------------------------
// ÅBN FORMULAR TIL NY CYKEL
// --------------------------------------------------

async function openNewBikeForm() {

    bikeForm.reset();

    currentBikeImage.innerHTML =
        "";

    imageUploadMessage.textContent =
        "";

    bikeImageInput.value =
        "";


    document.getElementById(
        "bike-id"
    ).value = "";


    bikeFormTitle.textContent =
        "Ny cykel";


    bikeFormMessage.textContent =
        "";


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
// ÅBN FORMULAR TIL REDIGERING
// --------------------------------------------------

async function openEditBikeForm(bikeId) {

    bikeFormMessage.textContent =
        "";

    imageUploadMessage.textContent =
        "";

    bikeImageInput.value =
        "";


    const { data: bike, error } =
        await db
            .from("bikes")
            .select("*")
            .eq("id", bikeId)
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


    showCurrentBikeImage(
        bike.bike_number
    );


    bikeFormSection.hidden =
        false;


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


    currentBikeImage.innerHTML =
        "";

    imageUploadMessage.textContent =
        "";

    bikeFormMessage.textContent =
        "";

    bikeImageInput.value =
        "";
}


// --------------------------------------------------
// BYG DATA FRA FORMULAR
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
            getTextValue("model"),

        category:
            getTextValue("category"),

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
// LOGIN / ADMIN VISNING
// --------------------------------------------------

async function showCorrectView() {

    const {
        data: { session }
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
    async (event) => {

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
            await db.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(error);

            loginMessage.textContent =
                "Login mislykkedes. Kontrollér e-mail og password.";

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
// NY CYKEL
// --------------------------------------------------

newBikeButton.addEventListener(
    "click",
    async () => {

        await openNewBikeForm();
    }
);


// --------------------------------------------------
// ANNULLER FORMULAR
// --------------------------------------------------

cancelBikeFormButton.addEventListener(
    "click",
    () => {

        closeBikeForm();
    }
);


// --------------------------------------------------
// UPLOAD HOVEDBILLEDE
// --------------------------------------------------

uploadImageButton.addEventListener(
    "click",
    async () => {

        imageUploadMessage.textContent =
            "";


        const bikeNumber =
            document.getElementById(
                "bike-number"
            ).value;


        const bikeId =
            document.getElementById(
                "bike-id"
            ).value;


        const file =
            bikeImageInput.files[0];


        // Cyklen skal eksistere i databasen først

        if (!bikeId) {

            imageUploadMessage.textContent =
                "Gem cyklen først, før du uploader billeder.";

            return;
        }


        if (!file) {

            imageUploadMessage.textContent =
                "Vælg et billede først.";

            return;
        }


        imageUploadMessage.textContent =
            "Uploader...";


        // Midlertidig V1-konvention:
        // hovedbilledet hedder altid 01.png

        const filePath =
            `${bikeNumber}/01.png`;


        const { error } =
            await db.storage
                .from("bike-images")
                .upload(
                    filePath,
                    file,
                    {
                        upsert: false,
                        contentType: file.type
                    }
                );


        if (error) {

            console.error(error);

            imageUploadMessage.textContent =
                "Billedet kunne ikke uploades.";

            return;
        }


        imageUploadMessage.textContent =
            "Billedet er uploadet.";


        // Tving browseren til at hente
        // den nye version af billedet

        const imagePath =
            `${bikeNumber}/01.png`;


        const { data } = db.storage
            .from("bike-images")
            .getPublicUrl(imagePath);


        currentBikeImage.innerHTML =
            "";


        const image =
            document.createElement("img");


        image.src =
            `${data.publicUrl}?t=${Date.now()}`;

        image.alt =
            `Hovedbillede af ${bikeNumber}`;

        image.style.maxWidth =
            "300px";

        image.style.height =
            "auto";

        image.style.display =
            "block";

        image.style.marginTop =
            "10px";


        currentBikeImage.appendChild(
            image
        );


        bikeImageInput.value =
            "";
    }
);


// --------------------------------------------------
// GEM NY ELLER REDIGERET CYKEL
// --------------------------------------------------

bikeForm.addEventListener(
    "submit",
    async (event) => {

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


        // REDIGER EKSISTERENDE

        if (bikeId) {

            const result =
                await db
                    .from("bikes")
                    .update(bikeData)
                    .eq("id", bikeId);


            error =
                result.error;

        }


        // OPRET NY

        else {

            const result =
                await db
                    .from("bikes")
                    .insert(bikeData);


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
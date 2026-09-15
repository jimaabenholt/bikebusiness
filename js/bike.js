const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadBike() {

    const bikeDetail = document.getElementById("bike-detail");

    const params = new URLSearchParams(window.location.search);
    const bikeNumber = params.get("bike");

    if (!bikeNumber) {
        bikeDetail.innerHTML = "<p>Cyklen blev ikke fundet.</p>";
        return;
    }

    const { data: bike, error } = await db
        .from("public_bikes")
        .select("*")
        .eq("bike_number", bikeNumber)
        .single();

    if (error) {
        console.error(error);
        bikeDetail.innerHTML = "<p>Cyklen blev ikke fundet.</p>";
        return;
    }

    const imageUrls = [];

    for (let i = 1; i <= 4; i++) {

        const filename = `0${i}.png`;
        const imagePath = `${bike.bike_number}/${filename}`;

        const { data } = db
            .storage
            .from("bike-images")
            .getPublicUrl(imagePath);

        imageUrls.push(data.publicUrl);
    }

    bikeDetail.innerHTML = `
        <section class="bike-detail">

            <h1>${bike.brand} ${bike.model ?? ""}</h1>

            <p class="bike-price">
                ${Number(bike.asking_price).toLocaleString("da-DK")} kr.
            </p>

            <div class="bike-gallery">
                ${imageUrls.map((url, index) => `
                    <img
                        src="${url}"
                        alt="${bike.brand} ${bike.model ?? ""} - billede ${index + 1}"
                    >
                `).join("")}
            </div>

            <h2>Om cyklen</h2>

            <p>
                ${bike.sales_description ?? ""}
            </p>

            <h2>Specifikationer</h2>

            <dl class="bike-specifications">

                <dt>Mærke</dt>
                <dd>${bike.brand}</dd>

                <dt>Model</dt>
                <dd>${bike.model ?? "-"}</dd>

                <dt>Type</dt>
                <dd>${bike.category ?? "-"}</dd>

                <dt>Stelstørrelse</dt>
                <dd>${bike.frame_size ?? "-"}</dd>

                <dt>Hjulstørrelse</dt>
                <dd>${bike.wheel_size ?? "-"}</dd>

                <dt>Gear</dt>
                <dd>${bike.gears ?? "-"}</dd>

                <dt>Farve</dt>
                <dd>${bike.color ?? "-"}</dd>

            </dl>

            ${bike.work_done ? `
                <h2>Klargøring</h2>
                <p>${bike.work_done}</p>
            ` : ""}

        </section>
    `;

    document.title = `${bike.brand} ${bike.model ?? ""}`;
}

loadBike();
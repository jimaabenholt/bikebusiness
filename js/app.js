const SUPABASE_URL = "https://tdsorowcgtagqesmsyhq.supabase.co";
const SUPABASE_KEY = "sb_publishable_V8lhWL3P7vGtPggqnR5hLg__tv4URmW";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadBikes() {

    const bikeList = document.getElementById("bike-list");

    const { data, error } = await db
        .from("public_bikes")
        .select("*");

    if (error) {
        console.error(error);
        bikeList.innerHTML = "<p>Kunne ikke hente cykler.</p>";
        return;
    }

    if (data.length === 0) {
        bikeList.innerHTML = "<p>Ingen cykler til salg lige nu.</p>";
        return;
    }

    bikeList.innerHTML = "";

    data.forEach(bike => {

        const imagePath = `${bike.bike_number}/01.png`;

        const { data: imageData } = db
            .storage
            .from("bike-images")
            .getPublicUrl(imagePath);

        const imageUrl = imageData.publicUrl;

        const bikeElement = document.createElement("article");
        bikeElement.classList.add("bike-card");

        bikeElement.innerHTML = `
            <img
                src="${imageUrl}"
                alt="${bike.brand} ${bike.model ?? ""}"
                class="bike-image"
            >

            <div class="bike-content">

                <h3>${bike.brand} ${bike.model ?? ""}</h3>

                <p class="bike-specs">
                    ${bike.category ?? ""}
                    ${bike.frame_size ? " · " + bike.frame_size : ""}
                    ${bike.gears ? " · " + bike.gears + " gear" : ""}
                </p>

                <p>
                    ${bike.sales_description ?? ""}
                </p>

                <p class="bike-price">
                    ${Number(bike.asking_price).toLocaleString("da-DK")} kr.
                </p>

                <a
                    href="bike.html?bike=${bike.bike_number}"
                    class="bike-link"
                >
                    Se cykel
                </a>

            </div>
        `;

        bikeList.appendChild(bikeElement);
    });
}

loadBikes();
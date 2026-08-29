/* ======================================================
   PROJECT DATA
====================================================== */

const PROJECTS = [
    {
        id: "aerosense",
        title: "AeroSense: Low-Cost Air Quality Sensing",
        domain: "Sustainability",
        summary:
            "A distributed low-cost sensor mesh estimating street-level PM2.5 across dense urban wards. Closes the gap between satellite estimates and what residents actually breathe.",
        mentor: "Dr. Ananya Rao",
        cohort: "Batch of 2026",
        image: "images/aerosense.jpg"
    },

    {
        id: "gaitassist",
        title: "GaitAssist: Wearable Rehab Feedback",
        domain: "Healthcare Tech",
        summary:
            "A wearable IMU insole that gives real-time gait correction cues to post-stroke patients during physiotherapy. Built with clinicians at a partner hospital.",
        mentor: "Dr. Farhan Qureshi",
        cohort: "Batch of 2027",
        image: "images/gaitassist.jpg"
    },

    {
        id: "fieldbot",
        title: "FieldBot: Autonomous Crop Scout",
        domain: "Robotics & Embedded Systems",
        summary:
            "A four-wheeled field robot that scouts crop rows for early pest and nutrient-deficiency signs using onboard vision, cutting manual scouting time for smallholder farms.",
        mentor: "Dr. Priya Menon",
        cohort: "Batch of 2025",
        image: "images/fieldbot.jpg"
    },

    {
        id: "creditlens",
        title: "CreditLens: Explainable Microloan Scoring",
        domain: "AI / Machine Learning",
        summary:
            "An interpretable credit-scoring model for first-time microloan applicants without formal credit history, built to reduce opaque rejections.",
        mentor: "Dr. Ananya Rao",
        cohort: "Batch of 2026",
        image: "images/creditlens.jpg"
    },

    {
        id: "handspeak",
        title: "HandSpeak: Real-Time ISL Translator",
        domain: "AI / Machine Learning",
        summary:
            "An on-device model that translates Indian Sign Language gestures to text and speech in real time, aimed at making campus front-desks and clinics more accessible.",
        mentor: "Dr. Farhan Qureshi",
        cohort: "Batch of 2027",
        image: "images/handspeak.jpg"
    },

    {
        id: "microgrid",
        title: "MicroGrid Balancer",
        domain: "Sustainability",
        summary:
            "A reinforcement-learning controller that balances battery, solar, and diesel backup for a rural microgrid, cutting diesel runtime at a partner village site.",
        mentor: "Dr. Priya Menon",
        cohort: "Batch of 2025",
        image: "images/microgrid.jpg"
    }
];


/* ======================================================
   DOMAIN FILTER DATA
====================================================== */

const DOMAINS = [
    "All",
    "AI / Machine Learning",
    "Robotics & Embedded Systems",
    "Sustainability",
    "Healthcare Tech"
];

let activeDomain = "All";
let searchTerm = "";


/* ======================================================
   ELEMENTS
====================================================== */

const domainChipsEl = document.getElementById("domainChips");
const cardGrid = document.getElementById("cardGrid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");
const navSearch = document.getElementById("navSearch");


/* ======================================================
   RENDER DOMAIN CHIPS
====================================================== */

function renderChips() {

    domainChipsEl.innerHTML = DOMAINS.map(
        (domain) => `
            <button
                class="chip"
                data-domain="${domain}"
                data-active="${domain === activeDomain}"
            >
                ${domain}
            </button>
        `
    ).join("");
}


/* ======================================================
   DOMAIN FILTER
====================================================== */

domainChipsEl.addEventListener("click", (event) => {

    const button = event.target.closest("button[data-domain]");

    if (!button) return;

    activeDomain = button.dataset.domain;

    renderChips();
    renderCards();
});


/* ======================================================
   SEARCH
====================================================== */

if (navSearch) {

    navSearch.addEventListener("input", (event) => {

        searchTerm = event.target.value
            .trim()
            .toLowerCase();

        renderCards();
    });

}


/* ======================================================
   FILTER PROJECTS
====================================================== */

function matchesFilters(project) {

    const domainMatch =
        activeDomain === "All" ||
        project.domain === activeDomain;

    const searchMatch =
        !searchTerm ||
        project.title.toLowerCase().includes(searchTerm) ||
        project.summary.toLowerCase().includes(searchTerm) ||
        project.domain.toLowerCase().includes(searchTerm) ||
        project.mentor.toLowerCase().includes(searchTerm);

    return domainMatch && searchMatch;
}


/* ======================================================
   RENDER PROJECT CARDS
====================================================== */

function renderCards() {

    const filteredProjects = PROJECTS.filter(matchesFilters);

    /* Project count */

    resultCount.textContent =
        `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""}`;


    /* No projects */

    if (filteredProjects.length === 0) {

        cardGrid.innerHTML = "";

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    /* Project cards */

    cardGrid.innerHTML = filteredProjects.map(
        (project) => `
            <article class="project-card fade-up">

                <!-- PROJECT PHOTO -->

                <div class="project-image">

                    <img
                        src="${project.image}"
                        alt="${project.title}"
                    >

                </div>


                <!-- PROJECT INFORMATION -->

                <div class="project-content">

                    <!-- DOMAIN -->

                    <p class="project-domain">
                        ${project.domain}
                    </p>


                    <!-- TITLE -->

                    <h3 class="project-title">
                        ${project.title}
                    </h3>


                    <!-- DESCRIPTION -->

                    <p class="project-description">
                        ${project.summary}
                    </p>


                    <!-- MENTOR + BATCH -->

                    <div class="project-footer">

                        <p class="project-mentor">
                            ${project.mentor}
                        </p>

                        <p class="project-batch">
                            ${project.cohort}
                        </p>

                    </div>

                </div>

            </article>
        `
    ).join("");
}


/* ======================================================
   INITIALIZE
====================================================== */

renderChips();
renderCards();
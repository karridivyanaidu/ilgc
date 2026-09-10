/* ======================================================
   AUTH GUARD
====================================================== */

const role = localStorage.getItem("selectedRole");
const loggedIn = localStorage.getItem("loggedIn");
const userId = localStorage.getItem("userId");

if (!loggedIn || role !== "student" || !userId) {
    window.location.href = "login.html";
}


/* ======================================================
   STUDENT PROFILE (derived — see data.js)
====================================================== */

const { name: studentName, semester: studentSemester } = deriveStudentProfile(userId);


/* ======================================================
   INTERESTS STORAGE
   Stored per-user in localStorage (see data.js) as a
   stand-in for the backend: [{ projectId, status, submittedAt }]
====================================================== */

let interests = loadInterestsFor(userId);

function getInterest(projectId) {
    return interests.find((i) => i.projectId === projectId) || null;
}

function submitInterest(projectId) {
    if (getInterest(projectId)) return;

    interests.push({
        projectId,
        status: "Pending",
        submittedAt: new Date().toISOString()
    });

    saveInterestsFor(userId, interests);
    showToast("Interest submitted ✓");
    renderAll();
}

/* Demo affordance: since there's no faculty portal wired up
   yet to accept/reject, clicking an already-pending interest
   simulates the faculty response so the flow is visible. */
function simulateFacultyResponse(projectId) {
    const interest = getInterest(projectId);
    if (!interest || interest.status !== "Pending") return;

    interest.status = Math.random() < 0.6 ? "Accepted" : "Rejected";
    saveInterestsFor(userId, interests);
    showToast(
        interest.status === "Accepted"
            ? "🎉 Your interest was accepted!"
            : "Your interest was not accepted this time."
    );
    renderAll();
}


/* ======================================================
   MY PROJECT (derived from an accepted interest)
====================================================== */

function getMyProject() {
    const accepted = interests.find((i) => i.status === "Accepted");
    if (!accepted) return null;
    return getAllProjects().find((p) => p.id === accepted.projectId) || null;
}


/* ======================================================
   TOAST
====================================================== */

let toastTimer = null;

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 2600);
}


/* ======================================================
   TABS
====================================================== */

const tabButtons = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");

function goToTab(tabName) {
    tabButtons.forEach((btn) => {
        btn.dataset.active = String(btn.dataset.tab === tabName);
    });

    views.forEach((view) => {
        view.dataset.active = String(view.id === `view-${tabName}`);
    });
}

tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => goToTab(btn.dataset.tab));
});

document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goToTab(btn.dataset.goto));
});


/* ======================================================
   LOGOUT
====================================================== */

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("selectedRole");
    window.location.href = "index.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutBtnProfile").addEventListener("click", logout);


/* ======================================================
   DISCOVER: FILTER STATE
====================================================== */

const STATUSES = ["All", "Ongoing", "Proposed", "Completed"];
const DOMAINS = [
    "All",
    "AI / Machine Learning",
    "Robotics & Embedded Systems",
    "Sustainability",
    "Healthcare Tech"
];

let activeStatus = "All";
let activeDomain = "All";
let searchTerm = "";

function matchesFilters(project) {
    const statusMatch = activeStatus === "All" || project.status === activeStatus;
    const domainMatch = activeDomain === "All" || project.domain === activeDomain;

    const term = searchTerm.toLowerCase();
    const searchMatch =
        !term ||
        project.title.toLowerCase().includes(term) ||
        project.summary.toLowerCase().includes(term) ||
        project.domain.toLowerCase().includes(term) ||
        project.mentor.toLowerCase().includes(term);

    return statusMatch && domainMatch && searchMatch;
}

function statusBadgeClass(status) {
    if (status === "Ongoing") return "badge-ongoing";
    if (status === "Proposed") return "badge-proposed";
    if (status === "Completed") return "badge-completed";
    return "";
}

function interestBadgeClass(status) {
    if (status === "Pending") return "badge-pending";
    if (status === "Accepted") return "badge-accepted";
    if (status === "Rejected") return "badge-rejected";
    return "";
}


/* ======================================================
   RENDER: HOME
====================================================== */

function renderHome() {
    document.getElementById("greetingText").textContent = `Hi, ${studentName} 👋`;
    document.getElementById("greetingSub").textContent = `Semester ${studentSemester} · ${userId}`;

    const myProject = getMyProject();
    const pendingCount = interests.filter((i) => i.status === "Pending").length;
    const acceptedCount = interests.filter((i) => i.status === "Accepted").length;

    document.getElementById("statRow").innerHTML = `
        <div class="stat-card">
            <p class="stat-value">${myProject ? "1" : "0"}</p>
            <p class="stat-label">Active project</p>
        </div>
        <div class="stat-card">
            <p class="stat-value">${pendingCount}</p>
            <p class="stat-label">Pending interests</p>
        </div>
        <div class="stat-card">
            <p class="stat-value">${acceptedCount}</p>
            <p class="stat-label">Accepted interests</p>
        </div>
    `;

    const myProjectPanel = document.getElementById("myProjectPanel");

    if (myProject) {
        myProjectPanel.innerHTML = `
            <div class="my-project-card">
                <p class="my-project-title">${myProject.title}</p>
                <p class="my-project-meta">${myProject.domain} · Mentor: ${myProject.mentor}</p>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${myProject.progress}%"></div>
                </div>
                <p class="progress-label">${myProject.progress}% complete</p>
            </div>
        `;
    } else {
        myProjectPanel.innerHTML = `
            <p class="empty-panel">
                You're not on a project team yet. Browse
                <a data-goto="discover">Discover Projects</a>
                and express interest to get started.
            </p>
        `;
        myProjectPanel.querySelector("[data-goto]").addEventListener("click", (e) => {
            goToTab(e.target.dataset.goto);
        });
    }

    const previewEl = document.getElementById("myInterestsPreview");
    const recent = [...interests].reverse().slice(0, 3);

    if (recent.length === 0) {
        previewEl.innerHTML = `<p class="empty-panel">No interests submitted yet.</p>`;
        return;
    }

    previewEl.innerHTML = recent.map((interest) => {
        const project = getAllProjects().find((p) => p.id === interest.projectId);
        if (!project) return "";
        return `
            <div class="mini-interest-row">
                <div>
                    <p class="mini-interest-title">${project.title}</p>
                    <p class="mini-interest-domain">${project.domain}</p>
                </div>
                <span class="badge ${interestBadgeClass(interest.status)}">${interest.status}</span>
            </div>
        `;
    }).join("");
}


/* ======================================================
   RENDER: DISCOVER
====================================================== */

function actionButtonHtml(project) {
    const interest = getInterest(project.id);

    if (!interest) {
        return `<button class="btn btn-primary" data-express="${project.id}">Express Interest</button>`;
    }

    if (interest.status === "Pending") {
        return `<button class="btn btn-pending" data-simulate="${project.id}" title="Demo: click to simulate faculty response">Pending ✓</button>`;
    }

    if (interest.status === "Accepted") {
        return `<button class="btn btn-accepted" disabled>Accepted ✓</button>`;
    }

    return `<button class="btn btn-rejected" disabled>Not selected</button>`;
}

function renderDiscoverChips() {
    document.getElementById("statusChips").innerHTML = STATUSES.map((status) => `
        <button class="chip" data-status="${status}" data-active="${status === activeStatus}">${status}</button>
    `).join("");

    document.getElementById("domainChips").innerHTML = DOMAINS.map((domain) => `
        <button class="chip" data-domain-filter="${domain}" data-active="${domain === activeDomain}">${domain}</button>
    `).join("");
}

function renderDiscover() {
    const filtered = getAllProjects().filter(matchesFilters);
    const grid = document.getElementById("discoverGrid");
    const empty = document.getElementById("discoverEmpty");

    document.getElementById("discoverCount").textContent =
        `${filtered.length} project${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
        grid.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    grid.innerHTML = filtered.map((project) => `
        <article class="project-card">
            <div class="project-card-top">
                <span class="project-domain">${project.domain}</span>
                <span class="badge ${statusBadgeClass(project.status)}">${project.status}</span>
            </div>
            <div class="project-card-body">
                <h3 class="project-title" data-open="${project.id}">${project.title}</h3>
                <p class="project-description">${project.summary}</p>
                <p class="project-mentor-row">${project.mentor}</p>
                <div class="project-card-actions">
                    ${actionButtonHtml(project)}
                    <button class="btn btn-secondary" data-open="${project.id}">Details</button>
                </div>
            </div>
        </article>
    `).join("");
}


/* ======================================================
   RENDER: MY INTERESTS
====================================================== */

function renderInterests() {
    const list = document.getElementById("interestsList");
    const empty = document.getElementById("interestsEmpty");

    if (interests.length === 0) {
        list.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    const sorted = [...interests].sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );

    list.innerHTML = sorted.map((interest) => {
        const project = getAllProjects().find((p) => p.id === interest.projectId);
        if (!project) return "";

        const date = new Date(interest.submittedAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });

        return `
            <div class="interest-row">
                <div class="interest-row-main">
                    <p class="interest-row-title" data-open="${project.id}">${project.title}</p>
                    <p class="interest-row-meta">${project.domain} · ${project.mentor}</p>
                </div>
                <div class="interest-row-right">
                    <span class="interest-date">${date}</span>
                    <span class="badge ${interestBadgeClass(interest.status)}">${interest.status}</span>
                </div>
            </div>
        `;
    }).join("");
}


/* ======================================================
   RENDER: PROFILE
====================================================== */

function renderProfile() {
    document.getElementById("profileAvatar").textContent = studentName.charAt(0);
    document.getElementById("profileName").textContent = studentName;
    document.getElementById("profileMeta").textContent = `Student · Semester ${studentSemester}`;
    document.getElementById("profileUserId").textContent = userId;
}


/* ======================================================
   MODAL
====================================================== */

const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");

function openModal(projectId) {
    const project = getAllProjects().find((p) => p.id === projectId);
    if (!project) return;

    const teamHtml = project.team.length
        ? `<div class="modal-team">${project.team.map((m) => `<span class="team-chip">${m.name} · Sem ${m.semester}</span>`).join("")}</div>`
        : `<p class="modal-text">No students assigned to this project yet.</p>`;

    modalBody.innerHTML = `
        <p class="modal-eyebrow">${project.domain} · ${project.status}</p>
        <h2 class="modal-title">${project.title}</h2>

        <div class="modal-meta-row">
            <div class="modal-meta-item">
                <span class="meta-label">Mentor</span>
                <span class="meta-value">${project.mentor}</span>
            </div>
            <div class="modal-meta-item">
                <span class="meta-label">Cohort</span>
                <span class="meta-value">${project.cohort}</span>
            </div>
            <div class="modal-meta-item">
                <span class="meta-label">Progress</span>
                <span class="meta-value">${project.progress}%</span>
            </div>
        </div>

        <p class="modal-section-label">Overview</p>
        <p class="modal-text">${project.summary}</p>

        <p class="modal-section-label">Expected outcome</p>
        <p class="modal-text">${project.expectedOutcome}</p>

        <p class="modal-section-label">Current team</p>
        ${teamHtml}

        <div class="modal-actions">
            ${actionButtonHtml(project)}
        </div>
    `;

    modalOverlay.classList.remove("hidden");
}

function closeModal() {
    modalOverlay.classList.add("hidden");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});


/* ======================================================
   EVENT DELEGATION
====================================================== */

document.getElementById("statusChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    activeStatus = btn.dataset.status;
    renderDiscoverChips();
    renderDiscover();
});

document.getElementById("domainChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-domain-filter]");
    if (!btn) return;
    activeDomain = btn.dataset.domainFilter;
    renderDiscoverChips();
    renderDiscover();
});

document.getElementById("discoverSearch").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    renderDiscover();
});

document.addEventListener("click", (e) => {
    const expressBtn = e.target.closest("[data-express]");
    if (expressBtn) {
        submitInterest(expressBtn.dataset.express);
        return;
    }

    const simulateBtn = e.target.closest("[data-simulate]");
    if (simulateBtn) {
        simulateFacultyResponse(simulateBtn.dataset.simulate);
        return;
    }

    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
        openModal(openBtn.dataset.open);
        return;
    }
});


/* ======================================================
   RENDER ALL / INIT
====================================================== */

function renderAll() {
    renderHome();
    renderDiscover();
    renderInterests();
}

renderDiscoverChips();
renderProfile();
renderAll();

// ---------------- PWA Registration ----------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("✅ PWA ready"))
    .catch((err) => console.error("SW registration failed:", err));
}

// ---------------- Dark Mode ----------------
const body = document.getElementById("body");
const themeToggle = document.getElementById("themeToggle");
const toggleTrack = document.getElementById("toggleTrack");
const toggleThumb = document.getElementById("toggleThumb");

function setTheme(isDark) {
  if (isDark) {
    body.classList.add("dark", "bg-gray-900", "text-white");
    toggleThumb.classList.add("translate-x-5");
    toggleTrack.classList.replace("bg-gray-300", "bg-blue-600");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.remove("dark", "bg-gray-900", "text-white");
    toggleThumb.classList.remove("translate-x-5");
    toggleTrack.classList.replace("bg-blue-600", "bg-gray-300");
    localStorage.setItem("theme", "light");
  }
}

themeToggle.addEventListener("change", (e) => setTheme(e.target.checked));
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  const dark = savedTheme === "dark";
  themeToggle.checked = dark;
  setTheme(dark);
});

// ---------------- Elements ----------------
const form = document.getElementById("roleForm");
const rolesList = document.getElementById("roles");
const timelineContainer = document.getElementById("timelineContainer");
const tabTracker = document.getElementById("tab-tracker");
const tabSummary = document.getElementById("tab-summary");
const tabTimeline = document.getElementById("tab-timeline");
const tabInsights = document.getElementById("tab-insights");
const tabTimer = document.getElementById("tab-timer");
const trackerTab = document.getElementById("trackerTab");
const summaryTab = document.getElementById("summaryTab");
const timelineTab = document.getElementById("timelineTab");
const insightsTab = document.getElementById("insightsTab");
const timerTab = document.getElementById("timerTab");

// Insights elements
const totalRolesEl = document.getElementById("totalRoles");
const topRolesEl = document.getElementById("topRoles");
const avgRatingEl = document.getElementById("avgRating");
const longestGapEl = document.getElementById("longestGap");
const streakCountEl = document.getElementById("streakCount");
const goalInput = document.getElementById("goalInput");
const goalProgress = document.getElementById("goalProgress");

// Timer elements
const timerInput = document.getElementById("timerInput");
const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimer");
const resetTimerBtn = document.getElementById("resetTimer");
let timerInterval = null;
let startTime = null;

// ---------------- Data Functions ----------------
function getRoles() {
  return JSON.parse(localStorage.getItem("roles") || "[]");
}
function saveRoles(data) {
  localStorage.setItem("roles", JSON.stringify(data));
}

// ---------------- Tracker Functions ----------------
function loadRoles() {
  const roles = getRoles();
  if (roles.length === 0) {
    rolesList.innerHTML =
      '<p class="text-gray-500 text-center">No roles added yet.</p>';
    return;
  }
  rolesList.innerHTML = roles
    .map(
      (r, i) => `
    <li class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div>
        <strong>${r.role}</strong> - ${r.club}<br>
        <small>${r.date}</small><br>
        <em>${r.notes || ""}</em><br>
        ${r.rating ? `<span>${r.rating}</span>` : ""}
      </div>
      <button class="text-red-600 text-sm mt-2" onclick="deleteRole(${i})">🗑 Delete</button>
    </li>`
    )
    .join("");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const newRole = {
    date: document.getElementById("date").value,
    role: document.getElementById("role").value,
    club: document.getElementById("club").value,
    notes: document.getElementById("notes").value,
    rating: document.getElementById("rating").value,
  };
  const roles = getRoles();
  roles.push(newRole);
  saveRoles(roles);
  form.reset();
  loadRoles();
  updateSummary();
  updateTimeline();
  updateInsights();
});

function deleteRole(i) {
  const roles = getRoles();
  roles.splice(i, 1);
  saveRoles(roles);
  loadRoles();
  updateSummary();
  updateTimeline();
  updateInsights();
}

// ---------------- Summary (Chart.js) ----------------
let roleChart = null;
function updateSummary() {
  const roles = getRoles();
  const ctx = document.getElementById("roleChart").getContext("2d");
  if (roleChart) roleChart.destroy();
  const freq = roles.reduce((a, r) => {
    a[r.role] = (a[r.role] || 0) + 1;
    return a;
  }, {});
  roleChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(freq),
      datasets: [
        {
          data: Object.values(freq),
          backgroundColor: "rgba(59,130,246,0.7)",
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { display: false } },
    },
  });
}

// ---------------- Timeline ----------------
function updateTimeline() {
  const roles = getRoles();
  timelineContainer.innerHTML = "";
  if (roles.length === 0) {
    timelineContainer.innerHTML =
      '<p class="text-gray-500 text-center">No roles to show yet.</p>';
    return;
  }

  const sorted = [...roles].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const grouped = {};
  sorted.forEach((r) => {
    const month = new Date(r.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(r);
  });

  Object.entries(grouped).forEach(([month, entries]) => {
    const section = document.createElement("div");
    section.innerHTML = `<h3 class="font-bold text-blue-700 dark:text-blue-300">${month}</h3>`;
    entries.forEach((r) => {
      section.innerHTML += `
        <div class="ml-6 mt-2 relative">
          <div class="absolute -left-6 top-2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
          <div class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow">
            <strong>${r.role}</strong> - ${r.club}<br>
            <small>${r.date}</small><br>
            <em>${r.notes || ""}</em><br>
            ${r.rating ? `<span>${r.rating}</span>` : ""}
          </div>
        </div>`;
    });
    timelineContainer.appendChild(section);
  });
}

// ---------------- Insights ----------------
let insightPie = null;
function updateInsights() {
  const roles = getRoles();
  const total = roles.length;
  totalRolesEl.textContent = total;

  if (total === 0) {
    topRolesEl.textContent = avgRatingEl.textContent = longestGapEl.textContent =
      streakCountEl.textContent = "-";
    return;
  }

  // Top roles
  const freq = {};
  let ratings = [];
  roles.forEach((r) => {
    freq[r.role] = (freq[r.role] || 0) + 1;
    if (r.rating) ratings.push(r.rating.length);
  });
  const sortedRoles = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([role]) => role)
    .slice(0, 3);
  topRolesEl.textContent = sortedRoles.join(", ") || "-";

  // Average rating
  avgRatingEl.textContent =
    ratings.length > 0
      ? `${(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)} ⭐`
      : "-";

  // Longest gap
  const sorted = [...roles].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  let longestGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i].date) - new Date(sorted[i - 1].date)) /
      (1000 * 60 * 60 * 24);
    if (diff > longestGap) longestGap = diff;
  }
  longestGapEl.textContent = `${Math.round(longestGap)} days`;

  // Streak counter
  const months = new Set(
    roles.map(
      (r) =>
        new Date(r.date).getFullYear() + "-" + (new Date(r.date).getMonth() + 1)
    )
  );
  streakCountEl.textContent = months.size + " months active";

  // Goal tracker
  const goal = parseInt(goalInput.value || localStorage.getItem("goal") || 10);
  localStorage.setItem("goal", goal);
  goalInput.value = goal;
  const percent = Math.min((total / goal) * 100, 100).toFixed(0);
  goalProgress.textContent = `${total} / ${goal} roles (${percent}%)`;

  // Pie chart
  const ctx = document.getElementById("insightPie").getContext("2d");
  if (insightPie) insightPie.destroy();
  insightPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(freq),
      datasets: [
        {
          data: Object.values(freq),
          backgroundColor: [
            "#60A5FA",
            "#FBBF24",
            "#34D399",
            "#F87171",
            "#A78BFA",
          ],
        },
      ],
    },
  });
}

goalInput.addEventListener("input", () => updateInsights());

// ---------------- Speech Timer ----------------
let timerRunning = false;
let timerSeconds = 0;
function updateTimerDisplay(seconds, limit) {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${min}:${sec}`;

  const ratio = seconds / limit;
  if (ratio < 0.66) timerDisplay.style.color = "limegreen";
  else if (ratio < 0.9) timerDisplay.style.color = "gold";
  else timerDisplay.style.color = "red";
}

startTimerBtn.addEventListener("click", () => {
  if (timerRunning) return;
  const limit = parseInt(timerInput.value) * 60;
  timerRunning = true;
  startTime = Date.now() - timerSeconds * 1000;
  timerInterval = setInterval(() => {
    timerSeconds = Math.floor((Date.now() - startTime) / 1000);
    if (timerSeconds >= limit) {
      clearInterval(timerInterval);
      timerDisplay.textContent = "Time Up!";
      timerDisplay.style.color = "red";
      timerRunning = false;
    } else updateTimerDisplay(timerSeconds, limit);
  }, 1000);
});

resetTimerBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerSeconds = 0;
  timerDisplay.textContent = "00:00";
  timerDisplay.style.color = "";
  timerRunning = false;
});

// ---------------- Tabs ----------------
function showTab(activeTab) {
  [trackerTab, summaryTab, timelineTab, insightsTab, timerTab].forEach((t) =>
    t.classList.add("hidden")
  );
  activeTab.classList.remove("hidden");

  [tabTracker, tabSummary, tabTimeline, tabInsights, tabTimer].forEach((b) =>
    b.classList.remove("border-blue-800")
  );
}

tabTracker.onclick = () => {
  showTab(trackerTab);
  tabTracker.classList.add("border-blue-800");
};
tabSummary.onclick = () => {
  showTab(summaryTab);
  tabSummary.classList.add("border-blue-800");
  updateSummary();
};
tabTimeline.onclick = () => {
  showTab(timelineTab);
  tabTimeline.classList.add("border-blue-800");
  updateTimeline();
};
tabInsights.onclick = () => {
  showTab(insightsTab);
  tabInsights.classList.add("border-blue-800");
  updateInsights();
};
tabTimer.onclick = () => {
  showTab(timerTab);
  tabTimer.classList.add("border-blue-800");
};

// ---------------- Init ----------------
window.onload = () => {
  loadRoles();
  updateSummary();
  updateTimeline();
  updateInsights();
};
showTab(trackerTab);
/* ============================================================
   Toastmasters Role Tracker v10
   Includes: Tracker • Summary • Timeline • Insights • Timer • Leader In Me
   Works fully offline (PWA)
   ============================================================ */

// ---------------- PWA Registration ----------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("✅ PWA ready"))
    .catch((err) => console.error("SW registration failed:", err));
}

// ---------------- Theme Toggle ----------------
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

// ---------------- Data Access ----------------
function getRoles() {
  return JSON.parse(localStorage.getItem("roles") || "[]");
}
function saveRoles(data) {
  localStorage.setItem("roles", JSON.stringify(data));
}

// ---------------- Tracker ----------------
const form = document.getElementById("roleForm");
const rolesList = document.getElementById("roles");

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
  updateLeaderTracker();
});

function deleteRole(i) {
  const roles = getRoles();
  roles.splice(i, 1);
  saveRoles(roles);
  loadRoles();
  updateSummary();
  updateTimeline();
  updateInsights();
  updateLeaderTracker();
}

// ---------------- Summary ----------------
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
  const timelineContainer = document.getElementById("timelineContainer");
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
  const totalRolesEl = document.getElementById("totalRoles");
  const topRolesEl = document.getElementById("topRoles");
  const avgRatingEl = document.getElementById("avgRating");
  const longestGapEl = document.getElementById("longestGap");
  const streakCountEl = document.getElementById("streakCount");
  const goalInput = document.getElementById("goalInput");
  const goalProgress = document.getElementById("goalProgress");

  const total = roles.length;
  totalRolesEl.textContent = total;

  if (total === 0) {
    topRolesEl.textContent = avgRatingEl.textContent = longestGapEl.textContent =
      streakCountEl.textContent = "-";
    return;
  }

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

  avgRatingEl.textContent =
    ratings.length > 0
      ? `${(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)} ⭐`
      : "-";

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

  const months = new Set(
    roles.map(
      (r) =>
        new Date(r.date).getFullYear() + "-" + (new Date(r.date).getMonth() + 1)
    )
  );
  streakCountEl.textContent = months.size + " months active";

  const goal = parseInt(goalInput.value || localStorage.getItem("goal") || 10);
  localStorage.setItem("goal", goal);
  goalInput.value = goal;
  const percent = Math.min((total / goal) * 100, 100).toFixed(0);
  goalProgress.textContent = `${total} / ${goal} roles (${percent}%)`;

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
document.getElementById("goalInput").addEventListener("input", () => updateInsights());

// ---------------- Timer ----------------
let timerRunning = false;
let timerSeconds = 0;
let timerInterval = null;
let startTime = null;

const timerInput = document.getElementById("timerInput");
const timerDisplay = document.getElementById("timerDisplay");
const startTimerBtn = document.getElementById("startTimer");
const resetTimerBtn = document.getElementById("resetTimer");

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
const trackerTab = document.getElementById("trackerTab");
const summaryTab = document.getElementById("summaryTab");
const timelineTab = document.getElementById("timelineTab");
const insightsTab = document.getElementById("insightsTab");
const timerTab = document.getElementById("timerTab");
const leaderTab = document.getElementById("leaderTab");
const tabTracker = document.getElementById("tab-tracker");
const tabSummary = document.getElementById("tab-summary");
const tabTimeline = document.getElementById("tab-timeline");
const tabInsights = document.getElementById("tab-insights");
const tabTimer = document.getElementById("tab-timer");
const tabLeader = document.getElementById("tab-leader");

function showTab(activeTab, activeButton) {
  [trackerTab, summaryTab, timelineTab, insightsTab, timerTab, leaderTab].forEach(
    (t) => t.classList.add("hidden")
  );
  activeTab.classList.remove("hidden");
  [tabTracker, tabSummary, tabTimeline, tabInsights, tabTimer, tabLeader].forEach(
    (b) => b.classList.remove("border-blue-800")
  );
  activeButton.classList.add("border-blue-800");
}

tabTracker.onclick = () => showTab(trackerTab, tabTracker);
tabSummary.onclick = () => {
  showTab(summaryTab, tabSummary);
  updateSummary();
};
tabTimeline.onclick = () => {
  showTab(timelineTab, tabTimeline);
  updateTimeline();
};
tabInsights.onclick = () => {
  showTab(insightsTab, tabInsights);
  updateInsights();
};
tabTimer.onclick = () => showTab(timerTab, tabTimer);

// ---------------- Leader In Me ----------------
const leaderSkills = [
  { title: "Listening", need: 2, roles: ["Ah Counter", "Speech Evaluator", "Grammarian", "TT Speaker"] },
  { title: "Critical Thinking", need: 2, roles: ["Speech Evaluator", "Grammarian", "General Evaluator"] },
  { title: "Giving Feedback", need: 2, roles: ["Speech Evaluator", "Grammarian", "General Evaluator"] },
  { title: "Time Management", need: 2, roles: ["Timer", "Topicsmaster", "Speaker"] },
  { title: "Planning and Implementation", need: 2, roles: ["Speaker", "General Evaluator", "Toastmaster of the Day", "Topicsmaster"] },
  { title: "Organizing and Delegating", need: 1, roles: ["Contest Organizer", "Event Helper", "Open House", "Newsletter"] },
  { title: "Facilitation", need: 1, roles: ["Toastmaster of the Day", "General Evaluator", "Table Topics Master", "Contest Chair"] },
  { title: "Motivation", need: 1, roles: ["Speech Evaluator", "General Evaluator"] },
  { title: "Mentoring", need: 1, roles: ["Mentor", "HPL Guidance Committee Member"] },
  { title: "Team Building", need: 1, roles: ["Toastmaster of the Day", "Contest Chair", "Chief Judge", "Event Convenor"] },
];

const leaderContainer = document.getElementById("leaderContainer");
const leaderProgress = document.getElementById("leaderProgress");
const leaderCongrats = document.getElementById("leaderCongrats");

function updateLeaderTracker() {
  const roles = getRoles();
  leaderContainer.innerHTML = "";
  let completedSkills = 0;

  leaderSkills.forEach((skill, idx) => {
    const matched = skill.roles.filter(r =>
      roles.some(role => role.role.toLowerCase().includes(r.toLowerCase()))
    );
    const count = matched.length;
    const done = count >= skill.need;
    if (done) completedSkills++;

    const color = done ? "border-green-500" : count > 0 ? "border-yellow-400" : "border-red-400";
    const wrapper = document.createElement("div");
    wrapper.className = `border-l-4 ${color} p-2 bg-gray-50 dark:bg-gray-700 rounded`;
    wrapper.innerHTML = `
      <div class="flex justify-between items-center cursor-pointer" onclick="toggleLeaderDetail(${idx})">
        <span><strong>${skill.title}</strong> — ${count}/${skill.need}</span>
        <span>${done ? "✅" : count > 0 ? "🟡" : "🔴"}</span>
      </div>
      <div id="leader-detail-${idx}" class="hidden mt-2 ml-3 text-sm space-y-1">
        ${skill.roles
          .map(r => `<div>${matched.includes(r) ? "✔" : "❌"} ${r}</div>`)
          .join("")}
      </div>`;
    leaderContainer.appendChild(wrapper);
  });

  const percent = Math.round((completedSkills / leaderSkills.length) * 100);
  leaderProgress.textContent = `Progress: ${completedSkills} / ${leaderSkills.length} (${percent}%)`;
  leaderCongrats.classList.toggle("hidden", completedSkills !== leaderSkills.length);
}

function toggleLeaderDetail(i) {
  document.getElementById(`leader-detail-${i}`).classList.toggle("hidden");
}

tabLeader.onclick = () => {
  showTab(leaderTab, tabLeader);
  updateLeaderTracker();
};

// ---------------- Init ----------------
window.onload = () => {
  loadRoles();
  updateSummary();
  updateTimeline();
  updateInsights();
  updateLeaderTracker();
};

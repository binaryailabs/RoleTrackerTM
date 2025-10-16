/* ============================================================
   Toastmasters Role Tracker v3 - Advanced Edition
   BinaryAILabs 💪 | Offline | PWA Ready
   ============================================================ */

// ---------------- PWA Registration ----------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("✅ PWA active"))
    .catch((err) => console.error("SW failed:", err));
}

// ---------------- Theme Toggle ----------------
const body = document.getElementById("body");
const themeToggle = document.getElementById("themeToggle");
const toggleTrack = document.getElementById("toggleTrack");
const toggleThumb = document.getElementById("toggleThumb");

function setTheme(isDark) {
  if (isDark) {
    body.classList.add("bg-gray-900", "text-white");
    toggleThumb.classList.add("translate-x-5");
    toggleTrack.classList.replace("bg-gray-300", "bg-blue-600");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.remove("bg-gray-900", "text-white");
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

// ---------------- Storage Helpers ----------------
function getRoles() {
  return JSON.parse(localStorage.getItem("roles") || "[]");
}
function saveRoles(r) {
  localStorage.setItem("roles", JSON.stringify(r));
}
function getRoleList() {
  const defaults = [
    "Speaker",
    "Speech Evaluator",
    "General Evaluator",
    "Table Topics Master",
    "Toastmaster of the Day",
    "Grammarian",
    "Ah Counter",
    "Timer",
    "Contest Chair",
    "Chief Judge",
    "Mentor",
    "Contest Organizer",
    "Event Convenor",
    "Topicsmaster",
  ];
  const stored = JSON.parse(localStorage.getItem("roleList") || "[]");
  return [...new Set([...defaults, ...stored])];
}
function saveRoleList(list) {
  localStorage.setItem("roleList", JSON.stringify(list));
}

// ---------------- Tracker ----------------
const form = document.getElementById("roleForm");
const rolesList = document.getElementById("roles");
const roleSelect = document.getElementById("role");
let sortDescending = true;

function populateDropdown() {
  roleSelect.innerHTML = getRoleList()
    .map((r) => `<option value="${r}">${r}</option>`)
    .join("");
}

function renderSortButton() {
  if (!document.getElementById("sortBtn")) {
    const btn = document.createElement("button");
    btn.id = "sortBtn";
    btn.className = "text-sm text-[#004165] underline mb-2";
    btn.innerHTML = sortDescending ? "🔽 Showing Newest First" : "🔼 Showing Oldest First";
    btn.onclick = () => {
      sortDescending = !sortDescending;
      btn.innerHTML = sortDescending ? "🔽 Showing Newest First" : "🔼 Showing Oldest First";
      loadRoles();
    };
    rolesList.parentElement.insertBefore(btn, rolesList);
  }
}

function loadRoles() {
  renderSortButton();
  const roles = getRoles().sort((a, b) =>
    sortDescending
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  if (roles.length === 0) {
    rolesList.innerHTML = `<p class="text-gray-500 text-center">No roles yet.</p>`;
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
  const role = {
    date: document.getElementById("date").value,
    role: document.getElementById("role").value,
    club: document.getElementById("club").value,
    notes: document.getElementById("notes").value,
    rating: document.getElementById("rating").value,
  };
  const roles = getRoles();
  roles.push(role);
  saveRoles(roles);
  form.reset();
  loadRoles();
  updateAll();
});

function deleteRole(i) {
  const roles = getRoles();
  roles.splice(i, 1);
  saveRoles(roles);
  loadRoles();
  updateAll();
}

// ---------------- Summary ----------------
let roleChart = null;
function updateSummary() {
  const roles = getRoles();
  const ctx = document.getElementById("roleChart").getContext("2d");
  if (roleChart) roleChart.destroy();
  const freq = roles.reduce((a, r) => ((a[r.role] = (a[r.role] || 0) + 1), a), {});
  roleChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(freq),
      datasets: [{ data: Object.values(freq), backgroundColor: "#004165" }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

// ---------------- Timeline ----------------
function updateTimeline() {
  const roles = getRoles().sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById("timelineContainer");
  if (!roles.length) return (container.innerHTML = "<p>No roles yet.</p>");
  const grouped = {};
  roles.forEach((r) => {
    const m = new Date(r.date).toLocaleString("default", { month: "long", year: "numeric" });
    (grouped[m] ||= []).push(r);
  });
  container.innerHTML = Object.entries(grouped)
    .map(
      ([m, arr]) =>
        `<h3 class="font-bold text-[#004165]">${m}</h3>` +
        arr
          .map(
            (r) =>
              `<div class="ml-3 border-l-2 border-[#004165] pl-3">
              <strong>${r.role}</strong> - ${r.club}<br><small>${r.date}</small>
            </div>`
          )
          .join("")
    )
    .join("");
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
  totalRolesEl.textContent = total || "-";
  if (!total) return;

  const freq = {};
  const ratings = [];
  roles.forEach((r) => {
    freq[r.role] = (freq[r.role] || 0) + 1;
    if (r.rating) ratings.push(r.rating.length);
  });

  topRolesEl.textContent = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([r]) => r)
    .join(", ");

  avgRatingEl.textContent =
    ratings.length > 0
      ? `${(ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1)} ⭐`
      : "-";

  const sorted = [...roles].sort((a, b) => new Date(a.date) - new Date(b.date));
  let longest = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i].date) - new Date(sorted[i - 1].date)) / (1000 * 3600 * 24);
    longest = Math.max(longest, diff);
  }
  longestGapEl.textContent = `${Math.round(longest)} days`;

  const months = new Set(
    sorted.map((r) => new Date(r.date).getFullYear() + "-" + new Date(r.date).getMonth())
  );
  streakCountEl.textContent = `${months.size} months`;

  const goal = parseInt(goalInput.value || localStorage.getItem("goal") || 10);
  localStorage.setItem("goal", goal);
  const percent = Math.min((total / goal) * 100, 100).toFixed(0);
  goalProgress.textContent = `${total}/${goal} (${percent}%)`;

  const ctx = document.getElementById("insightPie").getContext("2d");
  if (insightPie) insightPie.destroy();
  insightPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(freq),
      datasets: [{ data: Object.values(freq), backgroundColor: ["#004165", "#772432", "#fbbf24", "#60a5fa", "#34d399"] }],
    },
  });
}
document.getElementById("goalInput").addEventListener("input", updateInsights);

// ---------------- Timer ----------------
const timerDisplay = document.getElementById("timerDisplay");
document.getElementById("startTimer").onclick = () => {
  const green = parseFloat(prompt("Green (min):", "4"));
  const yellow = parseFloat(prompt("Yellow (min):", "5"));
  const red = parseFloat(prompt("Red (min):", "6"));
  let sec = 0;
  clearInterval(window.ti);
  window.ti = setInterval(() => {
    sec++;
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    timerDisplay.textContent = `${m}:${s}`;
    timerDisplay.style.backgroundColor =
      sec < green * 60
        ? "transparent"
        : sec < yellow * 60
        ? "#22c55e"
        : sec < red * 60
        ? "#facc15"
        : "#ef4444";
  }, 1000);
};
document.getElementById("resetTimer").onclick = () => {
  clearInterval(window.ti);
  timerDisplay.textContent = "00:00";
  timerDisplay.style.backgroundColor = "transparent";
};

// ---------------- Leader In Me ----------------
const leaderSkills = [
  { title: "Listening", need: 2, roles: ["Ah Counter", "Speech Evaluator", "Grammarian", "TT Speaker"] },
  { title: "Critical Thinking", need: 2, roles: ["Speech Evaluator", "Grammarian", "General Evaluator"] },
  { title: "Giving Feedback", need: 2, roles: ["Speech Evaluator", "Grammarian", "General Evaluator"] },
  { title: "Time Management", need: 2, roles: ["Timer", "Topicsmaster", "Speaker"] },
  { title: "Planning & Implementation", need: 2, roles: ["Speaker", "General Evaluator", "Toastmaster of the Day", "Topicsmaster"] },
  { title: "Organizing & Delegating", need: 1, roles: ["Contest Organizer", "Event Helper", "Open House", "Newsletter"] },
  { title: "Facilitation", need: 1, roles: ["Toastmaster of the Day", "General Evaluator", "Table Topics Master", "Contest Chair"] },
  { title: "Motivation", need: 1, roles: ["Speech Evaluator", "General Evaluator"] },
  { title: "Mentoring", need: 1, roles: ["Mentor", "HPL Guidance Committee Member"] },
  { title: "Team Building", need: 1, roles: ["Toastmaster of the Day", "Contest Chair", "Chief Judge", "Event Convenor"] },
];

function updateLeaderTracker() {
  const roles = getRoles();
  const container = document.getElementById("leaderContainer");
  container.innerHTML = "";
  let completed = 0;

  // Keep track of which role+date combinations are already used by other skills
  const usedEntries = new Set();

  leaderSkills.forEach((skill, i) => {
    // Find matches for this skill
    const matching = roles.filter((r) =>
      skill.roles.some((s) => r.role.toLowerCase().includes(s.toLowerCase()))
    );

    // Deduplicate and exclude any entries already used in other skills
    const uniqueEntries = [];
    for (const r of matching) {
      const key = `${r.role}-${r.date}`;
      if (!usedEntries.has(key)) {
        uniqueEntries.push(r);
        usedEntries.add(key);
      }
    }

    // Count limited to skill.need only
    const count = Math.min(uniqueEntries.length, skill.need);
    const done = count >= skill.need;
    if (done) completed++;

    const pct = Math.min((count / skill.need) * 100, 100);
    const color = done
      ? "border-green-500"
      : count
      ? "border-yellow-400"
      : "border-red-400";

    container.innerHTML += `
      <div class="border-l-4 ${color} p-2 bg-gray-50 dark:bg-gray-700 rounded mb-2">
        <div class="flex justify-between cursor-pointer" onclick="toggleLeaderDetail(${i})">
          <span><strong>${skill.title}</strong> — ${count}/${skill.need}</span>
          <span>${done ? "✅" : count ? "🟡" : "🔴"}</span>
        </div>
        <div class="w-full bg-gray-300 h-2 rounded mt-1">
          <div class="h-2 rounded transition-all duration-500 ease-in-out" style="width:${pct}%;background:#004165;"></div>
        </div>
        <div id="leader-detail-${i}" class="hidden mt-2 ml-3 text-sm">
          ${skill.roles
            .map((r) => {
              const found = uniqueEntries.some((x) =>
                x.role.toLowerCase().includes(r.toLowerCase())
              );
              return `<div>${found ? "✔" : "❌"} ${r}</div>`;
            })
            .join("")}
        </div>
      </div>`;
  });

  // ---------------- Mini Progress Bar & Dynamic Color ----------------
  const percent = Math.round((completed / leaderSkills.length) * 100);
  document.getElementById("leaderProgress").textContent =
    `Progress: ${completed}/${leaderSkills.length} (${percent}%)`;

  // Mini bar width
  const bar = document.getElementById("leaderMiniBar");
  const text = document.getElementById("leaderMiniText");
  if (bar) {
    bar.style.width = `${percent}%`;
    let barColor = "#9ca3af"; // default gray
    if (percent > 0 && percent <= 30) barColor = "#facc15";      // yellow
    else if (percent > 30 && percent <= 70) barColor = "#004165"; // loyal blue
    else if (percent > 70 && percent < 100) barColor = "#22c55e"; // green
    else if (percent === 100) barColor = "#772432";               // true maroon
    bar.style.background = barColor;
  }

  // Progress text visibility
  if (text) {
    text.textContent = `${percent}%`;
    text.style.color = percent > 15 ? "white" : "black";
  }

  // Congrats message
  document
    .getElementById("leaderCongrats")
    .classList.toggle("hidden", completed !== leaderSkills.length);
}



function toggleLeaderDetail(i) {
  document.getElementById(`leader-detail-${i}`).classList.toggle("hidden");
}

// ---------------- Roles Tab ----------------
function loadRolesTable() {
  const table = document.getElementById("rolesTable");
  const list = getRoleList();
  const search = document.getElementById("roleSearch").value.toLowerCase().trim();
  const filtered = list.filter((r) => r.toLowerCase().includes(search));
  table.innerHTML = filtered
    .map(
      (r) => `
    <tr>
      <td>${r}</td>
      <td><button onclick="deleteRoleFromList('${r}')" class="text-red-600 text-sm">🗑</button></td>
    </tr>`
    )
    .join("");
}
document.getElementById("roleSearch").addEventListener("input", loadRolesTable);
document.getElementById("addRoleBtn").onclick = () => {
  const newRole = document.getElementById("newRole").value.trim();
  if (!newRole) return;
  const list = getRoleList();
  if (!list.includes(newRole)) {
    list.push(newRole);
    saveRoleList(list);
    populateDropdown();
    loadRolesTable();
  }
  document.getElementById("newRole").value = "";
};
function deleteRoleFromList(role) {
  const list = getRoleList().filter((r) => r !== role);
  saveRoleList(list);
  populateDropdown();
  loadRolesTable();
}

// ---------------- Tabs ----------------
const tabs = [
  { id: "trackerTab", btn: "tab-tracker" },
  { id: "summaryTab", btn: "tab-summary" },
  { id: "timelineTab", btn: "tab-timeline" },
  { id: "insightsTab", btn: "tab-insights" },
  { id: "timerTab", btn: "tab-timer" },
  { id: "leaderTab", btn: "tab-leader" },
  { id: "rolesTab", btn: "tab-roles" },
  { id: "adminTab", btn: "tab-admin" },
];

function showTab(tabId) {
  document.querySelectorAll("section").forEach((s) => s.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  tabs.forEach((t) => document.getElementById(t.btn).classList.remove("active-tab"));
  document
    .getElementById(tabs.find((t) => t.id === tabId).btn)
    .classList.add("active-tab");
  updateAll();
}
tabs.forEach((t) =>
  document.getElementById(t.btn).addEventListener("click", () => showTab(t.id))
);

// ---------------- Admin ----------------
document.getElementById("unlockAdmin").onclick = () => {
  const pass = document.getElementById("adminPass").value;
  if (pass === "binaryailabs")
    document.getElementById("adminActions").classList.remove("hidden");
  else alert("❌ Incorrect password");
};
document.getElementById("resetAll").onclick = () => {
  if (confirm("Erase all data?")) {
    localStorage.clear();
    location.reload();
  }
};

// ---------------- Init ----------------
function updateAll() {
  updateSummary();
  updateTimeline();
  updateInsights();
  updateLeaderTracker();
  loadRolesTable();
}
window.onload = () => {
  populateDropdown();
  loadRoles();
  updateAll();
};

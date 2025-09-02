// ===================== Supabase Config =====================
const SUPABASE_URL = 'https://gcbijznnberhhumqyzua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYmlqem5uYmVyaGh1bXF5enVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTMzNzEsImV4cCI6MjA2NzEyOTM3MX0.AIvOmlHuUihBrZyww98M4Ktz4TE-MmuM2OE3HBiwSmA';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================== Backend Config =====================
// 👇 Always use your deployed backend
const BACKEND_URL = "https://mini-project-cai-5l66.onrender.com";

// ===================== Global Variables =====================
let currentUser = null;
let savedReports = [];
const symptoms = [];

const commonSymptoms = [
  'fever', 'cough', 'headache', 'fatigue', 'skin_rash', 'itching', 'shortness_of_breath', 'chest_pain',
  'sore_throat', 'body_pain', 'nausea', 'vomiting', 'diarrhoea', 'continuous_sneezing', 'shivering', 'joint_pain', 'stomach_pain', 'acidity', 'weight_gain'
];

// ===================== DOM Ready =====================
window.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');
  if (menuToggle && mobileMenu && menuIcon) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      menuIcon.textContent = mobileMenu.classList.contains('hidden') ? '☰' : '✕';
    });
  }

  // Common symptoms badges
  const commonSymptomsContainer = document.getElementById('common-symptoms');
  if (commonSymptomsContainer) {
    commonSymptoms.forEach(symptom => {
      const badge = document.createElement('span');
      badge.className = 'symptom-badge common';
      badge.textContent = symptom;
      badge.onclick = () => {
        document.getElementById('symptom-input').value = symptom;
      };
      commonSymptomsContainer.appendChild(badge);
    });
  }

  // Modals
  ['login-link', 'mobile-login-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal('login-modal'));
  });
  ['signup-link', 'mobile-signup-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal('signup-modal'));
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Profile/Dashboard links
  document.querySelectorAll('#mobile-profile-link a[href="#profile"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showProfile();
      document.getElementById('mobile-menu')?.classList.add('hidden');
      document.getElementById('menu-icon').textContent = '☰';
    });
  });
  document.querySelectorAll('#profile-link a[href="#profile"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showProfile();
    });
  });
  document.querySelectorAll('#profile-link a[href="#dashboard"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showDashboard();
    });
  });
  document.querySelectorAll('#mobile-profile-link a[href="#dashboard"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showDashboard();
      document.getElementById('mobile-menu')?.classList.add('hidden');
      document.getElementById('menu-icon').textContent = '☰';
    });
  });

  // Auto-login session check
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data?.session) {
      currentUser = data.session.user;
      onLogin();
    } else {
      showHome();
    }
  });
});

// ===================== Auth Functions =====================
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function switchForm(id) {
  closeModal('login-modal');
  closeModal('signup-modal');
  openModal(id);
}

async function handleSignup() {
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Enter valid email', 'error');
  if (password.length < 6) return showToast('Password must be 6+ characters', 'error');

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) showToast(error.message, 'error');
  else {
    showToast('Signup successful! Verify your email.', 'success');
    closeModal('signup-modal');
  }
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return showToast(error.message, 'error');

  currentUser = data.user;

  closeModal('login-modal');
  onLogin();
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  showToast('Logged out', 'info');
  showHome();
}

function onLogin() {
  showToast('Login successful', 'success');
  document.getElementById('profile-email').textContent = currentUser.email;
  fetchSavedReports(); // ✅ fetch saved reports immediately
  showDashboard();
}

// ===================== Navigation =====================
function showDashboard() {
  ['home', 'about', 'how-it-works', 'contact', 'report-info', 'prediction-info', 'health-journey', 'profile'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('auth-links').classList.add('hidden');
  document.getElementById('mobile-auth-links').classList.add('hidden');
  document.getElementById('profile-link').classList.remove('hidden');
  document.getElementById('mobile-profile-link').classList.remove('hidden');
}

function showProfile() {
  document.getElementById('dashboard')?.classList.add('hidden');
  document.getElementById('profile')?.classList.remove('hidden');
}

function showHome() {
  ['home', 'about', 'how-it-works', 'contact', 'report-info', 'prediction-info', 'health-journey'].forEach(id => document.getElementById(id)?.classList.remove('hidden'));
  ['dashboard', 'profile'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById('auth-links').classList.remove('hidden');
  document.getElementById('mobile-auth-links').classList.remove('hidden');
  document.getElementById('profile-link').classList.add('hidden');
  document.getElementById('mobile-profile-link').classList.add('hidden');
}

// ===================== Toast =====================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = position: fixed; top: 20px; right: 20px; padding: 12px 24px; background-color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'}; color: white; border-radius: 6px; z-index: 1000; font-weight: 500; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===================== Symptom Handling =====================
function addSymptom() {
  const input = document.getElementById('symptom-input');
  const value = input.value.trim();
  if (!value || symptoms.includes(value)) return;
  symptoms.push(value);
  renderSymptoms();
  input.value = '';
}

function renderSymptoms() {
  const container = document.getElementById('added-symptoms');
  container.innerHTML = '';
  symptoms.forEach(symptom => {
    const badge = document.createElement('span');
    badge.className = 'symptom-badge added bg-blue-600 text-white';
    badge.innerHTML = `
      ${symptom}
      <button 
        class="remove-btn text-white hover:bg-white/20" 
        onclick="removeSymptom('${symptom}')"
        aria-label="Remove"
      >
        &times;
      </button>
    `;
    container.appendChild(badge);
  });

  document.getElementById('symptom-count').textContent = symptoms.length;
  document.getElementById('added-symptoms-container').style.display = symptoms.length > 0 ? 'block' : 'none';
  document.getElementById('analyze-btn').disabled = symptoms.length === 0;
  document.getElementById('reset-btn').disabled = symptoms.length === 0;
}

function removeSymptom(symptom) {
  const index = symptoms.indexOf(symptom);
  if (index !== -1) {
    symptoms.splice(index, 1);
    renderSymptoms();
  }
}

function resetForm() {
  symptoms.length = 0;
  renderSymptoms();
}

// ===================== Analyze Symptoms =====================
async function analyzeSymptoms() {
  if (symptoms.length === 0) return;

  document.getElementById('report').scrollIntoView({ behavior: 'smooth' });
  showToast('Analyzing symptoms...', 'info');

  try {
    const response = await fetch(${BACKEND_URL}/predict, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms })
    });

    if (!response.ok) throw new Error(HTTP error! Status: ${response.status});

    const data = await response.json();

    if (data.error) {
      showToast('Error: ' + data.error, 'error');
      return;
    }

    const { disease, description, medications, diets, precautions, workouts } = data;

    const makeNumberedList = (arr) =>
      Array.isArray(arr) && arr.length > 0
        ? arr.map((item, i) => ${i + 1}. ${item}).join('<br>')
        : 'Not available';

    const reportFields = [
      disease || 'Not available',
      description || 'Not available',
      makeNumberedList(medications),
      makeNumberedList(diets),
      makeNumberedList(precautions),
      makeNumberedList(workouts)
    ];

    const reportEls = document.querySelectorAll('.report-text');
    reportEls.forEach((el, idx) => {
      el.innerHTML = reportFields[idx];
    });

    showToast('Check your health report below', 'success');
  } catch (error) {
    console.error('Error fetching prediction:', error);
    showToast('Failed to fetch health prediction', 'error');
  }
}

// ===================== Save Reports =====================
async function saveHealthReport() {
  const [disease, description, medications, diets, precautions, workouts] = Array.from(document.querySelectorAll('.report-text')).map(el => el.textContent.trim());

  if (!currentUser) {
    showToast('Please log in to save your report.', 'error');
    return;
  }

  const { data, error } = await supabaseClient
    .from('Reports')
    .insert([
      {
        disease,
        description,
        medications,
        diets,
        precautions,
        workouts,
        user_id: currentUser.id
      }
    ])
    .select();

  if (error) {
    showToast('Failed to save to database', 'error');
    console.error(error);
    return;
  }

  const insertedReport = data[0];
  savedReports.push([
    insertedReport.disease,
    insertedReport.description,
    insertedReport.medications,
    insertedReport.diets,
    insertedReport.precautions,
    insertedReport.workouts,
    insertedReport.id
  ]);

  renderSavedReports();
  showToast('Your report is saved', 'success');
}

// ===================== Fetch & Render Reports =====================
async function fetchSavedReports() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from('Reports')
    .select('id, disease, description, medications, diets, precautions, workouts')
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Error fetching saved reports:', error);
    return;
  }

  savedReports = data.map(row => [
    row.disease,
    row.description,
    row.medications,
    row.diets,
    row.precautions,
    row.workouts,
    row.id
  ]);

  renderSavedReports();
}

function renderSavedReports() {
  const container = document.getElementById('saved-reports-list');
  container.innerHTML = '';

  savedReports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'report-card space-y-4 mb-6 relative';

    const unsaveBtn = document.createElement('button');
    unsaveBtn.className = 'absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded';
    unsaveBtn.textContent = 'Unsave';
    unsaveBtn.dataset.id = report[6];

    unsaveBtn.onclick = () => deleteReport(report[6]);

    card.appendChild(unsaveBtn);

    const headings = [
      '🩺 Predicted Disease',
      '📜 Description',
      '💊 Medications',
      '🍽 Diets',
      '⚠ Precautions',
      '🏋 Workouts'
    ];

    report.slice(0, 6).forEach((text, idx) => {
      const section = document.createElement('div');
      let formattedText = text;

      if (idx >= 2) {
        formattedText = (text.match(/\d+\.\s.*?(?=\d+\.\s|$)/gs) || [text])
          .map(line => line.trim())
          .join('<br>');
      }

      section.innerHTML = <h3 class="report-heading text-lg mb-1">${headings[idx]}</h3><p class="report-text">${formattedText}</p>;
      card.appendChild(section);
    });

    container.appendChild(card);
  });
}

// ===================== Delete Report =====================
async function deleteReport(reportId) {
  if (!reportId) {
    console.error("❌ No report ID passed to deleteReport()");
    return;
  }

  const { error } = await supabaseClient
    .from("Reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    console.error("❌ Error deleting report:", error.message);
    showToast("❌ Failed to delete report", "error");
  } else {
    console.log("✅ Report deleted successfully:", reportId);
    showToast("✅ Report deleted", "success");
    fetchSavedReports();
  }
}

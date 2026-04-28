const cases = [
  {
    id: "openai-gpt4o-launch",
    speaker: "OpenAI",
    type: "speech",
    title: "OpenAI GPT-4o launch demo",
    query:
      "Did OpenAI publicly demonstrate GPT-4o with real-time voice and vision capabilities during its launch event.",
    summary:
      "The claim matches the official launch video, product announcement, and media coverage describing the live multimodal demo.",
    authenticity: 98,
    mediaEvidence: {
      label: "Primary video evidence",
      source: "OpenAI spring launch presentation",
      provider: "Official product event stream",
      description:
        "The source video shows the assistant responding in real time with voice, screen understanding, and multimodal interaction.",
      timestamp: "09:12 - 09:48",
      linkLabel: "Open launch clip",
      clipLabel: "Launch demo",
      frameTimestamp: "09:26",
      frameTitle: "Key frame",
      frameNote:
        "The presenter is demonstrating live voice interaction while the model responds on screen.",
      frameClass: "frame-stage",
    },
    evidence: [
      {
        type: "Official Announcement",
        source: "OpenAI product page",
        detail: "The launch materials describe GPT-4o as a multimodal model with voice, vision, and text capabilities.",
        score: "0.99",
      },
      {
        type: "Video",
        source: "Launch livestream",
        detail: "The official event video shows the real-time multimodal demo around 09:12.",
        score: "0.97",
        timestamp: "09:12 - 09:48",
        action: "Video source",
      },
      {
        type: "Tech Coverage",
        source: "Press reports",
        detail: "Independent reports describe the same launch demo and feature set.",
        score: "0.94",
      },
    ],
  },
  {
    id: "apple-free-macbook",
    speaker: "Apple",
    type: "quote",
    title: "Apple free MacBook rumor",
    query:
      "Did Apple announce that it will give every university student a free MacBook starting this year.",
    summary:
      "The rumor circulates on social platforms, but there is no credible primary-source evidence from Apple supporting the claim.",
    authenticity: 8,
    mediaEvidence: {
      label: "Source search result",
      source: "No official launch video identified",
      provider: "Apple newsroom / event archive scan",
      description:
        "Truth Hermes could not locate any official Apple event, newsroom post, or verified executive statement matching this rumor.",
      timestamp: "No verified timestamp",
      linkLabel: "Review source search",
      clipLabel: "No clip found",
      frameTimestamp: "Archive gap",
      frameTitle: "Missing key frame",
      frameNote:
        "No authenticated source footage exists for this claim, which is part of why the story is flagged as fake.",
      frameClass: "frame-archive",
    },
    evidence: [
      {
        type: "Rumor Posts",
        source: "Social reposts",
        detail: "The story spreads widely, but reposts do not cite a real Apple source.",
        score: "0.41",
      },
      {
        type: "Newsroom Search",
        source: "Official Apple channels",
        detail: "No evidence found in Apple newsroom announcements or keynote materials.",
        score: "0.18",
      },
      {
        type: "Citation Check",
        source: "Secondary coverage",
        detail: "Articles and posts mainly loop back to each other without a primary announcement.",
        score: "0.27",
      },
    ],
  },
  {
    id: "nvidia-chip-clip",
    speaker: "NVIDIA keynote clip",
    type: "video",
    title: "NVIDIA chip clip context",
    query:
      "Is this NVIDIA keynote clip misleading because the surrounding product context was removed.",
    summary:
      "The original statement exists, but the reposted clip trims surrounding explanation and changes how the product claim is interpreted.",
    authenticity: 61,
    mediaEvidence: {
      label: "Video comparison",
      source: "Full keynote vs reposted clip",
      provider: "Official keynote / social repost",
      description:
        "The official keynote and the short repost diverge once the broader hardware limitations and context are removed.",
      timestamp: "14:08 - 14:24",
      linkLabel: "Open comparison clips",
      clipLabel: "Clip comparison",
      frameTimestamp: "14:16",
      frameTitle: "Key frame",
      frameNote:
        "The frame captures the presenter just before the omitted clarification about deployment conditions.",
      frameClass: "frame-clip",
    },
    evidence: [
      {
        type: "Original Upload",
        source: "Official keynote video",
        detail: "The full source includes additional product caveats before and after the clipped segment.",
        score: "0.93",
        timestamp: "14:08 - 14:24",
        action: "Original clip",
      },
      {
        type: "Repost Clip",
        source: "Short-form repost",
        detail: "The repost removes a clarification line and reframes the claim as absolute.",
        score: "0.56",
        timestamp: "00:11 clip",
        action: "Repost clip",
      },
      {
        type: "Transcript Alignment",
        source: "ASR + manual sync",
        detail: "Transcript comparison shows the exact point where contextual explanation was omitted.",
        score: "0.91",
      },
    ],
  },
].map(withVerdict);

const conversations = [];
let activeConversationId = null;
let requestSequence = 0;
let isRequestInFlight = false;
let authMode = "register";

const AUTH_USERS_KEY = "truth-hermes-users";
const AUTH_SESSION_KEY = "truth-hermes-session";

const elements = {
  pageShell: document.querySelector(".page-shell"),
  landing: document.querySelector("#landing-screen"),
  workspace: document.querySelector("#app-workspace"),
  chatHome: document.querySelector("#chat-home"),
  chatGreeting: document.querySelector("#chat-greeting"),
  chatScroll: document.querySelector("#chat-scroll"),
  resultPanel: document.querySelector("#result-panel"),
  historyList: document.querySelector("#history-list"),
  tryGuest: document.querySelector("#try-guest"),
  authEntry: document.querySelector("#auth-entry"),
  newChat: document.querySelector("#new-chat"),
  quoteInput: document.querySelector("#quote-input"),
  inputHint: document.querySelector("#input-hint"),
  speakerInput: document.querySelector("#speaker-input"),
  contentType: document.querySelector("#content-type"),
  caseList: document.querySelector("#case-list"),
  startDemo: document.querySelector("#start-demo"),
  authModal: document.querySelector("#auth-modal"),
  authBackdrop: document.querySelector("#auth-backdrop"),
  authClose: document.querySelector("#auth-close"),
  authTitle: document.querySelector("#auth-title"),
  authCopy: document.querySelector("#auth-copy"),
  authForm: document.querySelector("#auth-form"),
  authNameField: document.querySelector("#auth-name-field"),
  authName: document.querySelector("#auth-name"),
  authIdentifier: document.querySelector("#auth-identifier"),
  authPassword: document.querySelector("#auth-password"),
  authError: document.querySelector("#auth-error"),
  authSubmit: document.querySelector("#auth-submit"),
  authMeta: document.querySelector("#auth-meta"),
  authMetaSwitch: document.querySelector("#auth-meta-switch"),
  authModeRegister: document.querySelector("#auth-mode-register"),
  authModeLogin: document.querySelector("#auth-mode-login"),
  accountPanel: document.querySelector("#account-panel"),
  accountName: document.querySelector("#account-name"),
  logoutButton: document.querySelector("#logout-button"),
};

function sanitizeComposerUi() {
  document.querySelectorAll(".composer-tools, .tool-button").forEach((node) => {
    node.remove();
  });
}

function loadUsers() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

function normalizeIdentifier(value) {
  const raw = String(value || "").trim();
  const compact = raw.replace(/\s+/g, "");
  if (compact.includes("@")) {
    return compact.toLowerCase();
  }

  const digits = compact.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    return `+${digits.slice(1).replace(/\D/g, "")}`;
  }

  return digits.replace(/\D/g, "");
}

function validateIdentifier(value) {
  const normalized = normalizeIdentifier(value);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  const numeric = normalized.replace(/^\+/, "");
  const isPhone = /^\d{7,15}$/.test(numeric);

  if (!isEmail && !isPhone) {
    return null;
  }

  return normalized;
}

function showAuthError(message) {
  elements.authError.textContent = message;
  elements.authError.classList.remove("is-hidden");
}

function hideAuthError() {
  elements.authError.textContent = "";
  elements.authError.classList.add("is-hidden");
}

function updateAccountUi(session) {
  if (!session?.name) {
    elements.accountPanel?.classList.add("is-hidden");
    elements.accountName.textContent = "Guest";
    elements.chatGreeting.textContent = "Hello, Truer";
    return;
  }

  elements.accountName.textContent = session.name;
  elements.chatGreeting.textContent = `Hello, ${session.name}`;
  elements.accountPanel?.classList.remove("is-hidden");
}

function resetAuthForm() {
  elements.authForm?.reset();
  hideAuthError();
}

function setAuthMode(mode) {
  authMode = mode === "login" ? "login" : "register";
  const isLogin = authMode === "login";

  elements.authTitle.textContent = isLogin ? "Welcome back" : "Create your account";
  elements.authCopy.textContent = isLogin
    ? "Log in with the email address or mobile number you registered with."
    : "Use your email address or mobile number to create a local demo account.";
  elements.authSubmit.textContent = isLogin ? "Log in" : "Create account";
  elements.authMeta.firstChild.textContent = isLogin
    ? "Need an account? "
    : "Already have an account? ";
  elements.authMetaSwitch.textContent = isLogin ? "Sign up" : "Log in";
  elements.authNameField.classList.toggle("is-hidden", isLogin);
  elements.authModeRegister.classList.toggle("is-active", !isLogin);
  elements.authModeLogin.classList.toggle("is-active", isLogin);
  elements.authPassword.autocomplete = isLogin ? "current-password" : "new-password";
  hideAuthError();
}

function openAuthModal(mode = "register") {
  setAuthMode(mode);
  resetAuthForm();
  elements.authModal.classList.remove("is-hidden");
  elements.authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.setTimeout(() => {
    (authMode === "login" ? elements.authIdentifier : elements.authName)?.focus();
  }, 0);
}

function closeAuthModal() {
  elements.authModal.classList.add("is-hidden");
  elements.authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function classifyAuthenticity(score) {
  if (score < 20) {
    return {
      status: "false",
      verdictLabel: "Fake",
      verdictTitle: "Fake",
    };
  }

  if (score > 80) {
    return {
      status: "true",
      verdictLabel: "True",
      verdictTitle: "True",
    };
  }

  return {
    status: "pending",
    verdictLabel: "Need Review",
    verdictTitle: "Need Review",
  };
}

function withVerdict(result) {
  const authenticity = Number.parseInt(result.authenticity, 10);

  return {
    ...result,
    ...classifyAuthenticity(authenticity),
    authenticity,
    authenticityLabel: `${authenticity}%`,
  };
}

function summarize(text) {
  return text.length > 54 ? `${text.slice(0, 54)}...` : text || "Untitled verification";
}

function getActiveConversation() {
  return conversations.find((item) => item.id === activeConversationId) || null;
}

function showApp() {
  document.body.classList.add("app-mode");
  elements.pageShell.classList.add("app-active");
  elements.landing.classList.add("is-hidden");
  elements.workspace.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showLanding() {
  document.body.classList.remove("app-mode");
  elements.pageShell.classList.remove("app-active");
  elements.workspace.classList.add("is-hidden");
  elements.landing.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showHomeState() {
  elements.chatHome.classList.remove("is-hidden");
  elements.resultPanel.classList.add("is-hidden");
}

function revealConversation() {
  elements.chatHome.classList.add("is-hidden");
  elements.resultPanel.classList.remove("is-hidden");
  window.requestAnimationFrame(() => {
    elements.chatScroll.scrollTo({
      top: elements.chatScroll.scrollHeight,
      behavior: "smooth",
    });
  });
}

function showInputHint(message) {
  elements.inputHint.textContent = message;
  elements.inputHint.classList.remove("is-hidden");
  elements.quoteInput.classList.add("input-error");
}

function hideInputHint() {
  elements.inputHint.classList.add("is-hidden");
  elements.quoteInput.classList.remove("input-error");
}

function resizeComposer() {
  if (!elements.quoteInput) {
    return;
  }

  elements.quoteInput.style.height = "0px";
  elements.quoteInput.style.height = `${Math.min(elements.quoteInput.scrollHeight, 132)}px`;
}

function renderHistory() {
  if (!conversations.length) {
    elements.historyList.innerHTML = `
      <div class="history-empty">
        <p>No saved verifications yet.</p>
        <span>Run a check to store it here.</span>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = conversations
    .map(
      (item) => `
        <button class="history-item ${item.id === activeConversationId ? "is-active" : ""}" data-history-id="${item.id}">
          <span class="history-title">${escapeHtml(item.title)}</span>
          <span class="history-meta">${escapeHtml(item.verdictLabel)} · ${item.messages.length} turns</span>
        </button>
      `
    )
    .join("");
}

function renderCases() {
  elements.caseList.innerHTML = cases
    .map(
      (item) => `
        <button class="sample-item" data-case-id="${item.id}">
          <span class="sample-title">${escapeHtml(item.title)}</span>
          <span class="sample-subtitle">${escapeHtml(item.verdictLabel)} · ${escapeHtml(item.speaker)}</span>
        </button>
      `
    )
    .join("");
}

function evidenceMarkup(evidence = []) {
  return evidence
    .map(
      (item) => `
        <article class="evidence-item">
          <div class="evidence-top">
            <span>${escapeHtml(item.type)}</span>
            <span>score ${escapeHtml(item.score)}</span>
          </div>
          <strong>${escapeHtml(item.source)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          ${
            item.timestamp || item.action
              ? `
                <div class="evidence-footer">
                  ${item.timestamp ? `<span class="timestamp-chip">${escapeHtml(item.timestamp)}</span>` : ""}
                  ${item.action ? `<span class="source-chip">${escapeHtml(item.action)}</span>` : ""}
                </div>
              `
              : ""
          }
        </article>
      `
    )
    .join("");
}

function workflowMarkup(data) {
  const media = data.mediaEvidence || {
    label: "Video Evidence",
    source: "Waiting for source confirmation",
    provider: "Pending",
    description:
      "Once the backend is connected, this section will show the source video, exact timestamp, and a representative frame.",
    timestamp: "Pending",
    linkLabel: "Source pending",
    clipLabel: "No verified clip",
    frameTimestamp: "Pending",
    frameTitle: "Key frame pending",
    frameNote: "A key frame will appear here once a source video is verified.",
    frameClass: "frame-archive",
  };

  return `
    <div class="verification-workflow">
      <article class="workflow-step">
        <span class="workflow-index">1</span>
        <div class="workflow-copy">
          <p class="section-label">Verdict</p>
          <h3>${escapeHtml(data.verdictTitle)}</h3>
          <p>${escapeHtml(data.summary)}</p>
          <div class="result-meta-row">
            <span class="status-pill ${escapeHtml(data.status)}">${escapeHtml(data.verdictLabel)}</span>
            <span class="confidence-pill">Authenticity ${escapeHtml(data.authenticityLabel)}</span>
          </div>
        </div>
      </article>

      <article class="workflow-step">
        <span class="workflow-index">2</span>
        <div class="workflow-copy">
          <p class="section-label">Source Video</p>
          <h3>${escapeHtml(media.source)}</h3>
          <p>${escapeHtml(media.description)}</p>
          <span class="source-chip">${escapeHtml(media.provider)}</span>
        </div>
      </article>

      <article class="workflow-step">
        <span class="workflow-index">3</span>
        <div class="workflow-copy">
          <p class="section-label">Matched Timestamp</p>
          <h3>${escapeHtml(media.timestamp)}</h3>
          <p>This is the segment that corresponds to the submitted news claim.</p>
          <span class="timestamp-chip">${escapeHtml(media.linkLabel)}</span>
        </div>
      </article>

      <article class="workflow-step workflow-frame-step">
        <span class="workflow-index">4</span>
        <div class="workflow-copy">
          <p class="section-label">Key Frame Screenshot</p>
          <h3>${escapeHtml(media.frameTimestamp)}</h3>
          <div class="keyframe-preview ${escapeHtml(media.frameClass)}">
            <span class="keyframe-badge">${escapeHtml(media.frameTitle)}</span>
            <span class="preview-time">${escapeHtml(media.frameTimestamp)}</span>
          </div>
          <p>${escapeHtml(media.frameNote)}</p>
        </div>
      </article>
    </div>
  `;
}

function turnMarkup(turn) {
  if (turn.isLoading) {
    return `
      <article class="thread-card thread-user">
        <div class="thread-avatar">You</div>
        <div class="thread-content">
          <p class="section-label">Submitted Query</p>
          <p class="thread-query">${escapeHtml(turn.query)}</p>
        </div>
      </article>
      <article class="thread-card thread-assistant thread-assistant-loading">
        <div class="thread-avatar thread-avatar-assistant">TH</div>
        <div class="thread-content">
          <div class="assistant-loading" aria-label="Truth Hermes is loading">
            <span class="loading-dot"></span>
          </div>
        </div>
      </article>
    `;
  }

  const data = turn.result;
  return `
    <article class="thread-card thread-user">
      <div class="thread-avatar">You</div>
      <div class="thread-content">
        <p class="section-label">Submitted Query</p>
        <p class="thread-query">${escapeHtml(turn.query)}</p>
      </div>
    </article>
    <article class="thread-card thread-assistant">
      <div class="thread-avatar thread-avatar-assistant">TH</div>
      <div class="thread-content">
        <section class="result-hero">
          <div class="result-copy">
            <div class="result-meta-row">
              <span class="status-pill ${escapeHtml(data.status)}">${escapeHtml(data.verdictLabel)}</span>
              <span class="confidence-pill">Authenticity ${escapeHtml(data.authenticityLabel)}</span>
            </div>
            <h2>${escapeHtml(data.verdictTitle)}</h2>
            <p class="verdict-summary">${escapeHtml(data.summary)}</p>
          </div>
        </section>
        <section class="result-sections">
          <div class="section-card sources-card workflow-card">
            <div class="section-card-head">
              <div>
                <p class="section-label">Verification Workflow</p>
                <h3>How Truth Hermes reached this result</h3>
              </div>
            </div>
            ${workflowMarkup(data)}
          </div>
        </section>
      </div>
    </article>
  `;
}

function renderConversation(conversation) {
  elements.resultPanel.innerHTML = conversation.messages.map(turnMarkup).join("");
  revealConversation();
}

function ensureActiveConversation(query) {
  let conversation = getActiveConversation();
  if (!conversation) {
    conversation = {
      id: `conversation-${Date.now()}`,
      title: summarize(query),
      verdictLabel: "Checking",
      messages: [],
    };
    conversations.unshift(conversation);
    activeConversationId = conversation.id;
  }

  return conversation;
}

function appendLoadingTurn(query) {
  const conversation = ensureActiveConversation(query);

  conversation.messages.push({
    query,
    isLoading: true,
  });

  elements.quoteInput.value = "";
  resizeComposer();
  renderHistory();
  renderConversation(conversation);

  return conversation;
}

function replaceLoadingTurn(conversationId, result) {
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return;
  }

  const loadingIndex = conversation.messages.findIndex((item) => item.isLoading);
  if (loadingIndex === -1) {
    return;
  }

  conversation.verdictLabel = result.verdictLabel;
  conversation.messages[loadingIndex] = {
    query: result.query,
    result,
    isLoading: false,
  };

  renderHistory();

  if (activeConversationId === conversation.id) {
    renderConversation(conversation);
  }
}

function resolveInitialResult(input = {}) {
  const query = (input.query ?? elements.quoteInput.value).trim();
  const speaker = (input.speaker ?? elements.speakerInput.value).trim();
  const type = input.type ?? elements.contentType.value;

  if (!query) {
    return null;
  }

  const haystack = normalize(`${query} ${speaker}`);
  const queryNormalized = normalize(query);
  const match = cases.find((item) => {
    const itemSpeaker = normalize(item.speaker);
    const itemTitle = normalize(item.title);
    const itemQuery = normalize(item.query);
    return (
      haystack.includes(itemSpeaker) ||
      haystack.includes(itemTitle) ||
      itemQuery.includes(queryNormalized)
    );
  });

  if (match) {
    return match;
  }

  return withVerdict({
    id: "custom-fallback",
    speaker,
    type,
    query,
    summary:
      "This query does not match a preset demo case yet. In the full product, Hermes would now search across videos, transcripts, and reporting archives.",
    authenticity: 61,
    mediaEvidence: null,
    evidence: [
      {
        type: "Video Search",
        source: "Pending real API",
        detail: "Waiting for relevant source video retrieval.",
        score: "0.42",
      },
      {
        type: "Transcript Search",
        source: "Pending real API",
        detail: "Waiting for transcript or textual source matching.",
        score: "0.38",
      },
    ],
  });
}

function resolveFollowUp(query) {
  const conversation = getActiveConversation();
  const previous = conversation?.messages[conversation.messages.length - 1]?.result;

  if (!previous) {
    return resolveInitialResult();
  }

  return {
    id: "follow-up",
    speaker: previous.speaker,
    type: previous.type,
    query,
    status: previous.status,
    verdictLabel: previous.verdictLabel,
    verdictTitle: previous.verdictTitle,
    summary:
      `Based on the previous verification, the key evidence remains ${previous.mediaEvidence?.source || "the retrieved source set"}. The most relevant timestamp is ${previous.mediaEvidence?.timestamp || "pending"}, and the answer should be interpreted in that source context.`,
    authenticity: previous.authenticity,
    authenticityLabel: previous.authenticityLabel,
    mediaEvidence: previous.mediaEvidence,
    evidence: [
      {
        type: "Conversation Context",
        source: previous.verdictTitle,
        detail: "This answer uses the immediately preceding verification result as context.",
        score: "0.88",
      },
      ...(previous.evidence || []).slice(0, 2),
    ],
  };
}

async function requestVerification(request) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });

  if (request.isFollowUp) {
    return resolveFollowUp(request.query);
  }

  return resolveInitialResult(request);
}

function completeAuth(user) {
  const session = {
    id: user.id,
    name: user.name,
    identifier: user.identifier,
  };

  saveSession(session);
  updateAccountUi(session);
  closeAuthModal();
  showApp();
}

function handleRegister() {
  const name = elements.authName.value.trim();
  const identifier = validateIdentifier(elements.authIdentifier.value);
  const password = elements.authPassword.value;

  if (!name) {
    showAuthError("Please enter your display name.");
    return;
  }

  if (!identifier) {
    showAuthError("Use a valid email address or mobile number.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  const users = loadUsers();
  if (users.some((item) => item.identifier === identifier)) {
    showAuthError("An account with that email or mobile number already exists.");
    return;
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    identifier,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);
  completeAuth(user);
}

function handleLogin() {
  const identifier = validateIdentifier(elements.authIdentifier.value);
  const password = elements.authPassword.value;

  if (!identifier) {
    showAuthError("Use the email address or mobile number linked to your account.");
    return;
  }

  const user = loadUsers().find((item) => item.identifier === identifier);
  if (!user) {
    showAuthError("No account was found for that email or mobile number.");
    return;
  }

  if (user.password !== password) {
    showAuthError("Incorrect password.");
    return;
  }

  completeAuth(user);
}

function handleAuthSubmit(event) {
  event.preventDefault();
  hideAuthError();

  if (authMode === "login") {
    handleLogin();
    return;
  }

  handleRegister();
}

async function submitVerification() {
  if (isRequestInFlight) {
    return;
  }

  const query = elements.quoteInput.value.trim();
  if (!query) {
    showInputHint("Please enter a quote, claim, or video description first.");
    return;
  }

  hideInputHint();
  const request = {
    query,
    speaker: elements.speakerInput.value.trim(),
    type: elements.contentType.value,
    isFollowUp: !!getActiveConversation()?.messages.some((item) => item.result),
  };
  const conversation = appendLoadingTurn(query);
  const currentRequest = ++requestSequence;
  isRequestInFlight = true;

  try {
    const result = await requestVerification(request);

    if (currentRequest !== requestSequence || !result) {
      return;
    }

    replaceLoadingTurn(conversation.id, result);
  } finally {
    isRequestInFlight = false;
  }
}

function startNewChat() {
  requestSequence += 1;
  isRequestInFlight = false;
  activeConversationId = null;
  elements.quoteInput.value = "";
  resizeComposer();
  elements.speakerInput.value = "";
  elements.contentType.value = "quote";
  elements.resultPanel.innerHTML = "";
  hideInputHint();
  renderHistory();
  showHomeState();
}

elements.tryGuest?.addEventListener("click", showApp);
elements.authEntry?.addEventListener("click", () => openAuthModal("register"));
elements.authBackdrop?.addEventListener("click", closeAuthModal);
elements.authClose?.addEventListener("click", closeAuthModal);
elements.authForm?.addEventListener("submit", handleAuthSubmit);
elements.authModeRegister?.addEventListener("click", () => setAuthMode("register"));
elements.authModeLogin?.addEventListener("click", () => setAuthMode("login"));
elements.authMetaSwitch?.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});
elements.logoutButton?.addEventListener("click", () => {
  clearSession();
  updateAccountUi(null);
  closeAuthModal();
  showLanding();
});
elements.newChat?.addEventListener("click", startNewChat);
elements.startDemo?.addEventListener("click", submitVerification);
elements.quoteInput?.addEventListener("input", () => {
  hideInputHint();
  resizeComposer();
});
elements.quoteInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    submitVerification();
  }
});

elements.caseList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-case-id]");
  const match = cases.find((item) => item.id === button?.dataset.caseId);
  if (!match) {
    return;
  }

  elements.quoteInput.value = match.query;
  elements.speakerInput.value = match.speaker;
  elements.contentType.value = match.type;
  resizeComposer();
  elements.quoteInput.focus();
});

elements.historyList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-history-id]");
  const match = conversations.find((item) => item.id === button?.dataset.historyId);
  if (!match) {
    return;
  }

  activeConversationId = match.id;
  renderHistory();
  renderConversation(match);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.authModal?.classList.contains("is-hidden")) {
    closeAuthModal();
  }
});

renderCases();
renderHistory();
resizeComposer();
sanitizeComposerUi();

const session = loadSession();
if (session?.name) {
  updateAccountUi(session);
  showApp();
} else {
  updateAccountUi(null);
}

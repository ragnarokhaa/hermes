const cases = [
  {
    id: "real-obama",
    speaker: "Barack Obama",
    type: "speech",
    title: "Obama 2004 keynote quote",
    query:
      "Did Barack Obama say in the 2004 Democratic National Convention speech: There is not a liberal America and a conservative America; there is the United States of America.",
    status: "true",
    verdictLabel: "True News",
    verdictTitle: "True News",
    summary:
      "The quote matches the original convention broadcast, official transcript material, and independent media transcripts.",
    confidence: "98%",
    mediaEvidence: {
      label: "Primary video evidence",
      source: "2004 Democratic National Convention keynote broadcast",
      provider: "Public video archive",
      description:
        "The verified line appears in the full keynote recording, synchronized with the official transcript.",
      timestamp: "12:41 - 12:52",
      linkLabel: "Open archive clip",
      clipLabel: "Speech clip",
      frameTimestamp: "12:46",
      frameTitle: "Key frame",
      frameNote:
        "Obama is at the podium as the verified sentence appears in the live broadcast frame.",
      frameClass: "frame-stage",
    },
    evidence: [
      {
        type: "Official Transcript",
        source: "DNC archive",
        detail: "The line appears in the official speech transcript.",
        score: "0.99",
      },
      {
        type: "Video",
        source: "Convention broadcast",
        detail: "The original speech video contains the sentence around 12:41.",
        score: "0.97",
        timestamp: "12:41 - 12:52",
        action: "Video source",
      },
      {
        type: "Media Transcript",
        source: "News transcript",
        detail: "Independent media transcripts match the same wording.",
        score: "0.94",
      },
    ],
  },
  {
    id: "fake-einstein",
    speaker: "Albert Einstein",
    type: "quote",
    title: "Einstein false quote",
    query:
      "Did Albert Einstein say: The definition of insanity is doing the same thing over and over and expecting different results.",
    status: "false",
    verdictLabel: "False News",
    verdictTitle: "False News",
    summary:
      "The claim circulates widely online, but there is no reliable primary-source evidence placing the quote in Einstein's verified writings or interviews.",
    confidence: "92%",
    mediaEvidence: {
      label: "Source search result",
      source: "No primary-source video identified",
      provider: "Archive scan",
      description:
        "Truth Hermes could not locate credible source footage tying this quote to Einstein.",
      timestamp: "No verified timestamp",
      linkLabel: "Review archive search",
      clipLabel: "No clip found",
      frameTimestamp: "Archive gap",
      frameTitle: "Missing key frame",
      frameNote:
        "No authenticated video frame exists for this claim, which is part of why the quote is flagged as false.",
      frameClass: "frame-archive",
    },
    evidence: [
      {
        type: "Quote Site",
        source: "Secondary aggregation",
        detail: "Widely repeated, but without a verifiable original source.",
        score: "0.41",
      },
      {
        type: "Archive Search",
        source: "Biography corpus",
        detail: "No direct evidence found in letters, books, or interviews.",
        score: "0.18",
      },
      {
        type: "Web Mentions",
        source: "Social reposts",
        detail: "The phrase is mostly repeated by citation loops.",
        score: "0.27",
      },
    ],
  },
  {
    id: "video-context",
    speaker: "Candidate Video Sample",
    type: "video",
    title: "Misleading political clip",
    query:
      "Is this campaign clip misleading because the surrounding context was removed.",
    status: "mixed",
    verdictLabel: "Misleading Clip",
    verdictTitle: "Misleading Clip",
    summary:
      "The original sentence exists, but the viral repost removes surrounding context and changes the meaning of the source clip.",
    confidence: "89%",
    mediaEvidence: {
      label: "Video comparison",
      source: "Original upload vs repost",
      provider: "Campaign channel / social repost",
      description:
        "The original source clip and the repost diverge after the highlighted segment.",
      timestamp: "01:18 - 01:29",
      linkLabel: "Open comparison clips",
      clipLabel: "Clip comparison",
      frameTimestamp: "01:24",
      frameTitle: "Key frame",
      frameNote:
        "The frame captures the speaker just before the omitted clarification line.",
      frameClass: "frame-clip",
    },
    evidence: [
      {
        type: "Original Upload",
        source: "Official channel",
        detail: "The full source includes extra context before and after the clip.",
        score: "0.93",
        timestamp: "01:18 - 01:29",
        action: "Original clip",
      },
      {
        type: "Repost Clip",
        source: "Social media repost",
        detail: "The viral version removes the clarification line.",
        score: "0.56",
        timestamp: "00:08 clip",
        action: "Repost clip",
      },
      {
        type: "Transcript Alignment",
        source: "ASR + manual sync",
        detail: "Transcript comparison shows where the context was removed.",
        score: "0.91",
      },
    ],
  },
];

const conversations = [];
let activeConversationId = null;

const elements = {
  pageShell: document.querySelector(".page-shell"),
  landing: document.querySelector("#landing-screen"),
  workspace: document.querySelector("#app-workspace"),
  chatHome: document.querySelector("#chat-home"),
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
};

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
  return;
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
            <span class="confidence-pill">Confidence ${escapeHtml(data.confidence)}</span>
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
              <span class="confidence-pill">Confidence ${escapeHtml(data.confidence)}</span>
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

function resolveInitialResult() {
  const query = elements.quoteInput.value.trim();
  const speaker = elements.speakerInput.value.trim();
  const type = elements.contentType.value;

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

  return {
    id: "custom-fallback",
    speaker,
    type,
    query,
    status: "pending",
    verdictLabel: "Need Review",
    verdictTitle: "Need Review",
    summary:
      "This query does not match a preset demo case yet. In the full product, Hermes would now search across videos, transcripts, and reporting archives.",
    confidence: "61%",
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
  };
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
    verdictLabel: "Follow-up",
    verdictTitle: "Follow-up Detail",
    summary:
      `Based on the previous verification, the key evidence remains ${previous.mediaEvidence?.source || "the retrieved source set"}. The most relevant timestamp is ${previous.mediaEvidence?.timestamp || "pending"}, and the answer should be interpreted in that source context.`,
    confidence: previous.confidence,
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

function appendResult(result) {
  let conversation = getActiveConversation();
  if (!conversation) {
    conversation = {
      id: `conversation-${Date.now()}`,
      title: summarize(result.query),
      verdictLabel: result.verdictLabel,
      messages: [],
    };
    conversations.unshift(conversation);
    activeConversationId = conversation.id;
  }

  conversation.verdictLabel = result.verdictLabel;
  conversation.messages.push({ query: result.query, result });
  elements.quoteInput.value = "";
  resizeComposer();
  renderHistory();
  renderConversation(conversation);
}

function submitVerification() {
  const query = elements.quoteInput.value.trim();
  if (!query) {
    showInputHint("Please enter a quote, claim, or video description first.");
    return;
  }

  hideInputHint();
  const result = getActiveConversation() ? resolveFollowUp(query) : resolveInitialResult();
  if (result) {
    appendResult(result);
  }
}

function startNewChat() {
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
elements.authEntry?.addEventListener("click", () => {
  window.alert("Sign up / Log in is a placeholder in this frontend demo.");
});
elements.newChat?.addEventListener("click", startNewChat);
elements.startDemo?.addEventListener("click", submitVerification);
elements.quoteInput?.addEventListener("input", () => {
  hideInputHint();
  resizeComposer();
});
elements.quoteInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
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

renderCases();
renderHistory();
resizeComposer();

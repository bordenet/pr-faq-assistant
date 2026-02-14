/**
 * DocForge Redirect Modal
 * Shows a dismissable modal inviting users to try DocForge AI.
 * Only shows once per day using localStorage.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'docforge_redirect_dismissed';
  const DOCFORGE_BASE = 'https://bordenet.github.io/docforge-ai';

  /**
   * Get today's date as YYYY-MM-DD string
   */
  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Check if modal was already dismissed today
   */
  function wasDismissedToday() {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      return dismissed === getToday();
    } catch (e) {
      return false;
    }
  }

  /**
   * Mark modal as dismissed for today
   */
  function markDismissed() {
    try {
      localStorage.setItem(STORAGE_KEY, getToday());
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Detect document type and app type from current URL
   */
  function detectContext() {
    const path = window.location.pathname;
    const host = window.location.hostname;

    // Map genesis repo names to DocForge plugin types
    const typeMap = {
      'one-pager': 'one-pager',
      'strategic-proposal': 'strategic-proposal',
      'architecture-decision-record': 'adr',
      'product-requirements-assistant': 'prd',
      'power-statement-assistant': 'power-statement',
      'pr-faq-assistant': 'pr-faq',
      'jd-assistant': 'jd',
      'acceptance-criteria-assistant': 'acceptance-criteria'
    };

    let docType = 'one-pager'; // default
    let appType = 'assistant'; // default

    // Check path for repo name
    for (const [repoName, pluginType] of Object.entries(typeMap)) {
      if (path.includes(repoName) || host.includes(repoName)) {
        docType = pluginType;
        break;
      }
    }

    // Detect if validator
    if (path.includes('/validator')) {
      appType = 'validator';
    }

    return { docType, appType };
  }

  /**
   * Build DocForge redirect URL
   */
  function buildRedirectUrl() {
    const { docType, appType } = detectContext();
    return `${DOCFORGE_BASE}/${appType}/?type=${docType}`;
  }

  /**
   * Create and show the modal
   */
  function showModal() {
    const { docType, appType } = detectContext();
    const redirectUrl = buildRedirectUrl();

    // Human-readable document type name
    const typeNames = {
      'one-pager': 'One-Pager',
      'strategic-proposal': 'Strategic Proposal',
      'adr': 'Architecture Decision Record',
      'prd': 'Product Requirements Document',
      'power-statement': 'Power Statement',
      'pr-faq': 'PR-FAQ',
      'jd': 'Job Description',
      'acceptance-criteria': 'Acceptance Criteria'
    };
    const typeName = typeNames[docType] || docType;

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'docforge-redirect-modal';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;">
        <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:1rem;max-width:28rem;width:100%;padding:2rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid #334155;">
          <div style="text-align:center;margin-bottom:1.5rem;">
            <span style="font-size:3rem;">🚀</span>
          </div>
          <h2 style="color:#f8fafc;font-size:1.5rem;font-weight:700;text-align:center;margin:0 0 1rem 0;">
            Try DocForge AI
          </h2>
          <p style="color:#94a3b8;text-align:center;margin:0 0 1.5rem 0;line-height:1.6;">
            This tool has been upgraded! DocForge AI combines all 9 document types in one place with an improved workflow.
          </p>
          <p style="color:#cbd5e1;text-align:center;margin:0 0 1.5rem 0;font-size:0.875rem;">
            Continue to <strong>${typeName} ${appType === 'validator' ? 'Validator' : 'Assistant'}</strong> in DocForge:
          </p>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <a href="${redirectUrl}" style="display:block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white;text-align:center;padding:0.875rem 1.5rem;border-radius:0.5rem;font-weight:600;text-decoration:none;transition:transform 0.15s,box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 20px -5px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='';this.style.boxShadow='';">
              Open DocForge AI →
            </a>
            <button id="docforge-modal-dismiss" style="background:transparent;color:#64748b;padding:0.75rem;border:none;cursor:pointer;font-size:0.875rem;transition:color 0.15s;" onmouseover="this.style.color='#94a3b8';" onmouseout="this.style.color='#64748b';">
              Stay here for now
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle dismiss
    document.getElementById('docforge-modal-dismiss').addEventListener('click', function() {
      markDismissed();
      modal.remove();
    });
  }

  /**
   * Initialize - show modal if not dismissed today
   */
  function init() {
    // Force show if URL has ?docforge-modal=show
    const forceShow = window.location.search.includes('docforge-modal=show');

    console.log('[DocForge Modal] Checking...', {
      dismissed: localStorage.getItem(STORAGE_KEY),
      today: getToday(),
      wasDismissedToday: wasDismissedToday(),
      forceShow: forceShow
    });

    if (forceShow || !wasDismissedToday()) {
      // Slight delay to ensure page is rendered
      setTimeout(showModal, 500);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

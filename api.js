
/* ============================================================
   BRCC-DMS V3 — PUBLIC PORTAL API CONNECTOR
   STEP 8S: ANDROID SUBMISSION PROOF
   Server verification / notification dispatch not enabled here.
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';

const BRCC_NOTIFICATION_SERVICES = new Set([
  'registration',
  'registry_update',
  'puppy_report'
]);

const BRCC_PROOF_TIMEOUT_MS = 15000;
const BRCC_PROOF_PENDING = new Map();
let brccProofSequence = 0;
let brccProofListenerInstalled = false;

/* ============================================================
   ANDROID BRIDGE
============================================================ */

function brccHasAndroidBridge() {
  return !!(
    window.BRCCNative &&
    typeof window.BRCCNative.postMessage === 'function' &&
    typeof window.BRCCNative.addEventListener === 'function'
  );
}

function brccInstallProofListener() {
  if (brccProofListenerInstalled || !brccHasAndroidBridge()) return;

  window.BRCCNative.addEventListener('message', function (event) {
    let message;
    try {
      message = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data;
    } catch (_) {
      return;
    }

    if (!message || message.action !== 'submissionProof' ||
        typeof message.requestId !== 'string') return;

    const pending = BRCC_PROOF_PENDING.get(message.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    BRCC_PROOF_PENDING.delete(message.requestId);

    const expiresAt = Number(message.expiresAt);
    if (message.ok === true &&
        typeof message.proofId === 'string' && message.proofId.length > 0 &&
        typeof message.proof === 'string' && message.proof.length > 0 &&
        Number.isFinite(expiresAt) &&
        expiresAt > Math.floor(Date.now() / 1000)) {
      pending.resolve({
        proofId: message.proofId,
        proof: message.proof
      });
    } else {
      pending.reject(new Error('Android notification proof unavailable.'));
    }
  });

  brccProofListenerInstalled = true;
}

function brccGetSubmissionProof() {
  if (!brccHasAndroidBridge()) return Promise.resolve(null);
  brccInstallProofListener();

  return new Promise(function (resolve, reject) {
    const requestId = 'brcc-' + Date.now() + '-' + (++brccProofSequence);
    const timer = setTimeout(function () {
      BRCC_PROOF_PENDING.delete(requestId);
      reject(new Error('Android notification proof timed out.'));
    }, BRCC_PROOF_TIMEOUT_MS);

    BRCC_PROOF_PENDING.set(requestId, { resolve, reject, timer });

    try {
      window.BRCCNative.postMessage(JSON.stringify({
        action: 'issueSubmissionProof',
        requestId: requestId
      }));
    } catch (_) {
      clearTimeout(timer);
      BRCC_PROOF_PENDING.delete(requestId);
      reject(new Error('Unable to request Android notification proof.'));
    }
  });
}

/* ============================================================
   GENERIC BRCC API REQUEST
============================================================ */

async function brccRequest(service, data = {}) {
  if (!BRCC_API_URL) {
    throw new Error('BRCC API URL is not configured.');
  }

  const serviceName = String(service || '').trim();
  const payload = {
    service: serviceName,
    data: data || {}
  };

  if (BRCC_NOTIFICATION_SERVICES.has(serviceName.toLowerCase()) &&
      brccHasAndroidBridge()) {
    try {
      const submissionProof = await brccGetSubmissionProof();
      if (submissionProof) {
        // Never mutate the caller's original form data.
        payload.data = Object.assign({}, payload.data, {
          notificationProofId: submissionProof.proofId,
          notificationProof: submissionProof.proof
        });
      }
    } catch (_) {
      // Notification proof is optional for the existing form workflow.
      // Do not log proof material or native response data.
    }
  }

  let response;
  try {
    response = await fetch(BRCC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
  } catch (_) {
    throw new Error('Unable to connect to the BRCC-DMS server.');
  }

  if (!response.ok) {
    throw new Error('BRCC-DMS server returned HTTP ' + response.status + '.');
  }

  let result;
  try {
    result = await response.json();
  } catch (_) {
    throw new Error('Invalid server response.');
  }

  if (!result || typeof result !== 'object') {
    throw new Error('Empty or invalid response from server.');
  }

  if (result.success !== true) {
    // Do not surface arbitrary server messages that might echo private data.
    throw new Error('BRCC-DMS request failed. Please review your details and try again.');
  }

  // Preserve the existing success response shape for all callers.
  return result;
}

/* ============================================================
   GENERIC SUBMIT
============================================================ */

async function brccSubmit(service, data) {
  return brccRequest(service, data);
}

/* ============================================================
   VERIFY MOTHER DOG
============================================================ */

async function brccVerifyMotherDog(registryNumber) {
  if (!registryNumber || !String(registryNumber).trim()) {
    throw new Error('Mother Dog Registry Number is required.');
  }
  return brccRequest('verify_mother_dog', {
    registryNumber: String(registryNumber).trim()
  });
}

/* ============================================================
   VERIFY DOG QR CODE
============================================================ */

async function brccVerifyDogQR(token) {
  if (!token || !String(token).trim()) {
    throw new Error('Verification token is required.');
  }
  return brccRequest('verify_dog_qr', {
    token: String(token).trim()
  });
}

/* ============================================================
   MOBILE APPROVAL API
============================================================ */

async function brccMobileApproval(action, data = {}) {
  return brccRequest('mobile_approval', Object.assign({}, data, {
    action: String(action || '').trim().toLowerCase()
  }));
}


/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR
   STEP 8S — ANDROID SUBMISSION PROOF SUPPORT
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';


/* ============================================================
   ANDROID NOTIFICATION BRIDGE
============================================================ */

const BRCC_NOTIFICATION_SERVICES = new Set([
  'registration',
  'registry_update',
  'puppy_report'
]);

const BRCC_PROOF_TIMEOUT_MS = 15000;

const BRCC_PENDING_PROOFS = new Map();

let brccBridgeListenerInstalled = false;

function brccCreateRequestId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    value => value.toString(16).padStart(2, '0')
  ).join('');
}

function brccGetNativeBridge() {
  const bridge = window.BRCCNative;

  if (
    !bridge ||
    typeof bridge.postMessage !== 'function' ||
    typeof bridge.addEventListener !== 'function'
  ) {
    return null;
  }

  return bridge;
}

function brccInstallBridgeListener() {
  if (brccBridgeListenerInstalled) {
    return;
  }

  const bridge = brccGetNativeBridge();

  if (!bridge) {
    return;
  }

  bridge.addEventListener('message', event => {
    let message;

    try {
      message = JSON.parse(event.data);
    } catch (_) {
      return;
    }

    if (
      !message ||
      message.action !== 'submissionProofResult'
    ) {
      return;
    }

    const requestId = String(message.requestId || '');
    const pending = BRCC_PENDING_PROOFS.get(requestId);

    if (!pending) {
      return;
    }

    BRCC_PENDING_PROOFS.delete(requestId);
    clearTimeout(pending.timer);

    if (
      message.ok === true &&
      typeof message.proofId === 'string' &&
      typeof message.proof === 'string' &&
      Number.isFinite(Number(message.expiresAt))
    ) {
      pending.resolve({
        proofId: message.proofId,
        proof: message.proof,
        expiresAt: Number(message.expiresAt)
      });
    } else {
      pending.reject(
        new Error('Android submission proof unavailable.')
      );
    }
  });

  brccBridgeListenerInstalled = true;
}

async function brccGetSubmissionProof() {
  const bridge = brccGetNativeBridge();

  // Browser users can submit without Android notifications.
  if (!bridge) {
    return null;
  }

  brccInstallBridgeListener();

  const requestId = brccCreateRequestId();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      BRCC_PENDING_PROOFS.delete(requestId);
      reject(new Error('Android proof request timed out.'));
    }, BRCC_PROOF_TIMEOUT_MS);

    BRCC_PENDING_PROOFS.set(requestId, {
      resolve,
      reject,
      timer
    });

    try {
      bridge.postMessage(JSON.stringify({
        action: 'issueSubmissionProof',
        requestId
      }));
    } catch (_) {
      clearTimeout(timer);
      BRCC_PENDING_PROOFS.delete(requestId);
      reject(new Error('Unable to contact Android app.'));
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

  // Never log payloads, personal information,
  // base64 photos, credentials, or proof values.
  console.info('BRCC API request:', serviceName);

  let response;

  try {
    response = await fetch(BRCC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
  } catch (_) {
    throw new Error(
      'Unable to connect to the BRCC-DMS server.'
    );
  }

  if (!response.ok) {
    throw new Error(
      'BRCC-DMS server returned HTTP ' + response.status
    );
  }

  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch (_) {
    // Do not log raw response: it may contain private data.
    throw new Error('Invalid server response.');
  }

  if (!result) {
    throw new Error('Empty response from server.');
  }

  if (result.success !== true) {
    throw new Error(
      result.message || 'Request failed.'
    );
  }

  console.info('BRCC API completed:', serviceName);

  return result;
}


/* ============================================================
   GENERIC SUBMIT
============================================================ */

async function brccSubmit(service, data) {
  const serviceName =
    String(service || '').trim().toLowerCase();

  const submissionData = Object.assign({}, data || {});

  if (BRCC_NOTIFICATION_SERVICES.has(serviceName)) {
    try {
      const proof = await brccGetSubmissionProof();

      if (proof) {
        // Temporary submission fields.
        // GAS must verify these through the protected Worker
        // after a successful request save.
        submissionData.notificationProofId = proof.proofId;
        submissionData.notificationProof = proof.proof;
      }
    } catch (_) {
      // Notification proof is optional.
      // Never block a valid registration or report.
      console.warn(
        'Android notification proof unavailable; continuing submission.'
      );
    }
  }

  return brccRequest(serviceName, submissionData);
}


/* ============================================================
   VERIFY MOTHER DOG
============================================================ */

async function brccVerifyMotherDog(registryNumber) {
  if (
    !registryNumber ||
    !String(registryNumber).trim()
  ) {
    throw new Error(
      'Mother Dog Registry Number is required.'
    );
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
  return brccRequest(
    'mobile_approval',
    Object.assign({}, data, {
      action: String(action || '')
        .trim()
        .toLowerCase()
    })
  );
}

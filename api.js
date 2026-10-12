
/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR — STEP 8S
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';


/* ============================================================
   ANDROID ONE-TIME SUBMISSION PROOF
============================================================ */

const BRCC_NOTIFICATION_SERVICES = new Set([
  'registration',
  'registry_update',
  'puppy_report'
]);

const BRCC_NATIVE_PROOF_TIMEOUT_MS = 15000;

let brccNativeProofCounter = 0;

const brccNativeProofPending = new Map();

let brccNativeProofListenerInstalled = false;


function brccInstallNativeProofListener() {

  if (brccNativeProofListenerInstalled) return;

  if (!window.BRCCNative ||
      typeof window.BRCCNative.postMessage !== 'function') {
    return;
  }

  window.BRCCNative.onmessage = function(event) {

    let message;

    try {
      message = JSON.parse(event.data);
    } catch (_) {
      return;
    }

    if (!message ||
        message.action !== 'submissionProof') {
      return;
    }

    const requestId = String(message.requestId || '');
    const pending = brccNativeProofPending.get(requestId);

    if (!pending) return;

    clearTimeout(pending.timer);
    brccNativeProofPending.delete(requestId);

    if (message.ok === true &&
        typeof message.proofId === 'string' &&
        typeof message.proof === 'string') {

      pending.resolve({
        proofId: message.proofId,
        proof: message.proof,
        expiresAt: message.expiresAt
      });

    } else {

      pending.reject(
        new Error('Android notification proof unavailable.')
      );

    }
  };

  brccNativeProofListenerInstalled = true;
}


async function brccGetAndroidSubmissionProof() {

  if (!window.BRCCNative ||
      typeof window.BRCCNative.postMessage !== 'function') {
    return null;
  }

  brccInstallNativeProofListener();

  const requestId =
    'brcc-' + Date.now() + '-' + (++brccNativeProofCounter);

  return new Promise((resolve, reject) => {

    const timer = setTimeout(() => {
      brccNativeProofPending.delete(requestId);
      reject(new Error('Android proof request timed out.'));
    }, BRCC_NATIVE_PROOF_TIMEOUT_MS);

    brccNativeProofPending.set(requestId, {
      resolve,
      reject,
      timer
    });

    try {

      window.BRCCNative.postMessage(
        JSON.stringify({
          action: 'issueSubmissionProof',
          requestId
        })
      );

    } catch (_) {

      clearTimeout(timer);
      brccNativeProofPending.delete(requestId);

      reject(
        new Error('Unable to request Android proof.')
      );
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

  const serviceName =
    String(service || '').trim().toLowerCase();

  const requestData = Object.assign({}, data || {});

  /*
   * For Android submissions, request a one-time proof.
   * Browser submissions continue without a proof.
   *
   * Server-side verification and device binding
   * are NOT active yet.
   */

  if (BRCC_NOTIFICATION_SERVICES.has(serviceName)) {

    try {

      const proof = await brccGetAndroidSubmissionProof();

      if (proof) {

        requestData.notificationProofId = proof.proofId;
        requestData.notificationProof = proof.proof;

      }

    } catch (_) {

      // Notification proof failure must not prevent
      // a normal registration/update/report submission.
      console.warn(
        'Android notification proof unavailable; continuing submission.'
      );

    }
  }

  const payload = {
    service: serviceName,
    data: requestData
  };

  // Never log the full payload, owner details, photos,
  // device credentials, or notification proofs.
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

  console.info('BRCC API HTTP status:', response.status);

  const responseText = await response.text();

  let result;

  try {

    result = JSON.parse(responseText);

  } catch (_) {

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

  console.info('BRCC API success:', serviceName);

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

  if (!registryNumber ||
      !String(registryNumber).trim()) {

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

  if (!token ||
      !String(token).trim()) {

    throw new Error(
      'Verification token is required.'
    );
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
      action: String(action || '').trim().toLowerCase()
    })
  );
}

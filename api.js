
/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR — STEP 8S
   Android one-time submission proof support
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';

const BRCC_NOTIFICATION_SERVICES = new Set([
  'registration',
  'registry_update',
  'puppy_report'
]);

/* ============================================================
   ANDROID ONE-TIME PROOF

   Uses the origin-restricted BRCCNative bridge.

   Browser submissions continue without a proof.
   Permanent Android credentials are never exposed.
============================================================ */

function brccGetSubmissionProof(timeoutMs = 12000) {

  return new Promise((resolve) => {

    const bridge = window.BRCCNative;

    if (
      !bridge ||
      typeof bridge.postMessage !== 'function'
    ) {
      resolve(null);
      return;
    }

    const requestId =
      'brcc-' +
      Date.now() + '-' +
      Math.random().toString(36).slice(2);

    let finished = false;
    let timer = null;

    function cleanup() {
      clearTimeout(timer);

      if (
        typeof bridge.removeEventListener === 'function'
      ) {
        bridge.removeEventListener(
          'message',
          onMessage
        );
      }
    }

    function finish(value) {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(value);
    }

    function onMessage(event) {

      let message;

      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (
        !message ||
        message.requestId !== requestId
      ) {
        return;
      }

      if (
        message.ok === true &&
        typeof message.proofId === 'string' &&
        typeof message.proof === 'string' &&
        Number.isFinite(Number(message.expiresAt))
      ) {
        finish({
          proofId: message.proofId,
          proof: message.proof,
          expiresAt: Number(message.expiresAt)
        });
      } else {
        finish(null);
      }
    }

    if (
      typeof bridge.addEventListener !== 'function'
    ) {
      resolve(null);
      return;
    }

    bridge.addEventListener(
      'message',
      onMessage
    );

    timer = setTimeout(
      () => finish(null),
      timeoutMs
    );

    try {

      bridge.postMessage(
        JSON.stringify({
          action: 'issueSubmissionProof',
          requestId
        })
      );

    } catch {
      finish(null);
    }

  });

}

/* ============================================================
   GENERIC BRCC API REQUEST
============================================================ */

async function brccRequest(service, data = {}) {

  if (!BRCC_API_URL) {
    throw new Error(
      'BRCC API URL is not configured.'
    );
  }

  const serviceName =
    String(service || '').trim();

  // Preserve the caller's original data.
  // Add notification proof only to submission services.
  let requestData = data || {};

  if (
    BRCC_NOTIFICATION_SERVICES.has(
      serviceName.toLowerCase()
    )
  ) {

    const proof =
      await brccGetSubmissionProof();

    if (proof) {

      requestData = Object.assign(
        {},
        requestData,
        {
          notificationProofId:
            proof.proofId,

          notificationProof:
            proof.proof
        }
      );

    }

  }

  const payload = {
    service: serviceName,
    data: requestData
  };

  // Never log submitted personal data,
  // photos, notification proofs, or raw responses.
  console.info(
    'BRCC API request:',
    serviceName
  );

  let response;

  try {

    response = await fetch(
      BRCC_API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8'
        },

        body: JSON.stringify(payload),

        redirect: 'follow'
      }
    );

  } catch {

    throw new Error(
      'Unable to connect to the BRCC-DMS server.'
    );

  }

  console.info(
    'BRCC API HTTP status:',
    response.status
  );

  const responseText =
    await response.text();

  let result;

  try {

    result = JSON.parse(responseText);

  } catch {

    throw new Error(
      'Invalid server response.'
    );

  }

  if (!result) {
    throw new Error(
      'Empty response from server.'
    );
  }

  if (result.success !== true) {

    throw new Error(
      result.message ||
      'Request failed.'
    );

  }

  console.info(
    'BRCC API completed:',
    serviceName
  );

  return result;

}

/* ============================================================
   GENERIC SUBMIT
============================================================ */

async function brccSubmit(service, data) {

  return brccRequest(
    service,
    data
  );

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

  return brccRequest(
    'verify_mother_dog',
    {
      registryNumber:
        String(registryNumber).trim()
    }
  );

}

/* ============================================================
   VERIFY DOG QR CODE
============================================================ */

async function brccVerifyDogQR(token) {

  if (
    !token ||
    !String(token).trim()
  ) {

    throw new Error(
      'Verification token is required.'
    );

  }

  return brccRequest(
    'verify_dog_qr',
    {
      token:
        String(token).trim()
    }
  );

}

/* ============================================================
   MOBILE APPROVAL API
============================================================ */

async function brccMobileApproval(action, data = {}) {

  return brccRequest(
    'mobile_approval',
    Object.assign(
      {},
      data,
      {
        action:
          String(action || '')
            .trim()
            .toLowerCase()
      }
    )
  );

}


/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR
   STEP 8S — ANDROID SUBMISSION PROOF
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';

const BRCC_NOTIFICATION_SERVICES = new Set([
  'registration',
  'registry_update',
  'puppy_report'
]);

let brccNativeProofPending = false;


/* ============================================================
   REQUEST ONE-TIME PROOF FROM ANDROID
============================================================ */

async function brccGetAndroidSubmissionProof() {

  if (
    !window.BRCCNative ||
    typeof window.BRCCNative.postMessage !== 'function'
  ) {
    return null;
  }

  if (brccNativeProofPending) {
    return null;
  }

  brccNativeProofPending = true;

  const requestId =
    'brcc-' +
    Date.now() +
    '-' +
    Math.random().toString(36).slice(2);

  try {

    return await new Promise((resolve) => {

      let completed = false;

      const finish = (value) => {

        if (completed) return;

        completed = true;

        clearTimeout(timer);

        window.BRCCNative.removeEventListener(
          'message',
          onMessage
        );

        resolve(value);
      };

      const onMessage = (event) => {

        let message;

        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (
          !message ||
          message.requestId !== requestId ||
          message.action !== 'submissionProof'
        ) {
          return;
        }

        if (
          message.ok === true &&
          typeof message.proofId === 'string' &&
          typeof message.proof === 'string'
        ) {

          finish({
            proofId: message.proofId,
            proof: message.proof
          });

        } else {

          finish(null);

        }
      };

      const timer = setTimeout(
        () => finish(null),
        15000
      );

      window.BRCCNative.addEventListener(
        'message',
        onMessage
      );

      try {

        window.BRCCNative.postMessage(
          JSON.stringify({
            action: 'issueSubmissionProof',
            requestId
          })
        );

      } catch {

        finish(null);

      }
    });

  } finally {

    brccNativeProofPending = false;

  }
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

  const normalizedService =
    String(service || '').trim();

  const requestData =
    Object.assign({}, data || {});

  /*
   * Only the three public submission services
   * may request a one-time Android proof.
   *
   * Browser users continue without a proof.
   */
  if (
    BRCC_NOTIFICATION_SERVICES.has(
      normalizedService.toLowerCase()
    )
  ) {

    const nativeProof =
      await brccGetAndroidSubmissionProof();

    if (nativeProof) {

      requestData.notificationProofId =
        nativeProof.proofId;

      requestData.notificationProof =
        nativeProof.proof;

    }
  }

  const payload = {
    service: normalizedService,
    data: requestData
  };

  // Do not log submitted personal data,
  // photos, credentials or notification proofs.

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
      token: String(token).trim()
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

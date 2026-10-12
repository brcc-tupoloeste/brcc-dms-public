
/* ============================================================
   BRCC-DMS V3 — PUBLIC PORTAL API CONNECTOR
   ROLLBACK VERSION — NO ANDROID SUBMISSION PROOF

   Preserves existing public portal API services.
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';

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
    throw new Error('Unable to connect to the BRCC-DMS server.');
  }

  if (!response.ok) {
    throw new Error(
      'BRCC-DMS server returned HTTP ' + response.status + '.'
    );
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
    throw new Error(
      'BRCC-DMS request failed. Please review your details and try again.'
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
  return brccRequest(
    'mobile_approval',
    Object.assign({}, data, {
      action: String(action || '').trim().toLowerCase()
    })
  );
}

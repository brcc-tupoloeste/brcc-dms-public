/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR
============================================================ */


/* ============================================================
   GOOGLE APPS SCRIPT WEB APP URL

   IMPORTANT:
   This must be the deployed /exec URL.
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


  const payload = {
    service: String(service || '').trim(),
    data: data || {}
  };


  console.log('========================================');
  console.log('BRCC API REQUEST');
  console.log('URL:', BRCC_API_URL);
  console.log('PAYLOAD:', payload);
  console.log('========================================');


  let response;


  try {

    response = await fetch(
      BRCC_API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },

        body: JSON.stringify(payload),

        redirect: 'follow'
      }
    );

  }
  catch (error) {

    console.error('BRCC NETWORK ERROR:', error);

    throw new Error(
      'Unable to connect to the BRCC-DMS server.'
    );

  }


  console.log(
    'BRCC API HTTP STATUS:',
    response.status
  );


  const responseText =
    await response.text();


  console.log(
    'BRCC API RAW RESPONSE:',
    responseText
  );


  let result;


  try {

    result =
      JSON.parse(responseText);

  }
  catch (error) {

    console.error(
      'BRCC INVALID JSON RESPONSE:',
      responseText
    );

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


  console.log(
    'BRCC API SUCCESS:',
    result
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

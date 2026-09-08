/* ============================================================
   BRCC-DMS V3
   FILE: api.js

   PUBLIC PORTAL API CONNECTOR

   USED BY:
   - GitHub Public Portal
   - Dog Registration
   - Registry Update
   - Puppy Report
   - QR Verification
   - Mobile Approval Center
============================================================ */


/* ============================================================
   GOOGLE APPS SCRIPT WEB APP URL
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';


/* ============================================================
   GENERIC BRCC API REQUEST

   Payload format:

   {
     service: "service_name",
     data: {...}
   }
============================================================ */

async function brccRequest(
  service,
  data = {}
) {

  if (
    !BRCC_API_URL ||
    BRCC_API_URL.includes('ILAGAY_DITO')
  ) {

    throw new Error(
      'API URL is not configured.'
    );

  }


  const payload = {

    service:
      String(service || '')
        .trim(),

    data:
      data || {}

  };


  if (!payload.service) {

    throw new Error(
      'API service is required.'
    );

  }


  console.log(
    'BRCC API REQUEST:',
    payload
  );


  let response;


  try {

    response =
      await fetch(
        BRCC_API_URL,
        {

          method:
            'POST',

          headers: {

            'Content-Type':
              'text/plain;charset=utf-8'

          },

          body:
            JSON.stringify(
              payload
            ),

          redirect:
            'follow'

        }
      );

  }
  catch (networkError) {

    console.error(
      'BRCC API network error:',
      networkError
    );


    throw new Error(
      'Unable to connect to the BRCC-DMS server.'
    );

  }


  let result;


  try {

    result =
      await response.json();

  }
  catch (jsonError) {

    console.error(
      'Invalid API response:',
      jsonError
    );


    throw new Error(
      'Invalid response from server.'
    );

  }


  console.log(
    'BRCC API RESPONSE:',
    result
  );


  if (!result) {

    throw new Error(
      'Empty response from server.'
    );

  }


  if (!result.success) {

    throw new Error(
      result.message ||
      'Request failed.'
    );

  }


  /*
   ============================================================
   IMPORTANT

   PublicPortalRouter.gs returns:

   {
     success: true,
     service: "...",
     result: {
       success: true,
       ...
     }
   }

   We return the complete response so existing pages
   remain compatible.
   ============================================================
  */

  return result;

}


/* ============================================================
   SUBMIT TO BRCC-DMS

   Generic public service submission.

   Example:

   brccSubmit(
     'puppy_report',
     formData
   );
============================================================ */

async function brccSubmit(
  service,
  data
) {

  return await brccRequest(
    service,
    data
  );

}


/* ============================================================
   VERIFY MOTHER DOG

   Used by:
   - Puppy Report

   NOTE:
   Requires corresponding router/service support.
============================================================ */

async function brccVerifyMotherDog(
  registryNumber
) {

  if (
    !registryNumber ||
    !String(registryNumber).trim()
  ) {

    throw new Error(
      'Mother Dog Registry Number is required.'
    );

  }


  return await brccRequest(
    'verify_mother_dog',
    {

      registryNumber:
        String(registryNumber)
          .trim()

    }
  );

}


/* ============================================================
   VERIFY DOG QR CODE

   Used by:
   - verify.html
   - Public QR Verification
============================================================ */

async function brccVerifyDogQR(
  token
) {

  if (
    !token ||
    !String(token).trim()
  ) {

    throw new Error(
      'Verification token is required.'
    );

  }


  return await brccRequest(
    'verify_dog_qr',
    {

      token:
        String(token)
          .trim()

    }
  );

}


/* ============================================================
   MOBILE APPROVAL CENTER API
============================================================ */


/* ============================================================
   MOBILE ADMIN LOGIN

   Sends:

   {
     service: "mobile_approval",
     data: {
       action: "login",
       pin: "..."
     }
   }
============================================================ */

async function brccMobileApprovalLogin(
  pin
) {

  pin =
    String(pin || '')
      .trim();


  if (!pin) {

    throw new Error(
      'Admin PIN is required.'
    );

  }


  return await brccRequest(
    'mobile_approval',
    {

      action:
        'login',

      pin:
        pin

    }
  );

}


/* ============================================================
   GET PENDING REGISTRY UPDATE REQUESTS
============================================================ */

async function brccMobileApprovalGetPendingRequests(
  sessionToken
) {

  sessionToken =
    String(sessionToken || '')
      .trim();


  if (!sessionToken) {

    throw new Error(
      'Mobile admin session is required.'
    );

  }


  return await brccRequest(
    'mobile_approval',
    {

      action:
        'get_pending_requests',

      sessionToken:
        sessionToken

    }
  );

}


/* ============================================================
   APPROVE REGISTRY UPDATE REQUEST
============================================================ */

async function brccMobileApprovalApproveRequest(
  sessionToken,
  requestId
) {

  sessionToken =
    String(sessionToken || '')
      .trim();


  requestId =
    String(requestId || '')
      .trim();


  if (!sessionToken) {

    throw new Error(
      'Mobile admin session is required.'
    );

  }


  if (!requestId) {

    throw new Error(
      'Request ID is required.'
    );

  }


  return await brccRequest(
    'mobile_approval',
    {

      action:
        'approve_request',

      sessionToken:
        sessionToken,

      requestId:
        requestId

    }
  );

}


/* ============================================================
   REJECT REGISTRY UPDATE REQUEST
============================================================ */

async function brccMobileApprovalRejectRequest(
  sessionToken,
  requestId,
  rejectionReason
) {

  sessionToken =
    String(sessionToken || '')
      .trim();


  requestId =
    String(requestId || '')
      .trim();


  rejectionReason =
    String(rejectionReason || '')
      .trim();


  if (!sessionToken) {

    throw new Error(
      'Mobile admin session is required.'
    );

  }


  if (!requestId) {

    throw new Error(
      'Request ID is required.'
    );

  }


  if (!rejectionReason) {

    throw new Error(
      'Reason for rejection is required.'
    );

  }


  return await brccRequest(
    'mobile_approval',
    {

      action:
        'reject_request',

      sessionToken:
        sessionToken,

      requestId:
        requestId,

      rejectionReason:
        rejectionReason

    }
  );

}


/* ============================================================
   MOBILE ADMIN LOGOUT
============================================================ */

async function brccMobileApprovalLogout(
  sessionToken
) {

  sessionToken =
    String(sessionToken || '')
      .trim();


  return await brccRequest(
    'mobile_approval',
    {

      action:
        'logout',

      sessionToken:
        sessionToken

    }
  );

}

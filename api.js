/* ============================================================
   MOBILE APPROVAL CENTER API
============================================================ */


/* ============================================================
   NORMALIZE MOBILE APPROVAL RESPONSE

   PublicPortalRouter.gs wraps the service response inside:

   {
     success: true,
     service: "mobile_approval",
     result: {...}
   }

   This function returns the actual service result.
============================================================ */

function brccMobileApprovalExtractResult_(
  response
) {

  if (
    response &&
    response.result
  ) {

    return response.result;

  }


  return response;

}


/* ============================================================
   MOBILE ADMIN LOGIN
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


  const response =
    await brccRequest(
      'mobile_approval',
      {

        action:
          'login',

        pin:
          pin

      }
    );


  return brccMobileApprovalExtractResult_(
    response
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


  const response =
    await brccRequest(
      'mobile_approval',
      {

        action:
          'get_pending_requests',

        sessionToken:
          sessionToken

      }
    );


  return brccMobileApprovalExtractResult_(
    response
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


  const response =
    await brccRequest(
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


  return brccMobileApprovalExtractResult_(
    response
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


  const response =
    await brccRequest(
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


  return brccMobileApprovalExtractResult_(
    response
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


  const response =
    await brccRequest(
      'mobile_approval',
      {

        action:
          'logout',

        sessionToken:
          sessionToken

      }
    );


  return brccMobileApprovalExtractResult_(
    response
  );

}

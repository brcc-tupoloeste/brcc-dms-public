/* ============================================================
   BRCC-DMS V3 PUBLIC PORTAL
   SHARED API CONNECTOR

   Used by:
   - registration.html
   - registry-update.html
   - puppy-report.html
============================================================ */


/* ============================================================
   API CONFIGURATION
============================================================ */

const BRCC_PUBLIC_API = {

  /*
   BRCC-DMS V3 APPS SCRIPT WEB APP API
  */

  URL: 'https://script.google.com/macros/s/AKfycbxJ4GmvmV_ic9b1DIq9R56hxGUbK3k61uv7mq9kL6z-56f3vHxKbQDUMl1DvvBgXm9FGQ/exec'

};


/* ============================================================
   SUBMIT TO BRCC-DMS API

   Example:

   brccSubmit('registration', {...})

   brccSubmit('registry_update', {...})

   brccSubmit('puppy_report', {...})
============================================================ */

async function brccSubmit(service, data) {

  if (
    !BRCC_PUBLIC_API.URL ||
    BRCC_PUBLIC_API.URL.includes('PASTE_YOUR')
  ) {

    throw new Error(
      'Public API URL is not configured.'
    );

  }


  const payload = {
    service: service,
    data: data
  };


  try {

    const response = await fetch(
      BRCC_PUBLIC_API.URL,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },

        body: JSON.stringify(payload)
      }
    );


    const responseText = await response.text();


    let result;


    try {

      result = JSON.parse(responseText);

    } catch (error) {

      console.error(
        'Invalid API response:',
        responseText
      );


      throw new Error(
        'Invalid response from BRCC-DMS server.'
      );

    }


    if (!result.success) {

      throw new Error(
        result.message ||
        'Submission failed.'
      );

    }


    return result;


  } catch (error) {

    console.error(
      'BRCC API Error:',
      error
    );


    throw error;

  }

}


/* ============================================================
   SHOW FORM MESSAGE

   Usage:

   brccShowMessage(
     messageElement,
     'Successfully submitted!',
     'success'
   );
============================================================ */

function brccShowMessage(
  element,
  message,
  type
) {

  if (!element) {
    return;
  }


  element.textContent = message;


  element.className =
    'form-message ' +
    (type || '');


  element.style.display = 'block';

}


/* ============================================================
   HIDE FORM MESSAGE
============================================================ */

function brccHideMessage(element) {

  if (!element) {
    return;
  }


  element.style.display = 'none';


  element.textContent = '';

}


/* ============================================================
   BUTTON LOADING STATE
============================================================ */

function brccSetLoading(
  button,
  loading,
  loadingText
) {

  if (!button) {
    return;
  }


  if (loading) {

    /*
     Save original button text only once.
    */

    if (!button.dataset.originalText) {

      button.dataset.originalText =
        button.innerHTML;

    }


    button.disabled = true;


    button.innerHTML =
      loadingText ||
      'Submitting...';


  } else {

    button.disabled = false;


    if (button.dataset.originalText) {

      button.innerHTML =
        button.dataset.originalText;

    }

  }

}


/* ============================================================
   TEST API CONNECTION

   Optional diagnostic function.

   Can be called from browser console:

   brccTestConnection()
============================================================ */

async function brccTestConnection() {

  console.log(
    '======================================'
  );

  console.log(
    'BRCC-DMS PUBLIC API DIAGNOSTIC'
  );

  console.log(
    '======================================'
  );

  console.log(
    'API URL:',
    BRCC_PUBLIC_API.URL
  );


  try {

    const response = await fetch(
      BRCC_PUBLIC_API.URL,
      {
        method: 'GET'
      }
    );


    console.log(
      'HTTP Status:',
      response.status
    );


    console.log(
      'Connection reachable.'
    );


    return true;


  } catch (error) {

    console.error(
      'API Connection Error:',
      error
    );


    return false;

  }

}

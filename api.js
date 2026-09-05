/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR
============================================================ */


/* ============================================================
   GOOGLE APPS SCRIPT WEB APP URL

   IMPORTANT:
   Use the /exec deployment URL.
============================================================ */

const BRCC_API_URL =
  'https://script.google.com/macros/s/AKfycbzCGq7RqItFizrjt6EosUzTnGO9-FhxDgWrrwG-qfXu1YcPwGy8SydZvrGhkow64r3C7Q/exec';


/* ============================================================
   SUBMIT TO BRCC-DMS
============================================================ */

async function brccSubmit(
  service,
  data
) {

  if (
    !BRCC_API_URL ||
    BRCC_API_URL.includes(
      'ILAGAY_DITO'
    )
  ) {

    throw new Error(
      'API URL is not configured.'
    );

  }


  const payload = {

    service:
      service,

    data:
      data

  };


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

  } catch (networkError) {

    console.error(
      'API network error:',
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

  } catch (jsonError) {

    console.error(
      'Invalid API response:',
      jsonError
    );


    throw new Error(
      'Invalid response from server.'
    );

  }


  if (!result.success) {

    throw new Error(
      result.message ||
      'Submission failed.'
    );

  }


  return result;

}

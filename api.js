/* ============================================================
   BRCC-DMS V3
   PUBLIC PORTAL API CONNECTOR

   USED BY:
   - GitHub Public Portal
   - Registry Update
   - Puppy Report
   - Other Public Services
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

  } catch (jsonError) {

    console.error(
      'Invalid API response:',
      jsonError
    );


    throw new Error(
      'Invalid response from server.'
    );

  }


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


  return result;

}


/* ============================================================
   SUBMIT TO BRCC-DMS

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
   Puppy Report

   Example:

   const result =
     await brccVerifyMotherDog(
       'BTO-2026-00001'
     );
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

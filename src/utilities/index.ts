import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

const tryParseJSON = (value: string | File | Blob) => {
  if (value instanceof File || value instanceof Blob) {
    return value;
  }
  try {
    const json = JSON.parse(value);

    return json;
  } catch (e) {
    return value;
  }
};

/**
 * Generates an output object from the given form data, where the keys in the output object retain
 * the structure of the keys in the form data. Keys containing integer indexes are treated as arrays.
 */
export const generateFormData = (
  formData: FormData | URLSearchParams,
  preserveStringified = false,
) => {
  // Initialize an empty output object.
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const outputObject: Record<any, any> = {};

  // Iterate through each key-value pair in the form data.
  for (const [key, value] of formData.entries()) {
    // Try to convert data to the original type, otherwise return the original value
    const data = preserveStringified ? value : tryParseJSON(value);
    // Split the key into an array of parts.
    const keyParts = key.split(".");
    // Initialize a variable to point to the current object in the output object.
    let currentObject = outputObject;

    // Iterate through each key part except for the last one.
    for (let i = 0; i < keyParts.length - 1; i++) {
      // Get the current key part.
      const keyPart = keyParts[i];
      // If the current object doesn't have a property with the current key part,
      // initialize it as an object or array depending on whether the next key part is a valid integer index or not.
      if (!currentObject[keyPart]) {
        currentObject[keyPart] = /^\d+$/.test(keyParts[i + 1]) ? [] : {};
      }
      // Move the current object pointer to the next level of the output object.
      currentObject = currentObject[keyPart];
    }

    // Get the last key part.
    const lastKeyPart = keyParts[keyParts.length - 1];
    const lastKeyPartIsArray = /\[\d*\]$|\[\]$/.test(lastKeyPart);

    // Handles array[] or array[0] cases
    if (lastKeyPartIsArray) {
      const key = lastKeyPart.replace(/\[\d*\]$|\[\]$/, "");
      if (!currentObject[key]) {
        currentObject[key] = [];
      }

      currentObject[key].push(data);
    }

    // Handles array.foo.0 cases
    if (!lastKeyPartIsArray) {
      // If the last key part is a valid integer index, push the value to the current array.
      if (/^\d+$/.test(lastKeyPart)) {
        currentObject.push(data);
      }
      // Otherwise, set a property on the current object with the last key part and the corresponding value.
      else {
        currentObject[lastKeyPart] = data;
      }
    }
  }

  // Return the output object.
  return outputObject;
};

export const getFormDataFromSearchParams = <T extends FieldValues>(
  request: Pick<Request, "url">,
  preserveStringified = false,
): T => {
  const searchParams = new URL(request.url).searchParams;

  return generateFormData(searchParams, preserveStringified);
};

export const isGet = (request: Pick<Request, "method">) =>
  request.method === "GET" || request.method === "get";

type ReturnData<T extends FieldValues> =
  | {
      data: T;
      errors: undefined;
      receivedValues: Partial<T>;
    }
  | {
      data: undefined;
      errors: FieldErrors<T>;
      receivedValues: Partial<T>;
    };
/**
 * Parses the data from an HTTP request and validates it against a schema. Works in both loaders and actions, in loaders it extracts the data from the search params.
 * In actions it extracts it from request formData.
 *
 * @returns A Promise that resolves to an object containing the validated data or any errors that occurred during validation.
 */
export const getValidatedFormData = async <T extends FieldValues>(
  request: Request | FormData,
  resolver: Resolver<T>,
  preserveStringified = false,
): Promise<ReturnData<T>> => {
  const receivedValues =
    "url" in request && isGet(request)
      ? getFormDataFromSearchParams<T>(request, preserveStringified)
      : await parseFormData<T>(request, preserveStringified);

  const data = await validateFormData<T>(receivedValues, resolver);

  return { ...data, receivedValues };
};

/**
 * Helper method used in actions to validate the form data parsed from the frontend using zod and return a json error if validation fails.
 * @param data Data to validate
 * @param resolver Schema to validate and cast the data with
 * @returns Returns the validated data if successful, otherwise returns the error object
 */
export const validateFormData = async <T extends FieldValues>(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  data: any,
  resolver: Resolver<T>,
) => {
  const dataToValidate =
    data instanceof FormData ? Object.fromEntries(data) : data;
  const { errors, values } = await resolver(
    dataToValidate,
    {},
    { shouldUseNativeValidation: false, fields: {} },
  );

  if (Object.keys(errors).length > 0) {
    return { errors: errors as FieldErrors<T>, data: undefined };
  }

  return { errors: undefined, data: values as T };
};
/**
  Creates a new instance of FormData with the specified data and key.
  @template T - The type of the data parameter. It can be any type of FieldValues.
  @param {T} data - The data to be added to the FormData. It can be either an object of type FieldValues.
  @param {boolean} stringifyAll - Should the form data be stringified or not (default: true) eg: {a: '"string"', b: "1"} vs {a: "string", b: "1"}
  @returns {FormData} - The FormData object with the data added to it.
*/
export const createFormData = <T extends FieldValues>(
  data: T,
  stringifyAll = true,
): FormData => {
  const formData = new FormData();
  if (!data) {
    return formData;
  }
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }
    // Handle FileList
    if (typeof FileList !== "undefined" && value instanceof FileList) {
      for (let i = 0; i < value.length; i++) {
        formData.append(key, value[i]);
      }
      continue;
    }
    // Handle array of File and Blob objects
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => item instanceof File || item instanceof Blob)
    ) {
      for (let i = 0; i < value.length; i++) {
        formData.append(key, value[i]);
      }
      continue;
    }
    // Handle File or Blob
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      continue;
    }
    // Stringify all values if set
    if (stringifyAll) {
      formData.append(key, JSON.stringify(value));
      continue;
    }
    // Handle strings
    if (typeof value === "string") {
      formData.append(key, value);
      continue;
    }
    // Handle dates
    if (value instanceof Date) {
      formData.append(key, value.toISOString());
      continue;
    }
    // Handle all the other values

    formData.append(key, JSON.stringify(value));
  }

  return formData;
};

/**
Parses the specified Request object's FormData to retrieve the data associated with the specified key.
Or parses the specified FormData to retrieve the data 
  */

// biome-ignore lint/complexity/noUselessTypeConstraint: <explanation>
export const parseFormData = async <T extends unknown>(
  request: Request | FormData,
  preserveStringified = false,
): Promise<T> => {
  const formData =
    request instanceof Request ? await request.formData() : request;
  return generateFormData(formData, preserveStringified);
};

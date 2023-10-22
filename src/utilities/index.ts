import { object } from "zod";
import {
  type FieldValues,
  type Resolver,
  type FieldErrors,
  type FieldError,
  set,
} from "react-hook-form";

type FieldDataObjList = { path: string; value: string | Blob };

/**
 * Generates an output object from the given form data, where the keys in the output object retain
 * the structure of the keys in the form data. Keys containing integer indexes are treated as arrays.
 *
 * @param {FormData} formData - The form data to generate an output object from.
 * @returns {Object} The output object generated from the form data.
 */
export const generateFormData = <T extends FieldValues>(
  formData: FormData | URLSearchParams,
) => {
  const outputObject = {} as T;

  const hasJs = formData.has("hasJS");
  hasJs && formData.delete("hasJS");

  // Iterate through each key-value pair in the form data.
  for (const [path, value] of formData.entries()) {
    const cleanValue =
      hasJs && !isBlob(value) ? JSON.parse(value as string) : value;

    // set FieldValues object to dot syntax path
    set(outputObject, path, cleanValue);
  }

  return outputObject;
};

/**
 * cleanArrayStringUrl - This is a Fix for react-hook-form url empty [] brackets set conversion,
 * react-hook-form will not load array values that use the empty [] keys.
 *
 * This utility will add number keys to empty [].
 *
 * Note: empty url arrays and no js forms don't seam to be very popular either.
 *
 * @param {string} urlString
 * @returns {string}
 */
// "http://localhost:3000/?user.name=john&car[]=ford&car[]=chevy&colors[]=red&colors[]=green&colors[]=blue&numbers[0]=1";
export const cleanArrayStringKeys = (urlString: URLSearchParams) => {
  const cleanedFormData = new URLSearchParams();
  const counter = {} as Record<string, number>;

  for (const [path, value] of urlString.entries()) {
    const keys = path.split(/([\D]$\[\])/g);
    // early return if single key
    if (keys.length === 1 && !/\[\]/g.test(keys[0])) {
      cleanedFormData.set(keys.join(""), value);
      continue;
    }

    const cleanedKey = [] as string[];

    // adds indexes to empty arrays to match react-hook-form
    keys.forEach((key) => {
      key = key.replace(/\.\[/g, "[");
      counter[key] = (counter[key] === undefined ? -1 : counter[key]) + 1;

      cleanedKey.push(key.replace(/\[\]/g, () => `[${counter[key]}]`));

      // merge array keys back into path
      const cleanedPath = cleanedKey.join("");

      cleanedFormData.set(cleanedPath, value);
    });
  }

  return cleanedFormData;
};

export const getFormDataFromSearchParams = <T extends FieldValues>(
  request: Pick<Request, "url">,
) => {
  const searchParams = new URL(request.url).searchParams;

  const cleanedSearchParams = cleanArrayStringKeys(searchParams);

  return generateFormData<T>(cleanedSearchParams);
};

export const isGet = (request: Pick<Request, "method">) =>
  request.method === "GET" || request.method === "get";

/**
 * Parses the data from an HTTP request and validates it against a schema. Works in both loaders and actions, in loaders it extracts the data from the search params.
 * In actions it extracts it from request formData.
 *
 * @async
 * @param {Request} request - An object that represents an HTTP request.
 * @param validator - A function that resolves the schema.
 * @returns A Promise that resolves to an object containing the validated data or any errors that occurred during validation.
 */
export const getValidatedFormData = async <T extends FieldValues>(
  request: Request,
  resolver: Resolver,
) => {
  const data = isGet(request)
    ? getFormDataFromSearchParams(request)
    : await parseFormData<T>(request);

  const validatedOutput = await validateFormData<T>(data, resolver);

  return { ...validatedOutput, receivedValues: data };
};

/**
 * Helper method used in actions to validate the form data parsed from the frontend using zod and return a json error if validation fails.
 * @param data Data to validate
 * @param resolver Schema to validate and cast the data with
 * @returns Returns the validated data if successful, otherwise returns the error object
 */
export const validateFormData = async <T extends FieldValues>(
  data: any,
  resolver: Resolver,
) => {
  const { errors, values } = await resolver(
    data,
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
  @param {string} [key="formData"] - The key to be used for adding the data to the FormData.
  @returns {FormData} - The FormData object with the data added to it.
*/
export const createFormData = <T extends FieldValues>(
  data?: T | object | null,
): FormData => {
  if (!FormData) console.error("FormData doesn't exist");

  const formData = new FormData();

  // This lets the parser know that the data was generated by this formData
  // generator which uses JSON.Stringify to maintain all data types including Blobs
  formData.append("hasJS", "true");

  if (!data || isEmptyObj(data)) {
    formData.append("emptyNull", !data ? "null" : "{}");
    return formData;
  }

  const fieldDataObjList = createPathDataList(data, true) as FieldDataObjList[];

  fieldDataObjList.forEach(({ path, value }) => {
    formData.append(path, value);
  });

  return formData;
};

/**
Parses the specified Request object's FormData to retrieve the data associated with the specified key.
@template T - The type of the data to be returned.
@param {Request} request - The Request object whose FormData is to be parsed.
@param {string} [key="formData"] - The key of the data to be retrieved from the FormData.
@returns {Promise<T>} - A promise that resolves to the data of type T.
@throws {Error} - If no data is found for the specified key, or if the retrieved data is not a string.
*/
export const parseFormData = async <T extends FieldValues>(
  request: Request,
) => {
  const formData = await request.formData();

  // handles {} or null data sends
  if (formData.has("emptyNull")) {
    const data = formData.get("emptyNull") as string;
    return JSON.parse(data);
  }

  return generateFormData<T>(formData) as T;
};

/**
Merges two error objects generated by a resolver, where T is the generic type of the object.
The function recursively merges the objects and returns the resulting object.

@template T - The generic type of the object.
@param frontendErrors - The frontend errors
@param backendErrors - The backend errors
@returns The merged errors of type Partial<FieldErrorsImpl<DeepRequired<T>>>.
*/
export const mergeErrors = (
  frontendErrors: FieldErrors,
  backendErrors?: any,
  validKeys: string[] | undefined = [],
  errorSet: boolean | undefined = false,
) => {
  if (!backendErrors) {
    return frontendErrors;
  }

  for (const [key, rightValue] of Object.entries<FieldErrors>(backendErrors)) {
    if (
      typeof rightValue === "object" &&
      !rightValue?.message &&
      !rightValue?.type &&
      !Array.isArray(rightValue)
    ) {
      if (!frontendErrors[key]) {
        frontendErrors[key] = {};
      }
      mergeErrors(
        frontendErrors[key]! as FieldErrors,
        rightValue,
        validKeys,
        errorSet,
      );
      const hasNoMessage = isEmptyObj(frontendErrors[key]);
      // removes the base object since no error was set.
      if (!errorSet && hasNoMessage) {
        delete frontendErrors[key];
      }
    } else if (rightValue) {
      if (
        (validKeys.includes(key) || key.toLowerCase().startsWith("root")) &&
        (typeof rightValue === "string" ||
          rightValue?.message ||
          rightValue?.type)
      ) {
        frontendErrors[key] = formatError(rightValue);
        if (frontendErrors[key]) errorSet = true;
      }
    }
  }

  return frontendErrors;
};

/**
 * formatError maintains react-hook-form message standard formate.
 *
 * @param {*} error
 * @returns {*}
 */
export const formatError = <K extends keyof FieldValues = keyof FieldValues>(
  error: FieldErrors[K] | string,
): FieldError | undefined => {
  // Turns a string error into a valid react-hook-form error message
  if (typeof error === "string") {
    return {
      message: error,
      type: "backend",
    };
  }

  // allows for no message react-hook-form error messages
  if (typeof error?.type === "string" || typeof error?.message === "string") {
    const { message, type, ...errorProps } = error as FieldError;

    return {
      message,
      type: type || "backend",
      ...errorProps,
    };
  }

  // We return undefined since message and type are not set,
  // there is no valid react-hook-form error message being sent
  return undefined;
};

/**
 * safeKeys will append the keys from dot syntax FieldValues to the key list. Including the excepted root key.
 *
 * Note: This keeps the dot syntax version too, just incase the user sends that back from the back end.
 *
 * @param {object} values
 * @returns {string[]}
 */
export const safeKeys = (values: object) => {
  const validKeys = Object.keys(values);
  let dotSyntaxKeys: string[] = ["root"];

  validKeys.forEach((key) => {
    if (key.includes(".")) {
      const keys = key.split(".");
      dotSyntaxKeys = dotSyntaxKeys.concat(keys);
    }
  });

  return [...new Set(validKeys.concat(dotSyntaxKeys))];
};

/**
 * isEmptyObj will only be true if passed an empty object
 *
 * @param {{}} obj
 * @returns {boolean}
 */
export const isEmptyObj = (obj: any) => {
  if (typeof obj !== "object" || Array.isArray(obj)) return "NaO"; // Not an object
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * createPathDataList FieldDataObjList array from field data to send to backend.
 * Allowing for all valid formData types
 *
 * @template T
 * @param {T} formData
 * @param {?string} [pathKey]
 * @param {?FieldDataObjList[]} [fieldDataList]
 * @returns {(FieldDataObjList[] | undefined)}
 */
export const createPathDataList = <T extends FieldValues>(
  fieldValues: T,
  hasJs: boolean,
  pathKey?: string,
  fieldDataList?: FieldDataObjList[],
): FieldDataObjList[] | undefined => {
  let isRecursion = true;

  if (!Array.isArray(fieldDataList)) {
    isRecursion = false;
    fieldDataList = [];
  }

  for (const [key, value] of Object.entries<T>(fieldValues)) {
    const path = `${pathKey ? pathKey + "." : ""}${key}`;
    const isBlobValue = isBlob(value);

    if (Array.isArray(value)) {
      arrayPathToValueList(fieldDataList, path, value, hasJs);
      continue;
    }

    if (isBlobValue) {
      const blobValue = value as unknown as Blob;
      fieldDataList.push({ path, value: blobValue });
      continue;
    }

    // handles nested objects
    if (typeof value === "object" && !isBlobValue && !isEmptyObj(value)) {
      createPathDataList(value, hasJs, path, fieldDataList);
      continue;
    }

    const cleanValue = hasJs ? JSON.stringify(value) : value;
    fieldDataList.push({
      path,
      value: cleanValue as string | Blob, // ToDo: Check this!
    });
  }

  if (!isRecursion) {
    return fieldDataList;
  }
};

/**
 * arrayPathToValueList - when adding to value list if the value is an array,
 * this will create the path for each array value, then append it to the fieldDataList.
 *
 * @template T
 * @param {FieldDataObjList[]} fieldDataList
 * @param {string} path
 * @param {T} value
 */
export const arrayPathToValueList = <T extends FieldValues>(
  fieldDataList: FieldDataObjList[],
  path: string,
  valueArray: T,
  hasJs: boolean,
) => {
  for (const index in valueArray) {
    const keyPath = `${path}.[${index}]`;
    const value = valueArray[index];

    if (isBlob(value)) {
      const blobValue = value as Blob;
      fieldDataList.push({ path: keyPath, value: blobValue });
      continue;
    }

    if (typeof value === "object" && !isEmptyObj(value)) {
      createPathDataList(value, hasJs, keyPath, fieldDataList);
      continue;
    }

    fieldDataList.push({
      path: keyPath,
      value: cleanValue(hasJs, value),
    });
  }
};

/**
 * isBlob returns true if value is a Blob
 *
 * @param {*} value
 * @returns {boolean}
 */
export const isBlob = (value: any) => {
  if (!Blob) return false;

  return value instanceof Blob || toString.call(value) === "[object Blob]";
};

/**
 * Clean Value returns a Blob or a JSON.stringify() string if hasJS is set.
 *
 * @param {*} value
 * @returns {string | Blob}
 */
export const cleanValue = (hasJs: boolean, value: any): string | Blob => {
  if (isBlob(value)) return value;

  if (hasJs || typeof value !== "string") {
    return JSON.stringify(value);
  }

  return value;
};

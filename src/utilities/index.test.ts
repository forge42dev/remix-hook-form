import { array, object, string } from "zod";
import {
  arrayPathToValueList,
  cleanArrayStringKeys,
  createFormData,
  createPathDataList,
  generateFormData,
  getFormDataFromSearchParams,
  getValidatedFormData,
  isBlob,
  isEmptyObj,
  isGet,
  mergeErrors,
  parseFormData,
  safeKeys,
  validateFormData,
} from "./index";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  dataFormValues,
  dataFormValuesHasJsPathValueList,
  dataArrayUrl,
  dataArrayUrlSchema,
  dataArrayUrlExpect,
  dataArrayUrlSearchParameterExpected,
  dataFormValuesHasJsPathValueExpected,
  dataFormValuesJsFormDataObjectEntries,
  dataFormValuesNonJsPathValueList,
  dataFieldValuesNonJsFinal,
  mockBlob,
} from "./test.data";
import { mockRequest } from "./test.utils";
import { v } from "vitest/dist/types-e3c9754d";

describe("createFormData", () => {
  it("should create a FormData object with the provided data", async () => {
    const formData = createFormData(dataFormValues);
    expect(Object.fromEntries(formData)).toMatchObject(
      dataFormValuesJsFormDataObjectEntries,
    );
  });

  it("should handle empty data", async () => {
    const formData = createFormData({});

    expect(formData.get("emptyNull")).toEqual("{}");
  });

  it("should handle null data", async () => {
    const formData = createFormData(null);

    expect(formData.get("emptyNull")).toEqual("null");
  });
});

describe("parseFormData", async () => {
  it("should parse the data from the request object", async () => {
    const request = await mockRequest(dataFormValues);
    const parsedData = await parseFormData(request);

    expect(parsedData).toEqual(dataFormValues);
  });

  it("should return an empty object if no formData exists", async () => {
    const request = await mockRequest({});
    const parsedData = await parseFormData(request);

    expect(parsedData).toEqual({});
  });

  it("should return formData if NO js was used and formData was passed as is", async () => {
    const formData = new FormData();
    dataFormValuesNonJsPathValueList.forEach(({ path, value }) => {
      formData.append(path, value);
    });
    const request = await mockRequest(formData);

    const parsedData = await parseFormData(request);
    expect(parsedData).toEqual(dataFieldValuesNonJsFinal);
  });
});

describe("safeKeys", () => {
  it("should return dot syntax and final nested field value key", () => {
    const formValues = {
      "profile.lastName": "Smith",
      firstName: "John",
      heading: { text: "Password" },
    };
    const expectedKeys: any = [
      "profile.lastName",
      "firstName",
      "heading",
      "root",
      "profile",
      "lastName",
    ];
    const validKeys = safeKeys(formValues);

    expect(validKeys).toEqual(expectedKeys);
  });

  it("should remove duplicate generated from dot syntax field value keys", () => {
    const formValues = {
      "profile.lastName": "Smith",
      firstName: "John",
      heading: { text: "Password" },
      lastName: "smith",
    };
    const expectedKeys: any = [
      "profile.lastName",
      "firstName",
      "heading",
      "lastName",
      "root",
      "profile",
    ];
    const validKeys = safeKeys(formValues);

    expect(validKeys).toEqual(expectedKeys);
  });
});

describe("mergeErrors", () => {
  it("should return the backend errors if frontend errors is not provided", () => {
    const backendErrors: any = {
      username: { message: "This field is required" },
    };
    const expectedErrors: any = {
      username: { message: "This field is required", type: "backend" },
    };
    const mergedErrors = mergeErrors({}, backendErrors, ["username"]);

    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should return the frontend errors if backend errors is not provided", () => {
    const frontendErrors: any = { email: { message: "Invalid email" } };
    const mergedErrors = mergeErrors(frontendErrors, undefined);
    expect(mergedErrors).toEqual(frontendErrors);
  });

  it("should merge nested objects recursively", () => {
    const frontendErrors: any = {
      password: { message: "Password is required" },
      confirmPassword: { message: "Passwords do not match" },
      profile: {
        firstName: { message: "First name is required" },
      },
    };
    const backendErrors: any = {
      confirmPassword: { message: "Password confirmation is required" },
      profile: {
        lastName: { message: "Last name is required" },
        address: { street: { message: "Street is required" } },
      },
    };
    const expectedErrors = {
      password: { message: "Password is required" },
      confirmPassword: {
        message: "Password confirmation is required",
        type: "backend",
      },
      profile: {
        firstName: { message: "First name is required" },
        lastName: { message: "Last name is required", type: "backend" },
        address: { street: { message: "Street is required", type: "backend" } },
      },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, [
      "password",
      "confirmPassword",
      "firstName",
      "lastName",
      "street",
    ]);

    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should ignore backend data that doesn't conform to react-hook-form errors even if the key exists", () => {
    const validKeys = ["password", "profile.lastName", "heading", "lastName"];
    const frontendErrors: any = {
      password: { message: "required" },
    };
    const backendErrors: any = {
      profile: {
        heading: { text: "Password" },
        lastName: { message: "Last name is required" },
      },
    };
    const expectedErrors = {
      profile: {
        lastName: { message: "Last name is required", type: "backend" },
      },
      password: { message: "required" },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);

    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should override backend type with value you from backend response", () => {
    const validKeys = ["password", "profile.lastName", "heading", "lastName"];
    const frontendErrors: any = {
      password: { message: "required" },
    };
    const backendErrors: any = {
      profile: {
        heading: { text: "Password" },
        lastName: { message: "Last name is required", type: "required" },
      },
    };
    const expectedErrors = {
      profile: {
        lastName: { message: "Last name is required", type: "required" },
      },
      password: { message: "required" },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);

    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should return a backend type error response only", () => {
    const validKeys = ["password", "profile.lastName", "heading", "lastName"];
    const frontendErrors: any = {
      password: { message: "required" },
    };
    const backendErrors: any = {
      profile: {
        lastName: { type: "min" },
      },
    };
    const expectedErrors = {
      profile: {
        lastName: { type: "min" },
      },
      password: { message: "required" },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);

    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should return backend root errors", () => {
    const validKeys: string[] = [];
    const frontendErrors: any = {};
    const backendErrors: any = {
      root: { message: "root error message" },
      "root.server": { message: "root.server error message" },
    };
    const expectedErrors = {
      root: { message: "root error message", type: "backend" },
      "root.server": { message: "root.server error message", type: "backend" },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);
    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should return nested backend root errors", () => {
    const validKeys = ["root.server", "server", "toastMessage"];
    const frontendErrors: any = {};
    const backendErrors: any = {
      root: {
        toastMessage: { message: "root error message" },
        server: { message: "root.server error message" },
      },
      "root.server": { message: "root.server error message" },
    };
    const expectedErrors = {
      root: {
        server: {
          message: "root.server error message",
          type: "backend",
        },
        toastMessage: {
          message: "root error message",
          type: "backend",
        },
      },
      "root.server": {
        message: "root.server error message",
        type: "backend",
      },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);
    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should show backend that just use react-hook-form type messages", () => {
    const validKeys = ["password", "firstName", "lastName"];
    const frontendErrors: any = {};
    const backendErrors: any = {
      password: { message: "Invalid Password" },
      profile: {
        firstName: { type: "required" },
        lastName: { type: "min" },
      },
    };
    const expectedErrors = {
      password: { message: "Invalid Password", type: "backend" },
      profile: {
        firstName: { type: "required" },
        lastName: { type: "min" },
      },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);
    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should overwrite the frontend error message with the backend error message", () => {
    const validKeys = ["username"];
    const frontendErrors: any = {
      username: { message: "This field is required" },
    };
    const backendErrors: any = {
      username: { message: "The username is already taken" },
    };
    const expectedErrors = {
      username: { message: "The username is already taken", type: "backend" },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors, validKeys);
    expect(mergedErrors).toEqual(expectedErrors);
  });
});

describe("generateFormData", () => {
  it("should generate an output object for flat form data", () => {
    const formData = new FormData();

    dataFormValuesHasJsPathValueList.forEach(({ path, value }) => {
      formData.append(path, value);
    });

    expect(generateFormData(formData)).toMatchObject(
      dataFormValuesHasJsPathValueExpected,
    );
  });

  it("should generate an output object for nested form data", () => {
    const formData = new FormData();
    formData.append("user.name.first", "John");
    formData.append("user.name.last", "Doe");
    formData.append("user.email", "johndoe@example.com");

    const expectedOutput = {
      user: {
        name: {
          first: "John",
          last: "Doe",
        },
        email: "johndoe@example.com",
      },
    };

    expect(generateFormData(formData)).toEqual(expectedOutput);
  });

  it("should generate an output object with arrays for integer indexes", () => {
    const formData = new FormData();
    formData.append("user.roles.[0]", "admin");
    formData.append("user.roles.[1]", "editor");
    formData.append("user.roles.[2]", "contributor");

    const expectedOutput = {
      user: {
        roles: ["admin", "editor", "contributor"],
      },
    };

    expect(generateFormData(formData)).toEqual(expectedOutput);
  });

  it("should handle all valid data types strings and blobs, ", () => {
    const formData = new FormData();

    formData.append("user.roles.[0]", "admin");
    formData.append("user.roles.[1]", "editor");
    formData.append("user.roles.[2]", "contributor");

    const expectedOutput = {
      user: {
        roles: ["admin", "editor", "contributor"],
      },
    };

    expect(generateFormData(formData)).toEqual(expectedOutput);
  });
});

describe("isGet", () => {
  it("returns true if the request method is GET", () => {
    const request = { method: "GET" };
    expect(isGet(request)).toBe(true);
  });

  it("returns true if the request method is get", () => {
    const request = { method: "get" };
    expect(isGet(request)).toBe(true);
  });

  it("returns false if the request method is POST", () => {
    const request = { method: "POST" };
    expect(isGet(request)).toBe(false);
  });
});

describe("getFormDataFromSearchParams", () => {
  it("should return an empty FormData object when there are no search params", () => {
    const request = {
      url: "http://localhost:3000/",
    };

    const formData = getFormDataFromSearchParams(request);
    expect(formData).toStrictEqual({});
  });

  it("should return a FormData object with search params", () => {
    const request = {
      url: "http://localhost:3000/?name=John+Doe&email=johndoe@example.com",
    };

    const formData = getFormDataFromSearchParams(request);
    expect(formData).toStrictEqual({
      name: "John Doe",
      email: "johndoe@example.com",
    });
  });

  it("should return a FormData object with nested search params", () => {
    const request = {
      url: "http://localhost:3000/?user.name.first=John&user.name.last=Doe&user.email=johndoe@example.com",
    };

    const formData = getFormDataFromSearchParams(request);

    expect(formData).toStrictEqual({
      user: {
        name: {
          first: "John",
          last: "Doe",
        },
        email: "johndoe@example.com",
      },
    });
  });

  it("should convert array search params to FormData object with arrays", () => {
    const request = {
      url: "http://localhost:3000/?colors[]=red&colors[]=green&colors[]=blue&numbers[0]=1&numbers[1]=2&numbers[2]=3",
    };
    const formData = getFormDataFromSearchParams(request);

    expect(formData).toStrictEqual({
      colors: ["red", "green", "blue"],
      numbers: ["1", "2", "3"],
    });
  });
});

describe("validateFormData", () => {
  it("should return an empty error object and valid data if there are no errors", async () => {
    const formData = {
      name: "John Doe",
      email: "email@email.com",
    };

    const returnData = await validateFormData(
      formData,
      zodResolver(object({ name: string(), email: string().email() })),
    );
    expect(returnData.errors).toStrictEqual(undefined);
    expect(returnData.data).toStrictEqual(formData);
  });

  it("should return an error object and no data if there are errors", async () => {
    const formData = {
      email: "email",
      name: "John Doe",
    };
    const returnData = await validateFormData(
      formData,
      zodResolver(object({ name: string(), email: string().email() })),
    );
    expect(returnData.errors).toStrictEqual({
      email: {
        message: "Invalid email",
        type: "invalid_string",
        ref: undefined,
      },
    });
    expect(returnData.data).toStrictEqual(undefined);
  });
});

describe("cleanArrayStringKeys", () => {
  it("will clean empty SearchURL empty array params to conform to react-hook-form standard", async () => {
    const searchParams = new URL(dataArrayUrl).searchParams;
    const cleanedSearchParams = cleanArrayStringKeys(searchParams);
    const formData = generateFormData(cleanedSearchParams);

    expect(formData).toEqual(dataArrayUrlExpect);
  });
});

describe("getValidatedFormData", () => {
  it("gets valid form data from a GET request", async () => {
    const request = await mockRequest(undefined, dataArrayUrl, {
      method: "GET",
    });

    const validatedOutput = await getValidatedFormData(
      request,
      zodResolver(dataArrayUrlSchema),
    );

    expect(validatedOutput).toEqual(dataArrayUrlSearchParameterExpected);
  });

  it("gets valid form data from a POST request when it is js", async () => {
    const fieldValues = {
      name: "John Doe",
      age: "30",
      hobbies: ["Reading", "Writing", "Coding"],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    };
    const request = new Request("http://localhost:3000", { method: "POST" });
    const requestFormDataSpy = vi.spyOn(request, "formData");

    const formData = createFormData(fieldValues);
    requestFormDataSpy.mockResolvedValueOnce(formData);

    const schema = object({
      name: string(),
      age: string(),
      hobbies: array(string()),
      other: object({
        skills: array(string()),
        something: string(),
      }),
    });

    const validatedFormData = await getValidatedFormData(
      request as any,
      zodResolver(schema),
    );

    expect(validatedFormData).toStrictEqual({
      data: fieldValues,
      receivedValues: fieldValues,
      errors: undefined,
    });
  });

  it("gets valid form data from a POST request when it is no js", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("age", "30");
    formData.append("hobbies.0", "Reading");
    formData.append("hobbies.1", "Writing");
    formData.append("hobbies.2", "Coding");
    formData.append("other.skills.0", "testing");
    formData.append("other.skills.1", "testing");
    formData.append("other.something", "else");
    const request = new Request("http://localhost:3000", { method: "post" });
    const requestFormDataSpy = vi.spyOn(request, "formData");
    requestFormDataSpy.mockResolvedValueOnce(formData);

    const schema = object({
      name: string(),
      age: string(),
      hobbies: array(string()),
      other: object({
        skills: array(string()),
        something: string(),
      }),
    });
    const returnData = await getValidatedFormData(
      request as any,
      zodResolver(schema),
    );
    expect(returnData).toStrictEqual({
      data: {
        name: "John Doe",
        age: "30",
        hobbies: ["Reading", "Writing", "Coding"],
        other: {
          skills: ["testing", "testing"],
          something: "else",
        },
      },
      receivedValues: {
        name: "John Doe",
        age: "30",
        hobbies: ["Reading", "Writing", "Coding"],
        other: {
          skills: ["testing", "testing"],
          something: "else",
        },
      },
      errors: undefined,
    });
  });
});

describe("isEmptyObj", () => {
  it("Should return true if empty object", () => {
    expect(isEmptyObj({})).toBeTruthy();
  });

  it("Should return NaO if passed empty array", () => {
    expect(isEmptyObj([])).toEqual("NaO");
  });

  it("Should return false if object has values", () => {
    expect(
      isEmptyObj({ question: "What are you going to call it?" }),
    ).toBeFalsy();
  });

  it("Should return NaO if passed string", () => {
    expect(isEmptyObj(`I think I'll call it "Bob"`)).toEqual("NaO");
  });

  it("Should return NaO if passed filled array", () => {
    expect(isEmptyObj(["You", "can't", "call", "a", "planet", "Bob."])).toEqual(
      "NaO",
    );
  });
});

describe("createPathDataList", () => {
  it("Should handle all types of data and nesting", () => {
    expect(createPathDataList(dataFormValues, true)).toEqual(
      dataFormValuesHasJsPathValueList,
    );
  });
});

describe("isBlob", () => {
  it("Should return true if value is a Blob", () => {
    expect(isBlob(mockBlob)).toBeTruthy();
  });

  it("Should return true if value is a file", () => {
    const newFile = new File(["Hello world"], "test_file.txt");
    expect(isBlob(newFile)).toBeTruthy();
  });

  it("Should return false if value is an object", () => {
    expect(isBlob({})).toBeFalsy();
  });

  it("Should return false if value is an string", () => {
    expect(isBlob("my string")).toBeFalsy();
  });

  it("Should return false if value is an array", () => {
    expect(isBlob([1, 2, 3, 4])).toBeFalsy();
  });

  it("Should return false if value is an function", () => {
    expect(
      isBlob(() => {
        return;
      }),
    ).toBeFalsy();
  });
});

describe("arrayPathToValueList", () => {
  it("handles arrays of strings", () => {
    const fieldDataList = [
      { path: "profile.fullName", value: '"Capitan Jack Sparrow"' },
    ];

    const path = "profile.facts";
    const value = ["loves rum", "has magic campus"];
    arrayPathToValueList(fieldDataList, path, value, true);
    const expectedFieldDataList = [
      {
        path: "profile.fullName",
        value: '"Capitan Jack Sparrow"',
      },
      {
        path: "profile.facts.[0]",
        value: '"loves rum"',
      },
      {
        path: "profile.facts.[1]",
        value: '"has magic campus"',
      },
    ];
    expect(fieldDataList).toEqual(expectedFieldDataList);
  });

  it("handles arrays of objects", () => {
    const fieldDataList = [
      { path: "profile.fullName", value: '"Capitan Jack Sparrow"' },
    ];

    const path = "profile.facts";
    const value = [{ activity: "drinking" }, { activity: "sword fighting" }];

    arrayPathToValueList(fieldDataList, path, value, true);

    const expectedFieldDataList = [
      {
        path: "profile.fullName",
        value: '"Capitan Jack Sparrow"',
      },
      {
        path: "profile.facts.[0].activity",
        value: '"drinking"',
      },
      {
        path: "profile.facts.[1].activity",
        value: '"sword fighting"',
      },
    ];

    expect(fieldDataList).toEqual(expectedFieldDataList);
  });

  it("handles arrays of blobs", () => {
    const fieldDataList = [
      { path: "profile.fullName", value: '"Capitan Jack Sparrow"' },
    ];

    const path = "profile.images";
    const value = [mockBlob, mockBlob];

    arrayPathToValueList(fieldDataList, path, value, true);

    const expectedFieldDataList = [
      {
        path: "profile.fullName",
        value: '"Capitan Jack Sparrow"',
      },
      {
        path: "profile.images.[0]",
        value: mockBlob,
      },
      {
        path: "profile.images.[1]",
        value: mockBlob,
      },
    ];

    expect(fieldDataList).toMatchObject(expectedFieldDataList);
  });
});

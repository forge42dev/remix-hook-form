import { array, boolean, coerce, date, number, object, string } from "zod";
import {
  createFormData,
  generateFormData,
  getFormDataFromSearchParams,
  getValidatedFormData,
  isGet,
  parseFormData,
  validateFormData,
} from "./index";

import { zodResolver } from "@hookform/resolvers/zod";

describe("createFormData", () => {
  it("should create a FormData object with the provided data", () => {
    const data = {
      name: "John Doe",
      age: 30,
      bool: true,
      object: {
        test: "1",
        number: 2,
      },
      array: [1, 2, 3],
    };
    const formData = createFormData(data);

    expect(formData.get("name")).toEqual(JSON.stringify(data.name));
    expect(formData.get("age")).toEqual(data.age.toString());
    expect(formData.get("object")).toEqual(JSON.stringify(data.object));
    expect(formData.get("array")).toEqual(JSON.stringify(data.array));
    expect(formData.get("bool")).toEqual(data.bool.toString());
  });

  it("should create a FormData object with the provided data and remove undefined values", () => {
    const data = {
      name: "John Doe",
      age: 30,
      bool: true,
      b: undefined,
      a: null,
      object: {
        test: "1",
        number: 2,
      },
      array: [1, 2, 3],
    };
    const formData = createFormData(data);

    expect(formData.get("name")).toEqual(JSON.stringify(data.name));
    expect(formData.get("age")).toEqual(data.age.toString());
    expect(formData.get("object")).toEqual(JSON.stringify(data.object));
    expect(formData.get("array")).toEqual(JSON.stringify(data.array));
    expect(formData.get("bool")).toEqual(data.bool.toString());
    expect(formData.get("b")).toEqual(null);
    expect(formData.get("a")).toEqual("null");
  });

  it("should handle null data", () => {
    const formData = createFormData(null as any);
    expect(formData).toBeTruthy();
  });

  it("should handle undefined data", () => {
    const formData = createFormData(undefined as any);
    expect(formData).toBeTruthy();
  });

  it("should handle Date data", () => {
    const date = "2024-01-01T00:00:00.000Z";
    const formData = createFormData({ date: new Date(date) }, false);
    expect(formData.get("date")).toEqual(date);
  });
});

describe("parseFormData", () => {
  // Mock the Request and formData methods
  beforeAll(() => {
    global.Request = vi.fn();
    global.Request.prototype.formData = vi.fn();
  });

  // Reset the mocks after each test
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should parse the data from the request object", async () => {
    const data = {
      name: "John Doe",
      age: "30",
    };
    const request = new Request("http://localhost:3000");
    const requestFormDataSpy = vi.spyOn(request, "formData");
    requestFormDataSpy.mockResolvedValueOnce(createFormData(data));
    const parsedData = await parseFormData<typeof data>(request);
    expect(parsedData).toEqual(data);
  });

  it("should return an empty object if no formData exists", async () => {
    const request = new Request("http://localhost:3000");
    const requestFormDataSpy = vi.spyOn(request, "formData");
    requestFormDataSpy.mockResolvedValueOnce(createFormData({}));
    const parsedData = await parseFormData(request);
    expect(parsedData).toEqual({});
  });

  it("should return formData if NO js was used and formData was passed as is", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("age", "30");
    formData.append("hobbies.0", "Reading");
    formData.append("hobbies.1", "Writing");
    formData.append("hobbies.2", "Coding");
    formData.append("other.skills.0", "testing");
    formData.append("other.skills.1", "testing");
    formData.append("other.something", "else");
    const request = new Request("http://localhost:3000");
    const requestFormDataSpy = vi.spyOn(request, "formData");
    requestFormDataSpy.mockResolvedValueOnce(formData);
    const parsedData = await parseFormData(request);
    expect(parsedData).toEqual({
      name: "John Doe",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    });
  });

  it("should not throw an error when a file is passed in", async () => {
    const request = new Request("http://localhost:3000");
    const requestFormDataSpy = vi.spyOn(request, "formData");
    const blob = new Blob(["Hello, world!"], { type: "text/plain" });
    const mockFormData = new FormData();
    mockFormData.append("formData", blob);
    requestFormDataSpy.mockResolvedValueOnce(mockFormData);
    const data = await parseFormData<{ formData: any }>(request);
    expect(data.formData).toBeTypeOf("string");
  });
});

describe("generateFormData", () => {
  it("should generate an output object for flat form data", () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("email", "johndoe@example.com");

    const expectedOutput = {
      name: "John Doe",
      email: "johndoe@example.com",
    };

    expect(generateFormData(formData)).toEqual(expectedOutput);
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
    formData.append("user.roles.0", "admin");
    formData.append("user.roles.1", "editor");
    formData.append("user.roles.2", "contributor");

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
      numbers: [1, 2, 3],
    });
  });
});

describe("validateFormData", () => {
  it("should return an error when parsing date object without coerce", async () => {
    const formData = createFormData({
      date: new Date(2024, 1, 1),
    });
    const returnData = await validateFormData(
      formData,
      zodResolver(object({ date: date() })),
    );
    expect(returnData.errors).toStrictEqual({
      date: {
        message: "Expected date, received string",
        type: "invalid_type",
        ref: undefined,
      },
    });
    expect(returnData.data).toStrictEqual(undefined);
  });

  it("should return an error when parsing date object with coerce", async () => {
    const formData = createFormData({
      date: new Date(2024, 1, 1),
    });
    const returnData = await validateFormData(
      formData,
      zodResolver(object({ date: coerce.date() })),
    );
    expect(returnData.errors).toStrictEqual({
      date: {
        message: "Invalid date",
        type: "invalid_date",
        ref: undefined,
      },
    });
    expect(returnData.data).toStrictEqual(undefined);
  });

  it("should return a correct value when formatting as object", async () => {
    const formData = createFormData(
      {
        date: new Date(2024, 1, 1),
      },
      false,
    );
    const returnData = await validateFormData(
      formData,
      zodResolver(object({ date: coerce.date() })),
    );
    expect(returnData.errors).toStrictEqual(undefined);
    expect(returnData.data).toStrictEqual({
      date: new Date(2024, 1, 1),
    });
  });

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

describe("createFormData", () => {
  it("doesn't mess up types when passed from frontend to backend", async () => {
    const formData = createFormData({
      name: "123",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      boolean: true,
      numbers: [1, 2, 3],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    });
    const request = new Request("http://localhost:3000", { method: "POST" });
    const requestFormDataSpy = vi.spyOn(request, "formData");

    requestFormDataSpy.mockResolvedValueOnce(formData);
    const parsed = await parseFormData<typeof formData>(request);

    expect(parsed).toStrictEqual({
      name: "123",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      boolean: true,
      numbers: [1, 2, 3],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    });
  });

  it("doesn't send undefined values to the backend but sends null values", async () => {
    const formData = createFormData({
      name: "123",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      boolean: true,
      a: null,
      b: undefined,
      numbers: [1, 2, 3],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    });
    const request = new Request("http://localhost:3000", { method: "POST" });
    const requestFormDataSpy = vi.spyOn(request, "formData");

    requestFormDataSpy.mockResolvedValueOnce(formData);
    const parsed = await parseFormData<typeof formData>(request);

    expect(parsed).toStrictEqual({
      name: "123",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      boolean: true,
      a: null,
      numbers: [1, 2, 3],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    });
  });
});

describe("getValidatedFormData", () => {
  it("gets valid form data from formData", async () => {
    const formData = {
      name: "John Doe",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      boolean: true,
      numbers: [1, 2, 3],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    };
    const data = createFormData(formData);
    const schema = object({
      name: string(),
      age: number(),
      boolean: boolean(),
      numbers: array(number()),
      hobbies: array(string()),
      other: object({
        skills: array(string()),
        something: string(),
      }),
    });
    const validatedFormData = await getValidatedFormData(
      data,
      zodResolver(schema),
    );
    expect(validatedFormData).toStrictEqual({
      data: formData,
      receivedValues: formData,
      errors: undefined,
    });
  });

  it("gets valid form data from a GET request", async () => {
    const request = {
      method: "GET",
      url: "http://localhost:3000/?user.name=john&colors[]=red&colors[]=green&colors[]=blue&numbers[0]=1&numbers[1]=2&numbers[2]=3",
    };

    const schema = object({
      user: object({
        name: string(),
      }),
      colors: array(string()),
      numbers: array(number()),
    });
    const formData = await getValidatedFormData(
      request as any,
      zodResolver(schema),
    );
    expect(formData).toStrictEqual({
      data: {
        user: {
          name: "john",
        },
        colors: ["red", "green", "blue"],
        numbers: [1, 2, 3],
      },
      receivedValues: {
        user: {
          name: "john",
        },
        colors: ["red", "green", "blue"],
        numbers: [1, 2, 3],
      },
      errors: undefined,
    });
  });

  it("gets valid form data from a POST request when it is js", async () => {
    const formData = {
      name: "John Doe",
      age: 30,
      hobbies: ["Reading", "Writing", "Coding"],
      boolean: true,
      numbers: [1, 2, 3],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    };
    const request = new Request("http://localhost:3000", { method: "POST" });
    const requestFormDataSpy = vi.spyOn(request, "formData");
    const data = createFormData(formData);
    requestFormDataSpy.mockResolvedValueOnce(data);

    const schema = object({
      name: string(),
      age: number(),
      boolean: boolean(),
      numbers: array(number()),
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
      data: formData,
      receivedValues: formData,
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
    const request = new Request("http://localhost:3000", { method: "POST" });
    const requestFormDataSpy = vi.spyOn(request, "formData");
    requestFormDataSpy.mockResolvedValueOnce(formData);

    const schema = object({
      name: string(),
      age: number(),
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
        age: 30,
        hobbies: ["Reading", "Writing", "Coding"],
        other: {
          skills: ["testing", "testing"],
          something: "else",
        },
      },
      receivedValues: {
        name: "John Doe",
        age: 30,
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

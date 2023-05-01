import {
  createFormData,
  generateFormData,
  mergeErrors,
  parseFormData,
} from "./index";

describe("createFormData", () => {
  it("should create a FormData object with the provided data", () => {
    const data = {
      name: "John Doe",
      age: 30,
    };
    const formData = createFormData(data);
    expect(formData.get("formData")).toEqual(JSON.stringify(data));
  });

  it("should create a FormData object with the provided key and data", () => {
    const data = {
      name: "Jane Doe",
      age: 25,
    };
    const key = "myData";
    const formData = createFormData(data, key);
    expect(formData.get(key)).toEqual(JSON.stringify(data));
  });

  it("should handle empty data", () => {
    const formData = createFormData({});
    expect(formData.get("formData")).toEqual("{}");
  });

  it("should handle null data", () => {
    const formData = createFormData(null as any);
    expect(formData.get("formData")).toEqual("null");
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
      age: 30,
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
      age: "30",
      hobbies: ["Reading", "Writing", "Coding"],
      other: {
        skills: ["testing", "testing"],
        something: "else",
      },
    });
  });

  it("should throw an error if the retrieved data is not a string (but a file instead)", async () => {
    const request = new Request("http://localhost:3000");
    const requestFormDataSpy = vi.spyOn(request, "formData");
    const blob = new Blob(["Hello, world!"], { type: "text/plain" });
    const mockFormData = new FormData();
    mockFormData.append("formData", blob);
    requestFormDataSpy.mockResolvedValueOnce(mockFormData);
    await expect(parseFormData(request)).rejects.toThrowError(
      "Data is not a string"
    );
  });
});

describe("mergeErrors", () => {
  it("should return the backend errors if frontend errors is not provided", () => {
    const backendErrors: any = {
      username: { message: "This field is required" },
    };
    const mergedErrors = mergeErrors({}, backendErrors);
    expect(mergedErrors).toEqual(backendErrors);
  });

  it("should return the frontend errors if backend errors is not provided", () => {
    const frontendErrors: any = { email: { message: "Invalid email" } };
    const mergedErrors = mergeErrors(frontendErrors, {});
    expect(mergedErrors).toEqual(frontendErrors);
  });

  it("should merge nested objects recursively", () => {
    const frontendErrors: any = {
      password: { message: "Password is required" },
      confirmPassword: { message: "Passwords do not match" },
      profile: { firstName: { message: "First name is required" } },
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
      confirmPassword: { message: "Password confirmation is required" },
      profile: {
        firstName: { message: "First name is required" },
        lastName: { message: "Last name is required" },
        address: { street: { message: "Street is required" } },
      },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors);
    expect(mergedErrors).toEqual(expectedErrors);
  });

  it("should overwrite the frontend error message with the backend error message", () => {
    const frontendErrors: any = {
      username: { message: "This field is required" },
    };
    const backendErrors: any = {
      username: { message: "The username is already taken" },
    };
    const expectedErrors = {
      username: { message: "The username is already taken" },
    };
    const mergedErrors = mergeErrors(frontendErrors, backendErrors);
    expect(mergedErrors).toEqual(expectedErrors);
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

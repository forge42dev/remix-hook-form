import { FieldValues } from "react-hook-form";
import { createFormData, getFormDataFromSearchParams, isGet } from ".";

export const mockRequest = async <T extends FieldValues = FieldValues>(
  mockResponseData?: T | null,
  input: RequestInfo | URL | undefined = "http://localhost:3000",
  init?: RequestInit,
) => {
  if (!FormData) console.error("FormData doesn't exist");

  const method = init?.method || "POST";

  const newRequest = new Request(input, {
    ...init,
    method,
  });

  if (mockResponseData instanceof FormData) {
    newRequest.formData = async () => mockResponseData;

    return newRequest;
  }

  if (isGet(newRequest)) {
    const formData = createFormData<T>(getFormDataFromSearchParams(newRequest));
    newRequest.formData = async () => formData;

    return newRequest;
  }

  const formData = createFormData<T>(mockResponseData);
  newRequest.formData = async () => formData;

  return newRequest;
};

import {
  renderHook,
  act,
  waitFor,
  cleanup,
  render,
  fireEvent,
} from "@testing-library/react";
import { RemixFormProvider, useRemixForm, useRemixFormContext } from "./index";
import React from "react";
import * as remixRun from "@remix-run/react";

const submitMock = vi.fn();
vi.mock("@remix-run/react", () => ({
  useSubmit: () => submitMock,
  useActionData: () => ({}),
}));

const mockUseActionData = vi
  .spyOn(remixRun, "useActionData")
  .mockImplementation(() => ({}));

describe("useRemixForm", () => {
  it("should return all the same output that react-hook-form returns", () => {
    const { result } = renderHook(() => useRemixForm({}));
    expect(result.current.register).toBeInstanceOf(Function);
    expect(result.current.unregister).toBeInstanceOf(Function);
    expect(result.current.setValue).toBeInstanceOf(Function);
    expect(result.current.getValues).toBeInstanceOf(Function);
    expect(result.current.trigger).toBeInstanceOf(Function);
    expect(result.current.reset).toBeInstanceOf(Function);
    expect(result.current.clearErrors).toBeInstanceOf(Function);
    expect(result.current.setError).toBeInstanceOf(Function);
    expect(result.current.formState).toEqual({
      dirtyFields: {},
      isDirty: false,
      isSubmitSuccessful: false,
      isSubmitted: false,
      isSubmitting: false,
      isValid: false,
      isValidating: false,
      touchedFields: {},
      submitCount: 0,
      isLoading: false,
      errors: {},
    });
    expect(result.current.handleSubmit).toBeInstanceOf(Function);
  });

  it("should call onSubmit function when the form is valid", async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();

    const { result } = renderHook(() =>
      useRemixForm({
        resolver: () => ({ values: {}, errors: {} }),
        submitHandlers: {
          onValid,
          onInvalid,
        },
      })
    );

    act(() => {
      result.current.handleSubmit();
    });
    await waitFor(() => {
      expect(onValid).toHaveBeenCalled();
    });
  });

  it("should submit the form data to the server when the form is valid", async () => {
    const { result } = renderHook(() =>
      useRemixForm({
        resolver: () => ({ values: {}, errors: {} }),
        submitConfig: {
          action: "/submit",
        },
      })
    );

    act(() => {
      result.current.handleSubmit();
    });
    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledWith(expect.any(FormData), {
        method: "post",
        action: "/submit",
      });
    });
  });
});

afterEach(cleanup);

describe("RemixFormProvider", () => {
  it("should allow the user to submit via the useRemixForm handleSubmit using the context", () => {
    const { result } = renderHook(() =>
      useRemixForm({
        resolver: () => ({ values: {}, errors: {} }),
        submitConfig: {
          action: "/submit",
        },
      })
    );
    const spy = vi.spyOn(result.current, "handleSubmit");

    const TestComponent = () => {
      const { handleSubmit } = useRemixFormContext();
      return <form onSubmit={handleSubmit} data-testid="test"></form>;
    };

    const { getByTestId } = render(
      <RemixFormProvider {...result.current}>
        <TestComponent />
      </RemixFormProvider>
    );

    const form = getByTestId("test") as HTMLFormElement;
    fireEvent.submit(form);

    expect(spy).toHaveBeenCalled();
  });

  it("should merge useActionData error on submission only", async () => {
    const mockError = {
      userName: { message: "UserName required", type: "custom" },
    };

    const enum Value_Key {
      USERNAME = "userName",
      SCREEN_NAME = "screenName",
    }

    const defaultValues = {
      [Value_Key.USERNAME]: "",
      [Value_Key.SCREEN_NAME]: "",
    };

    const { result, rerender } = renderHook(() =>
      useRemixForm({
        mode: "onSubmit",
        reValidateMode: "onChange",
        submitConfig: {
          action: "/submit",
        },
        defaultValues,
      })
    );

    // Set useActionData mock after initial render, to simulate a server error
    mockUseActionData.mockImplementation(() => mockError);

    act(() => {
      result.current.setValue(Value_Key.SCREEN_NAME, "priceIsWrong");
    });

    act(() => {
      result.current.handleSubmit();
    });

    // Tests that error message is merged.
    await waitFor(() => {
      expect(result.current.formState.errors[Value_Key.USERNAME]?.message).toBe(
        mockError[Value_Key.USERNAME].message
      );
    });

    act(() => {
      result.current.setValue(Value_Key.USERNAME, "Bob Barker");
      // Simulates revalidation onChange
      result.current.clearErrors(Value_Key.USERNAME);
    });

    rerender();

    // This test that error is cleared after state change and not reemerged from useActionData
    await waitFor(() => {
      expect(result.current.getValues(Value_Key.USERNAME)).toBe("Bob Barker");
    });

    await waitFor(() => {
      expect(
        result.current.formState.errors[Value_Key.USERNAME]?.message
      ).toBeUndefined();
    });

    const newScreenName = "CaptainJackSparrow";

    act(() => {
      result.current.setValue(Value_Key.SCREEN_NAME, newScreenName);
    });

    // This test that other state changes do not reemerged from useActionData
    await waitFor(() => {
      expect(result.current.getValues(Value_Key.SCREEN_NAME)).toBe(
        newScreenName
      );
    });

    await waitFor(() => {
      expect(
        result.current.formState.errors[Value_Key.USERNAME]
      ).toBeUndefined();
    });
  });
});

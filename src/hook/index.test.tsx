import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { type Navigation, useFetcher } from "react-router";
import { RemixFormProvider, useRemixForm, useRemixFormContext } from "./index";

const submitMock = vi.fn();
const fetcherSubmitMock = vi.fn();

const useActionDataMock = vi.hoisted(() => vi.fn());

const useNavigationMock = vi.hoisted(() =>
  vi.fn<() => Pick<Navigation, "state" | "formData">>(() => ({
    state: "idle",
    formData: undefined,
  })),
);

vi.mock("react-router", () => ({
  useSubmit: () => submitMock,
  useActionData: useActionDataMock,
  useFetcher: () => ({ submit: fetcherSubmitMock, data: {} }),
  useNavigation: useNavigationMock,
}));

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
      disabled: false,
      dirtyFields: {},
      isDirty: false,
      isSubmitSuccessful: false,
      isSubmitted: false,
      isSubmitting: false,
      isValid: false,
      isValidating: false,
      validatingFields: {},
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
      }),
    );

    act(() => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      result.current.handleSubmit({} as any);
    });
    await waitFor(() => {
      expect(onValid).toHaveBeenCalled();
    });
  });

  it("should reset isSubmitSuccessful after submission if reset is called", async () => {
    const { result } = renderHook(() =>
      useRemixForm({
        resolver: () => ({ values: {}, errors: {} }),
      }),
    );

    act(() => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      result.current.handleSubmit({} as any);
    });
    await waitFor(() => {
      expect(result.current.formState.isSubmitSuccessful).toBe(true);
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.formState.isSubmitSuccessful).toBe(false);
  });

  it("should submit the form data to the server when the form is valid", async () => {
    const { result } = renderHook(() =>
      useRemixForm({
        resolver: () => ({ values: {}, errors: {} }),
        submitConfig: {
          action: "/submit",
        },
      }),
    );

    act(() => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      result.current.handleSubmit({} as any);
    });
    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledWith(expect.any(FormData), {
        method: "post",
        action: "/submit",
      });
    });
  });

  it("should submit the form data to the server using a fetcher when the form is valid", async () => {
    const {
      result: { current: fetcher },
    } = renderHook(() => useFetcher());
    const { result } = renderHook(() =>
      useRemixForm({
        fetcher,
        resolver: () => ({ values: {}, errors: {} }),
        submitConfig: {
          action: "/submit",
        },
      }),
    );

    act(() => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      result.current.handleSubmit({} as any);
    });
    await waitFor(() => {
      expect(fetcherSubmitMock).toHaveBeenCalledWith(expect.any(FormData), {
        method: "post",
        action: "/submit",
      });
    });
  });

  it("should not re-render on validation if isValidating is not being accessed", async () => {
    const renderHookWithCount = () => {
      let count = 0;
      const renderCount = () => count;
      const result = renderHook(() => {
        count++;
        return useRemixForm({
          mode: "onChange",
          resolver: () => ({
            values: {
              name: "",
            },
            errors: {},
          }),
        });
      });
      return { renderCount, ...result };
    };

    const { result, renderCount } = renderHookWithCount();

    await act(async () => {
      result.current.setValue("name", "John", { shouldValidate: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      result.current.setValue("name", "Bob", { shouldValidate: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(renderCount()).toBe(1);
  });

  it("should re-render on validation if isValidating is being accessed", async () => {
    const renderHookWithCount = () => {
      let count = 0;
      const renderCount = () => count;
      const result = renderHook(() => {
        count++;
        return useRemixForm({
          mode: "onChange",
          resolver: () => ({
            values: {
              name: "",
            },
            errors: {},
          }),
        });
      });
      return { renderCount, ...result };
    };

    const { result, renderCount } = renderHookWithCount();

    // Accessing isValidating
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isValidating = result.current.formState.isValidating;

    await act(async () => {
      result.current.setValue("name", "John", { shouldValidate: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      result.current.setValue("name", "Bob", { shouldValidate: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(renderCount()).toBe(3);
  });

  it("should not flash incorrect isSubmitting status", async () => {
    submitMock.mockReset();
    useNavigationMock.mockClear();

    const { result, rerender } = renderHook(() =>
      useRemixForm({
        resolver: () => ({ values: {}, errors: {} }),
        submitConfig: {
          action: "/submit",
        },
      }),
    );

    expect(result.current.formState.isSubmitting).toBe(false);

    act(() => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      result.current.handleSubmit({} as any);
    });
    expect(result.current.formState.isSubmitting).toBe(true);

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));

    expect(result.current.formState.isSubmitting).toBe(true);

    expect(submitMock).toHaveBeenCalledWith(expect.any(FormData), {
      method: "post",
      action: "/submit",
    });

    useNavigationMock.mockReturnValue({
      state: "submitting",
      formData: new FormData(),
    });
    rerender();

    expect(result.current.formState.isSubmitting).toBe(true);

    useNavigationMock.mockReturnValue({ state: "idle", formData: undefined });
    rerender();

    expect(result.current.formState.isSubmitting).toBe(false);
  });

  it("should return defaultValue from the register function", async () => {
    const { result, rerender } = renderHook(() =>
      useRemixForm({
        resolver: () => ({
          values: { name: "", address: { street: "" } },
          errors: {},
        }),
        defaultValues: {
          name: "Default name",
          address: {
            street: "Default street",
          },
        },
      }),
    );

    let nameFieldProps = result.current.register("name");
    let streetFieldProps = result.current.register("address.street");

    expect(nameFieldProps.defaultValue).toBe("Default name");
    expect(nameFieldProps.defaultChecked).toBe(undefined);
    expect(streetFieldProps.defaultValue).toBe("Default street");
    expect(streetFieldProps.defaultChecked).toBe(undefined);

    useActionDataMock.mockReturnValue({
      defaultValues: {
        name: "Updated name",
        address: {
          street: "Updated street",
        },
      },
      errors: { name: "Enter another name" },
    });

    rerender();

    nameFieldProps = result.current.register("name");
    streetFieldProps = result.current.register("address.street");

    expect(nameFieldProps.defaultValue).toBe("Updated name");
    expect(nameFieldProps.defaultChecked).toBe(undefined);
    expect(streetFieldProps.defaultValue).toBe("Updated street");
    expect(streetFieldProps.defaultChecked).toBe(undefined);
  });

  it("should return defaultChecked from the register function when a boolean", async () => {
    const { result, rerender } = renderHook(() =>
      useRemixForm({
        resolver: () => ({
          values: { name: "", address: { street: "" }, boolean: true },
          errors: {},
        }),
        defaultValues: {
          name: "Default name",
          boolean: true,
          address: {
            street: "Default street",
          },
        },
      }),
    );

    let booleanFieldProps = result.current.register("boolean");

    expect(booleanFieldProps.defaultChecked).toBe(true);
    expect(booleanFieldProps.defaultValue).toBe(undefined);

    useActionDataMock.mockReturnValue({
      defaultValues: {
        name: "Updated name",
        address: {
          street: "Updated street",
        },
        boolean: false,
      },
      errors: { name: "Enter another name" },
    });

    rerender();

    booleanFieldProps = result.current.register("boolean");
    expect(booleanFieldProps.defaultChecked).toBe(false);
    expect(booleanFieldProps.defaultValue).toBe(undefined);
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
      }),
    );
    const spy = vi.spyOn(result.current, "handleSubmit");

    const TestComponent = () => {
      const { handleSubmit } = useRemixFormContext();
      return <form onSubmit={handleSubmit} data-testid="test" />;
    };

    const { getByTestId } = render(
      <RemixFormProvider {...result.current}>
        <TestComponent />
      </RemixFormProvider>,
    );

    const form = getByTestId("test") as HTMLFormElement;
    fireEvent.submit(form);

    expect(spy).toHaveBeenCalled();
  });
});

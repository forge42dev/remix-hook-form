import React from "react";
import {
  FetcherWithComponents,
  SubmitFunction,
  useActionData,
  useSubmit,
  useNavigation,
} from "@remix-run/react";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useFormContext,
} from "react-hook-form";
import { useForm, FormProvider } from "react-hook-form";
import type {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormHandleSubmit,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { createFormData, mergeErrors, safeKeys } from "../utilities";

export type SubmitFunctionOptions = Parameters<SubmitFunction>[1];

export interface UseRemixFormOptions<T extends FieldValues>
  extends UseFormProps<T> {
  submitHandlers?: {
    onValid?: SubmitHandler<T>;
    onInvalid?: SubmitErrorHandler<T>;
  };
  submitConfig?: SubmitFunctionOptions;
  submitData?: FieldValues;
  fetcher?: FetcherWithComponents<T>;
  shouldResetActionData?: boolean;
}

export const useRemixForm = <T extends FieldValues>({
  submitHandlers,
  submitConfig,
  submitData,
  fetcher,
  shouldResetActionData = false,
  ...formProps
}: UseRemixFormOptions<T>) => {
  const actionSubmit = useSubmit();
  const actionData = useActionData();
  const submit = fetcher?.submit ?? actionSubmit;
  const data = fetcher?.data ?? actionData;
  const methods = useForm<T>(formProps);
  const navigation = useNavigation();
  const shouldMergeErrors = useIsNewData(data, shouldResetActionData);

  // Either it's submitted to an action or submitted to a fetcher (or neither)
  const isSubmittingForm =
    navigation.state !== "idle" || (fetcher && fetcher.state !== "idle");

  // Submits the data to the server when form is valid
  const onSubmit = (data: T) => {
    submit(createFormData({ ...data, ...submitData }), {
      method: "post",
      ...submitConfig,
    });
  };
  const values = methods.getValues();
  const validKeys = safeKeys(values);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onInvalid = () => {};

  const formState = methods.formState;

  const {
    dirtyFields,
    isDirty,
    isSubmitSuccessful,
    isSubmitting,
    isValidating,
    touchedFields,
    submitCount,
    errors: frontendErrors,
    isLoading,
  } = formState;

  // remix-hook-forms should only process data errors that conform to react-hook-form error data types.
  const errors =
    shouldMergeErrors && data?.errors
      ? mergeErrors(frontendErrors, data?.errors, validKeys)
      : frontendErrors;

  const isValid = !(Object.keys(errors).length > 0);
  const isSubmitted =
    data && Object.keys(data).length > 0 && isValid ? true : false;

  return {
    ...methods,
    handleSubmit: methods.handleSubmit(
      submitHandlers?.onValid ?? onSubmit,
      submitHandlers?.onInvalid ?? onInvalid,
    ),
    register: (
      name: Path<T>,
      options?: RegisterOptions<T> & {
        disableProgressiveEnhancement?: boolean;
      },
    ) => ({
      ...methods.register(name, options),
      ...(!options?.disableProgressiveEnhancement && {
        defaultValue: data?.defaultValues?.[name] ?? "",
      }),
    }),
    formState: {
      dirtyFields,
      isDirty,
      isSubmitSuccessful,
      isSubmitted,
      isSubmitting: isSubmittingForm || isSubmitting,
      isValid,
      isValidating,
      touchedFields,
      submitCount,
      isLoading,
      errors,
    },
  };
};
interface RemixFormProviderProps<T extends FieldValues>
  extends Omit<UseFormReturn<T>, "handleSubmit"> {
  children: React.ReactNode;
  handleSubmit: any;
  register: any;
}
export const RemixFormProvider = <T extends FieldValues>({
  children,
  ...props
}: RemixFormProviderProps<T>) => {
  return <FormProvider {...props}>{children}</FormProvider>;
};

export const useRemixFormContext = <T extends FieldValues>() => {
  const methods = useFormContext<T>();
  return {
    ...methods,
    handleSubmit: methods.handleSubmit as any as ReturnType<
      UseFormHandleSubmit<T>
    >,
  };
};

/**
 * usePrevious takes in a data object and return the previous state of that data
 *
 * @export
 * @template T
 * @param {T} data
 * @returns {*}
 */
export function usePrevious<T extends { [key: string]: any }>(data: T) {
  const ref = React.useRef<T>();

  React.useEffect(() => {
    ref.current = data;
  }, [data]);

  return ref.current;
}

/**
 * useIsNewData will only return data if it is new data.
 * This useIsNewData hook is used to maintain react-hook-form default behavior and
 * prevents remix default behavior of returning useActionData on every rerender.
 * This can be overridden by passing shouldResetActionData: true to useRemixForm,
 * and it will restore remix default behavior.
 *
 * @export
 * @template DataType
 * @param {DataType} data
 * @param {boolean} [shouldResetActionData=false] if set to true will always return data.
 * @returns {(DataType | undefined)}
 */
export function useIsNewData<
  DataType extends { [key: string]: any } | undefined,
>(data: DataType, shouldResetActionData = false): DataType | undefined {
  const oldData = usePrevious(data || {});

  if (!data || Object.keys(data).length < 1) {
    return undefined;
  }

  if (shouldResetActionData) {
    return data;
  }

  if (data === oldData) {
    return undefined;
  }

  return data;
}

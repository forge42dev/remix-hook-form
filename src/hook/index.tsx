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
  DefaultValues,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormHandleSubmit,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { createFormData, mergeErrors } from "../utilities";

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
}

export const useRemixForm = <T extends FieldValues>({
  submitHandlers,
  submitConfig,
  submitData,
  fetcher,
  ...formProps
}: UseRemixFormOptions<T>) => {
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] =
    React.useState(false);
  const actionSubmit = useSubmit();
  const actionData = useActionData();
  const submit = fetcher?.submit ?? actionSubmit;
  const data: any = fetcher?.data ?? actionData;
  const methods = useForm<T>(formProps);
  const navigation = useNavigation();
  // Either it's submitted to an action or submitted to a fetcher (or neither)
  const isSubmittingForm =
    navigation.state !== "idle" || (fetcher && fetcher.state !== "idle");

  // Submits the data to the server when form is valid
  const onSubmit = (data: T) => {
    setIsSubmittedSuccessfully(true);
    const formData = createFormData({ ...data, ...submitData });
    submit(formData, {
      method: "post",
      ...submitConfig,
    });
  };
  const values = methods.getValues();
  const validKeys = Object.keys(values);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onInvalid = () => {};

  const formState = methods.formState;

  const {
    dirtyFields,
    isDirty,
    isSubmitSuccessful,
    isSubmitted,
    isSubmitting,
    isValid,
    isValidating,
    touchedFields,
    submitCount,
    errors,
    isLoading,
    disabled,
  } = formState;

  const formErrors = mergeErrors<T>(
    errors,
    data?.errors ? data.errors : data,
    validKeys,
  );

  return {
    ...methods,
    handleSubmit: methods.handleSubmit(
      submitHandlers?.onValid ?? onSubmit,
      submitHandlers?.onInvalid ?? onInvalid,
    ),
    reset: (values?: T | DefaultValues<T> | undefined) => {
      setIsSubmittedSuccessfully(false);
      methods.reset(values);
    },
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
      disabled,
      dirtyFields,
      isDirty,
      isSubmitSuccessful: isSubmittedSuccessfully || isSubmitSuccessful,
      isSubmitted,
      isSubmitting: isSubmittingForm || isSubmitting,
      isValid,
      isValidating,
      touchedFields,
      submitCount,
      isLoading,
      errors: formErrors,
    },
  };
};
interface RemixFormProviderProps<T extends FieldValues>
  extends Omit<UseFormReturn<T>, "handleSubmit" | "reset"> {
  children: React.ReactNode;
  handleSubmit: any;
  register: any;
  reset: any;
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

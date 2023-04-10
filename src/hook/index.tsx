import React from "react";
import { SubmitFunction, useActionData, useSubmit } from "@remix-run/react";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useFormContext,
} from "react-hook-form";
import { useForm, FormProvider } from "react-hook-form";
import type {
  FieldValues,
  UseFormHandleSubmit,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form/dist/types";
import { createFormData, mergeErrors } from "../utilities";

export type SubmitFunctionOptions = Parameters<SubmitFunction>[1];
interface UseRemixFormOptions<T extends FieldValues> extends UseFormProps<T> {
  submitHandlers?: {
    onValid?: SubmitHandler<T>;
    onInvalid?: SubmitErrorHandler<T>;
  };
  submitConfig?: SubmitFunctionOptions;
  submitData?: FieldValues;
}

export const useRemixForm = <T extends FieldValues>({
  submitHandlers,
  submitConfig,
  submitData,
  ...formProps
}: UseRemixFormOptions<T>) => {
  const submit = useSubmit();
  const data = useActionData();
  const methods = useForm<T>(formProps);

  // Submits the data to the server when form is valid
  const onSubmit = (data: T) => {
    submit(createFormData({ ...data, ...submitData }), {
      method: "post",
      ...submitConfig,
    });
  };

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
  } = formState;

  const formErrors = mergeErrors<T>(errors, data);

  return {
    ...methods,
    handleSubmit: methods.handleSubmit(
      submitHandlers?.onValid ?? onSubmit,
      submitHandlers?.onInvalid ?? onInvalid
    ),
    formState: {
      dirtyFields,
      isDirty,
      isSubmitSuccessful,
      isSubmitted,
      isSubmitting,
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
  extends Omit<UseFormReturn<T>, "handleSubmit"> {
  children: React.ReactNode;
  handleSubmit: any;
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

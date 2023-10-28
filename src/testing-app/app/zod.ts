import type { ZodRawShape } from "zod";
import { z } from "zod";

const errorMessages = {
  required_error: "validation.required",
  invalid_type_error: "validation.required",
};
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_union) {
    return { message: "validation.required" };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

export const stringRequired = () =>
  z.string(errorMessages).trim().nonempty("validation.required");

export const stringOptional = () => z.string(errorMessages).trim().nullish();

export const numberRequired = () => z.number(errorMessages);

export const numberOptional = () => z.number(errorMessages).nullish();

export const booleanRequired = () => z.boolean(errorMessages);

export const booleanOptional = () => z.boolean(errorMessages).optional();

export const passwordRequired = () =>
  stringRequired().min(8, "validation.min8");

const dateOrStringDate = stringRequired()
  .pipe(
    z.date({
      coerce: true,
      ...errorMessages,
    }),
  )
  .or(z.date(errorMessages));

export const dateOfBirthRequired = () =>
  stringRequired()
    .pipe(
      z
        .date({
          coerce: true,
          ...errorMessages,
        })
        .min(new Date("1.1.1900"), "validation.min_year")
        .max(new Date(), "validation.dob_future"),
    )
    .or(
      z
        .date(errorMessages)
        .min(new Date("1.1.1900"), "validation.min_year")
        .max(new Date(), "validation.dob_future"),
    );

export const dateRequired = () => dateOrStringDate;

export const dateOptional = () => dateOrStringDate.nullish();

export const generateObjectSchema = <T extends ZodRawShape>(obj: T) =>
  z.object(obj);

export const generateObjectArraySchema = (
  obj: Record<string, z.ZodSchema>,
  required?: boolean,
) =>
  required
    ? z.array(generateObjectSchema(obj)).min(1, "validation.required")
    : z.array(generateObjectSchema(obj));

export const confirmEmail = <T extends { email: string; confirmEmail: string }>(
  data: T,
) => data.email === data.confirmEmail;

export const confirmPassword = <
  T extends { password: string; confirmPassword: string },
>(
  data: T,
) => data.password === data.confirmPassword;

export const emailRequired = () => stringRequired().email("validation.email");

export const emailOptional = () => emailRequired().nullish().or(z.literal(""));

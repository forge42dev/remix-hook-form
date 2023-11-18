import { zodResolver } from "@hookform/resolvers/zod";
import {
  json,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useFetcher } from "@remix-run/react";
import {
  getValidatedFormData,
  useRemixForm,
  parseFormData,
  getFormDataFromSearchParams,
  validateFormData,
  RemixFormProvider,
} from "remix-hook-form";
import { z } from "zod";
import {
  generateObjectSchema,
  stringOptional,
  stringRequired,
  dateOfBirthRequired,
  emailOptional,
  booleanOptional,
  booleanRequired,
} from "~/zod";
const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const patientBaseSchema = generateObjectSchema({
  id: stringOptional(),
  firstName: stringRequired(),
  lastName: stringRequired(),
  primaryCareProvider: stringOptional(),
  dateOfBirth: dateOfBirthRequired(),
  email: emailOptional(),
  hasThirdPartyCoverage: booleanOptional(),
  isForeignCitizen: booleanOptional(),
  allergies: z.array(stringRequired()).optional(),
  healthCardNumber: stringOptional(),
  hasHealthCardNumber: booleanRequired(),
  city: stringRequired(),
  province: stringRequired(),
  street: stringRequired(),
  postalCode: stringRequired(),
  healthCardProvince: stringRequired(),
});
const FormDataZodSchema = z.object({
  email: z.string().trim().nonempty("validation.required"),
  password: z.string().trim().nonempty("validation.required"),
  number: z.number({ coerce: true }).int().positive(),
  redirectTo: z.string().optional(),
});

type FormData = z.infer<typeof patientBaseSchema>;

const resolver = zodResolver(patientBaseSchema);
export const loader = ({ request }: LoaderFunctionArgs) => {
  const data = getFormDataFromSearchParams(request);
  console.log("loader", data);
  return json({ result: "success" });
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { data, errors, receivedValues } = await getValidatedFormData(
    request,
    resolver,
  );
  console.log("action", data, errors, receivedValues);
  if (errors) {
    return json(errors, {
      status: 422,
    });
  }
  return json({ result: "success" });
};

export default function Index() {
  const fetcher = useFetcher();
  const methods = useRemixForm({
    resolver,
    fetcher,
    defaultValues: {
      firstName: "a",
      lastName: "t",
      primaryCareProvider: "",
      dateOfBirth: new Date("1997-09-05T00:00:00.000Z"),

      email: "",

      hasThirdPartyCoverage: false,
      isForeignCitizen: false,
      allergies: [],
      city: "Sarajevo",
      street: "Radenka Abazovića",
      province: "ON",
      postalCode: "a5t 5a5",
      hasHealthCardNumber: true,
      healthCardNumber: "5555555555",
      healthCardProvince: "ON",
    },
    submitConfig: {
      method: "POST",
    },
  });
  const { register, handleSubmit, formState, watch, reset } = methods;
  console.log(formState);

  return (
    <RemixFormProvider {...methods}>
      <p>Add a thing...</p>

      <Form method="post" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <input type="text" {...register("email")} />
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </RemixFormProvider>
  );
}

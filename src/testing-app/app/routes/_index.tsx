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
const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const FormDataZodSchema = z.object({
  email: z.string().trim().nonempty("validation.required"),
  password: z.string().trim().nonempty("validation.required"),
  number: z.number({ coerce: true }).int().positive(),
  redirectTo: z.string().optional(),
});

type FormData = z.infer<typeof FormDataZodSchema>;

const resolver = zodResolver(FormDataZodSchema);

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

export const loader = ({ request }: LoaderFunctionArgs) => {
  const data = getFormDataFromSearchParams(request);
  console.log("loader", data);
  return json({ result: "success" });
};

export default function Index() {
  const methods = useRemixForm<FormData>({
    resolver,
    defaultValues: {
      email: "t.zlak97@gmail.com",
      password: "12345678",
      redirectTo: undefined,
      number: 1,
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
          <input type="text" {...register("password")} />
          <input type="number" {...register("number")} />
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

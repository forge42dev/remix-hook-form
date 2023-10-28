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
  action: z.string(),
  outline: z.string().min(2, {
    message: "Outline must be at least 2 characters.",
  }),
});

type FormData = z.infer<typeof FormDataZodSchema>;

const resolver = zodResolver(FormDataZodSchema);

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  if (formData.get("action") === "accept") {
    console.log("formData", Object.fromEntries(formData));

    const { data, errors } = await validateFormData<FormData>(
      formData,
      resolver,
    );

    console.log("errors", errors);

    if (errors) {
      return json(errors);
    }

    console.log(data);
    return null;
  }
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
      action: "accept",
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
          <input type="text" {...register("action")} />
          <input type="text" {...register("outline")} />
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

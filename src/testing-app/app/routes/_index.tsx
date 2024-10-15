import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type UploadHandler,
  json,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import {
  RemixFormProvider,
  getFormDataFromSearchParams,
  getValidatedFormData,
  parseFormData,
  useRemixForm,
  validateFormData,
} from "remix-hook-form";
import { z } from "zod";

export const fileUploadHandler =
  (): UploadHandler =>
  async ({ data, filename }) => {
    const chunks = [];
    console.log("udje?", filename);
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    // If there's no filename, it's a text field and we can return the value directly
    if (!filename) {
      const textDecoder = new TextDecoder();
      return textDecoder.decode(buffer);
    }

    return new File([buffer], filename, { type: "image/jpeg" });
  };

const FormDataZodSchema = z.object({
  email: z.string().trim().nonempty("validation.required"),
  password: z.string().trim().nonempty("validation.required"),
  number: z.number({ coerce: true }).int().positive(),
  redirectTo: z.string().optional(),
  boolean: z.boolean().optional(),
  date: z.date().or(z.string()),
  null: z.null(),
});

type SchemaFormData = z.infer<typeof FormDataZodSchema>;

const resolver = zodResolver(FormDataZodSchema);
export const loader = ({ request }: LoaderFunctionArgs) => {
  const data = getFormDataFromSearchParams(request);
  return json({ result: "success" });
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { errors, data } = await getValidatedFormData(request, resolver);
  console.log(data, errors);
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
      redirectTo: undefined,
      number: 4,
      email: "test@test.com",
      password: "test",
      date: new Date(),
      boolean: true,
      null: null,
    },
    submitData: {
      test: "test",
    },
  });
  const { register, handleSubmit, formState, watch, setError } = methods;

  const checkbox = watch("boolean");
  console.log(checkbox, typeof checkbox);
  return (
    <RemixFormProvider {...methods}>
      <p>Add a thing...</p>
      <Form method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
        <label>
          Boolean
          <input type="checkbox" {...register("boolean")} />
        </label>
        <label>
          number
          <input type="number" {...register("number")} />
        </label>
        <div></div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </RemixFormProvider>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import {
  json,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
  LoaderFunctionArgs,
  type UploadHandler,
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

export const patientBaseSchema = generateObjectSchema({
  file: z.any().optional(),
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
  return json({ result: "success" });
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await unstable_parseMultipartFormData(
    request,
    fileUploadHandler(),
  );
  console.log(formData.get("file"));
  const { errors, data } = await validateFormData(formData, resolver);
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
      file: undefined,
    },
    submitData: {
      test: "test",
    },
    submitConfig: {
      method: "POST",
      encType: "multipart/form-data",
    },
  });
  const { register, handleSubmit, formState, watch, reset } = methods;

  return (
    <RemixFormProvider {...methods}>
      <p>Add a thing...</p>

      <Form method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
        <input type="file" {...register("file")} />
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </RemixFormProvider>
  );
}

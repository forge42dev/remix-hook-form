import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useFetcher } from "react-router";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  data,
} from "react-router";
import {
  RemixFormProvider,
  getFormDataFromSearchParams,
  getValidatedFormData,
  useRemixForm,
} from "remix-hook-form";
import { z } from "zod";

const FormDataZodSchema = z.object({
  email: z.string().trim().nonempty("validation.required"),
  password: z.string().trim().nonempty("validation.required"),
  number: z.number({ coerce: true }).int().positive(),
  redirectTo: z.string().optional(),
  boolean: z.boolean().optional(),
  date: z.date().or(z.string()),
  null: z.null(),
});

const resolver = zodResolver(FormDataZodSchema);
export const loader = ({ request }: LoaderFunctionArgs) => {
  const data = getFormDataFromSearchParams(request);
  return { result: "success" };
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const { errors, data: formData } = await getValidatedFormData(
    request,
    resolver,
  );

  if (errors) {
    return data(errors, {
      status: 422,
    });
  }
  console.log(formData);
  return { result: "success" };
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
  return (
    <RemixFormProvider {...methods}>
      <p>Add a thing...</p>
      <Form
        method="post"
        action="/?index"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
      >
        <label>
          Boolean
          <input type="checkbox" {...register("boolean")} />
        </label>
        <label>
          number
          <input type="number" {...register("number")} />
        </label>

        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </RemixFormProvider>
  );
}

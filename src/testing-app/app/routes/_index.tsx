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
} from "remix-hook-form";
import { z } from "zod";
const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const schema = z.object({
  array: z.array(z.string()).nonempty(),
  user: z.object({
    name: z.string().nonempty(),
    email: z.string().email(),
  }),
  boolean: z.boolean(),
  number: z.number().min(5),

  // file: z
  //    .any()
  //   .refine((files) => files?.length == 1, "Image is required.")
  //   .refine(
  //     (files) => files?.[0]?.size <= MAX_FILE_SIZE,
  //      `Max file size is 5MB.`,
  //   )
  //   .refine(
  //     (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
  //     ".jpg, .jpeg, .png and .webp files are accepted.",
  //   )
  //   .nullish(),
});

type FormData = z.infer<typeof schema>;

const resolver = zodResolver(schema);

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await getValidatedFormData<FormData>(request, resolver);
  console.log("action", data);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return null;
  // Make DB call or similar here.
  //return json({ errors: { content: { message: "error" } } });
  return {
    result: "success",
    transformed: `This was your content: ${JSON.stringify(data)}`,
  };
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const data = getFormDataFromSearchParams(request);
  console.log("loader", data);
  return json({ result: "success" });
};

export default function Index() {
  const { register, handleSubmit, formState, watch, reset } =
    useRemixForm<FormData>({
      resolver,
      defaultValues: {
        array: ["a", "b"],
        boolean: true,
        number: 6,
        user: {
          name: "John Doe",
          email: "test@test.com",
        },
      },
      submitConfig: {
        method: "POST",
      },
    });

  return (
    <div>
      <p>Add a thing...</p>

      <Form method="post" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <input type="number" {...register("number")} />
          <input type="boolean" {...register("boolean")} />

          <input type="string" {...register("user.name")} />
          <input type="string" {...register("user.email")} />
          <input type="string" {...register("array.0")} />
          <input type="string" {...register("array.1")} />
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}

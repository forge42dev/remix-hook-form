import { zodResolver } from "@hookform/resolvers/zod";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { getValidatedFormData, useRemixForm } from "remix-hook-form";
import { z } from "zod";

const schema = z.object({
  content: z.string().nonempty("content is required"),
});

type FormData = z.infer<typeof schema>;

const resolver = zodResolver(schema);

export const action = async ({ request }: ActionFunctionArgs) => {
  const { data } = await getValidatedFormData<FormData>(request, resolver);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return null;
  // Make DB call or similar here.
  //return json({ errors: { content: { message: "error" } } });
  return {
    result: "success",
    transformed: `This was your content: ${JSON.stringify(data)}`,
  };
};

export const loader = () => {
  return json({ result: "success" });
};

export default function Index() {
  const fetcher = useFetcher();
  const { register, handleSubmit, formState } = useRemixForm<FormData>({
    resolver,
    fetcher,
    submitConfig: {
      method: "GET",
    },
  });

  return (
    <div>
      <p>Add a thing...</p>
      <p>Current Errors: {JSON.stringify(formState.errors)}</p>
      <fetcher.Form method="post" onSubmit={handleSubmit}>
        <div>
          <label>
            Content:{" "}
            <input
              type="text"
              {...register("content", { disableProgressiveEnhancement: true })}
            />
            Error: {formState.errors.content?.message}
          </label>
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
}

# remix-hook-form

remix-hook-form is a lightweight wrapper around [remix-hook-form](https://react-hook-form.com/) that makes it easier to use in your [Remix](https://remix.run) applications. It provides a set of hooks and utilities that simplify the process of working with forms and form data, while leveraging the power and flexibility of remix-hook-form.

## Installation

You can install the latest version of remix-hook-form using [npm](https://www.npmjs.com/):

`npm install remix-hook-form`

Or, if you prefer [yarn](https://yarnpkg.com/):

`yarn add remix-hook-form`

## Usage

Here is an example usage of remix-hook-form:

```jsx
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { Form } from "@remix-run/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { ActionArgs, json } from "@remix-run/server-runtime";

const schema = zod.object({
  name: zod.string().nonempty(),
  email: zod.string().email().nonempty(),
});

type FormData = zod.infer<typeof schema>;

const resolver = zodResolver(schema);

export const action = ({ request }: ActionArgs) => {
  const { errors, data } =
    getValidatedFormData < FormData > (request, resolver);
  if (errors) {
    return json(errors);
  }
  // Do something with the data
  return json(data);
};

export default function MyForm() {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useRemixForm({
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
    },
    resolver,
  });

  return (
    <Form onSubmit={handleSubmit}>
      <label>
        Name:
        <input type="text" {...register("name")} />
        {errors.name && <p>{errors.name.message}</p>}
      </label>
      <label>
        Email:
        <input type="email" {...register("email")} />
        {errors.email && <p>{errors.email.message}</p>}
      </label>
      <button type="submit">Submit</button>
    </Form>
  );
}
```

## Utilities

### getValidatedFormData

getValidatedFormData is a utility function that can be used to validate form data in your action. It takes two arguments: the request object and the resolver function. It returns an object with two properties: `errors` and `data`. If there are no errors, `errors` will be `undefined`. If there are errors, `errors` will be an object with the same shape as the `errors` object returned by `useRemixForm`. If there are no errors, `data` will be an object with the same shape as the `data` object returned by `useRemixForm`.

### validateFormData

validateFormData is a utility function that can be used to validate form data in your action. It takes two arguments: the request object and the resolver function. It returns an object with two properties: `errors` and `data`. If there are no errors, `errors` will be `undefined`. If there are errors, `errors` will be an object with the same shape as the `errors` object returned by `useRemixForm`. If there are no errors, `data` will be an object with the same shape as the `data` object returned by `useRemixForm`.

The difference between `validateFormData` and `getValidatedFormData` is that `validateFormData` only validates the data while the `getValidatedFormData` function also extracts the data automatically from the request object assuming you were using the default setup

### createFormData

createFormData is a utility function that can be used to create a FormData object from the data returned by the handleSubmit function from `react-hook-form`. It takes two arguments, first one is the `data` from the `handleSubmit` function and the second one is the key that the data will be stored in the FormData object. (default is `formData`). It returns a FormData object.

### parseFormData

parseFormData is a utility function that can be used to parse the data submitted to the action by the handleSubmit function from `react-hook-form`. It takes two arguments, first one is the `request` submitted from the frontend and the second one is the key that the data will be stored in the FormData object. (default is `formData`). It returns an object that contains unvalidated `data` submitted from the frontend.

## Hooks

### useRemixForm

useRemixForm is a hook that can be used to create a form in your Remix application. It takes all the same properties as `react-hook-form`'s `useForm` hook, with the addition of 3 properties:
`submitHandlers` - an object containing two properties, `onValid` which can be passed into the function to override the default behavior of the handleSubmit success case provided by the hook, and `onInvalid` which can be passed into the function to override the default behavior of the handleSubmit error case provided by the hook.
`submitConfig` - allows you to pass additional configuration to the `useSubmit` function from remix such as `{ replace: true }` to replace the current history entry instead of pushing a new one.,
`submitData` - allows you to pass additional data to the backend when the form is submitted

The hook acts almost identically to the `react-hook-form` hook, with the exception of the `handleSubmit` function, and the `formState.errors`.

The `handleSubmit` function uses two thing under the hood to allow you easier usage in Remix, those two things are:

- The success case is provided by default where when the form is validated by the provided resolver, and it has no errors, it will automatically submit the form to the current route using a POST request. The data will be sent as `formData` to the action function.
- The data that is sent is automatically wrapped into a formData object and passed to the server ready to be used. Easiest way to consume it is by using the `parseFormData` or `getValidatedFormData` function from the `remix-hook-form` package.

The `formState.errors` object is automatically populated with the errors returned by the server. If the server returns an object with the same shape as the `errors` object returned by `useRemixForm`, it will automatically populate the `formState.errors` object with the errors returned by the server.
This is achieved by using `useActionData` from `@remix-run/react` to get the data returned by the action function. If the data returned by the action function is an object with the same shape as the `errors` object returned by `useRemixForm`, it will automatically populate the `formState.errors` object with the errors returned by the server. To assure this is done properly it is recommended that you use `getValidatedFormData` and then return the errors object from the action function as `json(errors)`.

### useRemixFormContext

Exactly the same as `useFormContext` from `react-hook-form` but it also returns the changed `formState.errors` and `handleSubmit` object.

## RemixFormProvider

Identical to the `FormProvider` from `react-hook-form`, but it also returns the changed `formState.errors` and `handleSubmit` object.

## License

MIT

## Bugs

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/Code-Forge-Net/remix-hook-form/issues)

## Contributing

We welcome contributions from the community!

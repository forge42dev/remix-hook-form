# remix-hook-form

![GitHub Repo stars](https://img.shields.io/github/stars/Code-Forge-Net/remix-hook-form?style=social)
![npm](https://img.shields.io/npm/v/remix-hook-form?style=plastic)
![GitHub](https://img.shields.io/github/license/Code-Forge-Net/remix-hook-form?style=plastic)
![npm](https://img.shields.io/npm/dy/remix-hook-form?style=plastic) 
![GitHub top language](https://img.shields.io/github/languages/top/Code-Forge-Net/remix-hook-form?style=plastic) 

Remix-hook-form is a powerful and lightweight wrapper around [react-hook-form](https://react-hook-form.com/) that streamlines the process of working with forms and form data in your [Remix](https://remix.run) applications. With a comprehensive set of hooks and utilities, you'll be able to easily leverage the flexibility of react-hook-form without the headache of boilerplate code.

And the best part? Remix-hook-form has zero dependencies, making it easy to integrate into your existing projects and workflows. Say goodbye to bloated dependencies and hello to a cleaner, more efficient development process with Remix-hook-form. 

Oh, and did we mention that this is fully Progressively enhanced? That's right, you can use this with or without javascript!

## Installation

You can install the latest version of remix-hook-form using [npm](https://www.npmjs.com/):

`npm install remix-hook-form`

Or, if you prefer [yarn](https://yarnpkg.com/):

`yarn add remix-hook-form`

## Basic usage

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

export const action = async ({ request }: ActionArgs) => {
  const { errors, data } =
    await getValidatedFormData<FormData>(request, resolver);
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

## Usage with NO js

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

export const action = async ({ request }: ActionArgs) => {
  const { errors, data, receivedValues: defaultValues } =
    await getValidatedFormData<FormData>(request, resolver);
  if (errors) {
    return json({ errors, defaultValues });
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

### Fetcher usage

You can pass in a fetcher as an optional prop and the useRemixForm will use that fetcher to submit the data and read the errors instead of the default behavior

## Utilities

## getValidatedFormData

Now supports no-js form submissions!

If you made a GET request instead of a POST request and you are using this inside of a loader it will try to extract the data from the search params

If the form is submitted without js it will try to parse the formData object and covert it to the same format as the data object returned by `useRemixForm`. If the form is submitted with js it will automatically extract the data from the request object and validate it.

getValidatedFormData is a utility function that can be used to validate form data in your action. It takes two arguments: the request object and the resolver function. It returns an object with three properties: `errors`, `receivedValues` and `data`. If there are no errors, `errors` will be `undefined`. If there are errors, `errors` will be an object with the same shape as the `errors` object returned by `useRemixForm`. If there are no errors, `data` will be an object with the same shape as the `data` object returned by `useRemixForm`.

The `receivedValues` property allows you to set the default values of your form to the values that were received from the request object. This is useful if you want to display the form again with the values that were submitted by the user when there is no JS present
 
 ### Example with errors only
```jsx
/** all the same code from above */

export const action = async ({ request }: ActionArgs) => {
  // Takes the request from the frontend, parses and validates it and returns the data
  const { errors, data } =
    await getValidatedFormData<FormData>(request, resolver);
  if (errors) {
    return json(errors);
  }
  // Do something with the data
};
```

### Example with errors and receivedValues
```jsx
/** all the same code from above */

export const action = async ({ request }: ActionArgs) => {
  // Takes the request from the frontend, parses and validates it and returns the data
  const { errors, data, receivedValues } =
    await getValidatedFormData<FormData>(request, resolver);
  if (errors) {
    return json({ errors, receivedValues });
  }
  // Do something with the data
};

```

## validateFormData

validateFormData is a utility function that can be used to validate form data in your action. It takes two arguments: the request object and the resolver function. It returns an object with two properties: `errors` and `data`. If there are no errors, `errors` will be `undefined`. If there are errors, `errors` will be an object with the same shape as the `errors` object returned by `useRemixForm`. If there are no errors, `data` will be an object with the same shape as the `data` object returned by `useRemixForm`.

The difference between `validateFormData` and `getValidatedFormData` is that `validateFormData` only validates the data while the `getValidatedFormData` function also extracts the data automatically from the request object assuming you were using the default setup.

```jsx
/** all the same code from above */

export const action = async ({ request }: ActionArgs) => {
  // Lets assume you get the data in a different way here but still want to validate it
  const formData = await yourWayOfGettingFormData(request);
  // Takes the request from the frontend, parses and validates it and returns the data
  const { errors, data } =
    await validateFormData<FormData>(formData, resolver);
  if (errors) {
    return json(errors);
  }
  // Do something with the data
};

```

## createFormData

createFormData is a utility function that can be used to create a FormData object from the data returned by the handleSubmit function from `react-hook-form`. It takes two arguments, first one is the `data` from the `handleSubmit` function and the second one is the key that the data will be stored in the FormData object. (default is `formData`). It returns a FormData object.

```jsx
/** all the same code from above */

export default function MyForm() {
  const { ... } = useRemixForm({
    ...,
    submitHandlers: {
      onValid: data => {
        // This will create a FormData instance ready to be sent to the server, by default all your data is stored inside a key called `formData` but this behavior can be changed by passing a second argument to the function
        const formData = createFormData(data);
        // Example with a custom key
        const formDataCustom = createFormData(data, "yourkeyhere");
        // Do something with the formData
      }
    }
  });

  return (
   ...
  );
}

```

## parseFormData

parseFormData is a utility function that can be used to parse the data submitted to the action by the handleSubmit function from `react-hook-form`. It takes two arguments, first one is the `request` submitted from the frontend and the second one is the key that the data will be stored in the FormData object. (default is `formData`). It returns an object that contains unvalidated `data` submitted from the frontend.


```jsx
/** all the same code from above */

export const action = async ({ request }: ActionArgs) => {
  // Allows you to get the data from the request object without having to validate it
  const formData = await parseFormData(request);
  // If you used a custom key (eg. `yourkeyhere` from above you can extract like this)
  const formDataCustom = await parseFormData(request, "yourkeyhere");
  // Do something with the data
};

```

## getFormDataFromSearchParams

If you're using a GET request formData is not available on the request so you can use this method to extract your formData from the search parameters assuming you set all your data in the search parameters

<hr />

## Hooks

## useRemixForm

`useRemixForm` is a hook that can be used to create a form in your Remix application. It takes all the same properties as `react-hook-form`'s `useForm` hook, with the addition of 3 properties:

- `submitHandlers`: an object containing two properties:
  - `onValid`: can be passed into the function to override the default behavior of the `handleSubmit` success case provided by the hook.
  - `onInvalid`: can be passed into the function to override the default behavior of the `handleSubmit` error case provided by the hook.
- `submitConfig`: allows you to pass additional configuration to the `useSubmit` function from Remix, such as `{ replace: true }` to replace the current history entry instead of pushing a new one.
- `submitData`: allows you to pass additional data to the backend when the form is submitted.


The hook acts almost identically to the `react-hook-form` hook, with the exception of the `handleSubmit` function, and the `formState.errors`.

The `handleSubmit` function uses two thing under the hood to allow you easier usage in Remix, those two things are:

- The success case is provided by default where when the form is validated by the provided resolver, and it has no errors, it will automatically submit the form to the current route using a POST request. The data will be sent as `formData` to the action function.
- The data that is sent is automatically wrapped into a formData object and passed to the server ready to be used. Easiest way to consume it is by using the `parseFormData` or `getValidatedFormData` function from the `remix-hook-form` package.


The `formState.errors` object is automatically populated with the errors returned by the server. If the server returns an object with the same shape as the `errors` object returned by `useRemixForm`, it will automatically populate the `formState.errors` object with the errors returned by the server.

The `register` function returned also has super powers that allows it to set the default value of the input returned from the server.

This is achieved by using `useActionData` from `@remix-run/react` to get the data returned by the action function. If the data returned by the action function is an object with the same shape as the `errors` object returned by `useRemixForm`, it will automatically populate the `formState.errors` object with the errors returned by the server. To ensure this is done properly, it is recommended that you use `getValidatedFormData` and then return the errors object from the action function as `json(errors)`.

### Examples

#### Overriding the default onValid and onInvalid cases

```jsx
  const { ... } = useRemixForm({
    ...ALL_THE_SAME_CONFIG_AS_REACT_HOOK_FORM,
    submitHandlers: {
      onValid: data => { 
        // Do something with the formData
      },
      onInvalid: errors => {
        // Do something with the errors
      }
    }
  });

```

#### Overriding the submit from remix to do something else

```jsx
  const { ... } = useRemixForm({
    ...ALL_THE_SAME_CONFIG_AS_REACT_HOOK_FORM,
    submitConfig: {
      replace: true,
      method: "PUT",
      action: "/api/youraction",
    },
  });

```

#### Passing additional data to the backend

```jsx
  const { ... } = useRemixForm({
    ...ALL_THE_SAME_CONFIG_AS_REACT_HOOK_FORM,
    submitData: {
      someFieldsOutsideTheForm: "someValue"
    },
  });

```

## RemixFormProvider

Identical to the [`FormProvider`](https://react-hook-form.com/api/formprovider/) from `react-hook-form`, but it also returns the changed `formState.errors` and `handleSubmit` object.
```jsx
export default function Form() {
  const methods = useRemixForm();
 
  return (
    <RemixFormProvider {...methods} > // pass all methods into the context
      <form onSubmit={methods.handleSubmit}>
        <button type="submit" />
      </form>
    </RemixFormProvider>
  );
}

```

## useRemixFormContext

Exactly the same as [`useFormContext`](https://react-hook-form.com/api/useformcontext/) from `react-hook-form` but it also returns the changed `formState.errors` and `handleSubmit` object.

```jsx
export default function Form() {
  const methods = useRemixForm();
 

  return (
    <RemixFormProvider {...methods} > // pass all methods into the context
      <form onSubmit={methods.handleSubmit}>
        <NestedInput />
        <button type="submit" />
      </form>
    </RemixFormProvider>
  );
}

const NestedInput = () => {
  const { register } = useRemixFormContext(); // retrieve all hook methods
  return <input {...register("test")} />;
}

```


## Support 

If you like the project, please consider supporting us by giving a ⭐️ on Github.
## License

MIT

## Bugs

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/Code-Forge-Net/remix-hook-form/issues)


## Contributing

Thank you for considering contributing to Remix-hook-form! We welcome any contributions, big or small, including bug reports, feature requests, documentation improvements, or code changes.

To get started, please fork this repository and make your changes in a new branch. Once you're ready to submit your changes, please open a pull request with a clear description of your changes and any related issues or pull requests.

Please note that all contributions are subject to our [Code of Conduct](https://github.com/Code-Forge-Net/remix-hook-form/blob/main/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

We appreciate your time and effort in contributing to Remix-hook-form and helping to make it a better tool for the community!


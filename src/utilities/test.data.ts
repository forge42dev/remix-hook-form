import { array, boolean, number, object, string, any } from "zod";

export const mockBlob = new File(["Hello, world!"], "blob", {
  type: "text/plain",
});

const dataMockBlobSchema = any()
  .refine(
    (file: File) => file?.name === mockBlob.name,
    `File name must be blob`,
  )
  .refine(
    (file: File) => "text/plain".includes(file?.type),
    "Only .txt file formats are supported.",
  );

export const dataFormValues = {
  profile: {
    fullName: "Capitan Jack Sparrow",
    age: 58,
    isPirate: true,
    facts: ["loves rum", "has magic campus"],
    image: mockBlob,
  },
  vehicle: [
    {
      type: "ship",
      name: "Black Pearl",
      Owners: [
        { name: "Morgan", image: mockBlob },
        { name: "Cutler Beckett", image: mockBlob },
      ],
    },
    {
      type: "ship",
      name: "Flying Dutchman",
      Owners: [
        { name: "Calypso", image: mockBlob },
        { name: "Davy Jones", image: mockBlob },
      ],
    },
  ],
};

export type DataFormValues = typeof dataFormValues;

export const dataFormValuesSchema = object({
  profile: object({
    fullName: string(),
    age: number(),
    isPirate: boolean(),
    facts: array(string()),
    image: dataMockBlobSchema,
  }),
  vehicle: array(
    object({
      type: string(),
      name: string(),
      Owners: array(
        object({
          name: string(),
          image: dataMockBlobSchema,
        }),
      ),
    }),
  ),
});

export const dataFormValuesJsFormDataObjectEntries = {
  hasJS: "true",
  "profile.age": "58",
  "profile.facts.[0]": '"loves rum"',
  "profile.facts.[1]": '"has magic campus"',
  "profile.fullName": '"Capitan Jack Sparrow"',
  "profile.image": mockBlob,
  "profile.isPirate": "true",
  "vehicle.[0].Owners.[0].image": mockBlob,
  "vehicle.[0].Owners.[0].name": '"Morgan"',
  "vehicle.[0].Owners.[1].image": mockBlob,
  "vehicle.[0].Owners.[1].name": '"Cutler Beckett"',
  "vehicle.[0].name": '"Black Pearl"',
  "vehicle.[0].type": '"ship"',
  "vehicle.[1].Owners.[0].image": mockBlob,
  "vehicle.[1].Owners.[0].name": '"Calypso"',
  "vehicle.[1].Owners.[1].image": mockBlob,
  "vehicle.[1].Owners.[1].name": '"Davy Jones"',
  "vehicle.[1].name": '"Flying Dutchman"',
  "vehicle.[1].type": '"ship"',
};

export const dataFormValuesHasJsPathValueList = [
  {
    path: "profile.fullName",
    value: '"Capitan Jack Sparrow"',
  },
  {
    path: "profile.age",
    value: "58",
  },
  {
    path: "profile.isPirate",
    value: "true",
  },
  {
    path: "profile.facts.[0]",
    value: '"loves rum"',
  },
  {
    path: "profile.facts.[1]",
    value: '"has magic campus"',
  },
  {
    path: "profile.image",
    value: mockBlob,
  },
  {
    path: "vehicle.[0].type",
    value: '"ship"',
  },
  {
    path: "vehicle.[0].name",
    value: '"Black Pearl"',
  },
  {
    path: "vehicle.[0].Owners.[0].name",
    value: '"Morgan"',
  },
  {
    path: "vehicle.[0].Owners.[0].image",
    value: mockBlob,
  },
  {
    path: "vehicle.[0].Owners.[1].name",
    value: '"Cutler Beckett"',
  },
  {
    path: "vehicle.[0].Owners.[1].image",
    value: mockBlob,
  },
  {
    path: "vehicle.[1].type",
    value: '"ship"',
  },
  {
    path: "vehicle.[1].name",
    value: '"Flying Dutchman"',
  },
  {
    path: "vehicle.[1].Owners.[0].name",
    value: '"Calypso"',
  },
  {
    path: "vehicle.[1].Owners.[0].image",
    value: mockBlob,
  },
  {
    path: "vehicle.[1].Owners.[1].name",
    value: '"Davy Jones"',
  },
  {
    path: "vehicle.[1].Owners.[1].image",
    value: mockBlob,
  },
];

export const dataFormValuesHasJsPathValueExpected = {
  profile: {
    age: "58",
    facts: ['"loves rum"', '"has magic campus"'],
    fullName: '"Capitan Jack Sparrow"',
    image: mockBlob,
    isPirate: "true",
  },
  vehicle: [
    {
      Owners: [
        {
          image: mockBlob,
          name: '"Morgan"',
        },
        {
          image: mockBlob,
          name: '"Cutler Beckett"',
        },
      ],
      name: '"Black Pearl"',
      type: '"ship"',
    },
    {
      Owners: [
        {
          image: mockBlob,
          name: '"Calypso"',
        },
        {
          image: mockBlob,
          name: '"Davy Jones"',
        },
      ],
      name: '"Flying Dutchman"',
      type: '"ship"',
    },
  ],
};

export const dataFormValuesNonJsPathValueList = [
  {
    path: "profile.fullName",
    value: "Capitan Jack Sparrow",
  },
  {
    path: "profile.age",
    value: "58",
  },
  {
    path: "profile.isPirate",
    value: "true",
  },
  {
    path: "profile.facts.[0]",
    value: "loves rum",
  },
  {
    path: "profile.facts.[1]",
    value: "has magic campus",
  },
  {
    path: "profile.image",
    value: mockBlob,
  },
  {
    path: "vehicle.[0].type",
    value: "ship",
  },
  {
    path: "vehicle.[0].name",
    value: "Black Pearl",
  },
  {
    path: "vehicle.[0].Owners.[0].name",
    value: "Morgan",
  },
  {
    path: "vehicle.[0].Owners.[0].image",
    value: mockBlob,
  },
  {
    path: "vehicle.[0].Owners.[1].name",
    value: "Cutler Beckett",
  },
  {
    path: "vehicle.[0].Owners.[1].image",
    value: mockBlob,
  },
  {
    path: "vehicle.[1].type",
    value: "ship",
  },
  {
    path: "vehicle.[1].name",
    value: "Flying Dutchman",
  },
  {
    path: "vehicle.[1].Owners.[0].name",
    value: "Calypso",
  },
  {
    path: "vehicle.[1].Owners.[0].image",
    value: mockBlob,
  },
  {
    path: "vehicle.[1].Owners.[1].name",
    value: "Davy Jones",
  },
  {
    path: "vehicle.[1].Owners.[1].image",
    value: mockBlob,
  },
];

export const dataArrayUrl =
  "http://localhost:3000/?user.name=john&car[]=Ford&car[]=Chevy&car[]=Porsche&colors[0]=red&colors[1]=green&colors[2]=blue";

export const dataArrayUrlSearchParameter = new URLSearchParams([
  ["user.name", "john"],
  ["car[0]", "Ford"],
  ["car[1]", "Chevy"],
  ["car[2]", "Porsche"],
  ["colors[0]", "red"],
  ["colors[1]", "green"],
  ["colors[2]", "blue"],
]);

export const dataArrayUrlSchema = object({
  user: object({
    name: string(),
  }),
  car: array(string()),
  colors: array(string()),
});

export const dataArrayUrlExpect = {
  user: { name: "john" },
  car: ["Ford", "Chevy", "Porsche"],
  colors: ["red", "green", "blue"],
};

export const dataArrayUrlSearchParameterExpected = {
  data: dataArrayUrlExpect,
  errors: undefined,
  receivedValues: dataArrayUrlExpect,
};

// Server Parser has no way of know if the data received should be a string, number, or boolean.
// With that in mind it is better to leave it as it was sent, since the user knows that the
// input should be a string per html standards
export const dataFieldValuesNonJsFinal = {
  ...dataFormValues,
  profile: { ...dataFormValues.profile, age: "58", isPirate: "true" },
};

// JS submitted formData has the benefit of knowing the original data type, and can stringify it on both sides.
// This means that the user will get back exactly what they sent.
export const dataFieldValuesHasJsFinal = dataFormValues;

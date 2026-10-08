import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { ProductFormInput, ProductFormValues } from "@repo/contracts";

// The form is registered against the raw string input and resolves to the parsed output, so
// `Control` carries all three generics. Naming them once keeps every sub-component's props in
// step with `useForm` — a two-generic `Control` here is a type error, not a shorthand.
export type ProductFormControl = Control<ProductFormInput, unknown, ProductFormValues>;
export type ProductFormRegister = UseFormRegister<ProductFormInput>;
export type ProductFormErrors = FieldErrors<ProductFormInput>;

import { Heading } from "@/components/shared";
import { CustomerForm } from "@/components/business-forms";
import { Feedback } from "@/components/forms";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <>
      <Heading
        title="New customer"
        description="Start a relationship worth keeping."
      />
      <Feedback params={await searchParams} />
      <CustomerForm />
    </>
  );
}

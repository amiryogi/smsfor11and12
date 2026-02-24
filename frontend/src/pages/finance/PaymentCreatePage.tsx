import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreatePayment } from "../../hooks/useFinance";
import { FormField } from "../../components/ui/FormField";
import { PageHeader } from "../../components/layout/PageHeader";

const schema = z.object({
  studentId: z.string().min(1, "Student is required"),
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.coerce.number().positive("Amount must be positive").min(1),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "ONLINE", "CHEQUE"]),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PaymentCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      studentId: searchParams.get("studentId") ?? "",
      invoiceId: searchParams.get("invoiceId") ?? "",
      paymentMethod: "CASH",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createPayment.mutateAsync({
      ...data,
      idempotencyKey: crypto.randomUUID(),
    });
    navigate("/finance/payments");
  };

  return (
    <div>
      <PageHeader title="Record Payment" />
      <form
        onSubmit={handleSubmit(onSubmit as never)}
        className="max-w-2xl space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Student ID"
            error={errors.studentId?.message}
            required
          >
            <input
              {...register("studentId")}
              className="input"
              placeholder="Student UUID"
            />
          </FormField>
          <FormField
            label="Invoice ID"
            error={errors.invoiceId?.message}
            required
          >
            <input
              {...register("invoiceId")}
              className="input"
              placeholder="Invoice UUID"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Amount (NPR)"
            error={errors.amount?.message}
            required
          >
            <input
              type="number"
              step="0.01"
              {...register("amount")}
              className="input"
            />
          </FormField>
          <FormField
            label="Payment Method"
            error={errors.paymentMethod?.message}
            required
          >
            <select {...register("paymentMethod")} className="input">
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </FormField>
        </div>
        <FormField label="Reference No." error={errors.referenceNo?.message}>
          <input
            {...register("referenceNo")}
            className="input"
            placeholder="Bank ref / cheque no."
          />
        </FormField>
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea {...register("notes")} className="input" rows={2} />
        </FormField>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Processing..." : "Process Payment"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/finance/payments")}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

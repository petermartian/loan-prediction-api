import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

const schema = z.object({
  Gender: z.enum(["Male", "Female"]),
  Married: z.enum(["Yes", "No"]),
  Dependents: z.coerce.number(),
  Education: z.enum(["Graduate", "Not Graduate"]),
  Self_Employed: z.enum(["Yes", "No"]),
  ApplicantIncome: z.coerce.number(),
  CoapplicantIncome: z.coerce.number(),
  LoanAmount: z.coerce.number(),
  Loan_Amount_Term: z.coerce.number(),
  Credit_History: z.coerce.number(),
  Property_Area: z.enum(["Rural", "Urban", "Semiurban"]),
});

type FormData = z.infer<typeof schema>;

export default function App() {
  const [prediction, setPrediction] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await axios.post("https://your-backend-url/predict", data);
      setPrediction(response.data.prediction);
    } catch (error) {
      console.error("Prediction error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-4">Loan Default Predictor</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        {/* Input fields */}
        {[
          { label: "Gender", name: "Gender", type: "select", options: ["Male", "Female"] },
          { label: "Married", name: "Married", type: "select", options: ["Yes", "No"] },
          { label: "Dependents", name: "Dependents", type: "number" },
          { label: "Education", name: "Education", type: "select", options: ["Graduate", "Not Graduate"] },
          { label: "Self Employed", name: "Self_Employed", type: "select", options: ["Yes", "No"] },
          { label: "Applicant Income", name: "ApplicantIncome", type: "number" },
          { label: "Coapplicant Income", name: "CoapplicantIncome", type: "number" },
          { label: "Loan Amount", name: "LoanAmount", type: "number" },
          { label: "Loan Term (months)", name: "Loan_Amount_Term", type: "number" },
          { label: "Credit History (1 = Good, 0 = Bad)", name: "Credit_History", type: "number" },
          { label: "Property Area", name: "Property_Area", type: "select", options: ["Urban", "Rural", "Semiurban"] },
        ].map((field) => (
          <div key={field.name}>
            <label className="block font-semibold">
              {field.label}
              {field.type === "select" ? (
                <select {...register(field.name as keyof FormData)} className="block w-full mt-1 p-2 border rounded">
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  {...register(field.name as keyof FormData)}
                  className="block w-full mt-1 p-2 border rounded"
                />
              )}
            </label>
            {errors[field.name as keyof FormData] && (
              <p className="text-red-600 text-sm">
                {field.label} is required or must be valid.
              </p>
            )}
          </div>
        ))}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Predict
        </button>
      </form>

      {prediction && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded text-green-800">
          <strong>Prediction:</strong> {prediction}
        </div>
      )}
    </div>
  );
}

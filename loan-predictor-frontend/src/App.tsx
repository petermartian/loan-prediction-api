import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema with correct types
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

// ✅ Correctly inferred after coercion
type FormData = z.infer<typeof schema>;

function App() {
  const [prediction, setPrediction] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setPrediction(result.prediction);
    } catch (error) {
      console.error("Prediction error:", error);
      setPrediction("Error connecting to backend.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-md p-6">
        <h1 className="text-2xl font-bold mb-4">Loan Default Predictor</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Gender</label>
            <select {...register("Gender")} className="input">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {errors.Gender && <p className="text-red-500">{errors.Gender.message}</p>}
          </div>

          <div>
            <label>Married</label>
            <select {...register("Married")} className="input">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.Married && <p className="text-red-500">{errors.Married.message}</p>}
          </div>

          <div>
            <label>Dependents</label>
            <input type="number" {...register("Dependents")} className="input" />
            {errors.Dependents && <p className="text-red-500">{errors.Dependents.message}</p>}
          </div>

          <div>
            <label>Education</label>
            <select {...register("Education")} className="input">
              <option value="Graduate">Graduate</option>
              <option value="Not Graduate">Not Graduate</option>
            </select>
            {errors.Education && <p className="text-red-500">{errors.Education.message}</p>}
          </div>

          <div>
            <label>Self Employed</label>
            <select {...register("Self_Employed")} className="input">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.Self_Employed && <p className="text-red-500">{errors.Self_Employed.message}</p>}
          </div>

          <div>
            <label>Applicant Income</label>
            <input type="number" {...register("ApplicantIncome")} className="input" />
            {errors.ApplicantIncome && <p className="text-red-500">{errors.ApplicantIncome.message}</p>}
          </div>

          <div>
            <label>Coapplicant Income</label>
            <input type="number" {...register("CoapplicantIncome")} className="input" />
            {errors.CoapplicantIncome && <p className="text-red-500">{errors.CoapplicantIncome.message}</p>}
          </div>

          <div>
            <label>Loan Amount</label>
            <input type="number" {...register("LoanAmount")} className="input" />
            {errors.LoanAmount && <p className="text-red-500">{errors.LoanAmount.message}</p>}
          </div>

          <div>
            <label>Loan Term</label>
            <input type="number" {...register("Loan_Amount_Term")} className="input" />
            {errors.Loan_Amount_Term && <p className="text-red-500">{errors.Loan_Amount_Term.message}</p>}
          </div>

          <div>
            <label>Credit History</label>
            <input type="number" {...register("Credit_History")} className="input" />
            {errors.Credit_History && <p className="text-red-500">{errors.Credit_History.message}</p>}
          </div>

          <div>
            <label>Property Area</label>
            <select {...register("Property_Area")} className="input">
              <option value="Urban">Urban</option>
              <option value="Semiurban">Semiurban</option>
              <option value="Rural">Rural</option>
            </select>
            {errors.Property_Area && <p className="text-red-500">{errors.Property_Area.message}</p>}
          </div>

          <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
            Predict
          </button>
        </form>

        {prediction && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded shadow">
            Prediction Result: <strong>{prediction}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

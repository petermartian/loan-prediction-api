import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

// --- Zod Schema for Validation ---
const schema = z.object({
  Gender: z.enum(['Male', 'Female']),
  Married: z.enum(['Yes', 'No']),
  Dependents: z.coerce.number().min(0, { message: 'Must be 0 or more' }),
  Education: z.enum(['Graduate', 'Not Graduate']),
  Self_Employed: z.enum(['Yes', 'No']),
  ApplicantIncome: z.coerce.number().min(1, { message: 'Must be positive' }),
  CoapplicantIncome: z.coerce.number().min(0, { message: 'Cannot be negative' }),
  LoanAmount: z.coerce.number().min(1, { message: 'Must be positive' }),
  Loan_Amount_Term: z.coerce.number().min(1, { message: 'Must be positive' }),
  Credit_History: z.coerce.number().min(0).max(1, { message: 'Must be 0 or 1' }),
  Property_Area: z.enum(['Rural', 'Urban', 'Semiurban']),
});

// Infer TypeScript type from the Zod schema
type FormData = z.infer<typeof schema>;

export default function App() {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      Dependents: 0,
      Credit_History: 1, // Default to good credit
      ApplicantIncome: 0,
      CoapplicantIncome: 0,
      LoanAmount: 0,
      Loan_Amount_Term: 0,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError(null);
    setPrediction(null);

    try {
      const response = await axios.post('https://your-backend-url/predict', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      setPrediction(response.data.prediction.toString()); // Ensure prediction is a string
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prediction';
      setError(errorMessage);
      console.error('Prediction error:', err);
    }
  };

  // Define form fields with explicit typing
  const formFields = [
    { label: 'Gender', name: 'Gender' as const, type: 'select', options: ['Male', 'Female'] },
    { label: 'Married', name: 'Married' as const, type: 'select', options: ['Yes', 'No'] },
    { label: 'Dependents', name: 'Dependents' as const, type: 'number' },
    { label: 'Education', name: 'Education' as const, type: 'select', options: ['Graduate', 'Not Graduate'] },
    { label: 'Self Employed', name: 'Self_Employed' as const, type: 'select', options: ['Yes', 'No'] },
    { label: 'Applicant Income', name: 'ApplicantIncome' as const, type: 'number' },
    { label: 'Coapplicant Income', name: 'CoapplicantIncome' as const, type: 'number' },
    { label: 'Loan Amount', name: 'LoanAmount' as const, type: 'number' },
    { label: 'Loan Term (months)', name: 'Loan_Amount_Term' as const, type: 'number' },
    { label: 'Credit History (1 = Good, 0 = Bad)', name: 'Credit_History' as const, type: 'number' },
    { label: 'Property Area', name: 'Property_Area' as const, type: 'select', options: ['Urban', 'Rural', 'Semiurban'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-4">Loan Default Predictor</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        {formFields.map((field) => (
          <div key={field.name}>
            <label className="block font-semibold">
              {field.label}
              {field.type === 'select' ? (
                <select
                  {...register(field.name)}
                  className="block w-full mt-1 p-2 border rounded"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  {...register(field.name)}
                  className="block w-full mt-1 p-2 border rounded"
                  step={field.name === 'Credit_History' ? '1' : undefined} // Specific step for Credit_History
                />
              )}
            </label>
            {errors[field.name] && (
              <p className="text-red-600 text-sm">{errors[field.name]?.message}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Predict
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 rounded text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      {prediction && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded text-green-800">
          <strong>Prediction:</strong> {prediction}
        </div>
      )}
    </div>
  );
}
// src/App.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const loanSchema = z.object({
  Gender: z.enum(['Male', 'Female']),
  Married: z.enum(['Yes', 'No']),
  Dependents: z.coerce.number(),
  Education: z.enum(['Graduate', 'Not Graduate']),
  Self_Employed: z.enum(['Yes', 'No']),
  ApplicantIncome: z.coerce.number(),
  CoapplicantIncome: z.coerce.number(),
  LoanAmount: z.coerce.number(),
  Loan_Amount_Term: z.coerce.number(),
  Credit_History: z.coerce.number(),
  Property_Area: z.enum(['Rural', 'Urban', 'Semiurban']),
});

type LoanForm = z.infer<typeof loanSchema>;

export default function App() {
  const [prediction, setPrediction] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanForm>({
    resolver: zodResolver(loanSchema),
  });

  const onSubmit = async (data: LoanForm) => {
    const res = await fetch('https://loan-predictor-api.onrender.com/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setPrediction(result.prediction);
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Loan Default Predictor</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {[
          { label: 'Gender', name: 'Gender', options: ['Male', 'Female'] },
          { label: 'Married', name: 'Married', options: ['Yes', 'No'] },
          { label: 'Education', name: 'Education', options: ['Graduate', 'Not Graduate'] },
          { label: 'Self Employed', name: 'Self_Employed', options: ['Yes', 'No'] },
          { label: 'Property Area', name: 'Property_Area', options: ['Urban', 'Rural', 'Semiurban'] },
        ].map(({ label, name, options }) => (
          <div key={name}>
            <label>{label}:</label>
            <select {...register(name as keyof LoanForm)} className="w-full border p-2 rounded">
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors[name as keyof LoanForm] && <p className="text-red-500 text-sm">This field is required</p>}
          </div>
        ))}

        {[
          'Dependents',
          'ApplicantIncome',
          'CoapplicantIncome',
          'LoanAmount',
          'Loan_Amount_Term',
          'Credit_History',
        ].map((field) => (
          <div key={field}>
            <label>{field.replace(/_/g, ' ')}:</label>
            <input
              type="number"
              {...register(field as keyof LoanForm)}
              className="w-full border p-2 rounded"
            />
            {errors[field as keyof LoanForm] && <p className="text-red-500 text-sm">Invalid number</p>}
          </div>
        ))}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Predict</button>
      </form>

      {prediction && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
          Prediction: <strong>{prediction}</strong>
        </div>
      )}
    </main>
  );
}

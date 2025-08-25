import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

// --- Zod Schema for Validation ---
const loanSchema = z.object({
  Gender: z.enum(['Male', 'Female']),
  Married: z.enum(['Yes', 'No']),
  Dependents: z.coerce.number().min(0).max(3),
  Education: z.enum(['Graduate', 'Not Graduate']),
  Self_Employed: z.enum(['Yes', 'No']),
  ApplicantIncome: z.coerce.number().min(1),
  CoapplicantIncome: z.coerce.number().min(0),
  LoanAmount: z.coerce.number().min(1),
  Loan_Amount_Term: z.coerce.number().min(1),
  Credit_History: z.coerce.number().refine(val => [0, 1].includes(val), "Must be 0 or 1"),
  Property_Area: z.enum(['Rural', 'Urban', 'Semiurban']),
});

type LoanForm = z.infer<typeof loanSchema>;

type PredictionResult = {
  prediction: number;
  status: 'Approved' | 'Not Approved';
  confidence_probability: string;
};

export default function App() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanForm>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      Gender: 'Male',
      Married: 'No',
      Dependents: 0,
      Education: 'Graduate',
      Self_Employed: 'No',
      Credit_History: 1,
      Property_Area: 'Urban',
    },
  });

  const onSubmit: SubmitHandler<LoanForm> = async (data) => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('https://loan-prediction-api-yjry.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result: PredictionResult = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const chartData = prediction
    ? [{ name: 'Confidence', value: parseFloat(prediction.confidence_probability.replace('%', '')) }]
    : [];

  return (
    <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center p-6">
      <main className="w-full max-w-5xl bg-gray-800 rounded-2xl shadow-xl p-8 grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-400">Loan Approval Predictor</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select id="Gender" label="Gender" options={['Male', 'Female']} {...{ register, errors }} />
              <Select id="Married" label="Married" options={['Yes', 'No']} {...{ register, errors }} />
              <Input id="Dependents" label="Dependents (0–3)" type="number" {...{ register, errors }} />
              <Select id="Education" label="Education" options={['Graduate', 'Not Graduate']} {...{ register, errors }} />
              <Select id="Self_Employed" label="Self Employed" options={['Yes', 'No']} {...{ register, errors }} />
              <Input id="Credit_History" label="Credit History (1=Yes, 0=No)" type="number" {...{ register, errors }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="ApplicantIncome" label="Applicant Income" type="number" {...{ register, errors }} />
              <Input id="CoapplicantIncome" label="Co-applicant Income" type="number" {...{ register, errors }} />
              <Input id="LoanAmount" label="Loan Amount (in thousands)" type="number" {...{ register, errors }} />
              <Input id="Loan_Amount_Term" label="Loan Term (in months)" type="number" {...{ register, errors }} />
            </div>
            <Select id="Property_Area" label="Property Area" options={['Urban', 'Rural', 'Semiurban']} {...{ register, errors }} />
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition">
              {loading ? 'Predicting...' : 'Get Prediction'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[350px]">
          {loading && <p className="text-gray-400">Loading...</p>}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {prediction && (
            <div className="text-center w-full">
              <h2 className="text-xl font-bold mb-4 text-gray-300">Result</h2>
              <div className={`p-6 rounded-lg text-white text-3xl font-bold mb-6 ${
                prediction.status === 'Approved' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {prediction.status}
              </div>
              <p className="text-lg text-blue-400 mb-4">Confidence: {prediction.confidence_probability}</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart layout="vertical" data={chartData}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip />
                  <Bar dataKey="value" barSize={30}>
                    <Cell fill={prediction.status === 'Approved' ? '#22c55e' : '#ef4444'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {!loading && !error && !prediction && <p className="text-gray-500 text-center">Submit details to get prediction</p>}
        </div>
      </main>
    </div>
  );
}

// --- Reusable Input ---
function Input({
  id, label, type, register, errors,
}: {
  id: keyof LoanForm;
  label: string;
  type: string;
  register: ReturnType<typeof useForm>['register'];
  errors: ReturnType<typeof useForm>['formState']['errors'];
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
      <input
        type={type}
        {...register(id)}
        className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
      />
      {errors[id] && <p className="text-red-400 text-xs">{errors[id]?.message as string}</p>}
    </div>
  );
}

// --- Reusable Select ---
function Select({
  id, label, options, register, errors,
}: {
  id: keyof LoanForm;
  label: string;
  options: readonly string[];
  register: ReturnType<typeof useForm>['register'];
  errors: ReturnType<typeof useForm>['formState']['errors'];
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
      <select
        {...register(id)}
        className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {errors[id] && <p className="text-red-400 text-xs">{errors[id]?.message as string}</p>}
    </div>
  );
}

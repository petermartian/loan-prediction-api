import { useState } from 'react';
import { useForm, SubmitHandler, UseFormRegister, FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Zod Schema ---
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
  Credit_History: z.coerce.number().refine((val) => [0, 1].includes(val)),
  Property_Area: z.enum(['Rural', 'Urban', 'Semiurban']),
});
type LoanForm = z.infer<typeof loanSchema>;

type PredictionResult = {
  prediction: number;
  status: 'Approved' | 'Not Approved';
  confidence_probability: string;
};

type FormProps<T> = {
  id: keyof T;
  label: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
};

function Input<T>({ id, label, register, errors, ...rest }: FormProps<T> & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col">
      <label htmlFor={String(id)} className="text-sm text-gray-300">{label}</label>
      <input
        id={String(id)}
        {...register(id)}
        {...rest}
        className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
      />
      {errors[id] && <p className="text-red-400 text-xs">{(errors[id] as any)?.message}</p>}
    </div>
  );
}

function Select<T>({ id, label, options, register, errors }: FormProps<T> & { options: string[] }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={String(id)} className="text-sm text-gray-300">{label}</label>
      <select
        id={String(id)}
        {...register(id)}
        className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {errors[id] && <p className="text-red-400 text-xs">{(errors[id] as any)?.message}</p>}
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoanForm>({
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
    setIsLoading(true);
    setApiError(null);
    setResult(null);
    try {
      const res = await fetch("https://loan-prediction-api-yjry.onrender.com/predict", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

      const json: PredictionResult = await res.json();
      setResult(json);
    } catch (err) {
      setApiError((err as Error).message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = () => {
    if (!result) return [];
    const value = parseFloat(result.confidence_probability.replace('%', ''));
    return [{ name: 'Confidence', value }];
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex items-center justify-center p-4">
      <main className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-400">Loan Approval Predictor</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select<LoanForm> id="Gender" label="Gender" options={['Male', 'Female']} register={register} errors={errors} />
              <Select<LoanForm> id="Married" label="Married" options={['Yes', 'No']} register={register} errors={errors} />
              <Input<LoanForm> id="Dependents" label="Dependents" type="number" register={register} errors={errors} />
              <Select<LoanForm> id="Education" label="Education" options={['Graduate', 'Not Graduate']} register={register} errors={errors} />
              <Select<LoanForm> id="Self_Employed" label="Self Employed" options={['Yes', 'No']} register={register} errors={errors} />
              <Input<LoanForm> id="Credit_History" label="Credit History (0 or 1)" type="number" register={register} errors={errors} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input<LoanForm> id="ApplicantIncome" label="Applicant Income" type="number" register={register} errors={errors} />
              <Input<LoanForm> id="CoapplicantIncome" label="Co-applicant Income" type="number" register={register} errors={errors} />
              <Input<LoanForm> id="LoanAmount" label="Loan Amount" type="number" register={register} errors={errors} />
              <Input<LoanForm> id="Loan_Amount_Term" label="Loan Term" type="number" register={register} errors={errors} />
            </div>
            <Select<LoanForm> id="Property_Area" label="Property Area" options={['Rural', 'Urban', 'Semiurban']} register={register} errors={errors} />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm rounded-md font-semibold disabled:bg-gray-500"
            >
              {isLoading ? "Predicting..." : "Predict Loan Approval"}
            </button>
          </form>
        </div>
        <div className="bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
          {isLoading && <p className="text-gray-400">Checking prediction...</p>}
          {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
          {result && (
            <div className="text-center">
              <div className={`p-6 mb-4 text-2xl font-bold rounded-lg ${result.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'}`}>
                {result.status}
              </div>
              <p className="text-blue-300 text-lg mb-2">Confidence: {result.confidence_probability}</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={getChartData()} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip />
                  <Bar dataKey="value" barSize={30}>
                    <Cell fill={result.status === 'Approved' ? '#34d399' : '#f87171'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {!result && !apiError && !isLoading && <p className="text-gray-400">Submit the form to view result</p>}
        </div>
      </main>
    </div>
  );
}

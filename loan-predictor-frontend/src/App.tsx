import { useState } from 'react';
import { useForm, type SubmitHandler, type FieldError, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const loanApplicationSchema = z.object({
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

type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;

type PredictionResult = {
  prediction: number;
  status: 'Approved' | 'Not Approved';
  confidence_probability: string;
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: keyof LoanApplicationForm;
  label: string;
  register: UseFormRegister<LoanApplicationForm>;
  error?: FieldError;
}

const FormInput = ({ id, label, register, error, ...props }: FormInputProps) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-300">{label}</label>
    <input
      id={id}
      {...register(id, { valueAsNumber: ['ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term', 'Credit_History', 'Dependents'].includes(id) ? { valueAsNumber: true } : {} })}
      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
  </div>
);

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: keyof LoanApplicationForm;
  label: string;
  options: readonly string[];
  register: UseFormRegister<LoanApplicationForm>;
  error?: FieldError;
}

const FormSelect = ({ id, label, options, register, error }: FormSelectProps) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-300">{label}</label>
    <select
      id={id}
      {...register(id)}
      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
    >
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
  </div>
);

export default function App() {
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoanApplicationForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      Gender: 'Male',
      Married: 'No',
      Dependents: 0,
      Education: 'Graduate',
      Self_Employed: 'No',
      Credit_History: 1,
      Property_Area: 'Urban',
    }
  });

  const onSubmit: SubmitHandler<LoanApplicationForm> = async (data) => {
    setIsLoading(true);
    setApiError(null);
    setPredictionResult(null);

    try {
      const response = await fetch("https://loan-prediction-api-yjry.onrender.com/predict", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const result: PredictionResult = await response.json();
      setPredictionResult(result);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = () => {
    if (!predictionResult) return [];
    const prob = parseFloat(predictionResult.confidence_probability.replace('%', ''));
    return [{ name: 'Confidence', value: prob }];
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center p-4">
      <main className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-400">Loan Approval Predictor</h1>
          <p className="text-center text-gray-400 text-sm">Fill in the applicant's details to predict loan approval.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect id="Gender" label="Gender" options={['Male', 'Female']} register={register} error={errors.Gender} />
              <FormSelect id="Married" label="Married" options={['Yes', 'No']} register={register} error={errors.Married} />
              <FormInput id="Dependents" label="Dependents (0-3)" register={register} error={errors.Dependents} />
              <FormSelect id="Education" label="Education" options={['Graduate', 'Not Graduate']} register={register} error={errors.Education} />
              <FormSelect id="Self_Employed" label="Self Employed" options={['Yes', 'No']} register={register} error={errors.Self_Employed} />
              <FormInput id="Credit_History" label="Credit History (1=Yes, 0=No)" register={register} error={errors.Credit_History} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput id="ApplicantIncome" label="Applicant Income" register={register} error={errors.ApplicantIncome} />
              <FormInput id="CoapplicantIncome" label="Co-applicant Income" register={register} error={errors.CoapplicantIncome} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput id="LoanAmount" label="Loan Amount (in thousands)" register={register} error={errors.LoanAmount} />
              <FormInput id="Loan_Amount_Term" label="Loan Term (in months)" register={register} error={errors.Loan_Amount_Term} />
            </div>
            <FormSelect id="Property_Area" label="Property Area" options={['Rural', 'Urban', 'Semiurban']} register={register} error={errors.Property_Area} />
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 font-medium rounded-lg px-5 py-3 disabled:bg-gray-500">
              {isLoading ? 'Predicting...' : 'Predict Approval'}
            </button>
          </form>
        </div>
        <div className="p-8 flex flex-col items-center justify-center bg-gray-900 rounded-lg min-h-[300px]">
          {isLoading && <p className="text-gray-400">Contacting the model...</p>}
          {apiError && <p className="text-red-400">{apiError}</p>}
          {predictionResult && (
            <>
              <h2 className="text-xl font-semibold mb-4">Prediction Result</h2>
              <div className={`p-6 rounded-lg text-white text-3xl font-bold mb-6 ${predictionResult.status === 'Approved' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                {predictionResult.status}
              </div>
              <p className="text-4xl text-blue-400">{predictionResult.confidence_probability}</p>
              <div className="w-full h-40">
                <ResponsiveContainer>
                  <BarChart data={getChartData()} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip />
                    <Bar dataKey="value">
                      <Cell fill={predictionResult.status === 'Approved' ? '#48bb78' : '#f56565'} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {!isLoading && !apiError && !predictionResult && <p className="text-gray-500">Awaiting input...</p>}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// FIX: Removed 'Legend' as it was unused
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Zod Schema for Validation ---
// This schema defines the shape and rules for our form data.
const loanApplicationSchema = z.object({
  Gender: z.enum(['Male', 'Female']),
  Married: z.enum(['Yes', 'No']),
  Dependents: z.coerce.number().min(0, "Must be 0 or more").max(3, "Cannot exceed 3"),
  Education: z.enum(['Graduate', 'Not Graduate']),
  Self_Employed: z.enum(['Yes', 'No']),
  ApplicantIncome: z.coerce.number().min(1, "Income must be positive"),
  CoapplicantIncome: z.coerce.number().min(0, "Cannot be negative"),
  LoanAmount: z.coerce.number().min(1, "Loan amount must be positive"),
  Loan_Amount_Term: z.coerce.number().min(1, "Loan term must be positive"),
  Credit_History: z.coerce.number().min(0).max(1).refine(val => [0, 1].includes(val), "Must be 0 or 1"),
  Property_Area: z.enum(['Rural', 'Urban', 'Semiurban']),
});

// Infer the TypeScript type from the Zod schema
type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;

// --- API Response Type ---
type PredictionResult = {
  prediction: number;
  status: 'Approved' | 'Not Approved';
  confidence_probability: string;
};

// --- Main App Component ---
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
      const API_URL = "https://loan-prediction-api-yjry.onrender.com/predict";
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (Status: ${response.status})`);
      }

      const result: PredictionResult = await response.json();
      setPredictionResult(result);

    } catch (error) {
      console.error("Failed to get prediction:", error);
      setApiError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = () => {
    if (!predictionResult) return [];
    const probabilityValue = parseFloat(predictionResult.confidence_probability.replace('%', ''));
    return [{ name: 'Confidence', value: probabilityValue }];
  };

  // Reusable components (no changes needed here)
  const FormInput = ({ id, label, type = "number", register, error, ...props }: any) => (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-300">{label}</label>
      <input id={id} type={type} {...register(id)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" {...props}/>
      {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
    </div>
  );
  
  const FormSelect = ({ id, label, options, register, error }: any) => (
     <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-300">{label}</label>
      <select id={id} {...register(id)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
        {options.map((option: string) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex items-center justify-center p-4">
      <main className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-400">Loan Approval Predictor</h1>
          <p className="text-center text-gray-400 text-sm">Fill in the applicant's details below to get a prediction on loan approval.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect id="Gender" label="Gender" options={['Male', 'Female']} register={register} error={errors.Gender} />
              <FormSelect id="Married" label="Married" options={['Yes', 'No']} register={register} error={errors.Married} />
              <FormInput id="Dependents" label="Dependents (0-3)" register={register} error={errors.Dependents} />
              <FormSelect id="Education" label="Education" options={['Graduate', 'Not Graduate']} register={register} error={errors.Education} />
              <FormSelect id="Self_Employed" label="Self Employed" options={['Yes', 'No']} register={register} error={errors.Self_Employed} />
              <FormInput id="Credit_History" label="Credit History (1=Yes, 0=No)" step="1" register={register} error={errors.Credit_History} />
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
            <button type="submit" disabled={isLoading} className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'Getting Prediction...' : 'Predict Approval'}
            </button>
          </form>
        </div>
        <div className="bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
          {isLoading && <div className="flex flex-col items-center justify-center text-gray-400"><svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4">Contacting the model...</p></div>}
          {apiError && <div className="text-center text-red-400"><h2 className="text-xl font-bold mb-2">Error</h2><p className="text-sm bg-red-900/50 p-3 rounded-md">{apiError}</p></div>}
          {predictionResult && <div className="text-center w-full"><h2 className="text-xl font-semibold mb-4 text-gray-300">Prediction Result</h2><div className={`p-6 rounded-lg text-white text-3xl font-bold mb-6 ${predictionResult.status === 'Approved' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>{predictionResult.status}</div><h3 className="font-semibold text-gray-300">Confidence</h3><p className="text-4xl font-bold text-blue-400 mb-4">{predictionResult.confidence_probability}</p><div className="w-full h-40"><ResponsiveContainer><BarChart data={getChartData()} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="name" hide /><Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} /><Bar dataKey="value" barSize={40} radius={[10, 10, 10, 10]}><Cell fill={predictionResult.status === 'Approved' ? '#48bb78' : '#f56565'} /></Bar></BarChart></ResponsiveContainer></div></div>}
          {!isLoading && !apiError && !predictionResult && <div className="text-center text-gray-500"><h2 className="text-xl font-semibold">Awaiting Input</h2><p>Your prediction result will appear here.</p></div>}
        </div>
      </main>
    </div>
  );
}

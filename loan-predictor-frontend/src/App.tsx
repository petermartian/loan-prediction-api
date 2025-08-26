import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import "./App.css";

// Define Zod schema
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
      const response = await axios.post("https://loan-default-api.onrender.com/predict", data);
      setPrediction(response.data.prediction);
    } catch (error) {
      console.error("Prediction error:", error);
      setPrediction("Error making prediction.");
    }
  };

  return (
    <div className="App">
      <h1>Loan Default Predictor</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <select {...register("Gender")}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <select {...register("Married")}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <input type="number" placeholder="Dependents" {...register("Dependents")} />
        <p>{errors.Dependents?.message}</p>

        <select {...register("Education")}>
          <option value="Graduate">Graduate</option>
          <option value="Not Graduate">Not Graduate</option>
        </select>

        <select {...register("Self_Employed")}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <input type="number" placeholder="Applicant Income" {...register("ApplicantIncome")} />
        <p>{errors.ApplicantIncome?.message}</p>

        <input type="number" placeholder="Coapplicant Income" {...register("CoapplicantIncome")} />
        <p>{errors.CoapplicantIncome?.message}</p>

        <input type="number" placeholder="Loan Amount" {...register("LoanAmount")} />
        <p>{errors.LoanAmount?.message}</p>

        <input type="number" placeholder="Loan Amount Term" {...register("Loan_Amount_Term")} />
        <p>{errors.Loan_Amount_Term?.message}</p>

        <input type="number" placeholder="Credit History (0 or 1)" {...register("Credit_History")} />
        <p>{errors.Credit_History?.message}</p>

        <select {...register("Property_Area")}>
          <option value="Rural">Rural</option>
          <option value="Urban">Urban</option>
          <option value="Semiurban">Semiurban</option>
        </select>

        <button type="submit">Predict</button>
      </form>

      {prediction && <h2>Prediction: {prediction}</h2>}
    </div>
  );
}

export default App;
